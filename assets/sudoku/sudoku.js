const uiDisplay = {
  board: document.getElementById("sudoku-board"),
  checkBoard: document.getElementById("checkBoard"),
  restartGame: document.getElementById("restartGame"),
  overlay: document.getElementById("overlay"),
  overlayClose: document.getElementById("overlayClose"),
  overlayMessage: document.getElementById("overlayMessage"),
  overlayRestart: document.getElementById("overlayRestart"),
  gameModeSelector: document.getElementById("gameMode"),
  getHint: document.getElementById("getHint"),
  numberPad: document.getElementById("numberPad"),
  status: document.getElementById("status"),
};

// Number of given cells we aim for. Harder puzzles may end up with a few
// more if removing another cell would allow more than one solution.
const prefilledCounts = {
  easy: 40,
  medium: 35,
  hard: 30,
  expert: 25,
};

let solutionBoard = []; // numbers 1-9
let cells = []; // cells[row][col] -> <input>
let activeCell = null;

function initGame() {
  hideOverlay();
  uiDisplay.status.textContent = "";
  activeCell = null;

  const prefilledCount = prefilledCounts[uiDisplay.gameModeSelector.value] || 35;

  // 0 means an empty cell
  const fullBoard = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillBoard(fullBoard);
  solutionBoard = fullBoard.map((row) => row.slice()); // copy full solution

  const newPuzzle = generatePuzzle(fullBoard, prefilledCount);
  createBoard(newPuzzle);
}

/* ---------- Puzzle generation ---------- */

// Fisher–Yates shuffle, every order is equally likely
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function isSafe(board, row, col, num) {
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num || board[x][col] === num) return false;
  }
  const startRow = row - (row % 3);
  const startCol = col - (col % 3);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (board[startRow + r][startCol + c] === num) return false;
    }
  }
  return true;
}

function fillBoard(board) {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (isSafe(board, row, col, num)) {
            board[row][col] = num;
            if (fillBoard(board)) return true; // recurse
            board[row][col] = 0; // backtrack
          }
        }
        return false; // no valid number found, backtrack
      }
    }
  }
  return true; // board is filled
}

// Count solutions, but stop as soon as we reach `limit`.
// Always tries the empty cell with the fewest options first, which keeps it fast.
function countSolutions(board, limit = 2) {
  let bestRow = -1;
  let bestCol = -1;
  let bestOptions = null;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] !== 0) continue;
      const options = [];
      for (let num = 1; num <= 9; num++) {
        if (isSafe(board, row, col, num)) options.push(num);
      }
      if (options.length === 0) return 0; // dead end
      if (!bestOptions || options.length < bestOptions.length) {
        bestRow = row;
        bestCol = col;
        bestOptions = options;
      }
    }
  }

  if (!bestOptions) return 1; // no empty cells left: one solution found

  let count = 0;
  for (let num of bestOptions) {
    board[bestRow][bestCol] = num;
    count += countSolutions(board, limit - count);
    if (count >= limit) break;
  }
  board[bestRow][bestCol] = 0;
  return count;
}

// Remove numbers one by one, but only if the puzzle still has exactly one solution.
function generatePuzzle(fullBoard, prefilledCount) {
  const puzzle = fullBoard.map((row) => row.slice());
  const positions = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let filled = 81;

  for (let index of positions) {
    if (filled <= prefilledCount) break;
    const row = Math.floor(index / 9);
    const col = index % 9;
    const value = puzzle[row][col];

    puzzle[row][col] = 0;
    if (countSolutions(puzzle.map((r) => r.slice())) === 1) {
      filled--;
    } else {
      puzzle[row][col] = value; // put it back, removing it makes the puzzle ambiguous
    }
  }

  return puzzle;
}

/* ---------- Board ---------- */

function createBoard(puzzleData) {
  uiDisplay.board.innerHTML = "";
  cells = [];

  for (let row = 0; row < 9; row++) {
    cells.push([]);
    for (let col = 0; col < 9; col++) {
      const cell = document.createElement("input");
      cell.type = "text";
      cell.inputMode = "numeric";
      cell.autocomplete = "off";
      cell.maxLength = 2; // room for the new digit, we keep only the last one
      cell.className = "cell";
      cell.dataset.row = row;
      cell.dataset.col = col;
      cell.setAttribute("aria-label", `Row ${row + 1}, column ${col + 1}`);

      const value = puzzleData[row][col];
      if (value !== 0) {
        cell.value = value;
        cell.classList.add("prefilled");
        cell.readOnly = true;
        cell.tabIndex = -1;
      } else {
        cell.addEventListener("input", () => setCellValue(cell, cell.value));
      }

      cell.addEventListener("focus", () => selectCell(cell));
      cell.addEventListener("keydown", (event) => moveWithArrows(event, row, col));

      cells[row].push(cell);
      uiDisplay.board.appendChild(cell);
    }
  }
}

// Only allow a single digit 1-9; typing replaces the old digit
function setCellValue(cell, text) {
  if (cell.readOnly) return;
  const digits = String(text).replace(/[^1-9]/g, "");
  cell.value = digits.slice(-1);
  cell.classList.remove("error");
  uiDisplay.status.textContent = "";
}

// Highlight the row, column and box of the selected cell
function selectCell(cell) {
  activeCell = cell;
  cell.select(); // so typing replaces the digit wherever the caret was
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  const boxRow = Math.floor(row / 3);
  const boxCol = Math.floor(col / 3);

  cells.flat().forEach((other) => {
    const r = Number(other.dataset.row);
    const c = Number(other.dataset.col);
    const related =
      r === row || c === col || (Math.floor(r / 3) === boxRow && Math.floor(c / 3) === boxCol);
    other.classList.toggle("related", related);
    other.classList.toggle("selected", other === cell);
  });
}

function moveWithArrows(event, row, col) {
  const moves = {
    ArrowUp: [-1, 0],
    ArrowDown: [1, 0],
    ArrowLeft: [0, -1],
    ArrowRight: [0, 1],
  };
  const move = moves[event.key];
  if (!move) return;
  event.preventDefault();
  const newRow = (row + move[0] + 9) % 9;
  const newCol = (col + move[1] + 9) % 9;
  cells[newRow][newCol].focus();
}

/* ---------- Checking and hints ---------- */

function checkBoard() {
  let empty = 0;
  let wrong = 0;

  cells.flat().forEach((cell) => {
    cell.classList.remove("error");
    if (cell.readOnly) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);

    if (cell.value === "") {
      empty++;
    } else if (Number(cell.value) !== solutionBoard[row][col]) {
      wrong++;
      cell.classList.add("error");
    }
  });

  if (empty === 0 && wrong === 0) {
    showOverlay("🎉 Sudoku solved correctly!");
  } else if (wrong > 0) {
    showOverlay(`❌ ${wrong} ${wrong === 1 ? "number is" : "numbers are"} wrong.`);
  } else {
    uiDisplay.status.textContent = `No mistakes so far, ${empty} ${empty === 1 ? "cell" : "cells"} left.`;
  }
}

// Fill in the selected cell, or a random empty/wrong cell if none is selected.
function giveHint() {
  let cell = activeCell;

  if (!cell || cell.readOnly) {
    const candidates = cells.flat().filter((c) => {
      if (c.readOnly) return false;
      const answer = solutionBoard[c.dataset.row][c.dataset.col];
      return Number(c.value) !== answer;
    });
    if (candidates.length === 0) return;
    cell = candidates[Math.floor(Math.random() * candidates.length)];
  }

  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);

  cell.value = solutionBoard[row][col];
  cell.classList.remove("error");
  cell.classList.add("hinted");
  cell.readOnly = true; // a hint is always right, so lock it
  uiDisplay.status.textContent = "";
}

/* ---------- Overlay ---------- */

function showOverlay(message) {
  uiDisplay.overlayMessage.textContent = message;
  uiDisplay.overlay.classList.add("show");
}

function hideOverlay() {
  uiDisplay.overlay.classList.remove("show");
}

/* ---------- Events ---------- */

uiDisplay.checkBoard.addEventListener("click", checkBoard);
uiDisplay.restartGame.addEventListener("click", initGame);
uiDisplay.overlayRestart.addEventListener("click", initGame);
uiDisplay.getHint.addEventListener("click", giveHint);
uiDisplay.overlayClose.addEventListener("click", hideOverlay);
uiDisplay.overlay.addEventListener("click", (event) => {
  if (event.target === uiDisplay.overlay) hideOverlay(); // click outside the box
});
uiDisplay.gameModeSelector.addEventListener("change", initGame);

// On-screen number pad, handy on phones
uiDisplay.numberPad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button || !activeCell) return;
  setCellValue(activeCell, button.dataset.number);
});

// Keep focus on the board cell when tapping the number pad
uiDisplay.numberPad.addEventListener("mousedown", (event) => event.preventDefault());

initGame();
