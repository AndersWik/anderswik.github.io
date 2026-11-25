/*
 * Fia: the Swedish race game on a board shaped like a plus sign. Each
 * player moves four pieces once around the 40 circles of the track, and
 * then down the middle of their own arm to the four home circles. Roll a 6
 * to come out, and a 6 gives you another roll. Land on another player's
 * piece to knock it back to its base. Every circle holds one piece, so you
 * can never land on your own. The first player with all four pieces home
 * wins.
 *
 * The rules and the computer players are the ones from Pop and Bump, on a
 * grid like the one in Ludo.
 *
 *   Easy: moves a random piece.
 *   Hard: gives every move points: knocking someone out, getting a piece
 *         home or out of base, and not stopping where it can be hit.
 */

// --- Settings ------------------------------------------------------------

const COLORS = ["red", "blue", "green", "yellow"];   // in turn order
const NAMES = { red: "Red", blue: "Blue", green: "Green", yellow: "Yellow" };
const SIZE = 11;              // the board is 11 by 11 squares
const TRACK = 40;             // circles in the track
const LAST_ON_TRACK = 39;     // a piece goes 39 steps around the track,
const LAST = 43;              // then into its home circles: steps 40 to 43
const BASE = -1;              // a piece that hasn't come out yet
const COMPUTER_DELAY = 600;   // ms between the computer's actions
const DIE_FACES = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

// Who plays each color, for every choice in the drop-down list.
// A color that isn't listed is not in the game.
const MODES = {
    easy: { red: "human", blue: "easy", green: "easy", yellow: "easy" },
    hard: { red: "human", blue: "hard", green: "hard", yellow: "hard" },
    pvp: { red: "human", green: "human" },
    pvp4: { red: "human", blue: "human", green: "human", yellow: "human" }
};

// Red's quarter of the board, as [row, col]. The other three colors have
// the same circles, turned a quarter, a half and three quarters around.
const RED_TRACK = [
    [4, 0], [4, 1], [4, 2], [4, 3], [4, 4],   // in along the left arm
    [3, 4], [2, 4], [1, 4], [0, 4],           // up the top arm
    [0, 5]                                    // across its end
];
const RED_HOME = [[5, 1], [5, 2], [5, 3], [5, 4]];
const RED_BASE = [[0, 0], [0, 1], [1, 0], [1, 1]];
const MIDDLE = [5, 5];

// Turn a square a quarter clockwise around the middle of the board, "times"
// times.
function turn([row, col], times) {
    for (let i = 0; i < times; i++) {
        [row, col] = [col, SIZE - 1 - row];
    }
    return [row, col];
}

// All 40 track circles, starting at red's start and going clockwise.
const TRACK_SQUARES = [];
for (let quarter = 0; quarter < 4; quarter++) {
    RED_TRACK.forEach(function (square) {
        TRACK_SQUARES.push(turn(square, quarter));
    });
}

// --- Elements on the page ------------------------------------------------

const boardElement = document.getElementById("board");
const dieElement = document.getElementById("die");
const rollButton = document.getElementById("roll");
const statusText = document.getElementById("status");
const messageText = document.getElementById("message");
const restartButton = document.getElementById("restart");
const modeSelect = document.getElementById("mode");

// --- State ---------------------------------------------------------------

let cells = [];       // cells[row][col]: the <div> for each square
let players = [];     // the colors in this game
let pieces = {};      // pieces.red = [BASE, BASE, BASE, BASE]: steps gone
let turnIndex = 0;    // players[turnIndex] is the one to play
let dice = null;      // the number to move, or null when it's time to roll
let triesLeft = 0;    // rolls left this turn
let winner = null;
let computerTimer = null;

// --- Where things are ----------------------------------------------------

function current() {
    return players[turnIndex];
}

// How many quarters a color's part of the board is turned from red's.
function quarterOf(color) {
    return COLORS.indexOf(color);
}

// The track circle (0-39) a piece is on, counted from red's start.
function trackIndex(color, steps) {
    return (quarterOf(color) * RED_TRACK.length + steps) % TRACK;
}

// The [row, col] on the board where a color's piece number "index" is.
function squareOf(color, index) {
    const steps = pieces[color][index];
    if (steps === BASE) {
        return turn(RED_BASE[index], quarterOf(color));
    }
    if (steps <= LAST_ON_TRACK) {
        return TRACK_SQUARES[trackIndex(color, steps)];
    }
    return turn(RED_HOME[steps - LAST_ON_TRACK - 1], quarterOf(color));
}

// --- Rules ---------------------------------------------------------------

function stepsAfter(color, index, number) {
    const steps = pieces[color][index];
    return steps === BASE ? 0 : steps + number;
}

function canMove(color, index, number) {
    const steps = pieces[color][index];
    if (steps === BASE && number !== 6) {
        return false;
    }
    const to = stepsAfter(color, index, number);
    if (to > LAST) {
        return false;                    // past the last home circle
    }
    // Every circle holds one piece: you can't land on your own.
    return !pieces[color].includes(to);
}

// The numbers (0-3) of the pieces that can move.
function movablePieces(color, number) {
    return [0, 1, 2, 3].filter(function (index) {
        return canMove(color, index, number);
    });
}

// The other players' pieces on track circle "where": [color, index].
function piecesOn(where, color) {
    const found = [];
    players.forEach(function (other) {
        if (other === color) {
            return;
        }
        pieces[other].forEach(function (steps, index) {
            if (steps !== BASE && steps <= LAST_ON_TRACK && trackIndex(other, steps) === where) {
                found.push([other, index]);
            }
        });
    });
    return found;
}

function isHome(steps) {
    return steps > LAST_ON_TRACK;
}

// With nothing on the track, you get three tries to roll a 6.
function onlyInBase(color) {
    return pieces[color].every(function (steps) {
        return steps === BASE || isHome(steps);
    });
}

// --- Playing -------------------------------------------------------------

function startTurn() {
    dice = null;
    triesLeft = onlyInBase(current()) ? 3 : 1;
    update();
}

function nextPlayer() {
    turnIndex = (turnIndex + 1) % players.length;
    startTurn();
}

function roll() {
    if (winner || dice !== null) {
        return;
    }
    const color = current();
    const number = Math.floor(Math.random() * 6) + 1;
    dieElement.textContent = DIE_FACES[number - 1];
    dieElement.className = color;
    triesLeft--;
    messageText.textContent = "";
    if (movablePieces(color, number).length > 0) {
        dice = number;
        update();
    } else if (triesLeft > 0) {
        messageText.textContent = NAMES[color] + " rolled " + number + ". Try again!";
        update();
    } else {
        messageText.textContent = NAMES[color] + " rolled " + number + " and can't move.";
        nextPlayer();
    }
}

function move(index) {
    const color = current();
    if (winner || dice === null || !canMove(color, index, dice)) {
        return;
    }
    const to = stepsAfter(color, index, dice);
    pieces[color][index] = to;
    messageText.textContent = "";

    // Knock out the other players' pieces on the circle.
    if (to <= LAST_ON_TRACK) {
        piecesOn(trackIndex(color, to), color).forEach(function ([other, otherIndex]) {
            pieces[other][otherIndex] = BASE;
            messageText.textContent = NAMES[color] + " knocks " + NAMES[other] + " back to base!";
        });
    }

    if (pieces[color].every(isHome)) {
        winner = color;
        dice = null;
        update();
    } else if (dice === 6) {
        messageText.textContent += " " + NAMES[color] + " rolled a 6 and goes again.";
        messageText.textContent = messageText.textContent.trim();
        startTurn();
    } else {
        nextPlayer();
    }
}

// --- The computer --------------------------------------------------------

function playerType(color) {
    return MODES[modeSelect.value][color];
}

function isComputersTurn() {
    return !winner && playerType(current()) !== "human";
}

// One step at a time: roll, or move a piece. update() calls this again
// until it is a human's turn.
function computerStep() {
    if (dice === null) {
        roll();
        return;
    }
    const color = current();
    const choices = movablePieces(color, dice);
    let best = choices[Math.floor(Math.random() * choices.length)];
    if (playerType(color) === "hard") {
        let bestScore = -Infinity;
        choices.forEach(function (index) {
            const score = scoreMove(color, index);
            if (score > bestScore) {
                bestScore = score;
                best = index;
            }
        });
    }
    move(best);
}

// Points for moving piece "index" the number on the die.
function scoreMove(color, index) {
    const from = pieces[color][index];
    const to = stepsAfter(color, index, dice);
    if (isHome(from)) {
        return 1;                         // moving up inside home can wait
    }
    let score = to;                       // further along is better
    if (from === BASE) {
        score += 40;                      // a new piece out
    }
    if (isHome(to)) {
        score += 50;                      // home, nobody can hit it there
    } else {
        score += 60 * piecesOn(trackIndex(color, to), color).length;   // knock out
        if (canBeHit(color, to)) {
            score -= 40;                  // don't stop where you can be hit
        }
    }
    if (from !== BASE && canBeHit(color, from)) {
        score += 20;                      // run away
    }
    return score;
}

// Can another player reach the circle "steps" along color's way, with one
// roll?
function canBeHit(color, steps) {
    const where = trackIndex(color, steps);
    return players.some(function (other) {
        if (other === color) {
            return false;
        }
        return pieces[other].some(function (otherSteps) {
            if (otherSteps === BASE) {
                return trackIndex(other, 0) === where;   // comes out on a 6
            }
            if (isHome(otherSteps)) {
                return false;
            }
            const distance = (where - trackIndex(other, otherSteps) + TRACK) % TRACK;
            return distance >= 1 && distance <= 6 && otherSteps + distance <= LAST_ON_TRACK;
        });
    });
}

// --- Showing the board ---------------------------------------------------

function update() {
    show();
    if (isComputersTurn()) {
        computerTimer = setTimeout(computerStep, COMPUTER_DELAY);
    }
}

function show() {
    const color = current();
    const humanMoves = !isComputersTurn() && dice !== null;

    boardElement.querySelectorAll(".piece").forEach(function (piece) {
        piece.remove();
    });
    players.forEach(function (who) {
        pieces[who].forEach(function (steps, index) {
            const [row, col] = squareOf(who, index);
            const piece = document.createElement("div");
            piece.className = "piece " + who;
            if (humanMoves && who === color && canMove(who, index, dice)) {
                piece.classList.add("movable");
            }
            cells[row][col].appendChild(piece);
        });
    });

    rollButton.className = color;
    rollButton.disabled = Boolean(winner) || isComputersTurn() || dice !== null;
    if (winner) {
        statusText.textContent = NAMES[winner] + " wins!";
    } else if (isComputersTurn()) {
        statusText.textContent = NAMES[color] + " is playing...";
    } else if (dice === null) {
        statusText.textContent = NAMES[color] + "'s turn: roll the die.";
    } else {
        statusText.textContent = NAMES[color] + " rolled " + dice + ": click a piece to move.";
    }
}

// --- Building the board --------------------------------------------------

// What every square is, as class names: "circle", "circle home red"...
// Squares that are left as "" are not part of the board.
function squareClasses() {
    const classes = [];
    for (let row = 0; row < SIZE; row++) {
        classes.push(new Array(SIZE).fill(""));
    }
    COLORS.forEach(function (color, quarter) {
        RED_TRACK.forEach(function (square) {
            const [r, c] = turn(square, quarter);
            classes[r][c] = "circle";
        });
        RED_HOME.forEach(function (square) {
            const [r, c] = turn(square, quarter);
            classes[r][c] = "circle home-circle " + color;
        });
        RED_BASE.forEach(function (square) {
            const [r, c] = turn(square, quarter);
            classes[r][c] = "circle base " + color;
        });
        const [r, c] = turn(RED_TRACK[0], quarter);
        classes[r][c] = "circle start " + color;
    });
    classes[MIDDLE[0]][MIDDLE[1]] = "circle middle";
    return classes;
}

function buildBoard() {
    const classes = squareClasses();
    for (let row = 0; row < SIZE; row++) {
        cells.push([]);
        for (let col = 0; col < SIZE; col++) {
            const cell = document.createElement("div");
            cell.className = "cell " + classes[row][col];
            cell.addEventListener("click", function () {
                clickSquare(row, col);
            });
            boardElement.appendChild(cell);
            cells[row].push(cell);
        }
    }
}

function newGame() {
    // A computer move that is waiting to happen belongs to the old game.
    clearTimeout(computerTimer);

    players = COLORS.filter(function (color) {
        return MODES[modeSelect.value][color];
    });
    pieces = {};
    players.forEach(function (color) {
        pieces[color] = [BASE, BASE, BASE, BASE];
    });
    turnIndex = 0;
    winner = null;
    dieElement.textContent = DIE_FACES[5];
    dieElement.className = "";
    messageText.textContent = "";
    startTurn();
}

// Move the current player's piece on the square, if one there can move.
function clickSquare(row, col) {
    if (isComputersTurn() || dice === null) {
        return;
    }
    const color = current();
    const index = movablePieces(color, dice).find(function (i) {
        const [r, c] = squareOf(color, i);
        return r === row && c === col;
    });
    if (index !== undefined) {
        move(index);
    }
}

// --- Connect the page ----------------------------------------------------

rollButton.addEventListener("click", roll);
restartButton.addEventListener("click", newGame);
modeSelect.addEventListener("change", newGame);

buildBoard();
newGame();
