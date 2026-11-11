/*
 * Dice roller: pick a die with 4, 6, 8, 10, 12 or 20 sides and roll it.
 *
 * The picture of the die is set in the CSS: the preview gets a class like
 * "d6", and the CSS has a background picture for each class.
 */

// --- Elements on the page ------------------------------------------------

const diceSelect = document.getElementById("dice-type");
const preview = document.getElementById("dice-preview");
const previewText = document.getElementById("preview-text");
const rollButton = document.getElementById("roll-dice-btn");
const selectedText = document.getElementById("dice-selected");
const resultText = document.getElementById("dice-result");

const SPIN_TIME = 1000; // ms, the same as the spin animation in the CSS

// --- Helpers -------------------------------------------------------------

// A whole number from 1 to sides, all equally likely.
//   Math.random() * 6 is 0 to 5.999..., Math.floor makes it 0-5, + 1 gives 1-6.
function roll(sides) {
    return Math.floor(Math.random() * sides) + 1;
}

// --- Actions -------------------------------------------------------------

function chooseDie() {
    const sides = Number(diceSelect.value);
    preview.className = "d" + sides;
    previewText.textContent = sides;
    // The text of the chosen option, e.g. "D6 (6 sides)".
    selectedText.textContent = diceSelect.selectedOptions[0].text + " selected";
    resultText.textContent = "";
}

function rollDie() {
    if (preview.classList.contains("spin")) {
        return; // still rolling
    }
    const result = roll(Number(diceSelect.value));

    resultText.textContent = "";
    preview.classList.add("spin");
    setTimeout(function () {
        preview.classList.remove("spin");
        previewText.textContent = result;
        resultText.textContent = "You rolled " + result;
    }, SPIN_TIME);
}

// --- Connect the page ----------------------------------------------------

diceSelect.addEventListener("change", chooseDie);
rollButton.addEventListener("click", rollDie);

// --- Start ---------------------------------------------------------------

chooseDie();
selectedText.textContent = "Select a die and click Roll!";
