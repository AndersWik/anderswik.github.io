const words = [
  "APPLE",
  "BANANA",
  "CHERRY",
  "COCONUT",
  "GRAPES",
  "KIWI",
  "LEMON",
  "LIME",
  "MANGO",
  "MELON",
  "ORANGE",
  "PEAR",
  "PINEAPPLE",
];
let selectedWord = words[Math.floor(Math.random() * words.length)];
let correctLetters = [];
let wrongLetters = [];
let displayWord = Array(selectedWord.length).fill("_");
let keyboardBtns = [];

const uiDisplay = {
  correctList: document.getElementById("correctList"),
  wrongList: document.getElementById("wrongList"),
  wordDisplay: document.getElementById("wordDisplay"),
  wrongGuessesDisplay: document.getElementById("wrongGuesses"),
  keyboard: document.getElementById("keyboard"),
  result: document.getElementById("result"),
  restart: document.getElementById("restart"),
  hangmanImage: document.getElementById("hangmanImage"),
  overlay: document.getElementById("overlay"),
  resultImage: document.getElementById("resultImage"),
};

function updateUI() {
  uiDisplay.wordDisplay.textContent = displayWord.join(" ");
  uiDisplay.correctList.innerHTML = correctLetters.join(" ");
  uiDisplay.wrongList.innerHTML = wrongLetters.join(" ");

  if (wrongLetters.length > 0 && wrongLetters.length < 7) {
    uiDisplay.hangmanImage.src =
      "/assets/hangman/images/hangman-" + wrongLetters.length + ".svg";
  } else {
    uiDisplay.hangmanImage.src = "/assets/hangman/images/hangman.svg";
  }
  uiDisplay.wrongGuessesDisplay.textContent = `Wrong guesses: ${wrongLetters.length}`;
}

function checkLetter(letter) {
  let isCorrect = false;
  if (!correctLetters.includes(letter) && !wrongLetters.includes(letter)) {
    isCorrect = selectedWord.includes(letter);
    if (isCorrect) {
      for (let i = 0; i < selectedWord.length; i++) {
        if (selectedWord[i] === letter) {
          displayWord[i] = letter;
        }
      }
    }
    isCorrect ? correctLetters.push(letter) : wrongLetters.push(letter);
  }
  return isCorrect;
}

function checkGameOver() {
  if (!displayWord.includes("_")) {
    uiDisplay.result.innerHTML =
      "<span>You Win!</span> The word was <span>" + selectedWord + "</span>";
    uiDisplay.resultImage.src = "/assets/hangman/images/star.svg";
    uiDisplay.overlay.style.display = "block";
    disableKeyboard();
  } else if (wrongLetters.length >= 6) {
    uiDisplay.result.innerHTML =
      "<span>Game Over!</span> The word was <span>" + selectedWord + "</span>";
    uiDisplay.resultImage.src = "/assets/hangman/images/hangman-6.svg";
    uiDisplay.overlay.style.display = "block";
    disableKeyboard();
  }
}

function createKeyboard() {
  for (let i = 65; i <= 90; i++) {
    let letter = String.fromCharCode(i);
    let btn = document.createElement("button");
    btn.textContent = letter;
    btn.onclick = function () {
      btn.disabled = true;
      let isCorrect = checkLetter(letter);
      isCorrect ? btn.classList.add("correct") : btn.classList.add("wrong");
      updateUI();
      checkGameOver();
    };
    uiDisplay.keyboard.appendChild(btn);
    keyboardBtns.push(btn);
  }
}

function disableKeyboard() {
  keyboardBtns.forEach((element) => {
    element.disabled = true;
  });
}

uiDisplay.restart.addEventListener("click", function () {
  location.reload();
});

window.onload = function () {
  createKeyboard();
  updateUI();
};
