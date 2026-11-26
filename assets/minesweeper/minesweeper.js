/*
 * Minesweeper: some squares hide a mine. Dig up all the other squares to
 * win. A number tells how many mines there are in the 8 squares around it.
 *
 *   - The mines are placed after the first dig, never on it or next to it,
 *     so the first dig always opens up a bit of the field.
 *   - Squares with no mines around them open their neighbors by themselves.
 *   - Flag a square with a right-click, or with the Dig / Flag button.
 *   - Click a number with as many flags around it as its number, and all
 *     the other squares around it are dug.
 */

// --- Settings ------------------------------------------------------------

const LEVELS = {
    easy: { rows: 9, cols: 9, mines: 10 },
    medium: { rows: 12, cols: 12, mines: 25 },
    hard: { rows: 16, cols: 16, mines: 40 }
};

// --- Elements on the page ------------------------------------------------

const boardElement = document.getElementById("board");
const minesLeftText = document.getElementById("mines-left");
const timeText = document.getElementById("time");
const statusText = document.getElementById("status");
const toolButton = document.getElementById("tool");
const levelSelect = document.getElementById("level");
const restartButton = document.getElementById("restart");

// --- State ---------------------------------------------------------------

let level = LEVELS.easy;
let grid = [];          // grid[row][col]: { mine, open, flag, count, button }
let minesPlaced = false;
let gameOver = false;
let flags = 0;
let opened = 0;         // squares dug up so far
let flagTool = false;   // true when a click flags instead of digs
let seconds = 0;
let timer = null;

// --- The field -----------------------------------------------------------

function newGame() {
    clearInterval(timer);
    level = LEVELS[levelSelect.value];
    grid = [];
    minesPlaced = false;
    gameOver = false;
    flags = 0;
    opened = 0;
    seconds = 0;
    boardElement.innerHTML = "";
    // The CSS makes this many columns, and sizes the numbers to fit.
    boardElement.style.setProperty("--cols", level.cols);
    boardElement.classList.remove("won", "lost");

    for (let row = 0; row < level.rows; row++) {
        grid.push([]);
        for (let col = 0; col < level.cols; col++) {
            const button = document.createElement("button");
            button.type = "button";
            // A checker pattern, like a lawn that has been mowed.
            button.className = "cell" + ((row + col) % 2 === 0 ? " light" : "");
            button.addEventListener("click", function () {
                clickSquare(row, col);
            });
            button.addEventListener("contextmenu", function (event) {
                event.preventDefault();   // no browser menu on a right-click
                toggleFlag(row, col);
            });
            boardElement.appendChild(button);
            grid[row].push({ mine: false, open: false, flag: false, count: 0, button: button });
        }
    }
    statusText.textContent = "Dig anywhere to start.";
    showCounters();
}

// The squares around (row, col): up to 8 of them, fewer at the edges.
function neighbors(row, col) {
    const list = [];
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if ((r !== row || c !== col) && r >= 0 && r < level.rows && c >= 0 && c < level.cols) {
                list.push(grid[r][c]);
            }
        }
    }
    return list;
}

// Put the mines anywhere but on the first square dug or next to it, and
// count the mines around every square.
function placeMines(safeRow, safeCol) {
    const safe = neighbors(safeRow, safeCol).concat([grid[safeRow][safeCol]]);
    const places = grid.flat().filter(function (square) {
        return !safe.includes(square);
    });
    for (let i = 0; i < level.mines; i++) {
        const index = Math.floor(Math.random() * places.length);
        places[index].mine = true;
        places.splice(index, 1);   // so no square gets two mines
    }
    for (let row = 0; row < level.rows; row++) {
        for (let col = 0; col < level.cols; col++) {
            grid[row][col].count = neighbors(row, col).filter(function (square) {
                return square.mine;
            }).length;
        }
    }
    minesPlaced = true;
}

// --- Playing -------------------------------------------------------------

function clickSquare(row, col) {
    const square = grid[row][col];
    if (gameOver) {
        return;
    }
    if (square.open) {
        openAround(row, col);
    } else if (flagTool) {
        toggleFlag(row, col);
    } else {
        dig(row, col);
    }
}

function dig(row, col) {
    const square = grid[row][col];
    if (square.flag || square.open) {
        return;
    }
    if (!minesPlaced) {
        placeMines(row, col);
        startTimer();
        statusText.textContent = "";
    }
    if (square.mine) {
        lose(square);
        return;
    }
    openFrom(row, col);
    if (opened === level.rows * level.cols - level.mines) {
        win();
    }
}

// Open a square. If there are no mines around it, its neighbors are safe
// too, so open them, and go on from every neighbor that is also a 0. A list
// of squares still to open keeps track, instead of a function calling itself.
function openFrom(row, col) {
    const todo = [[row, col]];
    while (todo.length > 0) {
        const [r, c] = todo.pop();
        const square = grid[r][c];
        if (square.open || square.flag) {
            continue;
        }
        square.open = true;
        opened++;
        showSquare(square);
        if (square.count === 0) {
            for (let nr = r - 1; nr <= r + 1; nr++) {
                for (let nc = c - 1; nc <= c + 1; nc++) {
                    if (nr >= 0 && nr < level.rows && nc >= 0 && nc < level.cols && !grid[nr][nc].open) {
                        todo.push([nr, nc]);
                    }
                }
            }
        }
    }
}

// A click on a number with as many flags around it as its number digs all
// the other squares around it. (If a flag is wrong, that digs up a mine.)
function openAround(row, col) {
    const square = grid[row][col];
    const around = neighbors(row, col);
    const flagged = around.filter(function (s) { return s.flag; }).length;
    if (square.count === 0 || flagged !== square.count) {
        return;
    }
    for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
            if (r >= 0 && r < level.rows && c >= 0 && c < level.cols && !gameOver) {
                dig(r, c);
            }
        }
    }
}

function toggleFlag(row, col) {
    const square = grid[row][col];
    if (gameOver || square.open) {
        return;
    }
    square.flag = !square.flag;
    flags += square.flag ? 1 : -1;
    showSquare(square);
    showCounters();
}

function setTool(flag) {
    flagTool = flag;
    toolButton.textContent = flag ? "Flag" : "Dig";
    toolButton.setAttribute("aria-pressed", flag);
    toolButton.classList.toggle("flag", flag);
}

// --- Winning and losing --------------------------------------------------

function win() {
    gameOver = true;
    clearInterval(timer);
    // Every mine left is now known: flag them all.
    grid.flat().forEach(function (square) {
        if (square.mine && !square.flag) {
            square.flag = true;
            flags++;
            showSquare(square);
        }
    });
    showCounters();
    boardElement.classList.add("won");
    statusText.textContent = "You cleared the field in " + seconds + " seconds!";
}

function lose(hit) {
    gameOver = true;
    clearInterval(timer);
    hit.boom = true;
    // Show every mine, and the flags that were wrong.
    grid.flat().forEach(function (square) {
        if (square.mine || square.flag) {
            square.shown = true;
            showSquare(square);
        }
    });
    boardElement.classList.add("lost");
    statusText.textContent = "Boom! You dug up a mine.";
}

// --- Showing -------------------------------------------------------------

function showSquare(square) {
    const button = square.button;
    button.classList.remove("flag", "mine", "boom", "wrong");
    button.textContent = "";
    if (square.open) {
        button.classList.add("open");
        if (square.count > 0) {
            button.textContent = square.count;
            button.classList.add("n" + square.count);
        }
        button.setAttribute("aria-label", square.count > 0 ? square.count + " mines around" : "empty");
    } else if (square.shown && square.mine && !square.flag) {
        button.classList.add("mine");
        if (square.boom) {
            button.classList.add("boom");
        }
        button.setAttribute("aria-label", "mine");
    } else if (square.flag) {
        button.classList.add("flag");
        if (square.shown && !square.mine) {
            button.classList.add("wrong");   // a flag where there was no mine
        }
        button.setAttribute("aria-label", "flag");
    } else {
        button.setAttribute("aria-label", "hidden");
    }
}

function showCounters() {
    minesLeftText.textContent = level.mines - flags;
    timeText.textContent = seconds;
}

function startTimer() {
    clearInterval(timer);
    timer = setInterval(function () {
        seconds++;
        showCounters();
    }, 1000);
}

// --- Connect the page ----------------------------------------------------

toolButton.addEventListener("click", function () {
    setTool(!flagTool);
});
levelSelect.addEventListener("change", newGame);
restartButton.addEventListener("click", newGame);

newGame();
