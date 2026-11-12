/*
 * Space fighter: fly your ship through five levels of enemies. Shoot
 * them, dodge them and their bullets, and catch power-ups. Every level
 * brings a new kind of enemy. If your health runs out, the game is over.
 *
 *   Arrow keys   fly
 *   Space        shoot (hold it down)
 *   P / Esc      pause / menu
 */

// --- Settings ------------------------------------------------------------

const STEP = 1000 / 60;        // one update step, in milliseconds
const LAST_LEVEL = 5;
const SHIP_RADIUS = 15;
const SHIP_SPEED = 5;
const FAST_SHIP_SPEED = 9;
const SHOT_TIME = 12;          // steps between shots
const BULLET_SPEED = 8;
const SPREAD = 0.15;           // angle between the bullets of a multi-shot
const POWER_UP_TIME = 600;     // steps a power-up lasts (10 seconds)
const POWER_UP_EVERY = 300;    // steps between new power-ups (5 seconds)

// The kinds of enemies, and the first level they come on.
const ENEMIES = {
    saucer:  { level: 1, radius: 20, speed: 2, shootChance: 0.01, points: 10, color: "#87ceeb" },
    rocket:  { level: 2, radius: 14, speed: 5, shootChance: 0, points: 20, color: "#b388ff" },
    cruiser: { level: 3, radius: 26, speed: 1.2, shootChance: 0.03, points: 30, color: "orange" }
};

const POWER_UPS = {
    health:    { level: 1, color: "#00ff00", text: "Health: +30" },
    triple:    { level: 1, color: "red", text: "Triple shot for 10 seconds" },
    quintuple: { level: 2, color: "#e81e63", text: "Five shots for 10 seconds" },
    speed:     { level: 3, color: "yellow", text: "Faster ship for 10 seconds" }
};

// --- Canvas --------------------------------------------------------------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- State ---------------------------------------------------------------

let screen = "menu";   // menu, controls, powerUps, playing, paused, levelDone, won, gameOver
let menuIndex = 0;
let gameStarted = false;

let level = 1;
let score = 0;

// Everything that can hit something is a circle: x, y and radius.
let ship = null;
let bullets = [];        // { x, y, dx, dy, radius }
let enemies = [];        // { kind, x, y, radius, age }
let enemyBullets = [];
let powerUps = [];       // { type, x, y, radius }
let stars = [];

let enemiesLeft = 0;     // enemies still to come this level
let spawnTimer = 0;
let powerUpTimer = 0;
let shotTimer = 0;
let shotType = "single"; // single, triple or quintuple
let shotTime = 0;        // steps left of a multi-shot power-up
let speedTime = 0;       // steps left of the speed power-up
let hurtTime = 0;        // steps left to show the red flash

const keys = {};

const MENU_ITEMS = ["Start", "Controls", "Power-ups"];

// --- Stars ---------------------------------------------------------------

function newStar(y) {
    return { x: Math.random() * WIDTH, y: y, radius: Math.random() * 2, brightness: Math.random() };
}

for (let i = 0; i < 100; i++) {
    stars.push(newStar(Math.random() * HEIGHT));
}

// The stars drift down, and very fast between levels. A star that leaves
// the bottom comes back at the top.
function moveStars() {
    const speed = screen === "levelDone" ? 15 : 0.5;
    stars.forEach(function (star) {
        star.y += speed;
        if (star.y > HEIGHT) {
            Object.assign(star, newStar(0));
        }
        star.brightness = Math.min(1, Math.max(0.1, star.brightness + (Math.random() - 0.5) * 0.05));
    });
}

// --- Starting ------------------------------------------------------------

function newGame() {
    level = 1;
    score = 0;
    ship = { x: WIDTH / 2, y: HEIGHT - 60, radius: SHIP_RADIUS, health: 100 };
    gameStarted = true;
    startLevel();
}

function startLevel() {
    bullets = [];
    enemies = [];
    enemyBullets = [];
    powerUps = [];
    enemiesLeft = 20 + level * 10;
    spawnTimer = 60;
    powerUpTimer = POWER_UP_EVERY;
    shotType = "single";
    shotTime = 0;
    speedTime = 0;
    hurtTime = 0;
    screen = "playing";
}

// --- Helpers -------------------------------------------------------------

function touches(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius;
}

function randomItem(list) {
    return list[Math.floor(Math.random() * list.length)];
}

// The names in "table" whose level has been reached.
function unlocked(table) {
    return Object.keys(table).filter(function (name) {
        return table[name].level <= level;
    });
}

function hurt(damage) {
    ship.health -= damage;
    hurtTime = 10;
}

// --- Spawning ------------------------------------------------------------

function spawnEnemy() {
    const kind = randomItem(unlocked(ENEMIES));
    const radius = ENEMIES[kind].radius;
    enemies.push({ kind: kind, x: radius + Math.random() * (WIDTH - 2 * radius), y: -radius, radius: radius, age: 0 });
    enemiesLeft--;
}

function spawnPowerUp() {
    const type = randomItem(unlocked(POWER_UPS));
    powerUps.push({ type: type, x: 20 + Math.random() * (WIDTH - 40), y: -12, radius: 12 });
}

function pickUp(type) {
    if (type === "health") {
        ship.health = Math.min(100, ship.health + 30);
    } else if (type === "speed") {
        speedTime = POWER_UP_TIME;
    } else {
        shotType = type;   // triple or quintuple
        shotTime = POWER_UP_TIME;
    }
}

// --- Shooting ------------------------------------------------------------

// One bullet straight up, and with a power-up more, spread out like a fan.
function shoot() {
    let angles = [0];
    if (shotType === "triple") {
        angles = [-SPREAD, 0, SPREAD];
    } else if (shotType === "quintuple") {
        angles = [-2 * SPREAD, -SPREAD, 0, SPREAD, 2 * SPREAD];
    }
    angles.forEach(function (angle) {
        bullets.push({
            x: ship.x,
            y: ship.y - SHIP_RADIUS,
            dx: Math.sin(angle) * BULLET_SPEED,
            dy: -Math.cos(angle) * BULLET_SPEED,
            radius: 3
        });
    });
}

// --- Update --------------------------------------------------------------

function moveShip() {
    const speed = speedTime > 0 ? FAST_SHIP_SPEED : SHIP_SPEED;
    if (keys.ArrowLeft) {
        ship.x -= speed;
    }
    if (keys.ArrowRight) {
        ship.x += speed;
    }
    if (keys.ArrowUp) {
        ship.y -= speed;
    }
    if (keys.ArrowDown) {
        ship.y += speed;
    }
    ship.x = Math.max(SHIP_RADIUS, Math.min(WIDTH - SHIP_RADIUS, ship.x));
    ship.y = Math.max(SHIP_RADIUS, Math.min(HEIGHT - SHIP_RADIUS, ship.y));

    shotTimer--;
    if (keys[" "] && shotTimer <= 0) {
        shoot();
        shotTimer = SHOT_TIME;
    }
}

function moveEnemy(enemy) {
    const kind = ENEMIES[enemy.kind];
    enemy.age++;
    enemy.y += kind.speed;
    if (enemy.kind === "cruiser") {
        enemy.x += Math.sin(enemy.age / 30) * 2;   // weaves from side to side
    }
    if (Math.random() < kind.shootChance) {
        enemyBullets.push({ x: enemy.x, y: enemy.y + enemy.radius, dx: 0, dy: 4, radius: 3 });
    }
}

function update() {
    moveShip();

    spawnTimer--;
    if (spawnTimer <= 0 && enemiesLeft > 0) {
        spawnEnemy();
        spawnTimer = Math.max(20, 60 - level * 8);
    }
    powerUpTimer--;
    if (powerUpTimer <= 0) {
        spawnPowerUp();
        powerUpTimer = POWER_UP_EVERY;
    }

    // Power-ups run out, each on its own clock.
    shotTime--;
    if (shotTime <= 0) {
        shotType = "single";
    }
    speedTime--;
    hurtTime--;

    enemies.forEach(moveEnemy);

    // Your bullets: each one can destroy one enemy.
    bullets = bullets.filter(function (bullet) {
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;
        const enemy = enemies.find(function (e) {
            return touches(bullet, e);
        });
        if (enemy) {
            enemies.splice(enemies.indexOf(enemy), 1);
            score += ENEMIES[enemy.kind].points;
            return false;
        }
        return bullet.y > 0 && bullet.x > 0 && bullet.x < WIDTH;
    });

    // Flying into an enemy destroys it, but hurts you.
    enemies = enemies.filter(function (enemy) {
        if (touches(enemy, ship)) {
            hurt(20);
            return false;
        }
        return enemy.y - enemy.radius < HEIGHT;
    });

    enemyBullets = enemyBullets.filter(function (bullet) {
        bullet.y += bullet.dy;
        if (touches(bullet, ship)) {
            hurt(10);
            return false;
        }
        return bullet.y < HEIGHT;
    });

    powerUps = powerUps.filter(function (powerUp) {
        powerUp.y += 2;
        if (touches(powerUp, ship)) {
            pickUp(powerUp.type);
            return false;
        }
        return powerUp.y < HEIGHT + powerUp.radius;
    });

    if (ship.health <= 0) {
        ship.health = 0;
        screen = "gameOver";
    } else if (enemiesLeft === 0 && enemies.length === 0) {
        screen = level === LAST_LEVEL ? "won" : "levelDone";
    }
}

// --- Drawing -------------------------------------------------------------

function drawText(text, x, y, size, color, align) {
    ctx.fillStyle = color || "white";
    ctx.font = size + "px Arial";
    ctx.textAlign = align || "center";
    ctx.fillText(text, x, y);
}

function drawEnemy(enemy) {
    const color = ENEMIES[enemy.kind].color;
    const r = enemy.radius;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (enemy.kind === "saucer") {
        ctx.ellipse(enemy.x, enemy.y, r, r / 2, 0, 0, Math.PI * 2);
    } else if (enemy.kind === "rocket") {
        // A triangle pointing down.
        ctx.moveTo(enemy.x - r, enemy.y - r);
        ctx.lineTo(enemy.x + r, enemy.y - r);
        ctx.lineTo(enemy.x, enemy.y + r);
    } else {
        ctx.rect(enemy.x - r, enemy.y - r / 2, r * 2, r);
    }
    ctx.fill();
}

function drawWorld() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    stars.forEach(function (star) {
        ctx.fillStyle = "rgba(255, 255, 255, " + star.brightness + ")";
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    if (!gameStarted) {
        return;
    }

    // The ship: a triangle pointing up.
    ctx.strokeStyle = speedTime > 0 ? "yellow" : "white";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ship.x, ship.y - 20);
    ctx.lineTo(ship.x - 15, ship.y + 10);
    ctx.lineTo(ship.x + 15, ship.y + 10);
    ctx.closePath();
    ctx.stroke();

    enemies.forEach(drawEnemy);

    ctx.fillStyle = "white";
    bullets.concat(enemyBullets).forEach(function (bullet) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    powerUps.forEach(function (powerUp) {
        ctx.fillStyle = POWER_UPS[powerUp.type].color;
        ctx.fillRect(powerUp.x - powerUp.radius, powerUp.y - powerUp.radius, powerUp.radius * 2, powerUp.radius * 2);
    });

    if (hurtTime > 0) {
        ctx.fillStyle = "rgba(225, 0, 0, 0.4)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // Score, level and a health bar that goes from green to red.
    drawText("Score: " + score + "   Level: " + level, 20, 30, 20, "white", "left");
    ctx.fillStyle = "#555555";
    ctx.fillRect(WIDTH - 120, 15, 100, 15);
    ctx.fillStyle = "rgb(" + (255 - ship.health * 2.55) + ", " + ship.health * 2.55 + ", 0)";
    ctx.fillRect(WIDTH - 120, 15, ship.health, 15);
}

function drawMessage(title, lines) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawText(title, WIDTH / 2, HEIGHT / 2 - 60, 44, "yellow");
    lines.forEach(function (line, index) {
        drawText(line, WIDTH / 2, HEIGHT / 2 + index * 30, 20);
    });
}

function drawMenu() {
    drawText("Space fighter", WIDTH / 2, HEIGHT / 2 - 60, 60);
    MENU_ITEMS.forEach(function (item, index) {
        const color = index === menuIndex ? "yellow" : "white";
        drawText(item, WIDTH / 2, HEIGHT / 2 + 10 + index * 45, 24, color);
    });
    drawText("Arrow keys and Enter to choose", WIDTH / 2, HEIGHT - 50, 16);
    if (gameStarted) {
        drawText("Esc: back to the game", WIDTH / 2, HEIGHT - 25, 16);
    }
}

function drawPowerUpHelp() {
    drawText("Power-ups", WIDTH / 2, 150, 40);
    Object.keys(POWER_UPS).forEach(function (type, index) {
        const y = 230 + index * 45;
        ctx.fillStyle = POWER_UPS[type].color;
        ctx.fillRect(WIDTH / 2 - 180, y - 18, 24, 24);
        drawText(POWER_UPS[type].text, WIDTH / 2 - 140, y, 20, "white", "left");
    });
    drawText("Esc: back", WIDTH / 2, HEIGHT - 25, 16);
}

function draw() {
    drawWorld();

    if (screen === "menu") {
        drawMenu();
    } else if (screen === "controls") {
        drawMessage("Controls", ["Fly: arrow keys", "Shoot: Space", "Pause: P      Menu: Esc", "", "Esc: back"]);
    } else if (screen === "powerUps") {
        drawPowerUpHelp();
    } else if (screen === "paused") {
        drawMessage("Pause", ["Press P to go on"]);
    } else if (screen === "levelDone") {
        drawMessage("Level " + level + " done!", ["Press Enter for the next level"]);
    } else if (screen === "won") {
        drawMessage("You win!", ["Score: " + score, "Press Enter to play again", "Press Esc for the menu"]);
    } else if (screen === "gameOver") {
        drawMessage("Game over", ["Score: " + score, "Press Enter to play again", "Press Esc for the menu"]);
    }
}

// --- The loop ------------------------------------------------------------

// Run one update per 1/60 second, so the game has the same speed on
// every screen, then draw. The stars move on every screen.
let lastTime = performance.now();
let leftover = 0;

function gameLoop(now) {
    leftover += Math.min(now - lastTime, 250);
    lastTime = now;

    while (leftover >= STEP) {
        moveStars();
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
            level++;
            startLevel();
        }
    } else if (screen === "won" || screen === "gameOver") {
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

requestAnimationFrame(gameLoop);
