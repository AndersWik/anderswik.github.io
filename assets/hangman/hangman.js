/*
 * Hangman: guess the word one letter at a time. Every wrong letter adds a
 * part to the hanging man. Six wrong letters and you lose.
 *
 * Click the letters, or type them on your keyboard.
 */

// --- Settings ------------------------------------------------------------

const WORDS = [
    "APPLE", "BANANA", "CHERRY", "COCONUT", "GRAPES", "KIWI", "LEMON",
    "LIME", "MANGO", "MELON", "ORANGE", "PEAR", "PINEAPPLE"
];
const MAX_WRONG = 6;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// --- Elements on the page ------------------------------------------------

const wordText = document.getElementById("word");
const wrongText = document.getElementById("wrong");
const messageText = document.getElementById("message");
const keyboard = document.getElementById("keyboard");
const newWordButton = document.getElementById("newWord");
const parts = document.querySelectorAll(".part");  // head, body, arms, legs

// --- State ---------------------------------------------------------------

let word = "";
let guessed = [];      // every letter guessed so far, right or wrong
let gameOver = false;
const buttons = {};    // the button for each letter, e.g. buttons["A"]

// --- Helpers -------------------------------------------------------------

function wrongCount() {
    return guessed.filter(function (letter) {
        return !word.includes(letter);
    }).length;
}

function isSolved() {
    return word.split("").every(function (letter) {
        return guessed.includes(letter);
    });
}

// --- Showing the game ----------------------------------------------------

function show() {
    // Guessed letters are shown, the rest are _.
    wordText.textContent = word.split("").map(function (letter) {
        return guessed.includes(letter) ? letter : "_";
    }).join(" ");

    const wrong = wrongCount();
    wrongText.textContent = "Wrong guesses: " + wrong + " of " + MAX_WRONG;

    // One more part of the man for each wrong guess.
    parts.forEach(function (part, index) {
        part.style.visibility = index < wrong ? "visible" : "hidden";
    });
}

// --- Actions -------------------------------------------------------------

function guess(letter) {
    if (gameOver || guessed.includes(letter)) {
        return;
    }
    guessed.push(letter);

    const button = buttons[letter];
    button.disabled = true;
    button.classList.add(word.includes(letter) ? "correct" : "wrong");
    show();

    if (isSolved()) {
        endGame("You win! The word was " + word + ".");
    } else if (wrongCount() >= MAX_WRONG) {
        endGame("Game over! The word was " + word + ".");
    }
}

function endGame(text) {
    gameOver = true;
    messageText.textContent = text;
    LETTERS.split("").forEach(function (letter) {
        buttons[letter].disabled = true;
    });
}

function newGame() {
    word = WORDS[Math.floor(Math.random() * WORDS.length)];
    guessed = [];
    gameOver = false;
    messageText.textContent = "";
    LETTERS.split("").forEach(function (letter) {
        buttons[letter].disabled = false;
        buttons[letter].classList.remove("correct", "wrong");
    });
    show();
}

// --- Connect the page ----------------------------------------------------

// One button per letter.
LETTERS.split("").forEach(function (letter) {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = letter;
    button.addEventListener("click", function () {
        guess(letter);
    });
    keyboard.appendChild(button);
    buttons[letter] = button;
});

// Typing a letter works too, but not Ctrl+R and the like.
document.addEventListener("keydown", function (event) {
    if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
    }
    const letter = event.key.toUpperCase();
    if (letter.length === 1 && LETTERS.includes(letter)) {
        guess(letter);
    }
});

newWordButton.addEventListener("click", newGame);

newGame();
