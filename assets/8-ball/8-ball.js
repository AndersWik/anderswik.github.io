const uiDisplay = {
  eightball: document.getElementById("eightball"),
  eightBallBtn: document.getElementById("eightBallBtn"),
  question: document.getElementById("question"),
  result: document.getElementById("result"),
};

function getAnswer() {
  const questions = uiDisplay.question.value;

  if (!questions) {
    uiDisplay.result.innerHTML = "Please ask a question first!";
    return;
  }

  uiDisplay.eightball.classList.add("shake-ball");

  const answers = [
    "Yes, definitely.",
    "It is certain.",
    "Most likely.",
    "Ask again later.",
    "Cannot predict right now.",
    "Don’t count on it.",
    "Very doubtful.",
    "No way.",
    "Probably not.",
    "Maybe.",
  ];

  setTimeout(() => {
    uiDisplay.eightball.classList.remove("shake-ball");
    const result = answers[Math.floor(Math.random() * answers.length)];
    uiDisplay.result.innerHTML = result;
  }, 500);
}

uiDisplay.eightBallBtn.addEventListener("click", getAnswer);
