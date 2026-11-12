/*
 * Whack A Mole: moles pop up out of five holes. Hit them with the mallet
 * before they hide again. Every mole that gets away costs a life, and the
 * moles get quicker as your score goes up.
 *
 *   click     hit
 *   P / Esc   pause / menu
 */

// --- Settings ------------------------------------------------------------

// Where the pictures are. On a page of your own: "images/".
const IMAGE_FOLDER = "/assets/whack-a-mole/images/";

const STEP = 1000 / 60;      // one update step, in milliseconds
const START_LIVES = 3;
const MOLE_SIZE = 120;
const POINTS = 100;

// The middle of each hole in the background picture.
const HOLES = [
    { x: 141, y: 381 }, { x: 402, y: 375 }, { x: 660, y: 384 },
    { x: 270, y: 448 }, { x: 508, y: 448 }
];

// --- Canvas --------------------------------------------------------------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- Pictures ------------------------------------------------------------

const images = {};

function loadImage(name) {
    if (!images[name]) {
        images[name] = new Image();
        images[name].src = IMAGE_FOLDER + name;
    }
    return images[name];
}

function isLoaded(image) {
    return image.complete && image.naturalWidth > 0;
}

// Draw a picture, or a plain box if it hasn't loaded (yet).
function drawImage(name, x, y, width, height, fallbackColor) {
    const image = loadImage(name);
    if (isLoaded(image)) {
        ctx.drawImage(image, x, y, width, height);
    } else if (fallbackColor) {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(x, y, width, height);
    }
}

const MOLE_PICTURES = ["mole-1.png", "mole-2.png", "mole-3.png"];
["background.png", "mallet.png"].concat(MOLE_PICTURES).forEach(loadImage);

// --- State ---------------------------------------------------------------

let screen = "menu";   // menu, playing, paused, gameOver
let gameStarted = false;

let score = 0;
let lives = START_LIVES;
let moles = [];        // { hole, picture, timeLeft }
let pows = [];         // "POW!" where a mole was hit: { x, y, timeLeft }
let spawnTimer = 0;

let mouseX = WIDTH / 2;
let mouseY = HEIGHT / 2;
let mouseDown = false;

// --- Difficulty ----------------------------------------------------------

// Moles stay up for 1.5 seconds at the start, and a little shorter for
// every 1000 points, but never less than half a second.
function upTime() {
    return Math.max(30, 90 - Math.floor(score / 1000) * 10);
}

// A new mole every second at the start, faster later.
function spawnTime() {
    return Math.max(25, 60 - Math.floor(score / 1000) * 6);
}

// --- Starting ------------------------------------------------------------

function newGame() {
    score = 0;
    lives = START_LIVES;
    moles = [];
    pows = [];
    spawnTimer = 30;
    gameStarted = true;
    screen = "playing";
}

// --- Moles ---------------------------------------------------------------

function spawnMole() {
    const freeHoles = HOLES.filter(function (hole) {
        return !moles.some(function (mole) {
            return mole.hole === hole;
        });
    });
    if (freeHoles.length === 0) {
        return;
    }
    moles.push({
        hole: freeHoles[Math.floor(Math.random() * freeHoles.length)],
        picture: MOLE_PICTURES[Math.floor(Math.random() * MOLE_PICTURES.length)],
        timeLeft: upTime()
    });
}

// The box a mole is drawn in: standing in its hole.
function moleBox(mole) {
    return {
        x: mole.hole.x - MOLE_SIZE / 2,
        y: mole.hole.y - MOLE_SIZE + 15,
        width: MOLE_SIZE,
        height: MOLE_SIZE
    };
}

function hit(x, y) {
    // The last mole is drawn on top, so look at it first.
    for (let i = moles.length - 1; i >= 0; i--) {
        const box = moleBox(moles[i]);
        if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
            score += POINTS;
            pows.push({ x: moles[i].hole.x, y: box.y, timeLeft: 20 });
            moles.splice(i, 1);
            return;
        }
    }
}

// --- Update --------------------------------------------------------------

function update() {
    spawnTimer--;
    if (spawnTimer <= 0) {
        spawnMole();
        spawnTimer = spawnTime();
    }

    // A mole that stays up until its time runs out got away.
    moles = moles.filter(function (mole) {
        mole.timeLeft--;
        if (mole.timeLeft <= 0) {
            lives--;
            return false;
        }
        return true;
    });

    pows = pows.filter(function (pow) {
        pow.timeLeft--;
        return pow.timeLeft > 0;
    });

    if (lives <= 0) {
        screen = "gameOver";
    }
}

// --- Drawing -------------------------------------------------------------

function drawText(text, x, y, size, color, align) {
    ctx.fillStyle = color || "black";
    ctx.font = size + "px Arial";
    ctx.textAlign = align || "center";
    ctx.fillText(text, x, y);
}

function drawWorld() {
    drawImage("background.png", 0, 0, WIDTH, HEIGHT, "#7cc95b");

    moles.forEach(function (mole) {
        const box = moleBox(mole);
        drawImage(mole.picture, box.x, box.y, box.width, box.height, "saddlebrown");
    });

    pows.forEach(function (pow) {
        drawText("POW!", pow.x, pow.y, 36, "red");
    });
}

function drawHud() {
    drawText("Score: " + score, 20, 35, 24, "black", "left");
    drawText("Lives: " + lives, WIDTH - 20, 35, 24, "black", "right");

    // The mallet at the mouse, a little higher when the button is up.
    const lift = mouseDown ? 0 : 40;
    drawImage("mallet.png", mouseX - 100, mouseY - 75 - lift, 150, 150);
}

function drawMessage(title, lines) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.fillRect(WIDTH * 0.2, HEIGHT * 0.2, WIDTH * 0.6, HEIGHT * 0.6);
    drawText(title, WIDTH / 2, HEIGHT / 2 - 50, 48);
    lines.forEach(function (line, index) {
        drawText(line, WIDTH / 2, HEIGHT / 2 + index * 30, 20);
    });
}

function draw() {
    drawWorld();

    if (screen === "menu") {
        const lines = ["Click the moles before they hide!", "P: pause    Esc: menu", "Press Enter to start"];
        if (gameStarted) {
            lines.push("Esc: back to the game");
        }
        drawMessage("Whack A Mole", lines);
    } else if (screen === "playing") {
        drawHud();
    } else if (screen === "paused") {
        drawMessage("Pause", ["Press P to go on"]);
    } else if (screen === "gameOver") {
        drawMessage("Game over", ["Score: " + score, "Press Enter to play again", "Press Esc for the menu"]);
    }
}

// --- The loop ------------------------------------------------------------

// Run one update per 1/60 second, so the game has the same speed on
// every screen, then draw.
let lastTime = performance.now();
let leftover = 0;

function gameLoop(now) {
    leftover += Math.min(now - lastTime, 250);
    lastTime = now;

    while (leftover >= STEP) {
        if (screen === "playing") {
            update();
        }
        leftover -= STEP;
    }

    draw();
    requestAnimationFrame(gameLoop);
}

// --- Mouse and keyboard --------------------------------------------------

// The canvas can be shown smaller than 800x600 on a small screen. Convert
// from position on the screen to position in the canvas. clientLeft and
// clientWidth leave out the border around the canvas.
function canvasPosition(event) {
    const box = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - box.left - canvas.clientLeft) * (WIDTH / canvas.clientWidth),
        y: (event.clientY - box.top - canvas.clientTop) * (HEIGHT / canvas.clientHeight)
    };
}

canvas.addEventListener("mousemove", function (event) {
    const position = canvasPosition(event);
    mouseX = position.x;
    mouseY = position.y;
});

canvas.addEventListener("mousedown", function (event) {
    mouseDown = true;
    if (screen === "playing") {
        const position = canvasPosition(event);
        hit(position.x, position.y);
    }
});

window.addEventListener("mouseup", function () {
    mouseDown = false;
});

document.addEventListener("keydown", function (event) {
    const key = event.key;

    if (screen === "menu") {
        if (key === "Enter") {
            newGame();
        } else if (key === "Escape" && gameStarted) {
            screen = "paused";
        }
    } else if (screen === "playing") {
        if (key === "p" || key === "P") {
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
    } else if (screen === "gameOver") {
        if (key === "Enter") {
            newGame();
        } else if (key === "Escape") {
            gameStarted = false;
            screen = "menu";
        }
    }
});

// --- Start ---------------------------------------------------------------

requestAnimationFrame(gameLoop);
