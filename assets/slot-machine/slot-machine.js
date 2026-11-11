/*
 * Slot machine: a spin costs one coin. The three reels spin, and stop one
 * after the other. Press Stop to stop the next reel at once. Three of the
 * same symbol is a jackpot of 10 coins.
 */

// --- Settings ------------------------------------------------------------

const SYMBOLS = ["♣", "♦", "♥", "♠"];
const RED_SYMBOLS = ["♦", "♥"];
const START_COINS = 20;
const JACKPOT = 10;
const TICK = 60;            // ms between symbol changes while spinning
const FIRST_STOP = 15;      // ticks before the first reel stops...
const NEXT_STOP = 8;        // ...and between the next ones

// --- Elements on the page ------------------------------------------------

const reels = document.querySelectorAll(".slot");
const coinsText = document.getElementById("coins");
const messageText = document.getElementById("slot-message");
const titleText = document.getElementById("machine-title");
const spinButton = document.getElementById("start");
const stopButton = document.getElementById("stop");
const restartButton = document.getElementById("restart");

// --- State ---------------------------------------------------------------

let coins = START_COINS;
let results = [];       // the symbol showing on each reel
let stopAt = [];        // the tick each reel stops at
let ticks = 0;
let spinTimer = null;   // null when the reels are standing still

// --- Helpers -------------------------------------------------------------

function randomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function showReel(index, symbol) {
    reels[index].textContent = symbol;
    reels[index].classList.toggle("red", RED_SYMBOLS.includes(symbol));
}

function showButtons() {
    spinButton.disabled = spinTimer !== null || coins === 0;
    stopButton.disabled = spinTimer === null;
    restartButton.hidden = spinTimer !== null || coins > 0;
    coinsText.textContent = coins;
}

// --- Spinning ------------------------------------------------------------

function spin() {
    if (spinTimer !== null || coins === 0) {
        return;
    }
    coins--;
    ticks = 0;
    stopAt = [];
    reels.forEach(function (reel, index) {
        stopAt.push(FIRST_STOP + index * NEXT_STOP);
    });
    messageText.textContent = "Spinning...";
    titleText.classList.remove("jackpot");
    spinTimer = setInterval(tick, TICK);
    showButtons();
}

// Every tick, each reel that is still spinning shows a new random symbol.
// The symbol it shows when it stops is the result.
function tick() {
    ticks++;
    let spinning = 0;
    reels.forEach(function (reel, index) {
        if (ticks <= stopAt[index]) {
            results[index] = randomSymbol();
            showReel(index, results[index]);
            spinning++;
        }
    });
    if (spinning === 0) {
        clearInterval(spinTimer);
        spinTimer = null;
        checkWin();
        showButtons();
    }
}

// Stop the next reel that is still spinning, right now.
function stopNext() {
    const next = stopAt.findIndex(function (stop) {
        return stop > ticks;
    });
    if (next !== -1) {
        stopAt[next] = ticks;
    }
}

function checkWin() {
    const allSame = results.every(function (symbol) {
        return symbol === results[0];
    });
    if (allSame) {
        coins += JACKPOT;
        messageText.textContent = "Jackpot! +" + JACKPOT + " coins";
        titleText.classList.add("jackpot");
    } else if (coins === 0) {
        messageText.textContent = "No coins left!";
    } else {
        messageText.textContent = "Try again!";
    }
}

function newGame() {
    coins = START_COINS;
    messageText.textContent = "Try your luck!";
    showButtons();
}

// --- Connect the page ----------------------------------------------------

spinButton.addEventListener("click", spin);
stopButton.addEventListener("click", stopNext);
restartButton.addEventListener("click", newGame);

showButtons();
