/*
 * Connect Four: two players take turns dropping a piece into one of the
 * seven columns. It falls to the lowest free row. The first with four in a
 * row (across, down or diagonal) wins.
 */

// --- Settings ------------------------------------------------------------

const ROWS = 6;
const COLS = 7;
const NAMES = { 1: "Red", 2: "Yellow" };

const DIRECTIONS = [
    [0, 1],   // across
    [1, 0],   // down
    [1, 1],   // diagonal \
    [1, -1]   // diagonal /
];

// --- Elements on the page ------------------------------------------------

const boardElement = document.getElementById("board");
const statusText = document.getElementById("status");
const restartButton = document.getElementById("restart");

// --- State ---------------------------------------------------------------

let grid = [];          // grid[row][col]: 0 = empty, 1 = red, 2 = yellow
let cells = [];         // cells[row][col]: the <div> for each place
let player = 1;         // whose turn it is
let moves = 0;
let gameOver = false;

// --- The board -----------------------------------------------------------

function newGame() {
    grid = [];
    cells = [];
    boardElement.innerHTML = "";

    // Row 0 is the top row.
    for (let row = 0; row < ROWS; row++) {
        grid.push([]);
        cells.push([]);
        for (let col = 0; col < COLS; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.addEventListener("click", function () {
                play(col);
            });
            boardElement.appendChild(cell);
            grid[row].push(0);
            cells[row].push(cell);
        }
    }

    player = 1;
    moves = 0;
    gameOver = false;
    statusText.textContent = NAMES[player] + "'s turn";
}

// The lowest empty row in a column, or -1 if the column is full.
function freeRow(col) {
    for (let row = ROWS - 1; row >= 0; row--) {
        if (grid[row][col] === 0) {
            return row;
        }
    }
    return -1;
}

// --- Four in a row -------------------------------------------------------

// The pieces of the same color in a line from (row, col), one step at a
// time in the direction (dRow, dCol), not counting the start.
function lineFrom(row, col, dRow, dCol) {
    const who = grid[row][col];
    const line = [];
    let r = row + dRow;
    let c = col + dCol;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLS && grid[r][c] === who) {
        line.push([r, c]);
        r += dRow;
        c += dCol;
    }
    return line;
}

// Does the piece at (row, col) make four in a row? Returns the winning
// places, or null.
function findWin(row, col) {
    for (const [dRow, dCol] of DIRECTIONS) {
        // Look both ways from the new piece.
        const line = [[row, col]]
            .concat(lineFrom(row, col, dRow, dCol))
            .concat(lineFrom(row, col, -dRow, -dCol));
        if (line.length >= 4) {
            return line;
        }
    }
    return null;
}

// --- Playing -------------------------------------------------------------

function play(col) {
    if (gameOver) {
        return;
    }
    const row = freeRow(col);
    if (row === -1) {
        return; // the column is full
    }

    grid[row][col] = player;
    cells[row][col].classList.add("player" + player);
    moves++;

    const win = findWin(row, col);
    if (win) {
        win.forEach(function ([r, c]) {
            cells[r][c].classList.add("winning");
        });
        statusText.textContent = NAMES[player] + " wins!";
        gameOver = true;
    } else if (moves === ROWS * COLS) {
        statusText.textContent = "It's a draw!";
        gameOver = true;
    } else {
        player = player === 1 ? 2 : 1;
        statusText.textContent = NAMES[player] + "'s turn";
    }
}

// --- Connect the page ----------------------------------------------------

restartButton.addEventListener("click", newGame);

newGame();
