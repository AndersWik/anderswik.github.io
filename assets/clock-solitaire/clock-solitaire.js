/*
 * Clock Solitaire: 52 cards in 13 piles of 4, face down. Twelve piles sit
 * round a clock, one for each hour: the ace at 1 o'clock, the 2 at 2 and so
 * on, the jack at 11 and the queen at 12. The kings' pile is in the middle.
 *
 * Turn over the top card of the middle pile. Put it face up under the pile
 * of its hour, and turn over the top card of that pile. Go on until the
 * fourth king is turned over. If every card is face up by then, you win.
 *
 * There are no choices: the deal decides everything. You win about one
 * game in 13. The player's job is to find the right hour.
 */

// --- Settings ------------------------------------------------------------

const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUIT_NAMES = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
const VALUE_NAMES = { A: "an ace", J: "a jack", Q: "a queen", K: "a king" };
const KINGS = 12;           // the middle pile: piles[12]
const RADIUS = 13;          // em from the middle of the clock to the middle of a pile
const PEEK = 0.5;           // em each face-up card peeks out from under its pile
const LABEL = 4.6;          // em from a pile's middle to its hour, towards the clock's middle
const HAND_X = 6.6;         // em right of the middle where the card in the hand is shown
const AUTO_DELAY = 300;     // ms between cards when the game plays itself
const STATS_KEY = "clock-solitaire";

// --- Elements on the page --------------------------------------------------

const board = document.getElementById("board");
const turnedText = document.getElementById("turned");
const statusText = document.getElementById("status");
const autoButton = document.getElementById("auto");
const newGameButton = document.getElementById("new-game");

// --- State ---------------------------------------------------------------

// piles[0] is the aces' pile at 1 o'clock ... piles[11] the queens' at
// 12 o'clock, and piles[12] the kings' in the middle. Each pile has its
// face-down cards and the face-up cards put under it.
let piles = [];
let hand = null;       // the card turned over, waiting to be put in place
let turned = 0;        // cards turned over so far
let over = false;
let autoTimer = null;

// --- Cards ---------------------------------------------------------------

function newDeck() {
    const deck = [];
    for (const suit of SUITS) {
        VALUES.forEach(function (value, i) {
            deck.push({ suit: suit, value: value, rank: i + 1 });
        });
    }
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function isRed(card) {
    return card.suit === "♥" || card.suit === "♦";
}

// The card element, the same as in Klondike. A card that isn't given
// (null) is shown face down.
function cardElement(card) {
    const element = document.createElement("div");
    element.className = "playing-card";
    if (card === null) {
        element.classList.add("down");
    } else if (isRed(card)) {
        element.classList.add("red");
    }
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", card === null ? "A card, face down" : card.value + " of " + SUIT_NAMES[card.suit]);
    const front = document.createElement("div");
    front.className = "face front";
    if (card !== null) {
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

// --- The clock ---------------------------------------------------------------

// Which pile a card goes to: its rank minus 1. A king (rank 13) goes to
// pile 12, the middle.
function pileFor(card) {
    return card.rank - 1;
}

// The hour a pile is at, as text for the player.
function hourName(pile) {
    return pile === KINGS ? "the middle" : (pile + 1) + " o'clock";
}

// Where a pile is, in em from the middle of the clock. The hours go round
// like on a clock: 12 at the top, 3 to the right. An hour is 30 degrees,
// and the angles of sin and cos start at 3 o'clock, so we take 90 off.
function pilePosition(pile) {
    if (pile === KINGS) {
        return { x: 0, y: 0 };
    }
    const angle = ((pile + 1) * 30 - 90) * Math.PI / 180;
    return { x: Math.cos(angle) * RADIUS, y: Math.sin(angle) * RADIUS };
}

// --- The game ------------------------------------------------------------

function newGame() {
    stopAuto();
    const deck = newDeck();
    piles = [];
    for (let i = 0; i < 13; i++) {
        piles.push({ down: deck.splice(0, 4), up: [] });
    }
    turned = 0;
    over = false;
    hand = null;
    turnOver(KINGS);
    statusText.textContent = "Tap the pile at the card's hour.";
}

// Turn over the top card of a pile, into the hand. If the pile has no
// face-down cards left, the game is over. That can only happen in the
// middle, with the fourth king: every other pile still has a card to turn.
function turnOver(pile) {
    if (piles[pile].down.length === 0) {
        endGame();
        return;
    }
    hand = piles[pile].down.pop();
    turned++;
    render();
}

// The player tapped a pile. The card in the hand goes there if it is the
// right hour; then the top card of that pile is turned over.
function place(pile) {
    if (over || hand === null) {
        return;
    }
    if (pile !== pileFor(hand)) {
        const name = VALUE_NAMES[hand.value] || "a " + hand.value;
        statusText.textContent = "That's " + name + ": it goes to " + hourName(pileFor(hand)) + ".";
        shake(pile);
        return;
    }
    piles[pile].up.push(hand);
    hand = null;
    statusText.textContent = "";
    turnOver(pile);
}

function endGame() {
    over = true;
    hand = null;
    stopAuto();
    const left = piles.reduce(function (sum, pile) { return sum + pile.down.length; }, 0);
    const stats = countGame(left === 0);
    if (left === 0) {
        statusText.textContent = "You won! Every card came up before the last king. (" + stats + ")";
    } else {
        statusText.textContent = "The fourth king came up with " + left + (left === 1 ? " card" : " cards") +
            " still face down. Better luck with the next deal! (" + stats + ")";
    }
    render();
}

// Games and wins, saved, so you can see how rare a win is.
function countGame(won) {
    let stats = { games: 0, wins: 0 };
    try {
        stats = JSON.parse(localStorage.getItem(STATS_KEY)) || stats;
        stats.games++;
        if (won) {
            stats.wins++;
        }
        localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (error) {
        stats.games++;
        stats.wins += won ? 1 : 0;
    }
    return "You have won " + stats.wins + " of " + stats.games + (stats.games === 1 ? " game" : " games");
}

// --- Playing by itself -----------------------------------------------------

function toggleAuto() {
    if (autoTimer !== null) {
        stopAuto();
        return;
    }
    if (over) {
        newGame();
    }
    autoButton.textContent = "Stop";
    autoTimer = setInterval(function () {
        if (over || hand === null) {
            stopAuto();
            return;
        }
        place(pileFor(hand));
    }, AUTO_DELAY);
}

function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
    autoButton.textContent = "Play it for me";
}

// --- Drawing -------------------------------------------------------------

function render() {
    board.innerHTML = "";
    piles.forEach(function (pile, i) {
        const at = pilePosition(i);
        const box = document.createElement("button");
        box.type = "button";
        box.className = "pile";
        box.dataset.pile = i;
        box.setAttribute("aria-label", hourName(i) + ": " + pile.down.length + " face down, " + pile.up.length + " face up");
        // The middle of the board is 50%; the pile's middle goes at its place.
        box.style.left = "calc(50% + " + at.x + "em)";
        box.style.top = "calc(50% + " + at.y + "em)";

        // The face-up cards peek out from under the pile, away from the middle.
        const out = i === KINGS ? { x: 0, y: 1 } : { x: at.x / RADIUS, y: at.y / RADIUS };
        pile.up.forEach(function (card, n) {
            const slot = document.createElement("div");
            slot.className = "slot";
            const shift = (pile.up.length - n) * PEEK;
            slot.style.transform = "translate(" + (out.x * shift) + "em, " + (out.y * shift) + "em)";
            slot.appendChild(cardElement(card));
            box.appendChild(slot);
        });
        // The face-down cards on top, as one card with a count on it.
        if (pile.down.length > 0) {
            const slot = document.createElement("div");
            slot.className = "slot";
            slot.appendChild(cardElement(null));
            const count = document.createElement("span");
            count.className = "count";
            count.textContent = pile.down.length;
            slot.appendChild(count);
            box.appendChild(slot);
        }
        if (pile.down.length === 0 && pile.up.length === 0) {
            box.classList.add("empty");
        }
        // The hour, on the felt next to the pile, on the side of the middle.
        const label = document.createElement("span");
        label.className = "hour";
        label.textContent = i === KINGS ? "K" : VALUES[i];
        label.style.transform = "translate(" + (-out.x * LABEL) + "em, " + (-out.y * LABEL) + "em)";
        box.appendChild(label);
        board.appendChild(box);
    });

    // The card in the hand, between the middle and 3 o'clock.
    if (hand !== null) {
        const slot = document.createElement("div");
        slot.className = "hand";
        slot.style.left = "calc(50% + " + HAND_X + "em)";
        slot.appendChild(cardElement(hand));
        board.appendChild(slot);
    }
    turnedText.textContent = turned;
}

// A pile that was tapped by mistake gives a little shake.
function shake(pile) {
    const box = board.querySelector('[data-pile="' + pile + '"]');
    box.classList.remove("shake");
    void box.offsetWidth;   // start the animation again, even if it just ran
    box.classList.add("shake");
}

// --- Buttons ----------------------------------------------------------------

board.addEventListener("click", function (event) {
    const box = event.target.closest("[data-pile]");
    if (box && autoTimer === null) {
        place(Number(box.dataset.pile));
    }
});
autoButton.addEventListener("click", toggleAuto);
newGameButton.addEventListener("click", newGame);

// --- Start ---------------------------------------------------------------

newGame();
