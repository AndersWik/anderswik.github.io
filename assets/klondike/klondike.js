/*
 * Klondike, the solitaire most people just call Solitaire.
 *
 * Move all 52 cards to the four foundations, one for each suit, from the
 * ace up to the king. In the seven columns of the tableau, cards are built
 * down in alternating colors: a red 9 on a black 10. Only a king can go in
 * an empty column. Tap the stock to turn over 1 or 3 cards onto the waste.
 *
 * Every pile is a list of cards, the bottom card first. The whole board is
 * drawn again from these lists after every move, so the lists are the only
 * truth, and Undo only has to put old lists back.
 */

// --- Settings ------------------------------------------------------------

const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUIT_NAMES = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
const DOWN_GAP = 0.6;      // em between face-down cards in a column
const UP_GAP = 2.2;        // em between face-up cards: enough to see the corner
const WASTE_GAP = 1.4;     // em between the fanned cards on the waste (draw 3)
const DRAG_START = 6;      // pixels the pointer must move before a tap becomes a drag
const SAVE_KEY = "klondike";
const MAX_UNDO = 200;

// --- Elements on the page --------------------------------------------------

function byId(id) {
    return document.getElementById(id);
}

const board = byId("board");
const movesText = byId("moves");
const timeText = byId("time");
const statusText = byId("status");
const drawSelect = byId("draw");
const undoButton = byId("undo");
const newGameButton = byId("new-game");
const finishButton = byId("finish");

// --- State ---------------------------------------------------------------

// piles.stock, piles.waste, piles.f0 to f3 (foundations), piles.t0 to t6
// (tableau). Each card is { suit, value, rank, up }.
let piles = {};
let draw = 1;          // cards turned over from the stock at a time
let moves = 0;
let seconds = 0;
let started = false;   // the clock starts with the first move
let won = false;
let history = [];      // the game before each move, for Undo
let finishing = null;  // the timer while Finish sends the cards home

// --- Cards ---------------------------------------------------------------

function newDeck() {
    const deck = [];
    for (const suit of SUITS) {
        VALUES.forEach(function (value, i) {
            deck.push({ suit: suit, value: value, rank: i + 1, up: false });
        });
    }
    // The Fisher-Yates shuffle, as in the other card games.
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function isRed(card) {
    return card.suit === "♥" || card.suit === "♦";
}

// The top card of a pile. (Not called top(): window.top already exists in
// every browser, and a script may not replace it.)
function topCard(pile) {
    return pile[pile.length - 1];
}

// The card element, the same as in Blackjack and Video Poker.
function cardElement(card) {
    const element = document.createElement("div");
    element.className = "playing-card";
    if (!card.up) {
        element.classList.add("down");
    } else if (isRed(card)) {
        element.classList.add("red");
    }
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", card.up ? card.value + " of " + SUIT_NAMES[card.suit] : "A card, face down");

    const front = document.createElement("div");
    front.className = "face front";
    if (card.up) {
        front.innerHTML =
            '<span class="corner top">' + card.value + "<br>" + card.suit + "</span>" +
            '<span class="pip">' + card.suit + "</span>" +
            '<span class="corner bottom">' + card.value + "<br>" + card.suit + "</span>";
    }
    const back = document.createElement("div");
    back.className = "face back";
    element.append(front, back);
    return element;
}

// --- A new game ----------------------------------------------------------

function newGame() {
    stopFinishing();
    const deck = newDeck();
    piles = { stock: [], waste: [] };
    for (let i = 0; i < 4; i++) {
        piles["f" + i] = [];
    }
    // Column 1 gets 1 card, column 2 gets 2... and the last card is face up.
    for (let i = 0; i < 7; i++) {
        piles["t" + i] = deck.splice(0, i + 1);
        topCard(piles["t" + i]).up = true;
    }
    piles.stock = deck;   // the 24 cards that are left
    draw = Number(drawSelect.value);
    moves = 0;
    seconds = 0;
    started = false;
    won = false;
    history = [];
    statusText.textContent = "Drag the cards, or tap a card to move it.";
    save();
    render();
}

// --- The rules -----------------------------------------------------------

// Can these cards (one, or a run) go on this pile?
function canPlace(cards, name) {
    const pile = piles[name];
    const first = cards[0];
    if (name[0] === "f") {
        // Foundations: one card at a time, the same suit, one higher.
        if (cards.length !== 1) {
            return false;
        }
        return pile.length === 0 ? first.rank === 1 : first.suit === topCard(pile).suit && first.rank === topCard(pile).rank + 1;
    }
    if (name[0] === "t") {
        // Tableau: a king on an empty column, else one lower and the other color.
        if (pile.length === 0) {
            return first.rank === 13;
        }
        const under = topCard(pile);
        return under.up && isRed(under) !== isRed(first) && under.rank === first.rank + 1;
    }
    return false;   // nothing can be put on the stock or the waste
}

// Which cards may be picked up from a pile, from this card on? From the
// waste and the foundations only the top card; from a column any face-up
// card, with everything on top of it.
function canPickUp(name, index) {
    const pile = piles[name];
    if (index < 0 || index >= pile.length || !pile[index].up) {
        return false;
    }
    if (name === "waste" || name[0] === "f") {
        return index === pile.length - 1;
    }
    return name[0] === "t";
}

// --- Moving --------------------------------------------------------------

// Remember the game as it is now, so Undo can bring it back. JSON makes a
// copy that later moves can't change.
function remember() {
    history.push(JSON.stringify({ piles: piles, moves: moves }));
    if (history.length > MAX_UNDO) {
        history.shift();
    }
}

function moveCards(from, index, to) {
    remember();
    const cards = piles[from].splice(index);
    piles[to].push(...cards);
    // A column whose top card was moved away turns over its next card.
    if (from[0] === "t" && piles[from].length > 0) {
        topCard(piles[from]).up = true;
    }
    afterMove();
}

// Tap the stock: turn over the next 1 or 3 cards. An empty stock gets all
// the waste back, turned face down again.
function dealFromStock() {
    if (piles.stock.length === 0 && piles.waste.length === 0) {
        return;
    }
    remember();
    if (piles.stock.length === 0) {
        piles.stock = piles.waste.reverse();
        piles.waste = [];
        piles.stock.forEach(function (card) { card.up = false; });
    } else {
        for (let i = 0; i < draw && piles.stock.length > 0; i++) {
            const card = piles.stock.pop();
            card.up = true;
            piles.waste.push(card);
        }
    }
    afterMove();
}

function afterMove() {
    moves++;
    started = true;
    if (SUITS.every(function (suit, i) { return piles["f" + i].length === 13; })) {
        won = true;
        stopFinishing();
        statusText.textContent = "You won in " + moves + " moves and " + timeString(seconds) + "! Press New game to play again.";
        countWin();
    }
    save();
    render();
}

function undo() {
    if (history.length === 0 || won) {
        return;
    }
    stopFinishing();
    const last = JSON.parse(history.pop());
    piles = last.piles;
    moves = last.moves;
    save();
    render();
}

// --- Tap to move ---------------------------------------------------------

// Tapping a card sends it where it fits best: home to a foundation if it
// can go there, else to a column with cards, else to an empty column.
function smartMove(from, index) {
    const cards = piles[from].slice(index);
    const targets = [];
    if (cards.length === 1 && from[0] !== "f") {
        targets.push("f0", "f1", "f2", "f3");
    }
    const columns = ["t0", "t1", "t2", "t3", "t4", "t5", "t6"].filter(function (name) { return name !== from; });
    columns.forEach(function (name) {
        if (piles[name].length > 0) {
            targets.push(name);
        }
    });
    // A king that already starts a column has no reason to go to another empty one.
    if (!(from[0] === "t" && index === 0)) {
        columns.forEach(function (name) {
            if (piles[name].length === 0) {
                targets.push(name);
            }
        });
    }
    const to = targets.find(function (name) { return canPlace(cards, name); });
    if (to) {
        moveCards(from, index, to);
        return true;
    }
    return false;
}

// --- Finish --------------------------------------------------------------

// When the stock and the waste are empty and every card is face up, the
// game is as good as won: the cards can go home one by one.
function canFinish() {
    if (won || piles.stock.length > 0 || piles.waste.length > 0) {
        return false;
    }
    for (let i = 0; i < 7; i++) {
        if (piles["t" + i].some(function (card) { return !card.up; })) {
            return false;
        }
    }
    return true;
}

function finish() {
    if (finishing !== null) {
        return;
    }
    finishing = setInterval(function () {
        // The lowest card that can go home goes first.
        let best = null;
        for (let i = 0; i < 7; i++) {
            const name = "t" + i;
            const card = topCard(piles[name]);
            if (card && (best === null || card.rank < topCard(piles[best]).rank)) {
                const home = ["f0", "f1", "f2", "f3"].find(function (f) { return canPlace([card], f); });
                if (home) {
                    best = name;
                }
            }
        }
        if (best === null) {
            stopFinishing();
            return;
        }
        smartMove(best, piles[best].length - 1);
    }, 90);
}

function stopFinishing() {
    clearInterval(finishing);
    finishing = null;
}

// --- Drawing -------------------------------------------------------------

function timeString(s) {
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

function render() {
    board.querySelectorAll("[data-pile]").forEach(function (box) {
        const name = box.dataset.pile;
        const pile = piles[name];
        box.innerHTML = "";
        box.classList.toggle("empty", pile.length === 0);

        // Which cards to show, and how far down (or along) each one is.
        let shown = pile.map(function (card, i) { return i; });
        if (name === "stock" || name[0] === "f") {
            shown = pile.length > 0 ? [pile.length - 1] : [];
        } else if (name === "waste") {
            shown = shown.slice(-Math.min(draw, 3));
        }
        let offset = 0;
        shown.forEach(function (i, n) {
            const slot = document.createElement("div");
            slot.className = "slot";
            slot.dataset.index = i;
            if (name === "waste") {
                slot.style.left = (n * WASTE_GAP) + "em";
            } else {
                slot.style.top = offset + "em";
                offset += pile[i].up ? UP_GAP : DOWN_GAP;
            }
            slot.appendChild(cardElement(pile[i]));
            box.appendChild(slot);
        });
        // A column is as tall as its cards, so the page can scroll to them.
        if (name[0] === "t") {
            box.style.height = (offset - (pile.length > 0 ? (topCard(pile).up ? UP_GAP : DOWN_GAP) : 0) + 6.6) + "em";
        }
    });

    movesText.textContent = moves;
    timeText.textContent = timeString(seconds);
    undoButton.disabled = history.length === 0 || won;
    finishButton.hidden = !canFinish();
}

// --- Saving --------------------------------------------------------------

function save() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ piles: piles, draw: draw, moves: moves, seconds: seconds, won: won }));
    } catch (error) {
        // Not saved, but the game still works.
    }
}

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (saved && !saved.won && saved.piles && saved.piles.stock) {
            piles = saved.piles;
            draw = saved.draw;
            moves = saved.moves;
            seconds = saved.seconds;
            started = moves > 0;
            drawSelect.value = String(draw);
            return true;
        }
    } catch (error) {
        // Nothing saved.
    }
    return false;
}

function countWin() {
    try {
        const wins = Number(localStorage.getItem(SAVE_KEY + "-wins")) || 0;
        localStorage.setItem(SAVE_KEY + "-wins", String(wins + 1));
    } catch (error) {
        // Not counted.
    }
}

// --- Drag and tap ----------------------------------------------------------

// One set of pointer events works for a mouse and a finger. A press that
// hardly moves is a tap; one that moves more than DRAG_START pixels is a drag.
let press = null;   // { from, index, x, y, dragging, layer, dx, dy }

function pileAndIndex(target) {
    const slot = target.closest(".slot");
    const box = target.closest("[data-pile]");
    if (!box) {
        return null;
    }
    return { from: box.dataset.pile, index: slot ? Number(slot.dataset.index) : -1 };
}

board.addEventListener("pointerdown", function (event) {
    if (won || finishing !== null || event.button > 0) {
        return;
    }
    const at = pileAndIndex(event.target);
    if (at === null) {
        return;
    }
    if (at.from === "stock") {
        dealFromStock();
        return;
    }
    if (!canPickUp(at.from, at.index)) {
        return;
    }
    event.preventDefault();
    try {
        board.setPointerCapture(event.pointerId);
    } catch (error) {
        // Dragging still works inside the board.
    }
    press = { from: at.from, index: at.index, x: event.clientX, y: event.clientY, dragging: false, layer: null };
});

board.addEventListener("pointermove", function (event) {
    if (press === null) {
        return;
    }
    if (!press.dragging) {
        if (Math.hypot(event.clientX - press.x, event.clientY - press.y) < DRAG_START) {
            return;
        }
        startDrag();
    }
    moveLayer(event.clientX, event.clientY);
});

board.addEventListener("pointerup", function (event) {
    if (press === null) {
        return;
    }
    const was = press;
    press = null;
    if (!was.dragging) {
        if (!smartMove(was.from, was.index)) {
            shake(was.from, was.index);
        }
        return;
    }
    const to = dropTarget(was);
    was.layer.remove();
    if (to !== null) {
        moveCards(was.from, was.index, to);
    } else {
        render();   // back where they were
    }
});

board.addEventListener("pointercancel", function () {
    if (press !== null && press.layer !== null) {
        press.layer.remove();
    }
    press = null;
    render();
});

// The dragged cards go in a layer of their own that follows the pointer.
// The cards left behind are hidden until the drag is over.
function startDrag() {
    press.dragging = true;
    const box = board.querySelector('[data-pile="' + press.from + '"]');
    const layer = document.createElement("div");
    layer.className = "drag-layer";
    const boardRect = board.getBoundingClientRect();
    const slots = Array.from(box.querySelectorAll(".slot")).filter(function (slot) {
        return Number(slot.dataset.index) >= press.index;
    });
    const firstRect = slots[0].getBoundingClientRect();
    slots.forEach(function (slot) {
        const copy = slot.cloneNode(true);
        const rect = slot.getBoundingClientRect();
        copy.style.left = (rect.left - firstRect.left) + "px";
        copy.style.top = (rect.top - firstRect.top) + "px";
        layer.appendChild(copy);
        slot.style.visibility = "hidden";
    });
    // Where in the first card the pointer took hold, so it doesn't jump.
    press.dx = press.x - firstRect.left;
    press.dy = press.y - firstRect.top;
    press.boardLeft = boardRect.left;
    press.boardTop = boardRect.top;
    board.appendChild(layer);
    press.layer = layer;
}

function moveLayer(x, y) {
    const boardRect = board.getBoundingClientRect();
    press.layer.style.left = (x - press.dx - boardRect.left) + "px";
    press.layer.style.top = (y - press.dy - boardRect.top) + "px";
}

// The pile the dragged cards are dropped on: of the piles where they may
// go, the one whose top card they cover the most.
function dropTarget(drag) {
    const cards = piles[drag.from].slice(drag.index);
    const held = drag.layer.firstChild.getBoundingClientRect();
    let best = null;
    let bestArea = 0;
    board.querySelectorAll("[data-pile]").forEach(function (box) {
        const name = box.dataset.pile;
        if (name === drag.from || !canPlace(cards, name)) {
            return;
        }
        const last = box.querySelector(".slot:last-child") || box;
        const r = last.getBoundingClientRect();
        const width = Math.min(held.right, r.right) - Math.max(held.left, r.left);
        const height = Math.min(held.bottom, r.bottom) - Math.max(held.top, r.top);
        const area = width > 0 && height > 0 ? width * height : 0;
        if (area > bestArea) {
            best = name;
            bestArea = area;
        }
    });
    return best;
}

// A card that can't go anywhere gives a little shake.
function shake(from, index) {
    const slot = board.querySelector('[data-pile="' + from + '"] .slot[data-index="' + index + '"]');
    if (slot) {
        slot.classList.remove("shake");
        void slot.offsetWidth;   // start the animation again, even if it just ran
        slot.classList.add("shake");
    }
}

// --- Buttons and the clock -----------------------------------------------

newGameButton.addEventListener("click", newGame);
undoButton.addEventListener("click", undo);
finishButton.addEventListener("click", finish);
// The draw setting is for a new game: changing it in the middle would be cheating.
drawSelect.addEventListener("change", function () {
    statusText.textContent = "Draw " + drawSelect.value + " starts with the next new game.";
    if (moves === 0) {
        newGame();
    }
});

setInterval(function () {
    if (started && !won && document.visibilityState === "visible") {
        seconds++;
        timeText.textContent = timeString(seconds);
        if (seconds % 10 === 0) {
            save();
        }
    }
}, 1000);

// --- Start ---------------------------------------------------------------

if (load()) {
    render();
} else {
    newGame();
}
