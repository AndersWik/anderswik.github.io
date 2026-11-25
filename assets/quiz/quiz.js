/*
 * Quiz: every game has a topic picked at random, and five questions about
 * it. Click an answer to see if it was right, and the next question comes
 * by itself.
 *
 * The questions are in questions.json: 8 topics with 50 questions each.
 * Each topic deals its questions like a deck of cards, so you don't get the
 * same question again until you have seen them all.
 */

// --- Settings ------------------------------------------------------------

// Where the questions are. On a page of your own: "questions.json".
const QUESTIONS_FILE = "/assets/quiz/questions.json";
const QUESTIONS_PER_GAME = 5;
const NEXT_TIME = 1200;    // ms to show the right answer before going on

// --- Elements on the page ------------------------------------------------

const topicText = document.getElementById("topic");
const statusRow = document.getElementById("status");
const scoreText = document.getElementById("score");
const progressText = document.getElementById("progress");
const dotsBox = document.getElementById("dots");
const questionText = document.getElementById("question");
const answersBox = document.getElementById("answers");
const resultText = document.getElementById("result");
const restartButton = document.getElementById("restart");

// --- State ---------------------------------------------------------------

let topics = [];       // from questions.json: { name, questions }
let decks = {};        // the questions left to deal, for each topic
let topic = null;      // the topic of this game
let questions = [];    // the questions for this game
let results = [];      // true or false for each question answered
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

function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

// --- Loading the questions -----------------------------------------------

async function loadQuestions() {
    questionText.textContent = "Loading the questions...";
    try {
        const response = await fetch(QUESTIONS_FILE);
        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }
        const data = await response.json();
        topics = data.topics;
        newGame();
    } catch (error) {
        questionText.textContent = "The questions could not be loaded (" + error.message + ").";
    }
}

// --- Topics and questions ------------------------------------------------

// A random topic, but not the same as last game.
function pickTopic() {
    const others = topics.filter(function (t) {
        return t !== topic;
    });
    return randomItem(others.length > 0 ? others : topics);
}

// The next questions from the topic's deck. When the deck runs low, the
// whole topic is shuffled into a new deck.
function dealQuestions(t) {
    if (!decks[t.name] || decks[t.name].length < QUESTIONS_PER_GAME) {
        decks[t.name] = shuffle(t.questions);
    }
    return decks[t.name].splice(0, QUESTIONS_PER_GAME);
}

// --- The game ------------------------------------------------------------

function newGame() {
    topic = pickTopic();
    questions = dealQuestions(topic);
    results = [];
    current = 0;
    score = 0;
    topicText.textContent = topic.name;
    scoreText.textContent = score;
    statusRow.hidden = false;
    resultText.textContent = "";
    restartButton.hidden = true;
    showQuestion();
}

function showDots() {
    dotsBox.innerHTML = "";
    questions.forEach(function (q, index) {
        const dot = document.createElement("span");
        dot.className = "dot";
        if (results[index] === true) {
            dot.classList.add("right");
        } else if (results[index] === false) {
            dot.classList.add("wrong");
        } else if (index === current) {
            dot.classList.add("now");
        }
        dotsBox.appendChild(dot);
    });
}

function showQuestion() {
    const q = questions[current];
    answered = false;
    progressText.textContent = "Question " + (current + 1) + " of " + questions.length;
    questionText.textContent = q.question;
    showDots();

    // The answers in a new order every time, so the right one moves around.
    // Each button remembers which answer it is with data-index.
    answersBox.innerHTML = "";
    shuffle([0, 1, 2, 3]).forEach(function (index) {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = q.answers[index];
        button.dataset.index = index;
        button.addEventListener("click", function () {
            answer(index, button);
        });
        answersBox.appendChild(button);
    });
}

function answer(index, clicked) {
    // Only the first click counts.
    if (answered) {
        return;
    }
    answered = true;

    const q = questions[current];
    const right = index === q.correct;
    results[current] = right;

    // Always show the right answer in green. A wrong click goes red.
    answersBox.querySelectorAll("button").forEach(function (button) {
        button.disabled = true;
        if (Number(button.dataset.index) === q.correct) {
            button.classList.add("correct");
        }
    });
    if (right) {
        score++;
        scoreText.textContent = score;
    } else {
        clicked.classList.add("wrong");
    }
    showDots();

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
    // The score is shown big at the end, so the row with it can go.
    statusRow.hidden = true;
    progressText.textContent = "";
    questionText.textContent = "";
    answersBox.innerHTML = "";
    showDots();

    let words;
    if (score === questions.length) {
        words = "Amazing! All of them right!";
    } else if (score >= questions.length - 2) {
        words = "Well done!";
    } else {
        words = "Better luck with the next topic!";
    }
    // The score big, and the words under it.
    resultText.innerHTML = "";
    const big = document.createElement("span");
    big.className = "big";
    big.textContent = score + " / " + questions.length;
    resultText.append(big, words);
    restartButton.hidden = false;
}

// --- Connect the page ----------------------------------------------------

restartButton.addEventListener("click", newGame);

loadQuestions();
