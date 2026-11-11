/*
 * Quiz: five questions about animals, picked at random. Click an answer to
 * see if it was right, and the next question comes by itself.
 */

// --- Settings ------------------------------------------------------------

const QUESTIONS = [
    {
        question: "How many years can a snail sleep for?",
        answers: ["Four", "Five", "Three", "One"],
        correct: 2
    },
    {
        question: "What is the largest bird in the world?",
        answers: ["Swan", "Emperor penguin", "Ostrich", "Albatross"],
        correct: 2
    },
    {
        question: "What do you call a group of kangaroos?",
        answers: ["A band", "A troop", "A gang", "A crowd"],
        correct: 1
    },
    {
        question: "What is the largest mammal in the world?",
        answers: ["African elephant", "Blue whale", "Giraffe", "Hippopotamus"],
        correct: 1
    },
    {
        question: "What is the tallest species of penguin?",
        answers: ["King penguin", "Humboldt penguin", "Royal penguin", "Emperor penguin"],
        correct: 3
    },
    {
        question: "How long does it take for a sloth to digest its food?",
        answers: ["30 days", "20 days", "10 days", "40 days"],
        correct: 0
    },
    {
        question: "How many compartments does a cow's stomach have?",
        answers: ["Four", "Three", "Two", "One"],
        correct: 0
    },
    {
        question: "Which mammal has the lowest heart rate?",
        answers: ["Hippopotamus", "Brown bear", "African elephant", "Blue whale"],
        correct: 3
    }
];
const QUESTIONS_PER_GAME = 5;
const NEXT_TIME = 1200;    // ms to show the right answer before going on

// --- Elements on the page ------------------------------------------------

const scoreText = document.getElementById("score");
const progressText = document.getElementById("progress");
const questionText = document.getElementById("question");
const answersBox = document.getElementById("answers");
const resultText = document.getElementById("result");
const restartButton = document.getElementById("restart");

// --- State ---------------------------------------------------------------

let questions = [];    // the questions for this game
let current = 0;       // index of the question showing
let score = 0;
let answered = false;  // true once the question showing has been answered

// --- Helpers -------------------------------------------------------------

// A shuffled copy of a list (the Fisher-Yates shuffle). Go from the end,
// and swap each item with a random one at or before it.
function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }
    return copy;
}

// --- The game ------------------------------------------------------------

function newGame() {
    questions = shuffle(QUESTIONS).slice(0, QUESTIONS_PER_GAME);
    current = 0;
    score = 0;
    scoreText.textContent = score;
    resultText.textContent = "";
    restartButton.hidden = true;
    showQuestion();
}

function showQuestion() {
    const q = questions[current];
    answered = false;
    progressText.textContent = "Question " + (current + 1) + " of " + questions.length;
    questionText.textContent = q.question;

    answersBox.innerHTML = "";
    q.answers.forEach(function (text, index) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.addEventListener("click", function () {
            answer(index);
        });
        answersBox.appendChild(button);
    });
}

function answer(index) {
    // Only the first click counts.
    if (answered) {
        return;
    }
    answered = true;

    const q = questions[current];
    const buttons = answersBox.querySelectorAll("button");
    buttons.forEach(function (button) {
        button.disabled = true;
    });

    // Always show the right answer in green. A wrong click goes red.
    buttons[q.correct].classList.add("correct");
    if (index === q.correct) {
        score++;
        scoreText.textContent = score;
    } else {
        buttons[index].classList.add("wrong");
    }

    setTimeout(nextQuestion, NEXT_TIME);
}

function nextQuestion() {
    current++;
    if (current < questions.length) {
        showQuestion();
    } else {
        endGame();
    }
}

function endGame() {
    progressText.textContent = "";
    questionText.textContent = "";
    answersBox.innerHTML = "";
    if (score === questions.length) {
        resultText.textContent = "Amazing! You got all " + score + " right!";
    } else {
        resultText.textContent = "You got " + score + " of " + questions.length + " right.";
    }
    restartButton.hidden = false;
}

// --- Connect the page ----------------------------------------------------

restartButton.addEventListener("click", newGame);

newGame();
