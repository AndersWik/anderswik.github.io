/*
 * Hi-Lo Counter: practice counting cards, the way blackjack players do.
 *
 * Cards are shown one at a time. Keep a count in your head:
 *
 *   2 3 4 5 6     +1
 *   7 8 9          0
 *   10 J Q K A    -1
 *
 * When the cards stop, say what the count is. Each round has 5 to 10
 * cards, picked at random.
 *
 *   Easy: every round starts at 0, with a new deck.
 *   Hard: the count keeps running from round to round, like at a real
 *         table, and the deck is not shuffled again until the game is over.
 */

// --- Settings ------------------------------------------------------------

const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const SUIT_NAMES = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" };
const MIN_CARDS = 5;
const MAX_CARDS = 10;
const HARD_DECKS = 2;    // 104 cards: enough for 10 rounds of 10 cards

// --- Elements on the page ------------------------------------------------

function byId(id) {
    return document.getElementById(id);
}

const setupForm = byId("setup");
const modeSelect = byId("mode");
const roundsSelect = byId("rounds");
const speedSelect = byId("speed");
const playBox = byId("play");
const roundText = byId("round");
const dealBox = byId("deal");
const statusText = byId("status");
const guessForm = byId("guess-form");
const guessInput = byId("guess");
const reviewBox = byId("review");
const verdictText = byId("verdict");
const reviewCards = byId("review-cards");
const reviewCountText = byId("review-count");
const nextButton = byId("next");
const endBox = byId("end");
const scoreText = byId("score");
const statsList = byId("stats");
const roundsTable = byId("rounds-table");
const againButton = byId("again");

// --- State ---------------------------------------------------------------

let mode = "easy";
let rounds = 5;       // rounds in this game
let speed = 2;        // seconds a card is shown
let deck = [];
let round = 0;        // the round being played, from 1
let cards = [];       // the cards of this round
let countBefore = 0;  // the count when the round started (0 in easy mode)
let count = 0;        // the right count after this round's cards
let history = [];     // { guess, count, cards, right } for each round
let dealTimer = null;

// --- Cards ---------------------------------------------------------------

// A shuffled deck, made of "decks" full decks (the Fisher-Yates shuffle).
function newDeck(decks) {
    const list = [];
    for (let d = 0; d < decks; d++) {
        for (const suit of SUITS) {
            for (const value of VALUES) {
                list.push({ suit: suit, value: value });
            }
        }
    }
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
}

// The Hi-Lo value of a card: low cards +1, middle cards 0, high cards -1.
function hiLo(card) {
    if (["2", "3", "4", "5", "6"].includes(card.value)) {
        return 1;
    }
    if (["7", "8", "9"].includes(card.value)) {
        return 0;
    }
    return -1;
}

// A count with its sign, like +2, 0 and −1.
function signed(n) {
    if (n > 0) {
        return "+" + n;
    }
    return n < 0 ? "−" + Math.abs(n) : "0";
}

// A card with a front and a back, as in Blackjack. It sits in a "slot"
// that slides it in, and the card itself turns over.
function cardElement(card, size) {
    const slot = document.createElement("div");
    slot.className = "slot " + size;
    const element = document.createElement("div");
    element.className = "card";
    if (card.suit === "♥" || card.suit === "♦") {
        element.classList.add("red");
    }
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", card.value + " of " + SUIT_NAMES[card.suit]);

    const front = document.createElement("div");
    front.className = "face front";
    front.innerHTML =
        '<span class="corner top">' + card.value + "<br>" + card.suit + "</span>" +
        '<span class="pip">' + card.suit + "</span>" +
        '<span class="corner bottom">' + card.value + "<br>" + card.suit + "</span>";
    const back = document.createElement("div");
    back.className = "face back";
    element.append(front, back);
    slot.appendChild(element);
    return slot;
}

// --- The game ------------------------------------------------------------

function startGame(event) {
    event.preventDefault();
    mode = modeSelect.value;
    rounds = Number(roundsSelect.value);
    speed = Number(speedSelect.value);
    deck = newDeck(mode === "hard" ? HARD_DECKS : 1);
    history = [];
    round = 0;
    count = 0;
    setupForm.hidden = true;
    endBox.hidden = true;
    playBox.hidden = false;
    nextRound();
}

function nextRound() {
    round++;
    if (mode === "easy") {
        deck = newDeck(1);
        count = 0;
    }
    countBefore = count;
    const amount = MIN_CARDS + Math.floor(Math.random() * (MAX_CARDS - MIN_CARDS + 1));
    cards = deck.splice(0, amount);
    cards.forEach(function (card) {
        count += hiLo(card);
    });

    roundText.textContent = "Round " + round + " of " + rounds;
    if (mode === "hard" && round > 1) {
        statusText.textContent = "Keep counting from where you were.";
    } else {
        statusText.textContent = "Count the cards.";
    }
    guessForm.hidden = true;
    reviewBox.hidden = true;
    dealBox.hidden = false;
    dealBox.innerHTML = "";
    showCard(0);
}

// Show card number "index", and the next one after "speed" seconds. Each
// card takes the place of the one before, so you can't count them again.
function showCard(index) {
    if (index === cards.length) {
        dealBox.innerHTML = "";
        askForCount();
        return;
    }
    const slot = cardElement(cards[index], "big");
    // The card comes in and turns over in under half of its time.
    const animation = Math.min(0.45, speed * 0.4);
    slot.style.animationDuration = animation * 0.4 + "s";
    slot.firstChild.style.animationDuration = animation * 0.6 + "s";
    slot.firstChild.style.animationDelay = animation * 0.4 + "s";
    dealBox.innerHTML = "";
    dealBox.appendChild(slot);
    dealTimer = setTimeout(function () {
        showCard(index + 1);
    }, speed * 1000);
}

function askForCount() {
    statusText.textContent = "";
    dealBox.hidden = true;
    // In hard mode the answer is the running count, so start from the count
    // before this round. The review of the last round showed it.
    guessInput.value = countBefore;
    guessForm.hidden = false;
    guessInput.focus();
}

function changeGuess(step) {
    guessInput.value = (Number(guessInput.value) || 0) + step;
}

function checkGuess(event) {
    event.preventDefault();
    const guess = Math.round(Number(guessInput.value) || 0);
    const right = guess === count;
    history.push({ guess: guess, count: count, cards: cards, right: right });

    guessForm.hidden = true;
    if (right) {
        verdictText.textContent = "Right! The count is " + signed(count) + ".";
        verdictText.className = "verdict right";
    } else {
        verdictText.textContent = "Not quite: you said " + signed(guess) + ", the count is " + signed(count) + ".";
        verdictText.className = "verdict wrong";
    }

    // The round's cards, small, with the value of each under it.
    reviewCards.innerHTML = "";
    cards.forEach(function (card) {
        const item = document.createElement("div");
        item.className = "review-card";
        item.appendChild(cardElement(card, "small"));
        const value = document.createElement("span");
        value.className = "value";
        value.textContent = signed(hiLo(card));
        item.appendChild(value);
        reviewCards.appendChild(item);
    });
    if (mode === "hard") {
        reviewCountText.textContent = "The count was " + signed(countBefore) +
            " before this round, and these cards add " + signed(count - countBefore) + ".";
    } else {
        reviewCountText.textContent = "These cards add up to " + signed(count) + ".";
    }
    nextButton.textContent = round < rounds ? "Next round" : "See how you did";
    reviewBox.hidden = false;
    nextButton.focus();
}

function next() {
    if (round < rounds) {
        nextRound();
    } else {
        endGame();
    }
}

function endGame() {
    playBox.hidden = true;
    endBox.hidden = false;

    const rightCount = history.filter(function (h) { return h.right; }).length;
    const percent = Math.round(rightCount / history.length * 100);
    scoreText.textContent = rightCount + " of " + history.length + " right (" + percent + "%)";

    // How far off the guesses were, and the longest run of right answers.
    const totalMiss = history.reduce(function (sum, h) {
        return sum + Math.abs(h.guess - h.count);
    }, 0);
    let streak = 0;
    let bestStreak = 0;
    history.forEach(function (h) {
        streak = h.right ? streak + 1 : 0;
        bestStreak = Math.max(bestStreak, streak);
    });
    statsList.innerHTML = "";
    [
        "Average miss: " + (totalMiss / history.length).toFixed(1),
        "Best streak: " + bestStreak + " right in a row",
        "Mode: " + (mode === "hard" ? "hard, running count" : "easy, new count every round") +
            ", " + speed + " s a card"
    ].forEach(function (text) {
        const item = document.createElement("li");
        item.textContent = text;
        statsList.appendChild(item);
    });

    roundsTable.innerHTML = "<tr><th>Round</th><th>Cards</th><th>You said</th><th>Count</th><th></th></tr>";
    history.forEach(function (h, index) {
        const row = document.createElement("tr");
        [index + 1, h.cards.length, signed(h.guess), signed(h.count), h.right ? "✓" : "✗"].forEach(function (text) {
            const cell = document.createElement("td");
            cell.textContent = text;
            row.appendChild(cell);
        });
        row.className = h.right ? "right" : "wrong";
        roundsTable.appendChild(row);
    });
    againButton.focus();
}

function playAgain() {
    clearTimeout(dealTimer);
    endBox.hidden = true;
    playBox.hidden = true;
    setupForm.hidden = false;
}

// --- Connect the page ----------------------------------------------------

setupForm.addEventListener("submit", startGame);
guessForm.addEventListener("submit", checkGuess);
byId("minus").addEventListener("click", function () { changeGuess(-1); });
byId("plus").addEventListener("click", function () { changeGuess(1); });
nextButton.addEventListener("click", next);
againButton.addEventListener("click", playAgain);
