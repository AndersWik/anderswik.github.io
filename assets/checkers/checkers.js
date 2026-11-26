/*
 * Checkers (English draughts): red against black on the dark squares of
 * an 8 x 8 board. Red is at the bottom and moves first.
 *
 *   - A man moves one step diagonally forward.
 *   - Jump over an opponent's piece to the empty square behind it to take
 *     it. Taking is a must, and a piece that can jump again carries on.
 *   - A man that reaches the far row becomes a king, which moves and
 *     jumps both ways. Becoming a king ends the turn.
 *   - A player who can't move, or has no pieces, loses.
 *
 * The board is a list of 64 squares, row by row. A square is null, or a
 * letter: "r" a red man, "R" a red king, "b" a black man, "B" a black king.
 * A move is { path, captured }: the squares the piece goes through, the
 * first one where it starts, and the squares of the pieces it takes.
 */

// --- Settings ------------------------------------------------------------

const SIZE = 8;
const HUMAN = "red";
const COMPUTER = "black";
const NAMES = { red: "Red", black: "Black" };
const DEPTH = 6;               // moves the hard computer looks ahead
const COMPUTER_DELAY = 500;    // ms before the computer moves
const DRAW_MOVES = 80;         // 40 moves each without a capture or a new king

// --- Elements on the page ------------------------------------------------

const boardElement = document.getElementById("board");
const statusText = document.getElementById("status");
const messageText = document.getElementById("message");
const restartButton = document.getElementById("restart");
const modeSelect = document.getElementById("mode");

// --- State ---------------------------------------------------------------

let board = [];
let player = "red";
let gameOver = false;
let quietMoves = 0;      // moves since the last capture or new king
let selected = null;     // the square of the piece the human picked
let steps = [];          // squares clicked so far in a jump with several steps
let lastMove = null;     // to show where the last move went
let squares = [];        // the 64 elements on the page
let computerTimer = null;

// --- The board -------------------------------------------------------------

function row(i) {
    return Math.floor(i / SIZE);
}

function col(i) {
    return i % SIZE;
}

function colorOf(piece) {
    if (piece === null) {
        return null;
    }
    return piece.toLowerCase() === "r" ? "red" : "black";
}

function isKing(piece) {
    return piece === "R" || piece === "B";
}

function other(who) {
    return who === "red" ? "black" : "red";
}

function startBoard() {
    const squares = [];
    for (let i = 0; i < SIZE * SIZE; i++) {
        const dark = (row(i) + col(i)) % 2 === 1;
        if (dark && row(i) < 3) {
            squares.push("b");
        } else if (dark && row(i) > 4) {
            squares.push("r");
        } else {
            squares.push(null);
        }
    }
    return squares;
}

// The ways a piece may go: [rows, columns]. Red goes up the board (row -1),
// black goes down (row +1), and kings go both ways.
function directions(piece) {
    const up = [[-1, -1], [-1, 1]];
    const down = [[1, -1], [1, 1]];
    if (isKing(piece)) {
        return up.concat(down);
    }
    return colorOf(piece) === "red" ? up : down;
}

// The square n steps away in a direction, or -1 if that is off the board.
function stepFrom(i, [dr, dc], n) {
    const r = row(i) + dr * n;
    const c = col(i) + dc * n;
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) {
        return -1;
    }
    return r * SIZE + c;
}

// Does this man become a king on this square?
function crowns(piece, i) {
    return !isKing(piece) && ((piece === "r" && row(i) === 0) || (piece === "b" && row(i) === SIZE - 1));
}

// --- Moves -----------------------------------------------------------------

// Every move "who" may make. If any piece can jump, only jumps are allowed.
function legalMoves(squares, who) {
    const jumps = [];
    const steps = [];
    for (let i = 0; i < squares.length; i++) {
        const piece = squares[i];
        if (colorOf(piece) !== who) {
            continue;
        }
        findJumps(squares, piece, [i], [], jumps);
        directions(piece).forEach(function (direction) {
            const to = stepFrom(i, direction, 1);
            if (to !== -1 && squares[to] === null) {
                steps.push({ path: [i, to], captured: [] });
            }
        });
    }
    return jumps.length > 0 ? jumps : steps;
}

// All the jumps a piece can make from the last square of "path", one after
// the other. A jump with several steps is one move. It ends when no other
// jump is possible, or when a man becomes a king.
function findJumps(squares, piece, path, captured, found) {
    const at = path[path.length - 1];
    let jumped = false;
    directions(piece).forEach(function (direction) {
        const over = stepFrom(at, direction, 1);
        const to = stepFrom(at, direction, 2);
        if (to === -1) {
            return;
        }
        const enemy = colorOf(squares[over]) === other(colorOf(piece));
        // The square it started from is empty now: the piece has left it.
        const free = squares[to] === null || to === path[0];
        if (!enemy || !free || captured.includes(over)) {
            return;
        }
        jumped = true;
        const nextPath = path.concat([to]);
        const nextCaptured = captured.concat([over]);
        if (crowns(piece, to)) {
            found.push({ path: nextPath, captured: nextCaptured });
        } else {
            findJumps(squares, piece, nextPath, nextCaptured, found);
        }
    });
    if (!jumped && captured.length > 0) {
        found.push({ path: path, captured: captured });
    }
}

// The board after a move, as a new list. The old one is left as it was,
// so the computer can try moves without undoing them.
function applyMove(squares, move) {
    const next = squares.slice();
    const from = move.path[0];
    const to = move.path[move.path.length - 1];
    let piece = next[from];
    next[from] = null;
    move.captured.forEach(function (i) {
        next[i] = null;
    });
    if (crowns(piece, to)) {
        piece = piece.toUpperCase();
    }
    next[to] = piece;
    return next;
}

function count(squares, who) {
    return squares.filter(function (piece) { return colorOf(piece) === who; }).length;
}

// --- Playing a move --------------------------------------------------------

function play(move) {
    const piece = board[move.path[0]];
    const to = move.path[move.path.length - 1];
    if (move.captured.length > 0 || crowns(piece, to)) {
        quietMoves = 0;
    } else {
        quietMoves++;
    }
    board = applyMove(board, move);
    lastMove = move;
    selected = null;
    steps = [];
    player = other(player);

    if (legalMoves(board, player).length === 0) {
        gameOver = true;
        messageText.textContent = NAMES[other(player)] + " wins! " +
            (count(board, player) === 0 ? NAMES[player] + " has no pieces left." : NAMES[player] + " can't move.");
    } else if (quietMoves >= DRAW_MOVES) {
        gameOver = true;
        messageText.textContent = "It's a draw: 40 moves each without a jump or a new king.";
    }
    show();
    if (!gameOver && isComputersTurn()) {
        computerTimer = setTimeout(computerMove, COMPUTER_DELAY);
    }
}

// --- The human: click a piece, then where it goes ---------------------------

// The moves the human can still make with the selected piece, given the
// squares clicked so far.
function movesInProgress() {
    if (selected === null) {
        return [];
    }
    return legalMoves(board, player).filter(function (move) {
        return move.path[0] === selected && steps.every(function (square, n) {
            return move.path[n + 1] === square;
        });
    });
}

function clickSquare(i) {
    if (gameOver || isComputersTurn()) {
        return;
    }
    // A click on one of your own pieces picks it, if it can move.
    if (colorOf(board[i]) === player && steps.length === 0) {
        const canMove = legalMoves(board, player).some(function (move) { return move.path[0] === i; });
        selected = canMove ? i : null;
        messageText.textContent = canMove ? "" : mustJumpText(i);
        show();
        return;
    }
    // A click on a square the picked piece may go to.
    const fits = movesInProgress().filter(function (move) { return move.path[steps.length + 1] === i; });
    if (fits.length === 0) {
        return;
    }
    steps.push(i);
    const done = fits.find(function (move) { return move.path.length === steps.length + 1; });
    if (done) {
        play(done);
    } else {
        show();   // a jump with more steps: click the next square
    }
}

// Why a piece can't be picked: usually because another piece must jump.
function mustJumpText(i) {
    const moves = legalMoves(board, player);
    if (moves.length > 0 && moves[0].captured.length > 0) {
        return "You must jump: one of your pieces can take.";
    }
    return "That piece can't move.";
}

// --- The computer ------------------------------------------------------------

function isComputersTurn() {
    return modeSelect.value !== "pvp" && player === COMPUTER;
}

function computerMove() {
    const moves = legalMoves(board, COMPUTER);
    let best = [];
    let bestScore = -Infinity;
    moves.forEach(function (move) {
        let score;
        if (modeSelect.value === "easy") {
            // Easy: take as many pieces as it can, else any move.
            score = move.captured.length + Math.random() * 0.5;
        } else {
            score = alphaBeta(applyMove(board, move), HUMAN, DEPTH - 1, -Infinity, Infinity);
        }
        if (score > bestScore) {
            bestScore = score;
            best = [move];
        } else if (score === bestScore) {
            best.push(move);
        }
    });
    // Of the moves that are just as good, pick one at random, so the
    // computer doesn't play the same game every time.
    play(best[Math.floor(Math.random() * best.length)]);
}

// Minimax with alpha-beta pruning: how good is this board for the computer,
// if both sides play their best for "depth" more moves? alpha and beta are
// the best scores the computer and the human are already sure of; a move
// that can't beat them doesn't need to be looked at any further.
function alphaBeta(squares, who, depth, alpha, beta) {
    const moves = legalMoves(squares, who);
    if (moves.length === 0) {
        // No moves: "who" has lost. Sooner is better (or worse).
        return who === COMPUTER ? -10000 - depth : 10000 + depth;
    }
    if (depth === 0) {
        return scoreBoard(squares);
    }
    if (who === COMPUTER) {
        let best = -Infinity;
        for (const move of moves) {
            best = Math.max(best, alphaBeta(applyMove(squares, move), HUMAN, depth - 1, alpha, beta));
            alpha = Math.max(alpha, best);
            if (alpha >= beta) {
                break;   // the human would never let it get here
            }
        }
        return best;
    }
    let best = Infinity;
    for (const move of moves) {
        best = Math.min(best, alphaBeta(applyMove(squares, move), COMPUTER, depth - 1, alpha, beta));
        beta = Math.min(beta, best);
        if (alpha >= beta) {
            break;   // the computer would never let it get here
        }
    }
    return best;
}

// A guess at how good a board is for the computer: a man is worth 100 and
// a king 160, plus a little for men that have come far, and for keeping
// the back row, which stops the other side from getting kings.
function scoreBoard(squares) {
    let score = 0;
    squares.forEach(function (piece, i) {
        if (piece === null) {
            return;
        }
        let value = isKing(piece) ? 160 : 100;
        if (piece === "b") {
            value += row(i) * 3 + (row(i) === 0 ? 8 : 0);
        } else if (piece === "r") {
            value += (SIZE - 1 - row(i)) * 3 + (row(i) === SIZE - 1 ? 8 : 0);
        }
        score += colorOf(piece) === COMPUTER ? value : -value;
    });
    return score;
}

// --- Showing the board -------------------------------------------------------

function show() {
    // While a jump with several steps is under way, show the board as it is
    // after the steps so far.
    let shown = board;
    let at = selected;
    const inProgress = movesInProgress();
    if (steps.length > 0) {
        const partial = { path: [selected].concat(steps), captured: inProgress[0].captured.slice(0, steps.length) };
        shown = applyMove(board, partial);
        at = steps[steps.length - 1];
    }
    const targets = inProgress.map(function (move) { return move.path[steps.length + 1]; });
    // Pieces that may move: when a jump is a must, only those that can jump.
    const movable = gameOver || isComputersTurn() || selected !== null ? [] :
        legalMoves(board, player).map(function (move) { return move.path[0]; });

    squares.forEach(function (element, i) {
        element.className = "square " + ((row(i) + col(i)) % 2 === 1 ? "dark" : "light");
        element.innerHTML = "";
        const piece = shown[i];
        if (piece !== null) {
            const disc = document.createElement("div");
            disc.className = "piece " + colorOf(piece) + (isKing(piece) ? " king" : "");
            if (i === at) {
                disc.classList.add("selected");
            } else if (movable.includes(i)) {
                disc.classList.add("movable");
            }
            element.appendChild(disc);
        }
        if (targets.includes(i)) {
            element.classList.add("target");
        }
        if (lastMove !== null && steps.length === 0 && lastMove.path.includes(i)) {
            element.classList.add("last");
        }
    });

    let text = "Red " + count(board, "red") + " - Black " + count(board, "black") + ". ";
    if (gameOver) {
        text += "Game over.";
    } else if (isComputersTurn()) {
        text += NAMES[player] + " is thinking...";
    } else {
        text += NAMES[player] + "'s turn.";
    }
    statusText.textContent = text;
}

// --- Starting --------------------------------------------------------------

function newGame() {
    // A computer move that is waiting to happen belongs to the old game.
    clearTimeout(computerTimer);
    board = startBoard();
    player = "red";
    gameOver = false;
    quietMoves = 0;
    selected = null;
    steps = [];
    lastMove = null;
    messageText.textContent = "";
    show();
}

function buildBoard() {
    for (let i = 0; i < SIZE * SIZE; i++) {
        const element = document.createElement("div");
        element.className = "square";
        element.addEventListener("click", function () {
            clickSquare(i);
        });
        boardElement.appendChild(element);
        squares.push(element);
    }
}

// --- Connect the page ----------------------------------------------------

restartButton.addEventListener("click", newGame);
modeSelect.addEventListener("change", newGame);

buildBoard();
newGame();
