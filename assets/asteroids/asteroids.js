/*
 * Asteroids: fly a small ship and shoot the rocks. Big rocks break into
 * two medium ones, medium ones into two small ones. Colored balls are
 * power-ups: fly into them to pick them up.
 *
 *   Arrow left/right   turn
 *   Arrow up           thrust
 *   Space              shoot (hold it down)
 *   P / Esc            pause / menu
 *
 * Everything that moves is an object with x, y (position), dx, dy (speed
 * per step) and radius. Things that fly off one side of the screen come
 * back on the other side.
 */

// --- Settings ------------------------------------------------------------

const STEP = 1000 / 60;         // one update step, in milliseconds
const TURN_SPEED = 0.08;        // radians per step
const THRUST = 0.15;
const MAX_SPEED = 6;
const FRICTION = 0.99;          // the ship slowly stops by itself
const BULLET_SPEED = 6;
const BULLET_TIME = 1500;       // ms a bullet flies
const FIRE_DELAY = 200;         // ms between shots
const POWER_UP_DELAY = 10000;   // ms between power-ups
const POWER_UP_TIME = 10000;    // ms a power-up lasts

const ROCK_SIZES = { large: 50, medium: 30, small: 15 };
const SPLITS_INTO = { large: "medium", medium: "small", small: null };

// A new kind of power-up is added on each level, in this order.
const POWER_UPS = [
    { type: "health", color: "#00ff00", text: "Repairs 10 health" },
    { type: "triple", color: "#ff0000", text: "Shoots 3 bullets at once" },
    { type: "five", color: "#e81e63", text: "Shoots 5 bullets at once" },
    { type: "speed", color: "#ffff00", text: "Faster ship" }
];

// --- Canvas --------------------------------------------------------------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- State ---------------------------------------------------------------

let screen = "menu";   // menu, controls, powerUps, playing, paused, levelDone, gameOver
let menuIndex = 0;
let gameStarted = false;

let ship;
let bullets = [];
let rocks = [];
let powerUps = [];
let level = 1;
let score = 0;
let rocksToSpawn = 0;
let gameTime = 0;      // ms of playing time; stops while paused
let nextRockTime = 0;
let nextPowerUpTime = 0;

// Which keys are held down right now, e.g. keys["ArrowUp"] === true.
const keys = {};

const MENU_ITEMS = ["Start", "Controls", "Power-ups"];

// The stars only twinkle, they never move.
const stars = [];
for (let i = 0; i < 100; i++) {
    stars.push({
        x: Math.random() * WIDTH,
        y: Math.random() * HEIGHT,
        radius: Math.random() * 2,
        brightness: Math.random()
    });
}

// --- Starting ------------------------------------------------------------

function newShip() {
    return {
        x: WIDTH / 2, y: HEIGHT / 2, dx: 0, dy: 0,
        angle: -Math.PI / 2,  // pointing up
        radius: 15,
        health: 100,
        lastShot: 0,
        shotType: "single",
        shotUntil: 0,
        speedUntil: 0,
        hurtUntil: 0
    };
}

function newGame() {
    ship = newShip();
    level = 1;
    score = 0;
    gameStarted = true;
    startLevel();
}

function startLevel() {
    bullets = [];
    rocks = [];
    powerUps = [];
    rocksToSpawn = 5 + level;
    gameTime = 0;
    nextRockTime = 0;
    nextPowerUpTime = POWER_UP_DELAY;
    screen = "playing";
}

// --- Helpers -------------------------------------------------------------

function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

// A place on a random edge of the screen, and a speed into the screen.
function fromRandomEdge() {
    const side = Math.floor(Math.random() * 4);
    const along = Math.random();
    const inward = Math.random() * 2 + 1;   // 1 to 3
    const sideways = Math.random() * 2 - 1; // -1 to 1

    if (side === 0) return { x: 0, y: along * HEIGHT, dx: inward, dy: sideways };       // left
    if (side === 1) return { x: WIDTH, y: along * HEIGHT, dx: -inward, dy: sideways };  // right
    if (side === 2) return { x: along * WIDTH, y: 0, dx: sideways, dy: inward };        // top
    return { x: along * WIDTH, y: HEIGHT, dx: sideways, dy: -inward };                  // bottom
}

// Move by the speed. Off one side of the screen: back on the other side.
function move(thing) {
    thing.x = (thing.x + thing.dx + WIDTH) % WIDTH;
    thing.y = (thing.y + thing.dy + HEIGHT) % HEIGHT;
}

// Two circles touch if the distance between the centers is less than
// the two radii added together (Pythagoras for the distance).
function touching(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius;
}

// --- Spawning ------------------------------------------------------------

function spawnRock() {
    const place = fromRandomEdge();
    rocks.push({ x: place.x, y: place.y, dx: place.dx, dy: place.dy, size: "large", radius: ROCK_SIZES.large });
    rocksToSpawn--;
    // Rocks come faster on higher levels, but not faster than every 0.5 s.
    nextRockTime = gameTime + Math.max(500, 3000 - level * 100);
}

function spawnPowerUp() {
    const place = fromRandomEdge();
    const kind = randomItem(POWER_UPS.slice(0, level));
    powerUps.push({
        x: place.x, y: place.y, dx: place.dx, dy: place.dy, radius: 10,
        type: kind.type, color: kind.color,
        hideTime: gameTime + POWER_UP_TIME
    });
    nextPowerUpTime = gameTime + POWER_UP_DELAY;
}

function breakRock(rock) {
    score += 10;
    const smaller = SPLITS_INTO[rock.size];
    if (smaller === null) {
        return;
    }
    for (let i = 0; i < 2; i++) {
        rocks.push({
            x: rock.x, y: rock.y,
            dx: Math.random() * 2 - 1, dy: Math.random() * 2 - 1,
            size: smaller, radius: ROCK_SIZES[smaller]
        });
    }
}

// --- The ship ------------------------------------------------------------

function steerShip() {
    if (keys.ArrowLeft) {
        ship.angle -= TURN_SPEED;
    }
    if (keys.ArrowRight) {
        ship.angle += TURN_SPEED;
    }

    const fast = gameTime < ship.speedUntil;
    if (keys.ArrowUp) {
        // Push in the direction the ship points.
        const thrust = fast ? THRUST * 2 : THRUST;
        ship.dx += Math.cos(ship.angle) * thrust;
        ship.dy += Math.sin(ship.angle) * thrust;
    }

    ship.dx *= FRICTION;
    ship.dy *= FRICTION;

    // Not faster than the top speed.
    const maxSpeed = fast ? MAX_SPEED * 1.5 : MAX_SPEED;
    const speed = Math.hypot(ship.dx, ship.dy);
    if (speed > maxSpeed) {
        ship.dx = ship.dx / speed * maxSpeed;
        ship.dy = ship.dy / speed * maxSpeed;
    }
}

function shoot() {
    if (!keys[" "] || gameTime - ship.lastShot < FIRE_DELAY) {
        return;
    }
    ship.lastShot = gameTime;

    // Extra bullets go out at small angles to the sides.
    let angles = [0];
    if (gameTime < ship.shotUntil && ship.shotType === "triple") {
        angles = [-0.15, 0, 0.15];
    } else if (gameTime < ship.shotUntil && ship.shotType === "five") {
        angles = [-0.3, -0.15, 0, 0.15, 0.3];
    }

    angles.forEach(function (spread) {
        const angle = ship.angle + spread;
        bullets.push({
            x: ship.x + Math.cos(angle) * 20,
            y: ship.y + Math.sin(angle) * 20,
            dx: Math.cos(angle) * BULLET_SPEED,
            dy: Math.sin(angle) * BULLET_SPEED,
            radius: 2,
            hideTime: gameTime + BULLET_TIME
        });
    });
}

function pickUp(powerUp) {
    if (powerUp.type === "health") {
        ship.health = Math.min(100, ship.health + 10);
    } else if (powerUp.type === "speed") {
        ship.speedUntil = gameTime + POWER_UP_TIME;
    } else {
        ship.shotType = powerUp.type;
        ship.shotUntil = gameTime + POWER_UP_TIME;
    }
}

// The ship and a rock bounce off each other, and the ship takes damage.
function crash(rock) {
    // A line from the ship to the rock, made 1 long.
    const distance = Math.hypot(rock.x - ship.x, rock.y - ship.y) || 1;
    const nx = (rock.x - ship.x) / distance;
    const ny = (rock.y - ship.y) / distance;

    // Already moving apart? Then they bounced last step; do nothing.
    if ((ship.dx - rock.dx) * nx + (ship.dy - rock.dy) * ny < 0) {
        return;
    }
    ship.dx -= nx;
    ship.dy -= ny;
    rock.dx += nx;
    rock.dy += ny;

    ship.health -= 5;
    ship.hurtUntil = gameTime + 150;
}

// --- Update --------------------------------------------------------------

function update() {
    gameTime += STEP;

    if (rocksToSpawn > 0 && gameTime >= nextRockTime) {
        spawnRock();
    }
    if (gameTime >= nextPowerUpTime) {
        spawnPowerUp();
    }

    steerShip();
    shoot();

    move(ship);
    bullets.forEach(move);
    rocks.forEach(move);
    powerUps.forEach(move);

    // Bullets that hit something are removed, and so is what they hit.
    bullets = bullets.filter(function (bullet) {
        if (gameTime > bullet.hideTime) {
            return false;
        }
        const rock = rocks.find(function (r) { return touching(bullet, r); });
        if (rock) {
            rocks.splice(rocks.indexOf(rock), 1);
            breakRock(rock);
            return false;
        }
        const powerUp = powerUps.find(function (p) { return touching(bullet, p); });
        if (powerUp) {
            powerUps.splice(powerUps.indexOf(powerUp), 1);
            return false;
        }
        return true;
    });

    powerUps = powerUps.filter(function (powerUp) {
        if (touching(ship, powerUp)) {
            pickUp(powerUp);
            return false;
        }
        return gameTime < powerUp.hideTime;
    });

    rocks.forEach(function (rock) {
        if (touching(ship, rock)) {
            crash(rock);
        }
    });

    if (ship.health <= 0) {
        ship.health = 0;
        screen = "gameOver";
    } else if (rocksToSpawn === 0 && rocks.length === 0) {
        level++;
        screen = "levelDone";
    }
}

// --- Drawing -------------------------------------------------------------

function drawText(text, x, y, size, color, align) {
    ctx.fillStyle = color || "white";
    ctx.font = size + "px Arial";
    ctx.textAlign = align || "center";
    ctx.fillText(text, x, y);
}

function drawCircle(thing, color, filled) {
    ctx.beginPath();
    ctx.arc(thing.x, thing.y, thing.radius, 0, Math.PI * 2);
    if (filled) {
        ctx.fillStyle = color;
        ctx.fill();
    } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function drawStars() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    stars.forEach(function (star) {
        // Change the brightness a little, up or down, every frame.
        star.brightness += (Math.random() - 0.5) * 0.05;
        star.brightness = Math.min(1, Math.max(0.1, star.brightness));

        ctx.fillStyle = "rgba(255, 255, 255, " + star.brightness + ")";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawShip() {
    // Move and turn the canvas to the ship, then draw a triangle that
    // points right. This is easier than working out turned corners.
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.angle);
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-15, -10);
    ctx.lineTo(-15, 10);
    ctx.closePath();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();

    if (keys.ArrowUp && screen === "playing") {
        // A small flame behind the ship.
        ctx.beginPath();
        ctx.moveTo(-15, -5);
        ctx.lineTo(-25, 0);
        ctx.lineTo(-15, 5);
        ctx.strokeStyle = "orange";
        ctx.stroke();
    }
    ctx.restore();
}

function drawHud() {
    drawText("Score: " + score + "   Level: " + level, 20, 30, 20, "white", "left");

    // Health bar: gray background, then the health from red to green.
    const red = Math.round(255 - ship.health * 2.55);
    const green = Math.round(ship.health * 2.55);
    ctx.fillStyle = "gray";
    ctx.fillRect(WIDTH - 120, 15, 100, 15);
    ctx.fillStyle = "rgb(" + red + ", " + green + ", 0)";
    ctx.fillRect(WIDTH - 120, 15, ship.health, 15);

    // Seconds left of a power-up.
    const effects = [];
    if (gameTime < ship.shotUntil) {
        effects.push(ship.shotType + ": " + Math.ceil((ship.shotUntil - gameTime) / 1000));
    }
    if (gameTime < ship.speedUntil) {
        effects.push("speed: " + Math.ceil((ship.speedUntil - gameTime) / 1000));
    }
    drawText(effects.join("   "), WIDTH - 20, 50, 16, "yellow", "right");
}

function drawMessage(title, lines) {
    drawText(title, WIDTH / 2, HEIGHT / 2 - 60, 40);
    lines.forEach(function (line, index) {
        drawText(line, WIDTH / 2, HEIGHT / 2 + index * 30, 20);
    });
}

function drawMenu() {
    drawText("Asteroids", WIDTH / 2, HEIGHT / 2 - 50, 60);
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
    drawText("Controls", WIDTH / 2, 150, 40);
    const lines = [
        ["Turn", "Arrow left / right"],
        ["Thrust", "Arrow up"],
        ["Shoot", "Space"],
        ["Pause", "P"],
        ["Menu", "Esc"]
    ];
    lines.forEach(function (line, index) {
        drawText(line[0], WIDTH / 2 - 120, 240 + index * 35, 20);
        drawText(line[1], WIDTH / 2 + 120, 240 + index * 35, 20);
    });
    drawText("Esc: back", WIDTH / 2, HEIGHT - 35, 16);
}

function drawPowerUpHelp() {
    drawText("Power-ups", WIDTH / 2, 150, 40);
    POWER_UPS.forEach(function (kind, index) {
        const y = 240 + index * 45;
        drawCircle({ x: WIDTH / 2 - 200, y: y - 7, radius: 10 }, kind.color, true);
        drawText(kind.text, WIDTH / 2 - 170, y, 20, "white", "left");
        drawText("from level " + (index + 1), WIDTH / 2 + 170, y, 16, "gray", "left");
    });
    drawText("Shot and speed power-ups last 10 seconds.", WIDTH / 2, 450, 18);
    drawText("Esc: back", WIDTH / 2, HEIGHT - 35, 16);
}

function draw() {
    drawStars();

    if (screen === "menu") {
        drawMenu();
        return;
    }
    if (screen === "controls") {
        drawControls();
        return;
    }
    if (screen === "powerUps") {
        drawPowerUpHelp();
        return;
    }

    rocks.forEach(function (rock) {
        drawCircle(rock, "gray", false);
    });
    powerUps.forEach(function (powerUp) {
        drawCircle(powerUp, powerUp.color, true);
    });
    bullets.forEach(function (bullet) {
        drawCircle(bullet, "white", true);
    });
    drawShip();
    drawHud();

    if (gameTime < ship.hurtUntil) {
        ctx.fillStyle = "rgba(225, 0, 0, 0.5)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    if (screen === "paused") {
        drawMessage("Pause", ["Press P to go on"]);
    } else if (screen === "levelDone") {
        drawMessage("Level " + (level - 1) + " done!", ["Press Enter for level " + level]);
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

// --- Keyboard ------------------------------------------------------------

document.addEventListener("keydown", function (event) {
    const key = event.key;
    keys[key] = true;

    if (screen === "menu") {
        if (key === "ArrowUp") {
            menuIndex = (menuIndex + MENU_ITEMS.length - 1) % MENU_ITEMS.length;
        } else if (key === "ArrowDown") {
            menuIndex = (menuIndex + 1) % MENU_ITEMS.length;
        } else if (key === "Enter") {
            const item = MENU_ITEMS[menuIndex];
            if (item === "Start") {
                newGame();
            } else if (item === "Controls") {
                screen = "controls";
            } else {
                screen = "powerUps";
            }
        } else if (key === "Escape" && gameStarted) {
            screen = "paused";
        }
    } else if (screen === "controls" || screen === "powerUps") {
        if (key === "Escape") {
            screen = "menu";
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
    } else if (screen === "levelDone") {
        if (key === "Enter") {
            startLevel();
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

document.addEventListener("keyup", function (event) {
    keys[event.key] = false;
});

// If the window loses focus while a key is held, we never get its keyup.
window.addEventListener("blur", function () {
    for (const key in keys) {
        keys[key] = false;
    }
});

// --- Start ---------------------------------------------------------------

ship = newShip();
requestAnimationFrame(gameLoop);
