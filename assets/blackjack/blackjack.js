/*
 * Blackjack against the dealer.
 *
 * Get closer to 21 than the dealer without going over. Number cards count
 * their number, J Q K count 10, and an ace counts 11 or 1.
 *
 * Rules in this game:
 *   - Click the chips to bet, then Deal.
 *   - Blackjack (21 with the first two cards) pays 3 to 2.
 *   - The dealer draws until 17 or more.
 *   - Double down: double the bet on two cards, get exactly one more card.
 *   - Split: two cards of the same value become two hands, once.
 *   - Insurance: when the dealer shows an ace, bet half your bet that the
 *     dealer has blackjack. It pays 2 to 1.
 *
 * Like the other apps, every action changes the state and then calls
 * render(), which draws the page from the state.
 */

// --- Settings ------------------------------------------------------------

const START_BALANCE = 1000;
const SUITS = ["♠", "♥", "♦", "♣"];
const VALUES = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const CHIPS = [10, 50, 100];

// --- Elements on the page ------------------------------------------------

function byId(id) {
    return document.getElementById(id);
}

const dealerCards = byId("dealer-cards");
const dealerScoreText = byId("dealer-score");
const playerHands = byId("player-hands");
const resultText = byId("result");
const balanceText = byId("balance");
const betText = byId("current-bet");
const clearButton = byId("clearBet");
const dealButton = byId("startGame");
const hitButton = byId("hit");
const standButton = byId("stand");
const doubleButton = byId("doubleDown");
const splitButton = byId("split");
const insuranceButton = byId("takeInsurance");
const chipButtons = CHIPS.map(function (chip) {
    return byId("placeBet" + chip);
});

// --- State ---------------------------------------------------------------

let balance = START_BALANCE;
let bet = 0;              // the bet being placed before Deal
let playing = false;      // true while the player is playing a hand
let deck = [];
let dealer = [];          // the dealer's cards; dealer[0] is face down
let hands = [];           // the player's hands: { cards, bet }
let active = 0;           // which hand the player is playing
let insurance = 0;
let peeked = false;       // has the dealer looked for blackjack?
let message = "Click the chips to place a bet.";

// --- Cards ---------------------------------------------------------------

function newDeck() {
    const cards = [];
    for (const suit of SUITS) {
        for (const value of VALUES) {
            cards.push({ suit: suit, value: value });
        }
    }
    // Fisher-Yates shuffle: swap every card with a random card at or
    // before it. Every order is equally likely.
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
}

function cardValue(card) {
    if (card.value === "A") {
        return 11;
    }
    if (["J", "Q", "K"].includes(card.value)) {
        return 10;
    }
    return Number(card.value);
}

// Count aces as 11, then as 1 while the total is over 21.
function score(cards) {
    let total = 0;
    let aces = 0;
    for (const card of cards) {
        total += cardValue(card);
        if (card.value === "A") {
            aces++;
        }
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

// Blackjack is 21 with the first two cards, and not after a split.
function isBlackjack(cards) {
    return cards.length === 2 && score(cards) === 21 && hands.length === 1;
}

function dealerHasBlackjack() {
    return dealer.length === 2 && score(dealer) === 21;
}

function hand() {
    return hands[active];
}

// --- Betting -------------------------------------------------------------

function addChip(chip) {
    if (playing || balance < chip) {
        return;
    }
    balance -= chip;
    bet += chip;
    message = "";
    render();
}

function clearBet() {
    balance += bet;
    bet = 0;
    render();
}

// --- Playing -------------------------------------------------------------

function deal() {
    // Out of money: start again.
    if (bet === 0 && balance < CHIPS[0]) {
        balance = START_BALANCE;
        message = "New game! Click the chips to place a bet.";
        render();
        return;
    }
    if (playing || bet === 0) {
        return;
    }

    deck = newDeck();
    hands = [{ cards: [deck.pop(), deck.pop()], bet: bet }];
    dealer = [deck.pop(), deck.pop()];
    bet = 0;
    active = 0;
    insurance = 0;
    peeked = false;
    playing = true;
    message = "";

    const upCard = dealer[1];
    if (isBlackjack(hand().cards)) {
        finishRound();      // nothing to decide; the dealer shows the cards
    } else if (cardValue(upCard) === 10) {
        // With a 10 showing, the dealer looks at the hidden card at once.
        peek();
    } else if (upCard.value === "A") {
        message = "The dealer shows an ace. Insurance?";
    }
    render();
}

// The dealer looks for blackjack. If it is there, the round is over.
// Returns true if the round ended.
function peek() {
    if (peeked) {
        return false;
    }
    peeked = true;
    if (dealerHasBlackjack()) {
        finishRound();
        return true;
    }
    return false;
}

function takeInsurance() {
    insurance = hand().bet / 2;
    balance -= insurance;
    message = "";
    if (!peek()) {
        message = "No dealer blackjack. Insurance lost.";
    }
    render();
}

function hit() {
    if (peek()) {
        render();
        return;
    }
    hand().cards.push(deck.pop());
    if (score(hand().cards) >= 21) {
        nextHand();     // bust, or 21: nothing more to do
    }
    render();
}

function stand() {
    if (!peek()) {
        nextHand();
    }
    render();
}

function doubleDown() {
    if (peek()) {
        render();
        return;
    }
    balance -= hand().bet;
    hand().bet *= 2;
    hand().cards.push(deck.pop());
    nextHand();
    render();
}

function split() {
    if (peek()) {
        render();
        return;
    }
    const [first, second] = hand().cards;
    balance -= hand().bet;
    hands = [
        { cards: [first, deck.pop()], bet: hand().bet },
        { cards: [second, deck.pop()], bet: hand().bet }
    ];
    message = "Playing hand 1.";
    render();
}

// Go on to the next hand, or let the dealer play after the last one.
function nextHand() {
    active++;
    if (active < hands.length) {
        message = "Playing hand " + (active + 1) + ".";
    } else {
        dealerPlays();
    }
}

function dealerPlays() {
    const allBust = hands.every(function (h) {
        return score(h.cards) > 21;
    });
    // The dealer only draws if there is a hand left to beat.
    if (!allBust) {
        while (score(dealer) < 17) {
            dealer.push(deck.pop());
        }
    }
    finishRound();
}

function finishRound() {
    playing = false;
    const dealerScore = score(dealer);
    const lines = [];

    if (insurance > 0 && dealerHasBlackjack()) {
        balance += insurance * 3;
        lines.push("Insurance pays " + insurance * 2 + "!");
    }

    hands.forEach(function (h, index) {
        const playerScore = score(h.cards);
        let result;
        let payout = 0;

        if (playerScore > 21) {
            result = "Bust";
        } else if (isBlackjack(h.cards) && dealerHasBlackjack()) {
            result = "Push";
            payout = h.bet;
        } else if (isBlackjack(h.cards)) {
            result = "Blackjack!";
            payout = h.bet * 2.5;     // the bet back, plus 3 to 2
        } else if (dealerHasBlackjack()) {
            result = "Dealer has blackjack";
        } else if (dealerScore > 21 || playerScore > dealerScore) {
            result = "Win";
            payout = h.bet * 2;       // the bet back, plus the same again
        } else if (playerScore < dealerScore) {
            result = "Lose";
        } else {
            result = "Push";
            payout = h.bet;           // the bet back
        }

        balance += payout;
        const name = hands.length > 1 ? "Hand " + (index + 1) + ": " : "";
        lines.push(name + result);
    });

    if (balance < CHIPS[0]) {
        lines.push("You are out of money. Press Deal to start again.");
    }
    message = lines.join("\n");
}

// --- Drawing -------------------------------------------------------------

function cardElement(card, faceDown) {
    const element = document.createElement("div");
    element.className = "card";

    if (faceDown) {
        element.classList.add("hidden");
        element.setAttribute("aria-label", "face down card");
    } else {
        element.textContent = card.value + card.suit;
        if (card.suit === "♥" || card.suit === "♦") {
            element.classList.add("red");
        }
    }
    // Only new cards slide in; cards that were already shown stay still.
    if (!card.shown) {
        element.classList.add("new");
        card.shown = true;
    }
    return element;
}

function render() {
    // The dealer's hidden card is shown when the round is over.
    dealerCards.innerHTML = "";
    dealer.forEach(function (card, index) {
        dealerCards.appendChild(cardElement(card, index === 0 && playing));
    });
    if (dealer.length === 0) {
        dealerScoreText.textContent = "";
    } else if (playing) {
        dealerScoreText.textContent = "(" + cardValue(dealer[1]) + " + ?)";
    } else {
        dealerScoreText.textContent = "(" + score(dealer) + ")";
    }

    playerHands.innerHTML = "";
    hands.forEach(function (h, index) {
        const box = document.createElement("div");
        box.className = "player-hand";
        if (playing && index === active && hands.length > 1) {
            box.classList.add("active");
        }

        const label = document.createElement("p");
        label.textContent = "Score " + score(h.cards) + ", bet $" + h.bet;
        box.appendChild(label);

        const cards = document.createElement("div");
        cards.className = "cards";
        h.cards.forEach(function (card) {
            cards.appendChild(cardElement(card, false));
        });
        box.appendChild(cards);
        playerHands.appendChild(box);
    });

    resultText.textContent = message;
    balanceText.textContent = balance;
    betText.textContent = bet;

    // Buttons can only be pressed when they make sense.
    const current = hands[active];
    const twoCards = playing && current.cards.length === 2;

    chipButtons.forEach(function (button, index) {
        button.disabled = playing || balance < CHIPS[index];
    });
    clearButton.disabled = playing || bet === 0;
    dealButton.disabled = playing || (bet === 0 && balance >= CHIPS[0]);
    hitButton.disabled = !playing;
    standButton.disabled = !playing;
    doubleButton.disabled = !twoCards || balance < current.bet;
    splitButton.disabled = !twoCards || hands.length > 1 ||
        cardValue(current.cards[0]) !== cardValue(current.cards[1]) ||
        balance < current.bet;
    insuranceButton.disabled = !playing || peeked || dealer[1].value !== "A" ||
        current.cards.length !== 2 || hands.length > 1 || balance < current.bet / 2;
}

// --- Connect the buttons -------------------------------------------------

chipButtons.forEach(function (button, index) {
    button.addEventListener("click", function () {
        addChip(CHIPS[index]);
    });
});
clearButton.addEventListener("click", clearBet);
dealButton.addEventListener("click", deal);
hitButton.addEventListener("click", hit);
standButton.addEventListener("click", stand);
doubleButton.addEventListener("click", doubleDown);
splitButton.addEventListener("click", split);
insuranceButton.addEventListener("click", takeInsurance);

// --- Start ---------------------------------------------------------------

render();
