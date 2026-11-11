/*
 * Artillery: two tanks take turns shooting at each other. Set the angle
 * and the power, mind the wind, and fire. Four hits and the other tank
 * is out.
 *
 *   Arrow left/right   change the angle
 *   Space              hold to change the power, let go to fire
 *   Enter              fire
 *   P / Esc            pause / menu
 *
 * The sliders and the Fire button under the canvas do the same thing.
 */

// --- Settings ------------------------------------------------------------

const GROUND_Y = 500;       // the ground; the tanks stand on it
const GRAVITY = 0.5;        // added to the shell's downward speed every step
const POWER_SCALE = 0.2;    // slider power 50 -> speed 10
const DAMAGE = 25;          // health lost per hit
const STEP = 1000 / 60;     // one update step, in milliseconds

const LANDSCAPES = [
    { sky: ["#0a1e3a", "#ffffff"], hills: ["#556070", "#3c4756", "#5e715a"], ground: "#99b694" },
    { sky: ["#4b0e0e", "#ffe8d6"], hills: ["#7b4a4a", "#5c2b2b", "#8c5e4b"], ground: "#5c2b2b" },
    { sky: ["#0000ff", "#ffffff"], hills: ["#a8a8cd", "#47476f", "#67679c"], ground: "#a8a8cd" }
];

// --- Elements on the page ------------------------------------------------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const angleSlider = document.getElementById("angleSlider");
const powerSlider = document.getElementById("powerSlider");
const angleText = document.getElementById("angleValue");
const powerText = document.getElementById("powerValue");
const fireButton = document.getElementById("fireBtn");

// --- State ---------------------------------------------------------------

let screen = "menu";    // menu, controls, playing, paused, gameOver
let menuIndex = 0;
let gameStarted = false;

let tanks = [];
let player = 0;         // whose turn it is: 0 or 1
let shell = null;       // the flying shell, or null
let wind = 0;
let shots = 0;          // shots fired; the wind changes every second shot
let winner = 0;
let landscape = LANDSCAPES[0];
let hills = [];

let chargingPower = false;  // Space is held down
let powerGoingUp = true;

const MENU_ITEMS = ["Start", "Controls"];

// --- Helpers -------------------------------------------------------------

function randomWind() {
    return Math.random() * 3 - 1.5; // from -1.5 to +1.5
}

// A row of random points for one layer of hills.
function makeHills(height, roughness) {
    const points = [];
    for (let i = 0; i <= 40; i++) {
        points.push({
            x: (i / 40) * WIDTH,
            y: HEIGHT - height - Math.random() * height * roughness
        });
    }
    return points;
}

function newGame() {
    tanks = [
        { x: 100, y: GROUND_Y, color: "#00ff00", health: 100, angle: 45, power: 50, direction: 1 },
        { x: 700, y: GROUND_Y, color: "#0000ff", health: 100, angle: 45, power: 50, direction: -1 }
    ];
    player = 0;
    shell = null;
    shots = 0;
    wind = randomWind();
    landscape = LANDSCAPES[Math.floor(Math.random() * LANDSCAPES.length)];
    hills = [makeHills(300, 0.4), makeHills(250, 0.5), makeHills(200, 0.6)];
    gameStarted = true;
    screen = "playing";
    showSettings();
}

// Move the sliders and labels to the current tank's angle and power.
function showSettings() {
    const tank = tanks[player];
    angleSlider.value = tank.angle;
    powerSlider.value = tank.power;
    angleText.textContent = tank.angle + "°";
    powerText.textContent = tank.power;
}

function setAngle(angle) {
    tanks[player].angle = Math.min(90, Math.max(0, angle));
    showSettings();
}

function setPower(power) {
    tanks[player].power = Math.min(100, Math.max(10, power));
    showSettings();
}

// --- Shooting ------------------------------------------------------------

function fire() {
    if (screen !== "playing" || shell !== null) {
        return;
    }
    const tank = tanks[player];
    const radians = tank.angle * Math.PI / 180;
    const speed = tank.power * POWER_SCALE;

    // cos gives the sideways part of the speed, sin the upward part.
    // Up is minus on a canvas, because y counts down from the top.
    shell = {
        x: tank.x,
        y: tank.y - 10,
        dx: Math.cos(radians) * speed * tank.direction,
        dy: -Math.sin(radians) * speed,
        target: tanks[1 - player]
    };
}

function hitsTank(x, y, tank) {
    return Math.abs(x - tank.x) < 14 && y > tank.y - 14 && y < tank.y + 4;
}

// The shot is over: next player's turn.
function endTurn() {
    shell = null;
    shots++;
    if (shots % 2 === 0) {
        wind = randomWind();
    }
    player = 1 - player;
    showSettings();
}

// --- Update --------------------------------------------------------------

function update() {
    // Holding Space moves the power up and down between 10 and 100.
    if (chargingPower && shell === null) {
        const power = tanks[player].power;
        if (power >= 100) {
            powerGoingUp = false;
        } else if (power <= 10) {
            powerGoingUp = true;
        }
        setPower(power + (powerGoingUp ? 1 : -1));
    }

    if (shell === null) {
        return;
    }

    shell.dy += GRAVITY;
    shell.dx += wind * 0.01;
    shell.x += shell.dx;
    shell.y += shell.dy;

    // A fast shell moves up to 30 pixels a step and could jump over the
    // tank, so landing right next to it counts as a hit too.
    const landed = shell.y >= GROUND_Y;
    const landedOnTank = landed && Math.abs(shell.x - shell.target.x) < 16;

    if (hitsTank(shell.x, shell.y, shell.target) || landedOnTank) {
        shell.target.health -= DAMAGE;
        if (shell.target.health <= 0) {
            winner = player;
            shell = null;
            screen = "gameOver";
            return;
        }
        endTurn();
    } else if (landed || shell.x < 0 || shell.x > WIDTH) {
        endTurn(); // missed
    }
}

// --- Drawing -------------------------------------------------------------

function drawText(text, x, y, size, color) {
    ctx.fillStyle = color || "white";
    ctx.font = size + "px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, x, y);
}

function drawLandscape() {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, landscape.sky[0]);
    sky.addColorStop(1, landscape.sky[1]);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    hills.forEach(function (points, index) {
        ctx.beginPath();
        ctx.moveTo(0, HEIGHT);
        points.forEach(function (point) {
            ctx.lineTo(point.x, point.y);
        });
        ctx.lineTo(WIDTH, HEIGHT);
        ctx.closePath();
        ctx.fillStyle = landscape.hills[index];
        ctx.fill();
    });

    ctx.fillStyle = landscape.ground;
    ctx.fillRect(0, GROUND_Y, WIDTH, HEIGHT - GROUND_Y);
}

function drawTank(tank, isActive) {
    const radians = tank.angle * Math.PI / 180;
    const barrelX = tank.x + Math.cos(radians) * 30 * tank.direction;
    const barrelY = tank.y - Math.sin(radians) * 30;

    // Barrel: a thick black line with a thinner colored line on top.
    ctx.lineCap = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(tank.x, tank.y);
    ctx.lineTo(barrelX, barrelY);
    ctx.stroke();
    ctx.strokeStyle = tank.color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Body: half a circle. Yellow outline on the tank whose turn it is.
    ctx.beginPath();
    ctx.arc(tank.x, tank.y, 12, Math.PI, 0);
    ctx.fillStyle = tank.color;
    ctx.fill();
    ctx.strokeStyle = isActive ? "yellow" : "black";
    ctx.lineWidth = isActive ? 3 : 1;
    ctx.stroke();

    // Health bar: red background, green for the health left.
    ctx.fillStyle = "red";
    ctx.fillRect(tank.x - 20, tank.y - 30, 40, 5);
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(tank.x - 20, tank.y - 30, 40 * tank.health / 100, 5);
}

// An arrow at the top that shows the wind: longer is stronger.
function drawWind() {
    const centerX = WIDTH / 2;
    const length = 20 + Math.abs(wind) * 60;
    const direction = wind < 0 ? -1 : 1;
    const tipX = centerX + direction * length / 2;
    const tailX = centerX - direction * length / 2;

    ctx.strokeStyle = "#00ff00";
    ctx.fillStyle = "#00ff00";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(tailX, 60);
    ctx.lineTo(tipX - direction * 15, 60);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(tipX, 60);
    ctx.lineTo(tipX - direction * 20, 45);
    ctx.lineTo(tipX - direction * 20, 75);
    ctx.closePath();
    ctx.fill();

    drawText("Wind: " + wind.toFixed(2), centerX, 30, 16);
}

function drawMessage(title, lines) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawText(title, WIDTH / 2, HEIGHT / 2 - 60, 40);
    lines.forEach(function (line, index) {
        drawText(line, WIDTH / 2, HEIGHT / 2 + index * 30, 20);
    });
}

function drawMenu() {
    drawText("Artillery", WIDTH / 2, HEIGHT / 2 - 50, 60);
    MENU_ITEMS.forEach(function (item, index) {
        const color = index === menuIndex ? "yellow" : "white";
        drawText(item, WIDTH / 2, HEIGHT / 2 + 20 + index * 50, 24, color);
    });
    drawText("Arrow keys and Enter to choose", WIDTH / 2, HEIGHT - 60, 16);
}

function drawControls() {
    drawText("Controls", WIDTH / 2, 150, 40);
    const lines = [
        ["Angle", "Arrow left / right"],
        ["Power and fire", "Hold Space, let go"],
        ["Fire", "Enter"],
        ["Pause", "P"],
        ["Menu", "Esc"]
    ];
    lines.forEach(function (line, index) {
        drawText(line[0], WIDTH / 2 - 130, 240 + index * 35, 20);
        drawText(line[1], WIDTH / 2 + 130, 240 + index * 35, 20);
    });
    drawText("Esc: back", WIDTH / 2, HEIGHT - 35, 16);
}

function draw() {
    if (hills.length === 0) {
        // Before the first game: a landscape for the menu.
        hills = [makeHills(300, 0.4), makeHills(250, 0.5), makeHills(200, 0.6)];
    }
    drawLandscape();

    if (screen === "menu") {
        drawMenu();
        return;
    }
    if (screen === "controls") {
        drawControls();
        return;
    }

    drawWind();
    tanks.forEach(function (tank, index) {
        drawTank(tank, index === player && screen === "playing");
    });
    if (shell !== null) {
        ctx.fillStyle = "black";
        ctx.beginPath();
        ctx.arc(shell.x, shell.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    if (screen === "playing") {
        drawText("Player " + (player + 1), WIDTH / 2, 110, 20, "yellow");
    } else if (screen === "paused") {
        drawMessage("Pause", ["Press P to go on"]);
    } else if (screen === "gameOver") {
        drawMessage("Player " + (winner + 1) + " wins!", ["Press Enter to play again", "Press Esc for the menu"]);
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

// --- Keyboard, sliders and button ----------------------------------------

document.addEventListener("keydown", function (event) {
    // Arrow keys on a focused slider move the slider; don't do it twice.
    if (event.target.tagName === "INPUT") {
        return;
    }
    const key = event.key;

    if (screen === "menu") {
        if (key === "ArrowUp") {
            menuIndex = (menuIndex + MENU_ITEMS.length - 1) % MENU_ITEMS.length;
        } else if (key === "ArrowDown") {
            menuIndex = (menuIndex + 1) % MENU_ITEMS.length;
        } else if (key === "Enter") {
            if (MENU_ITEMS[menuIndex] === "Start") {
                newGame();
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
        if (key === "ArrowLeft") {
            setAngle(tanks[player].angle - 1);
        } else if (key === "ArrowRight") {
            setAngle(tanks[player].angle + 1);
        } else if (key === " ") {
            chargingPower = true;
        } else if (key === "Enter") {
            fire();
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
    } else if (screen === "gameOver") {
        if (key === "Enter") {
            newGame();
        } else if (key === "Escape") {
            gameStarted = false;
            screen = "menu";
        }
    }
});

// Letting go of Space fires, but only if Space was pressed in the game.
document.addEventListener("keyup", function (event) {
    if (event.key === " " && chargingPower) {
        chargingPower = false;
        fire();
    }
});

angleSlider.addEventListener("input", function () {
    if (tanks.length > 0) {
        setAngle(Number(angleSlider.value));
    }
});

powerSlider.addEventListener("input", function () {
    if (tanks.length > 0) {
        setPower(Number(powerSlider.value));
    }
});

fireButton.addEventListener("click", fire);

// --- Start ---------------------------------------------------------------

requestAnimationFrame(gameLoop);
