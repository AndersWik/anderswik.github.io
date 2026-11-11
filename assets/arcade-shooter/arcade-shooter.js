/*
 * Arcade shooter: targets pop up in doors and windows. Shoot the bad guys
 * before they disappear, but don't shoot the civilians.
 *
 *   click   shoot (6 bullets)
 *   Space   reload
 *   P       pause
 *   Esc     menu
 *
 * The game is drawn on a <canvas>. A loop runs about 60 times a second:
 * it updates the game a fixed number of steps, then draws everything.
 * "screen" says what is shown: the menu, the game, the pause text...
 *
 * The level data (pictures and where targets pop up) is in levels.js.
 */

// --- Settings ------------------------------------------------------------

// Where the pictures are. On a page of your own: "images/".
const IMAGE_FOLDER = "/assets/arcade-shooter/images/";

const MAX_BULLETS = 6;
const START_LIVES = 3;
const TARGET_TIME = 2000;    // ms a target stays before it hides again
const TARGET_WIDTH = 80;
const TARGET_HEIGHT = 120;
const ENEMY_CHANCE = 0.7;    // 70% of targets are enemies
const STEP = 1000 / 60;      // one update step, in milliseconds

// --- Canvas --------------------------------------------------------------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- Pictures ------------------------------------------------------------

const images = {};

// Start loading a picture once and remember it by name.
function loadImage(name) {
    if (!images[name]) {
        images[name] = new Image();
        images[name].src = IMAGE_FOLDER + name;
    }
    return images[name];
}

// complete is true when loading is done; naturalWidth is 0 if it failed.
function isLoaded(image) {
    return image.complete && image.naturalWidth > 0;
}

// Load everything at the start, so nothing pops in late during the game.
function loadAllImages() {
    ["rifle_bullet.png", "splat-1.png", "splat-2.png"].forEach(loadImage);
    LEVELS.forEach(function (level) {
        loadImage(level.background);
        level.enemies.concat(level.civilians).forEach(function (picture) {
            loadImage(picture.half);
            loadImage(picture.full);
        });
    });
}

// --- State ---------------------------------------------------------------

let screen = "menu";   // menu, controls, playing, paused, levelDone, won, gameOver
let menuIndex = 0;
let gameStarted = false;

let levelIndex = 0;
let score = 0;
let lives = START_LIVES;
let bullets = MAX_BULLETS;
let targets = [];      // the targets showing right now
let splats = [];       // blood splats where an enemy was hit
let spawned = 0;       // targets shown so far this level
let gameTime = 0;      // ms of playing time; stops while paused
let nextSpawnTime = 0;
let hurtUntil = 0;     // show a red flash until this time

let mouseX = WIDTH / 2;
let mouseY = HEIGHT / 2;

const MENU_ITEMS = ["Start", "Controls"];

// --- Helpers -------------------------------------------------------------

function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function level() {
    return LEVELS[levelIndex];
}

function startGame() {
    levelIndex = 0;
    score = 0;
    lives = START_LIVES;
    gameStarted = true;
    startLevel();
}

function startLevel() {
    targets = [];
    splats = [];
    spawned = 0;
    bullets = MAX_BULLETS;
    gameTime = 0;
    nextSpawnTime = level().interval;
    hurtUntil = 0;
    screen = "playing";
}

function loseLife() {
    lives--;
    hurtUntil = gameTime + 150;
}

// --- Targets -------------------------------------------------------------

function spawnTarget() {
    // Spots that have no target in them right now.
    const freeSpots = level().spots.filter(function (spot) {
        return !targets.some(function (target) {
            return target.spot === spot;
        });
    });
    if (freeSpots.length === 0) {
        return; // try again next step
    }

    const spot = randomItem(freeSpots);
    const isEnemy = Math.random() < ENEMY_CHANCE;
    const picture = randomItem(isEnemy ? level().enemies : level().civilians);

    targets.push({
        spot: spot,
        x: spot.x,
        y: spot.y,
        isEnemy: isEnemy,
        image: loadImage(spot.place === "door" ? picture.full : picture.half),
        hideTime: gameTime + TARGET_TIME
    });
    spawned++;
    nextSpawnTime = gameTime + level().interval;
}

function isHit(target, x, y) {
    return x >= target.x && x <= target.x + TARGET_WIDTH &&
        y >= target.y && y <= target.y + TARGET_HEIGHT;
}

function shoot(x, y) {
    if (bullets === 0) {
        return;
    }
    bullets--;

    // Look from the last target, which is drawn on top, to the first.
    for (let i = targets.length - 1; i >= 0; i--) {
        const target = targets[i];
        if (isHit(target, x, y)) {
            if (target.isEnemy) {
                score += 100;
                splats.push({ x: x - 15, y: y - 15, image: loadImage(randomItem(["splat-1.png", "splat-2.png"])), hideTime: gameTime + 500 });
            } else {
                loseLife();
            }
            targets.splice(i, 1);
            return;
        }
    }
}

// --- Update --------------------------------------------------------------

// One step of the game: about 1/60 of a second.
function update() {
    gameTime += STEP;

    if (spawned < level().targets && gameTime >= nextSpawnTime) {
        spawnTarget();
    }

    // Enemies that hide again before they are shot cost a life.
    targets = targets.filter(function (target) {
        if (gameTime < target.hideTime) {
            return true;
        }
        if (target.isEnemy) {
            loseLife();
        }
        return false;
    });

    splats = splats.filter(function (splat) {
        return gameTime < splat.hideTime;
    });

    if (lives <= 0) {
        screen = "gameOver";
    } else if (spawned === level().targets && targets.length === 0) {
        screen = levelIndex === LEVELS.length - 1 ? "won" : "levelDone";
    }
}

// --- Drawing -------------------------------------------------------------

function drawText(text, x, y, size, color) {
    ctx.fillStyle = color || "white";
    ctx.font = size + "px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
}

// Draw a picture, or a plain box if it hasn't loaded (yet).
function drawImage(image, x, y, width, height, fallbackColor) {
    if (isLoaded(image)) {
        ctx.drawImage(image, x, y, width, height);
    } else {
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(x, y, width, height);
    }
}

function drawWorld() {
    drawImage(loadImage(level().background), 0, 0, WIDTH, HEIGHT, "#87ceeb");

    targets.forEach(function (target) {
        drawImage(target.image, target.x, target.y, TARGET_WIDTH, TARGET_HEIGHT,
            target.isEnemy ? "red" : "blue");
    });

    splats.forEach(function (splat) {
        if (isLoaded(splat.image)) {
            ctx.drawImage(splat.image, splat.x, splat.y, 30, 30);
        }
    });

    if (gameTime < hurtUntil) {
        ctx.fillStyle = "rgba(225, 0, 0, 0.5)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
}

function drawHud() {
    drawText("Score: " + score, 120, 30, 20);
    drawText("Lives: " + lives, 400, 30, 20);
    drawText("Level: " + (levelIndex + 1), 680, 30, 20);

    // The bullets left, stacked from the bottom left corner.
    const bulletImage = loadImage("rifle_bullet.png");
    for (let i = 0; i < bullets; i++) {
        drawImage(bulletImage, 20, HEIGHT - 60 - i * 30, 100, 30, "gold");
    }
    if (bullets === 0) {
        drawText("Press Space to reload", WIDTH / 2, HEIGHT - 30, 24, "yellow");
    }
}

function drawCrosshair() {
    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(mouseX, mouseY, 30, 0, Math.PI * 2);
    // Four short lines: left, right, up and down.
    ctx.moveTo(mouseX - 40, mouseY);
    ctx.lineTo(mouseX - 20, mouseY);
    ctx.moveTo(mouseX + 20, mouseY);
    ctx.lineTo(mouseX + 40, mouseY);
    ctx.moveTo(mouseX, mouseY - 40);
    ctx.lineTo(mouseX, mouseY - 20);
    ctx.moveTo(mouseX, mouseY + 20);
    ctx.lineTo(mouseX, mouseY + 40);
    ctx.stroke();
}

function drawMenu() {
    drawText("Tux Shooter", WIDTH / 2, HEIGHT / 2 - 50, 60, "yellow");
    MENU_ITEMS.forEach(function (item, index) {
        const color = index === menuIndex ? "yellow" : "white";
        drawText(item, WIDTH / 2, HEIGHT / 2 + 20 + index * 50, 24, color);
    });
    drawText("Arrow keys and Enter to choose", WIDTH / 2, HEIGHT - 60, 16);
    if (gameStarted) {
        drawText("Esc: back to the game", WIDTH / 2, HEIGHT - 35, 16);
    }
}

function drawControls() {
    drawText("Controls", WIDTH / 2, 150, 40, "yellow");
    const lines = [
        ["Shoot", "Click"],
        ["Reload", "Space"],
        ["Pause", "P"],
        ["Menu", "Esc"]
    ];
    lines.forEach(function (line, index) {
        drawText(line[0], WIDTH / 2 - 100, 250 + index * 35, 22);
        drawText(line[1], WIDTH / 2 + 100, 250 + index * 35, 22);
    });
    drawText("Shoot the bad guys. Don't shoot the civilians!", WIDTH / 2, 430, 20, "yellow");
    drawText("Esc: back", WIDTH / 2, HEIGHT - 35, 16);
}

function drawMessage(title, lines) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawText(title, WIDTH / 2, HEIGHT / 2 - 60, 40, "yellow");
    lines.forEach(function (line, index) {
        drawText(line, WIDTH / 2, HEIGHT / 2 + index * 30, 20);
    });
}

function draw() {
    drawWorld();

    if (screen === "menu") {
        drawMenu();
    } else if (screen === "controls") {
        drawControls();
    } else if (screen === "playing") {
        drawHud();
        drawCrosshair();
    } else if (screen === "paused") {
        drawMessage("Pause", ["Press P to go on"]);
    } else if (screen === "levelDone") {
        drawMessage("Level complete!", ["Score: " + score, "Press Enter to continue"]);
    } else if (screen === "won") {
        drawMessage("You win!", ["Score: " + score, "Press Enter to play again", "Press Esc for the menu"]);
    } else if (screen === "gameOver") {
        drawMessage("Game over", ["Score: " + score, "Press Enter to play again", "Press Esc for the menu"]);
    }
}

// --- The loop ------------------------------------------------------------

// requestAnimationFrame calls us before every screen refresh, usually 60
// times a second, but 120 or more on some screens. To make the game run
// at the same speed everywhere, we run one update per 1/60 second that
// has passed, however many frames that is.
let lastTime = performance.now();
let leftover = 0;

function gameLoop(now) {
    // Math.min: after a long break (another tab), don't run hundreds of steps.
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

canvas.addEventListener("click", function (event) {
    if (screen === "playing") {
        const position = canvasPosition(event);
        shoot(position.x, position.y);
    }
});

document.addEventListener("keydown", function (event) {
    const key = event.key;

    if (screen === "menu") {
        if (key === "ArrowUp") {
            menuIndex = (menuIndex + MENU_ITEMS.length - 1) % MENU_ITEMS.length;
        } else if (key === "ArrowDown") {
            menuIndex = (menuIndex + 1) % MENU_ITEMS.length;
        } else if (key === "Enter") {
            if (MENU_ITEMS[menuIndex] === "Start") {
                startGame();
            } else {
                screen = "controls";
            }
        } else if (key === "Escape" && gameStarted) {
            screen = "paused";
        }
    } else if (screen === "controls") {
        if (key === "Escape") {
            screen = "menu";
        }
    } else if (screen === "playing") {
        if (key === " ") {
            bullets = MAX_BULLETS;
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
    } else if (screen === "levelDone") {
        if (key === "Enter") {
            levelIndex++;
            startLevel();
        }
    } else if (screen === "won" || screen === "gameOver") {
        if (key === "Enter") {
            startGame();
        } else if (key === "Escape") {
            gameStarted = false;
            screen = "menu";
        }
    }
});

// --- Start ---------------------------------------------------------------

loadAllImages();
requestAnimationFrame(gameLoop);
