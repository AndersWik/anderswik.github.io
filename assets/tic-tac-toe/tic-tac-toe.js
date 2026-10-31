let playingAgainstCPU = true;
let smarterCPU = true;
let currentPlayer = "X";
let winner = "";
let gameActive = true;
let gameState = ["", "", "", "", "", "", "", "", ""];

const winningCombinations = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const uiDisplay = {
  squares: document.querySelectorAll(".square"),
  status: document.getElementById("status"),
  reset: document.getElementById("reset"),
  players: document.getElementById("players"),
  difficulty: document.getElementById("difficulty"),
};

function handleSquareClick(e) {
  if (!gameActive || (playingAgainstCPU && currentPlayer !== "X")) return;

  const square = e.target;
  const squareIndex = Array.from(uiDisplay.squares).indexOf(square);

  if (gameState[squareIndex] !== "") return;

  gameState[squareIndex] = currentPlayer;
  square.textContent = currentPlayer;
  checkWinner();
  gameActive && (currentPlayer = getOppositePlayer());
  updateStatus();

  if (gameActive && playingAgainstCPU) {
    setTimeout(() => {
      let index = smarterCPU
        ? computerSmartMove()
        : computerRandomMove(getEmptySquares());
      gameState[index] = currentPlayer;
      uiDisplay.squares[index].textContent = currentPlayer;
      checkWinner();
      gameActive && (currentPlayer = getOppositePlayer());
      updateStatus();
    }, 500);
  }
}

function getEmptySquares() {
  let emptysquares = [];
  gameState.forEach((square, index) => {
    if (square === "") {
      emptysquares.push(index);
    }
  });
  return emptysquares;
}

function getOppositePlayer() {
  const players = ["X", "O"];
  return currentPlayer === players[0] ? players[1] : players[0];
}

function computerRandomMove(emptySquares) {
  let randomIndex =
    emptySquares[Math.floor(Math.random() * emptySquares.length)];
  return randomIndex;
}

function computerSmartMove() {
  // Can SPU win?
  let bestMove = findWinningMove(gameState, currentPlayer);
  if (bestMove !== null) return bestMove;

  // Can player win?
  bestMove = findWinningMove(gameState, getOppositePlayer());
  if (bestMove !== null) return bestMove;

  // Are center square free?
  if (board[4] === "") return 4;

  // Are any corners free?
  const corners = [0, 2, 6, 8].filter((i) => board[i] === "");
  if (corners.length > 0) return computerRandomMove(corners);

  // If we did not find index get random
  return computerRandomMove(getEmptySquares());
}

function findWinningMove(board, symbol) {
  const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  for (let combo of winningCombinations) {
    let [a, b, c] = combo;
    let values = [board[a], board[b], board[c]];

    if (
      values.filter((v) => v === symbol).length === 2 &&
      values.includes("")
    ) {
      return combo[values.indexOf("")];
    }
  }
  return null;
}

function checkWinner() {
  winningCombinations.forEach((combination) => {
    const [a, b, c] = combination;

    if (
      gameState[a] === currentPlayer &&
      gameState[b] === currentPlayer &&
      gameState[c] === currentPlayer
    ) {
      gameActive = false;
      winner = currentPlayer;
    }
  });

  let emptySquares = getEmptySquares();
  if (gameActive && emptySquares.length === 0) {
    gameActive = false;
  }
}

function updateStatus() {
  let status = "";
  if (gameActive) {
    status = "Player " + currentPlayer + " turn";
  } else if (winner !== "X" && winner !== "O") {
    status = "It's a draw!";
  } else {
    if (playingAgainstCPU) {
      status = winner === "X" ? "You Win!" : "Computer Wins!";
    } else {
      status = "Player " + winner + " Win!";
    }
  }
  uiDisplay.status.textContent = status;
}

function resetGame() {
  playingAgainstCPU = uiDisplay.players.value === "1";
  smarterCPU = uiDisplay.difficulty.value === "smart";
  currentPlayer = "X";
  winner = "";
  gameActive = true;
  gameState = ["", "", "", "", "", "", "", "", ""];
  uiDisplay.squares.forEach((square) => (square.textContent = ""));
}

uiDisplay.squares.forEach((square) => {
  square.addEventListener("click", handleSquareClick);
});

uiDisplay.reset.addEventListener("click", function () {
  resetGame();
  updateStatus();
});

uiDisplay.players.addEventListener("change", function () {
  if (uiDisplay.players.value === "1") {
    uiDisplay.difficulty.style.display = "inline-block";
  } else {
    uiDisplay.difficulty.style.display = "none";
  }
  resetGame();
  updateStatus();
});

uiDisplay.difficulty.addEventListener("change", function () {
  resetGame();
  updateStatus();
});
