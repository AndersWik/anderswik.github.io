let playerScore = 0;
let computerScore = 0;

const uiDisplay = {
  result: document.getElementById("result"),
  playerChoice: document.getElementById("playerChoice"),
  computerChoice: document.getElementById("computerChoice"),
  playerScore: document.getElementById("playerScore"),
  computerScore: document.getElementById("computerScore"),
  playerImage: document.getElementById("playerImage"),
  computerImage: document.getElementById("computerImage"),
  rockBtn: document.getElementById("rockBtn"),
  paperBtn: document.getElementById("paperBtn"),
  scissorsBtn: document.getElementById("scissorsBtn"),
};

function playGame(playerChoice) {
  // Get computer's choice
  const choices = ["Rock", "Paper", "Scissors"];
  const computerChoice = choices[Math.floor(Math.random() * 3)];

  // Update display
  uiDisplay.playerChoice.textContent = `${playerChoice}`;
  uiDisplay.playerImage.src =
    "/assets/rock-paper-scissors/images/" + playerChoice + ".svg";
  uiDisplay.computerChoice.textContent = `${computerChoice}`;
  uiDisplay.computerImage.src =
    "/assets/rock-paper-scissors/images/" + computerChoice + ".svg";

  determineWinner(playerChoice, computerChoice);
}

function determineWinner(player, computer) {
  if (player === computer) {
    uiDisplay.result.innerHTML = "It's a draw!";
    return;
  }

  if (
    (player === "Rock" && computer === "Scissors") ||
    (player === "Paper" && computer === "Rock") ||
    (player === "Scissors" && computer === "Paper")
  ) {
    playerScore++;
    uiDisplay.playerScore.textContent = playerScore;
    uiDisplay.result.innerHTML = "You win!";
  } else {
    computerScore++;
    uiDisplay.computerScore.textContent = computerScore;
    uiDisplay.result.innerHTML = "Computer wins!";
  }
}

uiDisplay.rockBtn.addEventListener("click", function () {
  playGame("Rock");
});

uiDisplay.paperBtn.addEventListener("click", function () {
  playGame("Paper");
});

uiDisplay.scissorsBtn.addEventListener("click", function () {
  playGame("Scissors");
});
