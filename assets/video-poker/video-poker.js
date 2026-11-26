/*
 * Video Poker: Jacks or Better, the poker you play alone against the machine.
 *
 *   1. Choose a bet, 1 to 5 credits, and press Deal. You get five cards.
 *   2. Click the cards you want to keep (or press 1 to 5).
 *   3. Press Draw. The other cards are swapped for new ones from the deck.
 *   4. The final hand pays as the pay table says, times the bet.
 *
 * The lowest hand that pays is a pair of jacks, queens, kings or aces.
 * The cards look the same as in Blackjack and the Hi-Lo Counter.
 */

// --- Settings ------------------------------------------------------------

const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUIT_NAMES = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
const START_CREDITS = 100;
const MAX_BET = 5;
const SAVE_KEY = "video-poker";

// The pay table, best hand first. pay is the win for a bet of 1 credit.
const PAYTABLE = [
    { id: "royal", name: "Royal flush", pay: 250 },
    { id: "straightFlush", name: "Straight flush", pay: 50 },
    { id: "four", name: "Four of a kind", pay: 25 },
    { id: "fullHouse", name: "Full house", pay: 9 },
    { id: "flush", name: "Flush", pay: 6 },
    { id: "straight", name: "Straight", pay: 4 },
    { id: "three", name: "Three of a kind", pay: 3 },
    { id: "twoPair", name: "Two pair", pay: 2 },
    { id: "jacks", name: "Jacks or better", pay: 1 }
];

// --- Elements on the page ------------------------------------------------

function byId(id) {
    return document.getElementById(id);
}

const handBox = byId("hand");
const statusText = byId("status");
const betText = byId("bet");
const betMinus = byId("bet-minus");
const betPlus = byId("bet-plus");
const creditsText = byId("credits");
const dealButton = byId("deal");
const paytable = byId("paytable");

// --- State ---------------------------------------------------------------

let credits = START_CREDITS;
let bet = 1;
let deck = [];
let hand = [];                                 // the five cards
let held = [false, false, false, false, false];
let phase = "deal";   // "deal": waiting for Deal, "draw": choosing cards to hold
let lastWin = null;   // the id of the hand that won last, for the pay table

// --- Saving --------------------------------------------------------------

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
        if (saved) {
            credits = saved.credits;
            bet = saved.bet;
        }
    } catch (error) {
        // Nothing saved: start with 100 credits.
    }
}

function save() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ credits: credits, bet: bet }));
    } catch (error) {
        // Not saved, but the game still works.
    }
}

// --- Cards ---------------------------------------------------------------

// A shuffled deck (the Fisher-Yates shuffle), as in the Hi-Lo Counter.
function newDeck() {
    const list = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            list.push({ suit: suit, value: value });
        }
    }
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

// A card as a number, so cards can be compared: 2 is 2, J is 11, A is 14.
function rank(card) {
    const faces = { J: 11, Q: 12, K: 13, A: 14 };
    return faces[card.value] || Number(card.value);
}

// A card with a front and a back, as in Blackjack and the Hi-Lo Counter.
// A card that is "down" shows its back.
function cardElement(card, down) {
    const element = document.createElement("div");
    element.className = "card";
    if (down) {
        element.classList.add("down");
        element.setAttribute("aria-label", "A card, face down");
    } else {
        if (card.suit === "♥" || card.suit === "♦") {
            element.classList.add("red");
        }
        element.setAttribute("aria-label", card.value + " of " + SUIT_NAMES[card.suit]);
    }
    element.setAttribute("role", "img");

    const front = document.createElement("div");
    front.className = "face front";
    if (!down) {
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

// --- Which hand is it? ---------------------------------------------------

// Returns the row of the pay table for the hand, or null if it pays nothing.
function evaluate(cards) {
    const ranks = cards.map(rank).sort(function (a, b) { return a - b; });

    // How many of each rank: { 13: 2, 7: 3 } is a full house, kings and sevens.
    const counts = {};
    ranks.forEach(function (r) {
        counts[r] = (counts[r] || 0) + 1;
    });
    // The sizes of the groups, biggest first: [3, 2] is a full house.
    const groups = Object.values(counts).sort(function (a, b) { return b - a; });

    const flush = cards.every(function (card) { return card.suit === cards[0].suit; });
    // Five different ranks in a row. An ace can also be low: A 2 3 4 5.
    const lowAce = ranks.join(",") === "2,3,4,5,14";
    const straight = groups.length === 5 && (ranks[4] - ranks[0] === 4 || lowAce);

    let id = null;
    if (straight && flush) {
        id = ranks[0] === 10 ? "royal" : "straightFlush";
    } else if (groups[0] === 4) {
        id = "four";
    } else if (groups[0] === 3 && groups[1] === 2) {
        id = "fullHouse";
    } else if (flush) {
        id = "flush";
    } else if (straight) {
        id = "straight";
    } else if (groups[0] === 3) {
        id = "three";
    } else if (groups[0] === 2 && groups[1] === 2) {
        id = "twoPair";
    } else if (groups[0] === 2 && pairRank(counts) >= 11) {
        id = "jacks";
    }
    return PAYTABLE.find(function (row) { return row.id === id; }) || null;
}

// The rank of the one pair in a hand: the key in counts that is 2.
function pairRank(counts) {
    for (const r in counts) {
        if (counts[r] === 2) {
            return Number(r);
        }
    }
    return 0;
}

// --- Drawing -------------------------------------------------------------

// Draw the five cards. "fresh" is a list of the places (0 to 4) with new
// cards: they slide in and turn over, one after the other.
function showHand(fresh) {
    handBox.innerHTML = "";
    for (let i = 0; i < 5; i++) {
        // Each card is a button, so it can be held with a click, a tap or the keyboard.
        const button = document.createElement("button");
        button.type = "button";
        button.className = "hold-button";
        button.classList.toggle("held", held[i]);
        button.disabled = phase !== "draw";
        button.setAttribute("aria-pressed", held[i] ? "true" : "false");
        button.addEventListener("click", function () { toggleHold(i); });

        const tag = document.createElement("span");
        tag.className = "held-tag";
        tag.textContent = "HELD";

        // Before the first deal there are no cards yet: show their backs.
        const card = cardElement(hand[i], hand.length === 0);
        const slot = document.createElement("div");
        slot.className = "slot";
        slot.appendChild(card);
        if (fresh.includes(i)) {
            // New cards slide in and turn over, one after the other: each
            // starts 0.1 seconds after the one before.
            const delay = (fresh.indexOf(i) * 0.1) + "s";
            slot.classList.add("new");
            slot.style.animationDelay = delay;
            card.style.animationDelay = delay;
        }

        button.append(tag, slot);
        handBox.appendChild(button);
    }
}

function showPaytable() {
    paytable.innerHTML = "";
    PAYTABLE.forEach(function (row) {
        const tr = document.createElement("tr");
        tr.classList.toggle("win", row.id === lastWin);
        const name = document.createElement("td");
        name.textContent = row.name;
        const pay = document.createElement("td");
        pay.textContent = row.pay * bet;
        tr.append(name, pay);
        paytable.appendChild(tr);
    });
}

function showNumbers() {
    betText.textContent = bet;
    creditsText.textContent = credits;
    betMinus.disabled = phase !== "deal" || bet <= 1;
    betPlus.disabled = phase !== "deal" || bet >= Math.min(MAX_BET, Math.max(credits, 1));
    if (phase === "draw") {
        dealButton.textContent = "Draw";
    } else {
        dealButton.textContent = credits === 0 ? "Start over" : "Deal";
    }
    showPaytable();
}

// --- The game ------------------------------------------------------------

function deal() {
    if (credits === 0) {
        credits = START_CREDITS;
        bet = 1;
        save();
        statusText.textContent = "You have " + START_CREDITS + " new credits. Good luck!";
        showNumbers();
        return;
    }
    bet = Math.min(bet, credits);
    credits -= bet;
    deck = newDeck();
    hand = deck.splice(0, 5);
    held = [false, false, false, false, false];
    lastWin = null;
    phase = "draw";
    save();

    const now = evaluate(hand);
    statusText.textContent = (now ? "You have " + now.name.toLowerCase() + ". " : "") +
        "Click the cards you want to keep, then Draw.";
    showHand([0, 1, 2, 3, 4]);
    showNumbers();
}

function draw() {
    // Swap every card that isn't held for the next card in the deck.
    const fresh = [];
    for (let i = 0; i < 5; i++) {
        if (!held[i]) {
            hand[i] = deck.shift();
            fresh.push(i);
        }
    }
    phase = "deal";

    const result = evaluate(hand);
    if (result) {
        const win = result.pay * bet;
        credits += win;
        lastWin = result.id;
        statusText.textContent = result.name + "! You win " + win + (win === 1 ? " credit." : " credits.");
    } else {
        lastWin = null;
        statusText.textContent = noWinText() + (credits === 0 ? " You are out of credits." : "");
    }
    save();
    showHand(fresh);
    showNumbers();
}

// A low pair is the most common near miss, so say why it doesn't pay.
function noWinText() {
    const counts = {};
    hand.map(rank).forEach(function (r) {
        counts[r] = (counts[r] || 0) + 1;
    });
    const pair = pairRank(counts);
    if (pair > 0 && pair < 11) {
        return "A pair of " + VALUES[pair - 1] + "s doesn't pay: it has to be jacks or better.";
    }
    return "No win this time.";
}

function toggleHold(i) {
    if (phase !== "draw") {
        return;
    }
    held[i] = !held[i];
    const button = handBox.children[i];
    button.classList.toggle("held", held[i]);
    button.setAttribute("aria-pressed", held[i] ? "true" : "false");
}

function changeBet(change) {
    bet = Math.max(1, Math.min(MAX_BET, credits, bet + change));
    save();
    showNumbers();
}

// --- Buttons and keys ----------------------------------------------------

dealButton.addEventListener("click", function () {
    if (phase === "deal") {
        deal();
    } else {
        draw();
    }
});
betMinus.addEventListener("click", function () { changeBet(-1); });
betPlus.addEventListener("click", function () { changeBet(1); });

// The keys 1 to 5 hold the cards, from the left.
document.addEventListener("keydown", function (event) {
    const n = Number(event.key);
    if (n >= 1 && n <= 5) {
        toggleHold(n - 1);
    }
});

// --- Start ---------------------------------------------------------------

load();
showHand([]);
showNumbers();
