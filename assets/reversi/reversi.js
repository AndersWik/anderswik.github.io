/*
 * Reversi: two players take turns placing a piece. A piece must trap a
 * line of the other player's pieces between itself and one of your own;
 * the trapped pieces are flipped to your color. If you can't move, you
 * pass. When nobody can move, the player with the most pieces wins.
 */

// --- Settings ------------------------------------------------------------

const SIZE = 8;
const NAMES = { black: "Black", white: "White" };

// The eight directions from a square: up, down, sideways and diagonal.
const DIRECTIONS = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1], [0, 1],
    [1, -1], [1, 0], [1, 1]
];

// --- Elements on the page ------------------------------------------------

const boardElement = document.getElementById("board");
const statusText = document.getElementById("status");
const messageText = document.getElementById("message");
const restartButton = document.getElementById("restart");

// --- State ---------------------------------------------------------------

let board = [];        // board[row][col]: null, "black" or "white"
let cells = [];        // cells[row][col]: the <div> for each square
let player = "black";  // whose turn it is
let gameOver = false;

// --- Rules ---------------------------------------------------------------

function other(who) {
    return who === "black" ? "white" : "black";
}

function isInside(row, col) {
    return row >= 0 && row < SIZE && col >= 0 && col < SIZE;
}

// The pieces that "who" would flip by playing at (row, col). An empty
// list means the move isn't allowed.
function flipsFor(row, col, who) {
    if (board[row][col] !== null) {
        return [];
    }
    let flips = [];
    for (const [dRow, dCol] of DIRECTIONS) {
        // Walk over the other player's pieces...
        const line = [];
        let r = row + dRow;
        let c = col + dCol;
        while (isInside(r, c) && board[r][c] === other(who)) {
            line.push([r, c]);
            r += dRow;
            c += dCol;
        }
        // ...and if one of ours is at the end, they are trapped.
        if (line.length > 0 && isInside(r, c) && board[r][c] === who) {
            flips = flips.concat(line);
        }
    }
    return flips;
}

// Every move "who" can make, as { row, col, flips }.
function validMoves(who) {
    const moves = [];
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const flips = flipsFor(row, col, who);
            if (flips.length > 0) {
                moves.push({ row: row, col: col, flips: flips });
            }
        }
    }
    return moves;
}

function count(who) {
    return board.flat().filter(function (piece) {
        return piece === who;
    }).length;
}

// --- Playing -------------------------------------------------------------

function play(row, col) {
    if (gameOver) {
        return;
    }
    const flips = flipsFor(row, col, player);
    if (flips.length === 0) {
        return;   // not a valid move
    }
    board[row][col] = player;
    flips.forEach(function ([r, c]) {
        board[r][c] = player;
    });
    nextTurn();
}

// The other player's turn, if they can move. If not, they pass. If nobody
// can move, the game is over.
function nextTurn() {
    const next = other(player);
    messageText.textContent = "";
    if (validMoves(next).length > 0) {
        player = next;
    } else if (validMoves(player).length > 0) {
        messageText.textContent = NAMES[next] + " can't move and has to pass.";
    } else {
        gameOver = true;
    }
    show();
}

// --- Showing the board ---------------------------------------------------

function show() {
    const hints = gameOver ? [] : validMoves(player);
    for (let row = 0; row < SIZE; row++) {
        for (let col = 0; col < SIZE; col++) {
            const cell = cells[row][col];
            cell.className = "cell";
            if (board[row][col]) {
                cell.classList.add(board[row][col]);
            }
        }
    }
    // A small dot on every square where the player may move.
    hints.forEach(function (move) {
        cells[move.row][move.col].classList.add("hint");
    });

    const black = count("black");
    const white = count("white");
    let text = "Black " + black + " - White " + white + ". ";
    if (!gameOver) {
        text += NAMES[player] + "'s turn.";
    } else if (black > white) {
        text += "Black wins!";
    } else if (white > black) {
        text += "White wins!";
    } else {
        text += "It's a draw!";
    }
    statusText.textContent = text;
}

// --- Starting ------------------------------------------------------------

function newGame() {
    board = [];
    cells = [];
    boardElement.innerHTML = "";
    for (let row = 0; row < SIZE; row++) {
        board.push([]);
        cells.push([]);
        for (let col = 0; col < SIZE; col++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            cell.addEventListener("click", function () {
                play(row, col);
            });
            boardElement.appendChild(cell);
            board[row].push(null);
            cells[row].push(cell);
        }
    }

    // The four pieces in the middle.
    board[3][3] = "white";
    board[3][4] = "black";
    board[4][3] = "black";
    board[4][4] = "white";

    player = "black";
    gameOver = false;
    messageText.textContent = "";
    show();
}

// --- Connect the page ----------------------------------------------------

restartButton.addEventListener("click", newGame);

newGame();
