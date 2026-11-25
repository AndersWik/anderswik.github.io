/*
 * Five in a Row (Gomoku, or luffarschack in Swedish): two players take turns
 * placing a stone on a free point of a 15 x 15 board. Black starts. The
 * first to get five or more of their stones in a row, across, down or
 * diagonally, wins.
 *
 * White can be played by the computer:
 *
 *   Easy: wins if it can, blocks you if you are about to get five,
 *         otherwise plays next to a stone that is already there.
 *   Hard: gives every free point a score for the lines it would make for
 *         itself, and the lines it would stop for you, and picks the best.
 */

// --- Settings ------------------------------------------------------------

const SIZE = 15;              // the board is 15 by 15 points
const WIN = 5;                // stones in a row to win
const NAMES = { 1: "Black", 2: "White" };
const HUMAN = 1;
const COMPUTER = 2;
const COMPUTER_DELAY = 500;   // ms before the computer moves

// The four directions a line can go. The other four are the same, backwards.
const DIRECTIONS = [
    [0, 1],   // across
    [1, 0],   // down
    [1, 1],   // diagonal \
    [1, -1]   // diagonal /
];

// The small dots on the board, as on a Go board.
const STAR_POINTS = ["3,3", "3,11", "7,7", "11,3", "11,11"];

// --- Elements on the page ------------------------------------------------

const boardElement = document.getElementById("board");
const statusText = document.getElementById("status");
const restartButton = document.getElementById("restart");
const modeSelect = document.getElementById("mode");

// --- State ---------------------------------------------------------------

let grid = [];          // grid[row][col]: 0 = empty, 1 = black, 2 = white
let points = [];        // points[row][col]: the <div> for each point
let player = 1;         // whose turn it is
let moves = 0;
let lastMove = null;    // [row, col] of the last stone, to mark it
let gameOver = false;
let computerTimer = null;

// --- The board -----------------------------------------------------------

function newGame() {
    // A computer move that is waiting to happen belongs to the old game.
    clearTimeout(computerTimer);

    grid = [];
    points = [];
    boardElement.innerHTML = "";
    for (let row = 0; row < SIZE; row++) {
        grid.push([]);
        points.push([]);
        for (let col = 0; col < SIZE; col++) {
            const point = document.createElement("div");
            point.className = "point";
            if (STAR_POINTS.includes(row + "," + col)) {
                point.classList.add("star");
            }
            point.addEventListener("click", function () {
                if (!isComputersTurn()) {
                    play(row, col);
                }
            });
            boardElement.appendChild(point);
            grid[row].push(0);
            points[row].push(point);
        }
    }

    player = 1;
    moves = 0;
    lastMove = null;
    gameOver = false;
    showTurn();
}

function isInside(row, col) {
    return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

function isComputersTurn() {
    return modeSelect.value !== "pvp" && player === COMPUTER;
}

function showTurn() {
    if (isComputersTurn()) {
        statusText.textContent = NAMES[player] + " is thinking...";
    } else {
        statusText.textContent = NAMES[player] + "'s turn.";
    }
}

// --- Five in a row -------------------------------------------------------

// The stones of the same color in a line from (row, col), one step at a
// time in the direction (dRow, dCol), not counting the start.
function lineFrom(row, col, dRow, dCol, who) {
    const line = [];
    let r = row + dRow;
    let c = col + dCol;
    while (isInside(r, c) && grid[r][c] === who) {
        line.push([r, c]);
        r += dRow;
        c += dCol;
    }
    return line;
}

// Does a stone of "who" at (row, col) make five or more in a row? Returns
// the stones in the row, or null.
function findWin(row, col, who) {
    for (const [dRow, dCol] of DIRECTIONS) {
        // Look both ways from the new stone.
        const line = [[row, col]]
            .concat(lineFrom(row, col, dRow, dCol, who))
            .concat(lineFrom(row, col, -dRow, -dCol, who));
        if (line.length >= WIN) {
            return line;
        }
    }
    return null;
}

// --- Playing -------------------------------------------------------------

function play(row, col) {
    if (gameOver || grid[row][col] !== 0) {
        return;
    }
    grid[row][col] = player;
    moves++;

    // Draw the stone, and move the "last move" mark to it.
    if (lastMove) {
        points[lastMove[0]][lastMove[1]].firstChild.classList.remove("last");
    }
    const stone = document.createElement("div");
    stone.className = "stone " + (player === 1 ? "black" : "white") + " last";
    points[row][col].appendChild(stone);
    lastMove = [row, col];

    const line = findWin(row, col, player);
    if (line) {
        line.forEach(function ([r, c]) {
            points[r][c].firstChild.classList.add("winning");
        });
        gameOver = true;
        statusText.textContent = NAMES[player] + " wins!";
    } else if (moves === SIZE * SIZE) {
        gameOver = true;
        statusText.textContent = "The board is full. It's a draw!";
    } else {
        player = player === 1 ? 2 : 1;
        showTurn();
        if (isComputersTurn()) {
            computerTimer = setTimeout(computerMove, COMPUTER_DELAY);
        }
    }
}

// --- The computer --------------------------------------------------------

function computerMove() {
    const [row, col] = modeSelect.value === "easy" ? easyMove() : hardMove();
    play(row, col);
}

// The free points within "distance" of a stone. Far away from all stones a
// move does nothing, so there is no need to look there.
function candidates(distance) {
    const list = [];
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            if (grid[row][col] === 0 && hasNeighbor(row, col, distance)) {
                list.push([row, col]);
            }
        }
    }
    // The first stone goes in the middle.
    return list.length > 0 ? list : [[7, 7]];
}

function hasNeighbor(row, col, distance) {
    for (let r = row - distance; r <= row + distance; r++) {
        for (let c = col - distance; c <= col + distance; c++) {
            if (isInside(r, c) && grid[r][c] !== 0) {
                return true;
            }
        }
    }
    return false;
}

function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function easyMove() {
    const choices = candidates(1);
    const win = choices.find(function ([r, c]) { return findWin(r, c, COMPUTER); });
    if (win) {
        return win;
    }
    const block = choices.find(function ([r, c]) { return findWin(r, c, HUMAN); });
    if (block) {
        return block;
    }
    return randomItem(choices);
}

function hardMove() {
    let best = [];
    let bestScore = -Infinity;
    candidates(2).forEach(function ([row, col]) {
        // Making your own lines is a little better than stopping theirs,
        // so a win always comes before a block.
        const score = scorePoint(row, col, COMPUTER) + 0.9 * scorePoint(row, col, HUMAN);
        if (score > bestScore) {
            bestScore = score;
            best = [[row, col]];
        } else if (score === bestScore) {
            best.push([row, col]);
        }
    });
    return randomItem(best);
}

// How good a stone of "who" at the free point (row, col) would be: the sum
// of the lines it makes in the four directions.
function scorePoint(row, col, who) {
    let score = 0;
    for (const [dRow, dCol] of DIRECTIONS) {
        const forward = lineFrom(row, col, dRow, dCol, who);
        const back = lineFrom(row, col, -dRow, -dCol, who);
        const length = 1 + forward.length + back.length;
        // An end is open if the point after the line is free.
        const openEnds = isOpen(row + (forward.length + 1) * dRow, col + (forward.length + 1) * dCol)
            + isOpen(row - (back.length + 1) * dRow, col - (back.length + 1) * dCol);
        score += lineScore(length, openEnds);
    }
    return score;
}

function isOpen(row, col) {
    return isInside(row, col) && grid[row][col] === 0 ? 1 : 0;
}

// A line with both ends open is much stronger than one with one end open:
// the other player can only block one end at a time.
function lineScore(length, openEnds) {
    if (length >= WIN) {
        return 100000;
    }
    if (openEnds === 0) {
        return 0;                // blocked at both ends, it can never be five
    }
    const scores = {
        4: [1000, 10000],        // four: one open end, two open ends
        3: [100, 1000],
        2: [10, 100],
        1: [1, 10]
    };
    return scores[length][openEnds - 1];
}

// --- Connect the page ----------------------------------------------------

restartButton.addEventListener("click", newGame);
modeSelect.addEventListener("change", newGame);

newGame();
