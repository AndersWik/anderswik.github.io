/*
 * Magic 8 ball: ask a question, shake the ball, get a random answer.
 *
 * The question is not used for anything; the answer is picked at random.
 * The shaking is a CSS animation that we turn on by adding a class.
 */

// --- Elements on the page ------------------------------------------------

const ball = document.getElementById("eightball");
const form = document.getElementById("ask-form");
const questionInput = document.getElementById("question");
const resultText = document.getElementById("result");

// --- Data ----------------------------------------------------------------

const ANSWERS = [
    "Yes, definitely.",
    "It is certain.",
    "Most likely.",
    "Ask again later.",
    "Cannot predict right now.",
    "Don’t count on it.",
    "Very doubtful.",
    "No way.",
    "Probably not.",
    "Maybe."
];

const SHAKE_TIME = 500; // milliseconds, the same as the animation in the CSS

// --- Helpers -------------------------------------------------------------

// Math.random() gives a number from 0 up to (not including) 1.
// Times the length, rounded down, gives an index from 0 to length - 1.
function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

// --- Actions -------------------------------------------------------------

function shake(event) {
    // The form would reload the page; we handle it here instead.
    event.preventDefault();

    if (questionInput.value.trim() === "") {
        resultText.textContent = "Please ask a question first!";
        return;
    }

    // Already shaking? Then wait for that answer.
    if (ball.classList.contains("shake-ball")) {
        return;
    }

    resultText.textContent = "";
    ball.classList.add("shake-ball");

    setTimeout(function () {
        ball.classList.remove("shake-ball");
        resultText.textContent = randomItem(ANSWERS);
    }, SHAKE_TIME);
}

// --- Connect the page ----------------------------------------------------

// A form lets the user press Enter as well as click the button.
form.addEventListener("submit", shake);
