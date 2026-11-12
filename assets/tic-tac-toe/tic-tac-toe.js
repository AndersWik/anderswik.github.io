/*
 * Tic Tac Toe: X and O take turns. Three in a row, across, down or
 * diagonally, wins. Play against a friend or the computer, which plays O.
 *
 *   Easy:  picks a random free square.
 *   Smart: wins if it can, blocks you if you are about to win, and
 *          otherwise likes the middle, then the corners.
 */

// --- Settings ------------------------------------------------------------

// The squares are numbered like this:   0 1 2
//                                       3 4 5
//                                       6 7 8
const LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],   // across
    [0, 3, 6], [1, 4, 7], [2, 5, 8],   // down
    [0, 4, 8], [2, 4, 6]               // diagonal
];
const COMPUTER_DELAY = 500;   // ms before the computer moves

// --- Elements on the page ------------------------------------------------

const squares = document.querySelectorAll(".square");
const statusText = document.getElementById("status");
const restartButton = document.getElementById("reset");
const modeSelect = document.getElementById("mode");

// --- State ---------------------------------------------------------------

let board = [];        // "", "X" or "O" for each square
let player = "X";
let gameOver = false;
let computerTimer = null;

// --- Rules ---------------------------------------------------------------

// The line that "who" has three in a row on, or undefined.
function winningLine(who) {
    return LINES.find(function (line) {
        return line.every(function (index) {
            return board[index] === who;
        });
    });
}

function emptySquares() {
    const empty = [];
    board.forEach(function (mark, index) {
        if (mark === "") {
            empty.push(index);
        }
    });
    return empty;
}

function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

// --- Playing -------------------------------------------------------------

function isComputersTurn() {
    return modeSelect.value !== "pvp" && player === "O";
}

function play(index) {
    if (gameOver || board[index] !== "") {
        return;
    }
    board[index] = player;
    squares[index].textContent = player;

    const line = winningLine(player);
    if (line) {
        line.forEach(function (i) {
            squares[i].classList.add("winning");
        });
        gameOver = true;
        if (modeSelect.value === "pvp") {
            statusText.textContent = player + " wins!";
        } else {
            statusText.textContent = player === "X" ? "You win!" : "The computer wins!";
        }
    } else if (emptySquares().length === 0) {
        gameOver = true;
        statusText.textContent = "It's a draw!";
    } else {
        player = player === "X" ? "O" : "X";
        statusText.textContent = isComputersTurn() ? "The computer is thinking..." : player + "'s turn";
        if (isComputersTurn()) {
            computerTimer = setTimeout(computerMove, COMPUTER_DELAY);
        }
    }
}

// --- The computer --------------------------------------------------------

// A free square that would give "who" three in a row, or undefined.
function winningSquare(who) {
    for (const line of LINES) {
        const marks = line.map(function (index) {
            return board[index];
        });
        const mine = marks.filter(function (mark) {
            return mark === who;
        }).length;
        if (mine === 2 && marks.includes("")) {
            return line[marks.indexOf("")];
        }
    }
    return undefined;
}

function smartMove() {
    const win = winningSquare("O");
    if (win !== undefined) {
        return win;
    }
    const block = winningSquare("X");
    if (block !== undefined) {
        return block;
    }
    if (board[4] === "") {
        return 4;
    }
    const corners = [0, 2, 6, 8].filter(function (index) {
        return board[index] === "";
    });
    if (corners.length > 0) {
        return randomItem(corners);
    }
    return randomItem(emptySquares());
}

function computerMove() {
    const index = modeSelect.value === "smart" ? smartMove() : randomItem(emptySquares());
    play(index);
}

// --- Starting ------------------------------------------------------------

function newGame() {
    clearTimeout(computerTimer);
    board = ["", "", "", "", "", "", "", "", ""];
    squares.forEach(function (square) {
        square.textContent = "";
        square.classList.remove("winning");
    });
    player = "X";
    gameOver = false;
    statusText.textContent = "X's turn";
}

// --- Connect the page ----------------------------------------------------

squares.forEach(function (square, index) {
    square.addEventListener("click", function () {
        if (!isComputersTurn()) {
            play(index);
        }
    });
});
restartButton.addEventListener("click", newGame);
modeSelect.addEventListener("change", newGame);

newGame();
