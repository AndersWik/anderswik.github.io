const quizQuestions = [
  {
    question: "How many years can a snail sleep for?",
    answers: ["Four", "Five", "Three", "One"],
    correctIndex: 2,
  },
  {
    question: "What is the largest bird in the world?",
    answers: ["Swan", "Emperor Penguins", "Ostrich", "Albatrosses"],
    correctIndex: 2,
  },
  {
    question: "What do you call a group of kangaroos?",
    answers: ["A band", "A troop", "A gang", "A crowd"],
    correctIndex: 1,
  },
  {
    question: "What is the largest mammal in the world?",
    answers: ["African Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correctIndex: 1,
  },
  {
    question: "What is the tallest species of penguin?",
    answers: [
      "King Penguin",
      "Humboldt Penguin",
      "Royal Penguin",
      "Emperor Penguin",
    ],
    correctIndex: 3,
  },
  {
    question: "How long does it take for a sloth to digest its food?",
    answers: ["30 days", "20 days", "10 days", "40 days"],
    correctIndex: 0,
  },
  {
    question: "How many compartments does a cow’s stomach have?",
    answers: ["Four", "Three", "Two", "One"],
    correctIndex: 0,
  },
  {
    question: "Which mammal has the lowest heart rate?",
    answers: ["Hippopotamus", "Albatrosses", "African Elephant", "Blue whale"],
    correctIndex: 3,
  },
];

let quizData = [];
let currentQuestion = 0;
let totalQuestions = 5;
let score = 0;

const uiDisplay = {
  answersDiv: document.getElementById("answers"),
  questionDiv: document.getElementById("question"),
  restartButton: document.getElementById("restart"),
  score: document.getElementById("score"),
  result: document.getElementById("result"),
  overlay: document.getElementById("overlay"),
  star: document.getElementById("star"),
};

function initQuestions() {
  quizData = [];
  let questionIndexes = [];
  while (questionIndexes.length < totalQuestions) {
    let r = Math.floor(Math.random() * quizQuestions.length);
    if (questionIndexes.indexOf(r) === -1) {
      questionIndexes.push(r);
    }
  }
  for (let i = 0; i < questionIndexes.length; i++) {
    quizData.push(quizQuestions[questionIndexes[i]]);
  }
}

function loadQuestion() {
  if (currentQuestion >= totalQuestions) {
    showFinalScore();
    return;
  }

  const question = quizData[currentQuestion];
  uiDisplay.questionDiv.textContent = question.question;

  uiDisplay.answersDiv.innerHTML = "";

  question.answers.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = option;
    button.onclick = () => answerCheck(index);
    uiDisplay.answersDiv.appendChild(button);
  });
}

function answerCheck(selectedIndex) {
  if (selectedIndex === quizData[currentQuestion].correctIndex) {
    score++;
    uiDisplay.score.textContent = score;
  }

  currentQuestion++;
  loadQuestion();
}

function showFinalScore() {
  let message =
    score < totalQuestions
      ? "<span>Game Over! </span>"
      : "<span>Amazing! </span>";
  message += `Your final score is <span>${score}/${totalQuestions}</span>`;
  uiDisplay.result.innerHTML = message;
  uiDisplay.answersDiv.innerHTML = "";
  uiDisplay.overlay.classList.add("show");
  if (score === totalQuestions) {
    uiDisplay.star.style.display = "block";
  }
}

uiDisplay.restartButton.onclick = () => {
  currentQuestion = 0;
  totalQuestions = quizData.length;
  score = 0;
  uiDisplay.score.innerText = score;
  uiDisplay.overlay.classList.remove("show");
  uiDisplay.star.style.display = "none";
  initQuestions();
  loadQuestion();
};

window.onload = function () {
  initQuestions();
  loadQuestion();
};
