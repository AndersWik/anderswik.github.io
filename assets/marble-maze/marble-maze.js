/*
 * Marble Maze: tilt the phone to roll a marble through a maze to the green
 * hole, without falling into the black ones.
 *
 * The phone's tilt comes from the "deviceorientation" event, as in the
 * Bubble level: beta is the tilt front to back, gamma left to right. The
 * marble speeds up in the direction the phone leans, rolls on, slows down
 * a little, and bounces off the walls.
 *
 * Every maze is made from its level number, so level 5 is the same maze
 * every time. On a computer, the arrow keys tilt the board.
 */

// --- Settings ------------------------------------------------------------

const STEP = 1000 / 60;      // one update, in ms
const SUBSTEPS = 4;          // small steps, so the marble can't jump through a wall
const POWER = 0.5;           // how fast the marble speeds up when tilted all the way, px per step per step
const FRICTION = 0.985;      // speed kept each step
const MAX_SPEED = 9;         // px per step
const BOUNCE = 0.3;          // speed kept when bouncing off a wall
const WALL = 5;              // px, how thick the walls are
const TOP = 34;              // px at the top for the level, time and falls
const MARGIN = 8;            // px round the maze
const MAX_TILT = 30;         // degrees: tilting more than this is the same as this
const KEY_TILT = 0.45;       // how far an arrow key tilts the board
const BEST_KEY = "marble-maze-best";

// --- Canvas --------------------------------------------------------------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const message = document.getElementById("message");
const startButton = document.getElementById("start");

// --- State ---------------------------------------------------------------

let screen = "menu";       // menu, playing, falling, levelDone
let level = 1;
let maze = null;           // the level: walls, holes, start and goal
let marble = null;         // { x, y, vx, vy }
let levelTime = 0;         // ms on this level
let falls = 0;
let fallSteps = 0;         // how far into falling down a hole
let best = loadBest();     // best time for each level: { "3": 12345 }
let lastBump = 0;

// The tilt: the sensor's last angles, and the angles that count as flat.
let sensor = null;         // { beta, gamma }
let flat = null;           // the same, from when Start was pressed
let listening = false;
const keys = {};

// --- Making a maze -------------------------------------------------------

// A random number generator that gives the same numbers for the same seed
// (mulberry32), so a level is the same maze every time. Math.random()
// can't be given a seed.
function seeded(seed) {
    return function () {
        seed = (seed + 0x6D2B79F5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// How big each level is, and how many holes and extra openings it has.
function levelSettings(n) {
    const cols = Math.min(3 + n, 12);
    return {
        cols: cols,
        rows: Math.round(cols * 1.35),
        holes: Math.min(n - 1, 14),
        loops: Math.max(0, Math.min(n - 3, 8))
    };
}

// The maze: a grid of cells, each with four walls. We walk through the
// grid from the first cell, knocking down the wall to a random neighbour
// we haven't been to, and going back when there is none (a "recursive
// backtracker"). That makes exactly one way between any two cells.
function makeMaze(n) {
    const settings = levelSettings(n);
    const random = seeded(n * 7919);
    const cols = settings.cols;
    const rows = settings.rows;
    const cells = [];
    for (let i = 0; i < cols * rows; i++) {
        cells.push({ n: true, e: true, s: true, w: true });
    }
    const at = function (c, r) { return r * cols + c; };
    const steps = { n: [0, -1, "s"], e: [1, 0, "w"], s: [0, 1, "n"], w: [-1, 0, "e"] };

    const visited = new Set([0]);
    const stack = [0];
    while (stack.length > 0) {
        const i = stack[stack.length - 1];
        const c = i % cols;
        const r = Math.floor(i / cols);
        const options = Object.keys(steps).filter(function (side) {
            const [dc, dr] = steps[side];
            const nc = c + dc;
            const nr = r + dr;
            return nc >= 0 && nc < cols && nr >= 0 && nr < rows && !visited.has(at(nc, nr));
        });
        if (options.length === 0) {
            stack.pop();
            continue;
        }
        const side = options[Math.floor(random() * options.length)];
        const [dc, dr, back] = steps[side];
        const next = at(c + dc, r + dr);
        cells[i][side] = false;
        cells[next][back] = false;
        visited.add(next);
        stack.push(next);
    }

    // On later levels, knock down a few more walls, so there are loops and
    // more than one way round.
    for (let k = 0; k < settings.loops; k++) {
        const c = Math.floor(random() * (cols - 1));
        const r = Math.floor(random() * rows);
        cells[at(c, r)].e = false;
        cells[at(c + 1, r)].w = false;
    }

    // The distance of every cell from the start, by breadth-first search.
    // The goal is the cell furthest away.
    const parent = new Array(cells.length).fill(-1);
    const distance = new Array(cells.length).fill(-1);
    distance[0] = 0;
    const queue = [0];
    while (queue.length > 0) {
        const i = queue.shift();
        const c = i % cols;
        const r = Math.floor(i / cols);
        Object.keys(steps).forEach(function (side) {
            if (cells[i][side]) {
                return;
            }
            const next = at(c + steps[side][0], r + steps[side][1]);
            if (distance[next] === -1) {
                distance[next] = distance[i] + 1;
                parent[next] = i;
                queue.push(next);
            }
        });
    }
    let goal = 0;
    distance.forEach(function (d, i) {
        if (d > distance[goal]) {
            goal = i;
        }
    });
    // The shortest way from the start to the goal: no holes there.
    const path = new Set();
    for (let i = goal; i !== -1; i = parent[i]) {
        path.add(i);
    }

    // Where the maze goes on the canvas: as big as it fits, in the middle.
    const size = Math.floor(Math.min((WIDTH - 2 * MARGIN) / cols, (HEIGHT - TOP - MARGIN) / rows));
    const left = Math.round((WIDTH - size * cols) / 2);
    const top = TOP + Math.round((HEIGHT - TOP - MARGIN - size * rows) / 2);
    const middle = function (i) {
        return { x: left + (i % cols + 0.5) * size, y: top + (Math.floor(i / cols) + 0.5) * size };
    };

    // Holes in cells off the way to the goal, picked at random.
    const free = [];
    cells.forEach(function (cell, i) {
        if (!path.has(i)) {
            free.push(i);
        }
    });
    const holes = [];
    for (let k = 0; k < settings.holes && free.length > 0; k++) {
        const pick = free.splice(Math.floor(random() * free.length), 1)[0];
        holes.push(middle(pick));
    }

    // The walls, as straight lines: the top and left of every cell, and
    // the bottom and right of the last row and column.
    const walls = [];
    cells.forEach(function (cell, i) {
        const x = left + (i % cols) * size;
        const y = top + Math.floor(i / cols) * size;
        if (cell.n) walls.push([x, y, x + size, y]);
        if (cell.w) walls.push([x, y, x, y + size]);
        if (cell.s && Math.floor(i / cols) === rows - 1) walls.push([x, y + size, x + size, y + size]);
        if (cell.e && i % cols === cols - 1) walls.push([x + size, y, x + size, y + size]);
    });

    return {
        cols: cols, rows: rows, size: size, cells: cells, walls: walls, holes: holes,
        start: middle(0), goal: middle(goal), path: Array.from(path).reverse(), middle: middle,
        radius: Math.max(5, size * 0.24),       // the marble
        holeRadius: size * 0.3
    };
}

// --- The tilt ------------------------------------------------------------

// The tilt as two numbers from -1 to 1: right and down. With the phone's
// sensor, it is the sine of how far the phone leans from "flat", and the
// marble speeds up just like a real one would: sin(angle) of gravity.
function tilt() {
    let x = 0;
    let y = 0;
    if (sensor !== null && flat !== null) {
        x = Math.sin(clampAngle(sensor.gamma - flat.gamma) * Math.PI / 180);
        y = Math.sin(clampAngle(sensor.beta - flat.beta) * Math.PI / 180);
        const turned = toScreen(x, y);
        x = turned.x;
        y = turned.y;
    }
    if (keys.ArrowLeft) x = -KEY_TILT;
    if (keys.ArrowRight) x = KEY_TILT;
    if (keys.ArrowUp) y = -KEY_TILT;
    if (keys.ArrowDown) y = KEY_TILT;
    return { x: x, y: y };
}

function clampAngle(degrees) {
    return Math.max(-MAX_TILT, Math.min(MAX_TILT, degrees));
}

// When the screen turns to landscape, the phone's left-right is the
// screen's up-down. Turn the tilt back, as in the Bubble level.
function toScreen(x, y) {
    const angle = screenAngle() * Math.PI / 180;
    return {
        x: x * Math.cos(angle) + y * Math.sin(angle),
        y: -x * Math.sin(angle) + y * Math.cos(angle)
    };
}

// window.screen, because "screen" in this game is which screen of the game
// is showing: menu, playing and so on.
function screenAngle() {
    return window.screen.orientation ? window.screen.orientation.angle : window.orientation || 0;
}

function onOrientation(event) {
    if (event.beta === null || event.gamma === null) {
        return;
    }
    sensor = { beta: event.beta, gamma: event.gamma };
    if (flat === null) {
        flat = sensor;   // the first reading after Start counts as flat
    }
}

// iPhones ask the user first, and only after a tap, as in the Bubble level.
async function startSensor() {
    if (listening || !window.DeviceOrientationEvent) {
        return;
    }
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
            if (await DeviceOrientationEvent.requestPermission() !== "granted") {
                message.textContent = "No permission to read the tilt. You can still use the arrow keys.";
                return;
            }
        } catch (error) {
            return;
        }
    }
    window.addEventListener("deviceorientation", onOrientation);
    listening = true;
}

// --- Bouncing --------------------------------------------------------------

// The same bounce as in Mini Golf: find the point of the wall closest to
// the marble; if the marble is closer than its radius, push it out and
// turn its speed round.
function bounceOffWall(wall) {
    const [ax, ay, bx, by] = wall;
    const abx = bx - ax;
    const aby = by - ay;
    let t = ((marble.x - ax) * abx + (marble.y - ay) * aby) / (abx * abx + aby * aby);
    t = Math.max(0, Math.min(1, t));
    const cx = ax + abx * t;
    const cy = ay + aby * t;
    const dx = marble.x - cx;
    const dy = marble.y - cy;
    const distance = Math.hypot(dx, dy);
    const minimum = maze.radius + WALL / 2;
    if (distance >= minimum || distance === 0) {
        return;
    }
    const nx = dx / distance;
    const ny = dy / distance;
    marble.x = cx + nx * minimum;
    marble.y = cy + ny * minimum;
    const into = marble.vx * nx + marble.vy * ny;
    if (into < 0) {
        marble.vx -= (1 + BOUNCE) * into * nx;
        marble.vy -= (1 + BOUNCE) * into * ny;
        // A hard knock: a short buzz on phones that can.
        if (into < -2.5 && levelTime - lastBump > 150 && navigator.vibrate) {
            navigator.vibrate(12);
            lastBump = levelTime;
        }
    }
}

// --- The game ------------------------------------------------------------

function startLevel(n) {
    level = n;
    maze = makeMaze(n);
    marble = { x: maze.start.x, y: maze.start.y, vx: 0, vy: 0 };
    levelTime = 0;
    falls = 0;
    screen = "playing";
    startButton.textContent = "Make this flat";
    message.textContent = "Level " + n + ": roll to the green hole.";
}

function update() {
    if (screen === "falling") {
        fallSteps++;
        levelTime += STEP;
        if (fallSteps > 40) {
            marble = { x: maze.start.x, y: maze.start.y, vx: 0, vy: 0 };
            screen = "playing";
        }
        return;
    }
    levelTime += STEP;
    const lean = tilt();
    for (let s = 0; s < SUBSTEPS; s++) {
        marble.vx += lean.x * POWER / SUBSTEPS;
        marble.vy += lean.y * POWER / SUBSTEPS;
        marble.x += marble.vx / SUBSTEPS;
        marble.y += marble.vy / SUBSTEPS;
        maze.walls.forEach(bounceOffWall);
    }
    marble.vx *= FRICTION;
    marble.vy *= FRICTION;
    const speed = Math.hypot(marble.vx, marble.vy);
    if (speed > MAX_SPEED) {
        marble.vx *= MAX_SPEED / speed;
        marble.vy *= MAX_SPEED / speed;
    }

    // Into a hole: the middle of the marble is over it.
    const hole = maze.holes.find(function (h) {
        return Math.hypot(marble.x - h.x, marble.y - h.y) < maze.holeRadius;
    });
    if (hole) {
        falls++;
        fallSteps = 0;
        marble.x = hole.x;
        marble.y = hole.y;
        screen = "falling";
        if (navigator.vibrate) {
            navigator.vibrate([30, 40, 30]);
        }
        return;
    }
    if (Math.hypot(marble.x - maze.goal.x, marble.y - maze.goal.y) < maze.holeRadius * 0.8) {
        finishLevel();
    }
}

function finishLevel() {
    screen = "levelDone";
    const time = Math.round(levelTime);
    const old = best[level];
    if (old === undefined || time < old) {
        best[level] = time;
        saveBest();
    }
    startButton.textContent = "Next level";
    message.textContent = "Level " + level + " done in " + timeText(time) +
        (falls > 0 ? " with " + falls + (falls === 1 ? " fall" : " falls") : " without a fall") +
        (old === undefined || time < old ? ". A new best!" : ". Your best is " + timeText(old) + ".");
}

function timeText(ms) {
    const seconds = ms / 1000;
    return Math.floor(seconds / 60) + ":" + (seconds % 60).toFixed(1).padStart(4, "0");
}

function loadBest() {
    try {
        return JSON.parse(localStorage.getItem(BEST_KEY)) || {};
    } catch (error) {
        return {};
    }
}

function saveBest() {
    try {
        localStorage.setItem(BEST_KEY, JSON.stringify(best));
    } catch (error) {
        // Not saved, but the game still works.
    }
}

// --- Drawing -------------------------------------------------------------

function drawHole(h, goal) {
    const r = maze.holeRadius;
    const shade = ctx.createRadialGradient(h.x - r * 0.3, h.y - r * 0.3, r * 0.1, h.x, h.y, r);
    shade.addColorStop(0, goal ? "#1b5e20" : "#000000");
    shade.addColorStop(1, goal ? "#43a047" : "#3b2a1a");
    ctx.fillStyle = shade;
    ctx.beginPath();
    ctx.arc(h.x, h.y, r, 0, Math.PI * 2);
    ctx.fill();
    if (goal) {
        ctx.strokeStyle = "#a5d6a7";
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

function drawMarble() {
    let r = maze.radius;
    if (screen === "falling") {
        r *= Math.max(0, 1 - fallSteps / 25);   // it shrinks as it falls
    }
    if (r <= 0) {
        return;
    }
    // A shadow, then a shiny steel ball: light at the top left.
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.arc(marble.x + r * 0.25, marble.y + r * 0.3, r, 0, Math.PI * 2);
    ctx.fill();
    const shine = ctx.createRadialGradient(marble.x - r * 0.35, marble.y - r * 0.35, r * 0.1, marble.x, marble.y, r);
    shine.addColorStop(0, "#ffffff");
    shine.addColorStop(0.35, "#cfd8dc");
    shine.addColorStop(1, "#546e7a");
    ctx.fillStyle = shine;
    ctx.beginPath();
    ctx.arc(marble.x, marble.y, r, 0, Math.PI * 2);
    ctx.fill();
}

function draw() {
    // The wooden board.
    const wood = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    wood.addColorStop(0, "#e2b97f");
    wood.addColorStop(1, "#c8995e");
    ctx.fillStyle = wood;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    if (maze === null) {
        maze = makeMaze(1);
        marble = { x: maze.start.x, y: maze.start.y, vx: 0, vy: 0 };
    }

    maze.holes.forEach(function (h) { drawHole(h, false); });
    drawHole(maze.goal, true);

    // The walls, with a shadow to the bottom right, so they stand up.
    ctx.lineCap = "round";
    ctx.lineWidth = WALL;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.beginPath();
    maze.walls.forEach(function ([ax, ay, bx, by]) {
        ctx.moveTo(ax + 2, ay + 2);
        ctx.lineTo(bx + 2, by + 2);
    });
    ctx.stroke();
    ctx.strokeStyle = "#5d3a1a";
    ctx.beginPath();
    maze.walls.forEach(function ([ax, ay, bx, by]) {
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
    });
    ctx.stroke();

    drawMarble();

    // Level, time and falls, at the top.
    ctx.fillStyle = "#3b2a1a";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Level " + level, 10, 22);
    ctx.textAlign = "center";
    ctx.fillText(timeText(levelTime), WIDTH / 2, 22);
    ctx.textAlign = "right";
    ctx.fillText("Falls " + falls, WIDTH - 10, 22);

    if (screen === "menu" || screen === "levelDone") {
        ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "bold 32px Arial";
        ctx.fillText(screen === "menu" ? "Marble Maze" : "Level " + level + " done!", WIDTH / 2, HEIGHT / 2 - 10);
        ctx.font = "16px Arial";
        ctx.fillText(screen === "menu" ? "Tilt to roll the marble" : "Tap Next level", WIDTH / 2, HEIGHT / 2 + 22);
    }
}

// --- The loop ------------------------------------------------------------

let lastTime = performance.now();
let leftover = 0;

function gameLoop(now) {
    leftover += Math.min(now - lastTime, 250);
    lastTime = now;
    while (leftover >= STEP) {
        if (screen === "playing" || screen === "falling") {
            update();
        }
        leftover -= STEP;
    }
    draw();
    requestAnimationFrame(gameLoop);
}

// --- Buttons and keys ------------------------------------------------------

// Start: switch the sensor on, and use how the phone is held now as flat.
// While playing, the same button makes the current tilt flat again.
startButton.addEventListener("click", async function () {
    await startSensor();
    flat = sensor;   // null until the first reading: then onOrientation sets it
    if (screen === "menu") {
        startLevel(1);
    } else if (screen === "levelDone") {
        startLevel(level + 1);
    } else {
        message.textContent = "This is flat now.";
    }
});

document.addEventListener("keydown", function (event) {
    keys[event.key] = true;
    if (event.key === "Enter" && screen !== "playing" && screen !== "falling") {
        startButton.click();
    }
});

document.addEventListener("keyup", function (event) {
    keys[event.key] = false;
});

window.addEventListener("blur", function () {
    for (const key in keys) {
        keys[key] = false;
    }
});

// --- Start ---------------------------------------------------------------

requestAnimationFrame(gameLoop);
