/*
 * Snake: steer the snake to the food. Each piece of food makes it one
 * square longer and a little faster. Hit a wall or yourself, and the game
 * is over.
 *
 *   arrow keys or WASD   turn
 *   swipe                turn, on a phone
 *   P                    pause
 *   Esc                  menu
 *
 * The board is a grid of squares. The snake is a list of squares, head
 * first. To move, we add a new head in front and take the last square of
 * the tail away. When it eats, we don't take the tail away: it grows.
 */

// --- Settings ------------------------------------------------------------

const CELLS = 20;                // the board is 20 x 20 squares
const START_DELAY = 150;         // ms between two moves at the start
const FASTEST = 60;              // never faster than this
const SPEED_UP = 4;              // ms faster for each piece of food
const SWIPE = 30;                // pixels a finger must move to count as a swipe
const BEST_KEY = "snake-best";

const DIRECTIONS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
};
const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };

// Keys and the direction they turn to.
const KEYS = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
    W: "up", S: "down", A: "left", D: "right"
};

// --- Canvas --------------------------------------------------------------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const SIZE = WIDTH / CELLS;      // pixels in one square

// --- State ---------------------------------------------------------------

let screen = "menu";   // menu, playing, paused, gameOver
let gameStarted = false;

let snake = [];        // squares { x, y }, the head first
let direction = "right";
let turns = [];        // turns asked for, not done yet
let food = null;       // { x, y }
let score = 0;
let best = loadBest();
let delay = START_DELAY;
let sinceMove = 0;     // ms since the last move

// --- Starting --------------------------------------------------------------

function newGame() {
    // Three squares in the middle, moving right.
    const middle = Math.floor(CELLS / 2);
    snake = [
        { x: middle, y: middle },
        { x: middle - 1, y: middle },
        { x: middle - 2, y: middle }
    ];
    direction = "right";
    turns = [];
    score = 0;
    delay = START_DELAY;
    sinceMove = 0;
    placeFood();
    gameStarted = true;
    screen = "playing";
}

// Food on a random square that the snake isn't on. We list the free
// squares and pick one, so it never takes many tries, even when the
// snake is long.
function placeFood() {
    const free = [];
    for (let y = 0; y < CELLS; y++) {
        for (let x = 0; x < CELLS; x++) {
            if (!onSnake(x, y)) {
                free.push({ x: x, y: y });
            }
        }
    }
    food = free.length > 0 ? free[Math.floor(Math.random() * free.length)] : null;
}

function onSnake(x, y) {
    return snake.some(function (square) {
        return square.x === x && square.y === y;
    });
}

// --- Turning ---------------------------------------------------------------

// A turn is kept in a queue until the next move. Without the queue, two
// quick key presses between two moves, like up and then left while going
// right, would turn the snake straight back into itself. Each turn is
// checked against the turn before it, not against where the snake goes now.
function turn(to) {
    const last = turns.length > 0 ? turns[turns.length - 1] : direction;
    if (to === last || to === OPPOSITE[last] || turns.length >= 3) {
        return;
    }
    turns.push(to);
}

// --- Moving ----------------------------------------------------------------

function step() {
    if (turns.length > 0) {
        direction = turns.shift();
    }
    const head = snake[0];
    const move = DIRECTIONS[direction];
    const next = { x: head.x + move.x, y: head.y + move.y };

    const eats = food !== null && next.x === food.x && next.y === food.y;
    // The tail moves away in the same step, so the head may go where the
    // tail is now, unless the snake grows this step.
    const body = eats ? snake : snake.slice(0, -1);
    const hitWall = next.x < 0 || next.x >= CELLS || next.y < 0 || next.y >= CELLS;
    const hitSelf = body.some(function (square) {
        return square.x === next.x && square.y === next.y;
    });
    if (hitWall || hitSelf) {
        gameOver();
        return;
    }

    snake.unshift(next);    // a new head in front...
    if (eats) {
        score++;
        delay = Math.max(FASTEST, delay - SPEED_UP);
        placeFood();
    } else {
        snake.pop();        // ...and the last square of the tail away
    }
}

function gameOver() {
    if (score > (best || 0)) {
        best = score;
        try {
            localStorage.setItem(BEST_KEY, String(best));
        } catch (error) {
            // Not saved, but the game still works.
        }
    }
    screen = "gameOver";
}

function loadBest() {
    try {
        const saved = Number(localStorage.getItem(BEST_KEY));
        return saved > 0 ? saved : null;
    } catch (error) {
        return null;
    }
}

// --- Drawing -------------------------------------------------------------

function drawText(text, x, y, size, color) {
    ctx.fillStyle = color || "white";
    ctx.font = size + "px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
}

// A square of the board, a little smaller than the grid, so the squares
// of the snake show as separate blocks.
function drawSquare(square, color) {
    ctx.fillStyle = color;
    ctx.fillRect(square.x * SIZE + 1, square.y * SIZE + 1, SIZE - 2, SIZE - 2);
}

function drawBoard() {
    ctx.fillStyle = "#111111";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    // A faint checkerboard, so you can count squares.
    ctx.fillStyle = "#161616";
    for (let y = 0; y < CELLS; y++) {
        for (let x = (y % 2); x < CELLS; x += 2) {
            ctx.fillRect(x * SIZE, y * SIZE, SIZE, SIZE);
        }
    }
}

function drawSnake() {
    snake.forEach(function (square, i) {
        // The head is brighter, and the body fades a little to the tail.
        const light = i === 0 ? 60 : 45 - Math.min(20, i);
        drawSquare(square, "hsl(120, 70%, " + light + "%)");
    });

    // Two eyes on the head, looking the way it goes.
    const head = snake[0];
    const move = DIRECTIONS[direction];
    const cx = head.x * SIZE + SIZE / 2 + move.x * SIZE / 5;
    const cy = head.y * SIZE + SIZE / 2 + move.y * SIZE / 5;
    ctx.fillStyle = "black";
    [-1, 1].forEach(function (side) {
        ctx.beginPath();
        ctx.arc(cx + move.y * side * SIZE / 5, cy + move.x * side * SIZE / 5, SIZE / 10, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawFood() {
    if (food === null) {
        return;
    }
    ctx.fillStyle = "#e53935";
    ctx.beginPath();
    ctx.arc(food.x * SIZE + SIZE / 2, food.y * SIZE + SIZE / 2, SIZE / 2 - 3, 0, Math.PI * 2);
    ctx.fill();
}

function drawMessage(title, lines) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawText(title, WIDTH / 2, HEIGHT / 2 - 50, 40);
    lines.forEach(function (line, index) {
        drawText(line, WIDTH / 2, HEIGHT / 2 + index * 28, 18);
    });
}

function draw() {
    drawBoard();

    if (screen === "menu") {
        drawText("Snake", WIDTH / 2, HEIGHT / 2 - 60, 56, "#7CFC00");
        drawText("Eat the food. Don't hit the walls or yourself.", WIDTH / 2, HEIGHT / 2, 17);
        drawText("Arrow keys, WASD or swipe to turn. P: pause", WIDTH / 2, HEIGHT / 2 + 28, 17);
        drawText("Press Enter or tap to start", WIDTH / 2, HEIGHT / 2 + 70, 18, "yellow");
        if (best !== null) {
            drawText("Best: " + best, WIDTH / 2, HEIGHT - 50, 16, "gray");
        }
        if (gameStarted) {
            drawText("Esc: back to the game", WIDTH / 2, HEIGHT - 25, 16);
        }
        return;
    }

    drawFood();
    drawSnake();
    ctx.textAlign = "left";
    ctx.fillStyle = "white";
    ctx.font = "16px Arial";
    ctx.fillText("Score: " + score, 10, 22);

    if (screen === "paused") {
        drawMessage("Pause", ["Press P to go on"]);
    } else if (screen === "gameOver") {
        drawMessage("Game over", ["Score: " + score + "   Best: " + best, "Press Enter or tap to play again"]);
    }
}

// --- The loop ------------------------------------------------------------

// The snake moves once every "delay" ms, which gets shorter as it eats.
// We add up the time between frames, and move when enough has passed.
let lastTime = performance.now();

function gameLoop(now) {
    const passed = Math.min(now - lastTime, 250);
    lastTime = now;

    if (screen === "playing") {
        sinceMove += passed;
        while (sinceMove >= delay && screen === "playing") {
            sinceMove -= delay;
            step();
        }
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// --- Keyboard and swipes -------------------------------------------------

document.addEventListener("keydown", function (event) {
    const key = event.key;

    if (screen === "playing") {
        if (KEYS[key]) {
            turn(KEYS[key]);
        } else if (key === "p" || key === "P") {
            screen = "paused";
        } else if (key === "Escape") {
            screen = "menu";
        }
    } else if (screen === "paused") {
        if (key === "p" || key === "P") {
            screen = "playing";
        } else if (key === "Escape") {
            screen = "menu";
        }
    } else if (key === "Enter") {
        newGame();
    } else if (key === "Escape" && screen === "menu" && gameStarted) {
        screen = "paused";
    } else if (key === "Escape" && screen === "gameOver") {
        gameStarted = false;
        screen = "menu";
    }
});

// A swipe: where the finger went down, compared to where it is now.
// The longer way, sideways or up and down, is the direction.
let swipeStart = null;

canvas.addEventListener("pointerdown", function (event) {
    if (screen === "menu" || screen === "gameOver") {
        newGame();
        return;
    }
    if (screen === "paused") {
        screen = "playing";
        return;
    }
    swipeStart = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener("pointermove", function (event) {
    if (swipeStart === null || screen !== "playing") {
        return;
    }
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE) {
        return;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
        turn(dx > 0 ? "right" : "left");
    } else {
        turn(dy > 0 ? "down" : "up");
    }
    // Start again from here, so one long swipe can make two turns.
    swipeStart = { x: event.clientX, y: event.clientY };
});

canvas.addEventListener("pointerup", function () {
    swipeStart = null;
});

canvas.addEventListener("pointercancel", function () {
    swipeStart = null;
});

// --- Start ---------------------------------------------------------------

requestAnimationFrame(gameLoop);
