/*
 * Coin flip: the coin switches between heads and tails for a while, then
 * lands on one side at random. The page counts heads and tails.
 */

// --- Elements on the page ------------------------------------------------

const headsSide = document.getElementById("resultCoinHeads");
const tailsSide = document.getElementById("resultCoinTails");
const flipButton = document.getElementById("flipCoinBtn");
const headsText = document.getElementById("resultHeads");
const tailsText = document.getElementById("resultTails");

// --- State ---------------------------------------------------------------

let headsCount = 0;
let tailsCount = 0;
let flipping = false;

const FLIP_TIME = 2000;   // ms the coin spins
const SWITCH_TIME = 150;  // ms between showing heads and tails while it spins

// --- Helpers -------------------------------------------------------------

function showSide(isHeads) {
    headsSide.hidden = !isHeads;
    tailsSide.hidden = isHeads;
}

// --- Actions -------------------------------------------------------------

function flipCoin() {
    // One flip at a time; otherwise a fast double click counts twice.
    if (flipping) {
        return;
    }
    flipping = true;
    flipButton.disabled = true;

    // Switch sides quickly so it looks like the coin is spinning.
    let showingHeads = true;
    const spin = setInterval(function () {
        showingHeads = !showingHeads;
        showSide(showingHeads);
    }, SWITCH_TIME);

    setTimeout(function () {
        clearInterval(spin);

        // Math.random() is below 0.5 half of the time.
        const isHeads = Math.random() < 0.5;
        if (isHeads) {
            headsCount++;
        } else {
            tailsCount++;
        }
        showSide(isHeads);
        headsText.textContent = "Heads: " + headsCount;
        tailsText.textContent = "Tails: " + tailsCount;

        flipping = false;
        flipButton.disabled = false;
    }, FLIP_TIME);
}

// --- Connect the page ----------------------------------------------------

flipButton.addEventListener("click", flipCoin);
