/*
 * Sudoku: fill the board so every row, every column and every 3x3 box has
 * the numbers 1 to 9 once each. A new puzzle is made every game: first a
 * full, random board, then numbers are taken away for as long as the
 * puzzle still has only one solution.
 *
 *   click a square, then type a number or use the number pad
 *   arrow keys   move between squares
 */

// --- Settings ------------------------------------------------------------

// How many numbers are given at the start, for each difficulty. Hard
// puzzles can end up with a few more, if taking away another number would
// give the puzzle more than one solution.
const GIVEN = { easy: 40, medium: 35, hard: 30, expert: 25 };

// --- Elements on the page ------------------------------------------------

const boardElement = document.getElementById("board");
const difficultySelect = document.getElementById("difficulty");
const numberPad = document.getElementById("numberPad");
const statusText = document.getElementById("status");
const checkButton = document.getElementById("check");
const hintButton = document.getElementById("hint");
const restartButton = document.getElementById("restart");

// --- State ---------------------------------------------------------------

let solution = [];     // solution[row][col]: the right number, 1-9
let cells = [];        // cells[row][col]: the <input> for each square
let activeCell = null; // the square the player last clicked

// --- Making a puzzle -----------------------------------------------------

// Shuffle a list in place (the Fisher-Yates shuffle) and return it.
function shuffle(list) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = list[i];
        list[i] = list[j];
        list[j] = temp;
    }
    return list;
}

// Can "num" go at (row, col)? Not if it is already in the row, the column
// or the 3x3 box.
function canPlace(board, row, col, num) {
    for (let i = 0; i < 9; i++) {
        if (board[row][i] === num || board[i][col] === num) {
            return false;
        }
    }
    const boxRow = row - row % 3;
    const boxCol = col - col % 3;
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[boxRow + r][boxCol + c] === num) {
                return false;
            }
        }
    }
    return true;
}

// Fill every empty square (0) with a random number that fits. If a square
// has no number that fits, go back and try another number in the square
// before. This is called backtracking.
function fillBoard(board) {
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== 0) {
                continue;
            }
            for (const num of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
                if (canPlace(board, row, col, num)) {
                    board[row][col] = num;
                    if (fillBoard(board)) {
                        return true;
                    }
                    board[row][col] = 0;   // didn't work: undo and try the next
                }
            }
            return false;   // nothing fits here
        }
    }
    return true;   // no empty squares left
}

// How many solutions does the board have? We only need to know if it is
// one or more than one, so stop counting at "limit". Always fill the empty
// square with the fewest possible numbers first; that is much faster.
function countSolutions(board, limit) {
    let bestRow = -1;
    let bestCol = -1;
    let bestOptions = null;
    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            if (board[row][col] !== 0) {
                continue;
            }
            const options = [];
            for (let num = 1; num <= 9; num++) {
                if (canPlace(board, row, col, num)) {
                    options.push(num);
                }
            }
            if (options.length === 0) {
                return 0;   // a dead end
            }
            if (bestOptions === null || options.length < bestOptions.length) {
                bestRow = row;
                bestCol = col;
                bestOptions = options;
            }
        }
    }
    if (bestOptions === null) {
        return 1;   // the board is full: that is one solution
    }

    let count = 0;
    for (const num of bestOptions) {
        board[bestRow][bestCol] = num;
        count += countSolutions(board, limit - count);
        if (count >= limit) {
            break;
        }
    }
    board[bestRow][bestCol] = 0;
    return count;
}

// Take away numbers in random order, but only if the puzzle still has
// exactly one solution afterwards.
function makePuzzle(full, given) {
    const puzzle = full.map(function (row) {
        return row.slice();
    });
    const squares = [];
    for (let i = 0; i < 81; i++) {
        squares.push(i);
    }
    let filled = 81;
    for (const square of shuffle(squares)) {
        if (filled <= given) {
            break;
        }
        const row = Math.floor(square / 9);
        const col = square % 9;
        const value = puzzle[row][col];
        puzzle[row][col] = 0;
        if (countSolutions(puzzle, 2) === 1) {
            filled--;
        } else {
            puzzle[row][col] = value;   // put it back
        }
    }
    return puzzle;
}

// --- The board -----------------------------------------------------------

function newGame() {
    const full = [];
    for (let row = 0; row < 9; row++) {
        full.push([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    }
    fillBoard(full);
    solution = full;
    const puzzle = makePuzzle(full, GIVEN[difficultySelect.value]);

    boardElement.innerHTML = "";
    cells = [];
    activeCell = null;
    statusText.textContent = "";

    for (let row = 0; row < 9; row++) {
        cells.push([]);
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement("input");
            cell.type = "text";
            cell.inputMode = "numeric";
            cell.autocomplete = "off";
            cell.className = "cell";
            cell.setAttribute("aria-label", "Row " + (row + 1) + ", column " + (col + 1));
            cell.dataset.row = row;
            cell.dataset.col = col;

            if (puzzle[row][col] !== 0) {
                cell.value = puzzle[row][col];
                cell.readOnly = true;
                cell.classList.add("given");
            }
            cell.addEventListener("input", function () {
                setValue(cell, cell.value);
            });
            cell.addEventListener("focus", function () {
                selectCell(cell);
            });
            cell.addEventListener("keydown", function (event) {
                moveWithArrows(event, row, col);
            });

            boardElement.appendChild(cell);
            cells[row].push(cell);
        }
    }
}

// Keep only one digit, 1-9. Typing a new digit replaces the old one.
function setValue(cell, text) {
    if (cell.readOnly) {
        return;
    }
    const digits = String(text).replace(/[^1-9]/g, "");
    cell.value = digits.slice(-1);
    cell.classList.remove("wrong");
    statusText.textContent = "";
}

// Light up the row, column and box of the chosen square.
function selectCell(cell) {
    activeCell = cell;
    cell.select();
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    cells.flat().forEach(function (other) {
        const r = Number(other.dataset.row);
        const c = Number(other.dataset.col);
        const sameBox = Math.floor(r / 3) === Math.floor(row / 3) && Math.floor(c / 3) === Math.floor(col / 3);
        other.classList.toggle("related", r === row || c === col || sameBox);
        other.classList.toggle("selected", other === cell);
    });
}

function moveWithArrows(event, row, col) {
    const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    const move = moves[event.key];
    if (!move) {
        return;
    }
    event.preventDefault();
    // + 9 and % 9: going off one side comes back on the other.
    cells[(row + move[0] + 9) % 9][(col + move[1] + 9) % 9].focus();
}

// --- Checking and hints --------------------------------------------------

function check() {
    let empty = 0;
    let wrong = 0;
    cells.flat().forEach(function (cell) {
        cell.classList.remove("wrong");
        if (cell.readOnly) {
            return;
        }
        if (cell.value === "") {
            empty++;
        } else if (Number(cell.value) !== solution[cell.dataset.row][cell.dataset.col]) {
            wrong++;
            cell.classList.add("wrong");
        }
    });

    if (wrong > 0) {
        statusText.textContent = wrong + (wrong === 1 ? " number is" : " numbers are") + " wrong.";
    } else if (empty > 0) {
        statusText.textContent = "No mistakes so far. " + empty + (empty === 1 ? " square" : " squares") + " left.";
    } else {
        statusText.textContent = "Solved! Well done!";
    }
}

// Fill in the right number in the chosen square, or in a random square
// that is empty or wrong if no square is chosen.
function hint() {
    let cell = activeCell;
    if (!cell || cell.readOnly) {
        const open = cells.flat().filter(function (c) {
            return !c.readOnly && Number(c.value) !== solution[c.dataset.row][c.dataset.col];
        });
        if (open.length === 0) {
            return;
        }
        cell = open[Math.floor(Math.random() * open.length)];
    }
    cell.value = solution[cell.dataset.row][cell.dataset.col];
    cell.classList.remove("wrong");
    cell.classList.add("hinted");
    cell.readOnly = true;   // a hint is always right, so lock it
    statusText.textContent = "";
}

// --- Connect the page ----------------------------------------------------

checkButton.addEventListener("click", check);
hintButton.addEventListener("click", hint);
restartButton.addEventListener("click", newGame);
difficultySelect.addEventListener("change", newGame);

// The number pad, for phones. Clicking it would take the focus away from
// the square, so we stop that with preventDefault on mousedown.
numberPad.addEventListener("mousedown", function (event) {
    event.preventDefault();
});
numberPad.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (button && activeCell) {
        setValue(activeCell, button.dataset.number);
    }
});

newGame();
