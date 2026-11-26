/*
 * Mini Golf: 20 holes. Drag back from anywhere on the course and let go to
 * putt, like a slingshot: the further you drag, the harder the putt. Get the
 * ball in the hole in as few strokes as you can.
 *
 *   drag and let go   putt (mouse or finger)
 *   P                 pause
 *   Esc               menu
 *
 * The holes are in levels.js. Everything the ball can hit is turned into
 * straight line segments, so one bounce function handles every wall.
 */

// --- Settings ------------------------------------------------------------

const STEP = 1000 / 60;        // one update step, in milliseconds
const SUBSTEPS = 4;            // the ball moves in 4 small steps, so it can't jump through a wall
const BALL_RADIUS = 8;
const HOLE_RADIUS = 12;
const WALL_HALF = 4;           // half the thickness of a drawn wall
const BLADE_HALF = 3;          // half the thickness of a windmill blade
const MAX_SPEED = 16;          // pixels a step at full power
const MAX_PULL = 150;          // drag this far for full power
const FRICTION = 0.985;        // speed kept each step on grass
const SAND_FRICTION = 0.92;    // ... and in sand
const STOP_SPEED = 0.05;       // slower than this and the ball stops
const SINK_SPEED = 6;          // faster than this and the ball rolls over the hole
const WALL_BOUNCE = 0.75;      // speed kept when bouncing off a wall
const BUMPER_BOUNCE = 1.15;    // bumpers give a little extra
const MAX_STROKES = 10;        // the hole ends after this many
const BEST_KEY = "mini-golf-best";

// --- Canvas --------------------------------------------------------------

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- State ---------------------------------------------------------------

let screen = "menu";   // menu, playing, paused, holeDone, finished
let gameStarted = false;

let holeIndex = 0;     // which hole, 0 to 19
let course = null;     // the hole, made ready by buildCourse()
let ball = { x: 0, y: 0, vx: 0, vy: 0 };
let lastSpot = { x: 0, y: 0 };   // where the last putt was from, for water
let strokes = 0;
let scores = [];       // strokes for every finished hole
let time = 0;          // steps since the hole started, for movers and windmills
let best = loadBest(); // the lowest total ever, or null

let dragging = false;
let dragStart = { x: 0, y: 0 };
let dragNow = { x: 0, y: 0 };

let notice = "";       // a short message, like "Splash!"
let noticeSteps = 0;   // how many more steps to show it

// --- Building a hole -------------------------------------------------------

// A segment is a straight line the ball bounces off. "half" is half its
// thickness, so the ball bounces off the edge of a thick wall, not its middle.
function segment(ax, ay, bx, by, half) {
    return { ax: ax, ay: ay, bx: bx, by: by, half: half };
}

// The four edges of a rectangle [left, top, right, bottom].
function rectSegments(rect, half) {
    const [left, top, right, bottom] = rect;
    return [
        segment(left, top, right, top, half),
        segment(right, top, right, bottom, half),
        segment(right, bottom, left, bottom, half),
        segment(left, bottom, left, top, half)
    ];
}

// Turn a hole from levels.js into everything the physics needs.
// || [] means "an empty list if the hole has none".
function buildCourse(level) {
    const segments = [];

    // The outline: from each corner to the next, and the last one back to the first.
    level.course.forEach(function (corner, i) {
        const next = level.course[(i + 1) % level.course.length];
        segments.push(segment(corner[0], corner[1], next[0], next[1], WALL_HALF));
    });
    (level.walls || []).forEach(function (w) {
        segments.push(segment(w[0], w[1], w[2], w[3], WALL_HALF));
    });
    (level.blocks || []).forEach(function (rect) {
        segments.push(...rectSegments(rect, 0));
    });

    return {
        level: level,
        segments: segments,
        bumpers: level.bumpers || [],
        sand: level.sand || [],
        water: level.water || [],
        movers: level.movers || [],
        windmills: level.windmills || []
    };
}

// --- Things that move ------------------------------------------------------

// A mover goes to and fro with Math.sin, which goes smoothly from -1 to 1 and back.
function moverOffset(mover, t) {
    return Math.sin(t * mover.speed + (mover.phase || 0)) * mover.range;
}

function moverRect(mover, t) {
    const offset = moverOffset(mover, t);
    const [left, top, right, bottom] = mover.rect;
    if (mover.axis === "x") {
        return [left + offset, top, right + offset, bottom];
    }
    return [left, top + offset, right, bottom + offset];
}

// How fast the mover goes: the change of sin is cos.
function moverVelocity(mover, t) {
    const speed = Math.cos(t * mover.speed + (mover.phase || 0)) * mover.range * mover.speed;
    return mover.axis === "x" ? { x: speed, y: 0 } : { x: 0, y: speed };
}

// The blades of a windmill: each one is a line right through the middle.
function bladeSegments(windmill, t) {
    const blades = [];
    for (let i = 0; i < windmill.blades; i++) {
        const angle = t * windmill.speed + i * Math.PI / windmill.blades;
        const dx = Math.cos(angle) * windmill.radius;
        const dy = Math.sin(angle) * windmill.radius;
        blades.push(segment(windmill.x - dx, windmill.y - dy, windmill.x + dx, windmill.y + dy, BLADE_HALF));
    }
    return blades;
}

// How fast a point on a turning blade moves: faster further out, at a
// right angle to the blade.
function bladeVelocity(windmill, x, y) {
    return { x: -windmill.speed * (y - windmill.y), y: windmill.speed * (x - windmill.x) };
}

// --- Bouncing ------------------------------------------------------------

function still() {
    return { x: 0, y: 0 };
}

// Bounce the ball off a segment. velocityAt(x, y) says how fast the wall
// moves at that point: still() for a wall that doesn't move.
function bounceOffSegment(ball, seg, velocityAt) {
    // The point on the segment closest to the ball. t is how far along it,
    // from 0 (the start) to 1 (the end).
    const abx = seg.bx - seg.ax;
    const aby = seg.by - seg.ay;
    const lengthSquared = abx * abx + aby * aby;
    let t = lengthSquared === 0 ? 0 : ((ball.x - seg.ax) * abx + (ball.y - seg.ay) * aby) / lengthSquared;
    t = Math.max(0, Math.min(1, t));
    const cx = seg.ax + abx * t;
    const cy = seg.ay + aby * t;

    const dx = ball.x - cx;
    const dy = ball.y - cy;
    const distance = Math.hypot(dx, dy);
    const minimum = BALL_RADIUS + seg.half;
    if (distance >= minimum || distance === 0) {
        return;
    }

    // nx, ny: one pixel long, pointing from the wall to the ball.
    const nx = dx / distance;
    const ny = dy / distance;

    // Move the ball out of the wall.
    ball.x = cx + nx * minimum;
    ball.y = cy + ny * minimum;

    // How fast the ball goes into the wall, compared to the wall itself.
    const wall = velocityAt(cx, cy);
    const into = (ball.vx - wall.x) * nx + (ball.vy - wall.y) * ny;
    if (into < 0) {
        // Take that part of the speed away, and give some of it back the other way.
        ball.vx -= (1 + WALL_BOUNCE) * into * nx;
        ball.vy -= (1 + WALL_BOUNCE) * into * ny;
    }
}

function bounceOffBumper(ball, bumper) {
    const [x, y, radius] = bumper;
    const dx = ball.x - x;
    const dy = ball.y - y;
    const distance = Math.hypot(dx, dy);
    const minimum = BALL_RADIUS + radius;
    if (distance >= minimum || distance === 0) {
        return;
    }
    const nx = dx / distance;
    const ny = dy / distance;
    ball.x = x + nx * minimum;
    ball.y = y + ny * minimum;
    const into = ball.vx * nx + ball.vy * ny;
    if (into < 0) {
        ball.vx -= (1 + BUMPER_BOUNCE) * into * nx;
        ball.vy -= (1 + BUMPER_BOUNCE) * into * ny;
    }
}

function inside(point, rect) {
    return point.x > rect[0] && point.x < rect[2] && point.y > rect[1] && point.y < rect[3];
}

function distanceToHole(ball, level) {
    return Math.hypot(ball.x - level.hole[0], ball.y - level.hole[1]);
}

// --- Rolling ---------------------------------------------------------------

// One step of the ball, about 1/60 of a second. Returns what happened:
//   "sunk"     the ball went in the hole
//   "water"    the ball went in the water
//   "stopped"  the ball just stopped
//   null       nothing special
// It doesn't use anything outside its arguments, so the same function can
// try out putts without playing them.
function rollStep(ball, course, t) {
    const level = course.level;

    for (let s = 0; s < SUBSTEPS; s++) {
        const now = t + s / SUBSTEPS;
        ball.x += ball.vx / SUBSTEPS;
        ball.y += ball.vy / SUBSTEPS;

        course.segments.forEach(function (seg) {
            bounceOffSegment(ball, seg, still);
        });
        course.movers.forEach(function (mover) {
            const velocity = moverVelocity(mover, now);
            rectSegments(moverRect(mover, now), 0).forEach(function (seg) {
                bounceOffSegment(ball, seg, function () { return velocity; });
            });
        });
        course.windmills.forEach(function (windmill) {
            bladeSegments(windmill, now).forEach(function (seg) {
                bounceOffSegment(ball, seg, function (x, y) { return bladeVelocity(windmill, x, y); });
            });
        });
        course.bumpers.forEach(function (bumper) {
            bounceOffBumper(ball, bumper);
        });

        if (course.water.some(function (rect) { return inside(ball, rect); })) {
            return "water";
        }
        // Too fast and the ball rolls right over the hole.
        if (distanceToHole(ball, level) < HOLE_RADIUS && Math.hypot(ball.vx, ball.vy) < SINK_SPEED) {
            return "sunk";
        }
    }

    const speed = Math.hypot(ball.vx, ball.vy);
    if (speed === 0) {
        return null;   // lying still
    }

    // Friction: keep a part of the speed, and take a little more away, so
    // the ball stops in the end instead of creeping on for ever.
    const inSand = course.sand.some(function (rect) { return inside(ball, rect); });
    let newSpeed = inSand ? speed * SAND_FRICTION - 0.08 : speed * FRICTION - 0.02;
    newSpeed = Math.min(newSpeed, MAX_SPEED);   // bumpers can't make it faster than a full putt

    if (newSpeed < STOP_SPEED) {
        ball.vx = 0;
        ball.vy = 0;
        // Stopped on the edge of the hole: it drops in.
        if (distanceToHole(ball, level) < HOLE_RADIUS + 3) {
            return "sunk";
        }
        return "stopped";
    }
    ball.vx *= newSpeed / speed;
    ball.vy *= newSpeed / speed;
    return null;
}

// --- The game --------------------------------------------------------------

function loadBest() {
    try {
        const saved = Number(localStorage.getItem(BEST_KEY));
        return saved > 0 ? saved : null;
    } catch (error) {
        return null;
    }
}

function saveBest(total) {
    best = total;
    try {
        localStorage.setItem(BEST_KEY, String(total));
    } catch (error) {
        // Not saved, but the game still works.
    }
}

function newGame() {
    scores = [];
    gameStarted = true;
    startHole(0);
}

function startHole(index) {
    holeIndex = index;
    course = buildCourse(LEVELS[index]);
    ball = { x: course.level.start[0], y: course.level.start[1], vx: 0, vy: 0 };
    lastSpot = { x: ball.x, y: ball.y };
    strokes = 0;
    time = 0;
    dragging = false;
    notice = "";
    screen = "playing";
}

function ballStill() {
    return ball.vx === 0 && ball.vy === 0;
}

// The putt from dragging: the opposite way of the drag, like a slingshot.
function puttFromDrag() {
    const pullX = dragStart.x - dragNow.x;
    const pullY = dragStart.y - dragNow.y;
    const pull = Math.hypot(pullX, pullY);
    return {
        dx: pull === 0 ? 0 : pullX / pull,
        dy: pull === 0 ? 0 : pullY / pull,
        power: Math.min(1, pull / MAX_PULL)
    };
}

function putt() {
    const shot = puttFromDrag();
    dragging = false;
    if (shot.power < 0.03) {
        return;   // a click, not a drag
    }
    lastSpot = { x: ball.x, y: ball.y };
    ball.vx = shot.dx * shot.power * MAX_SPEED;
    ball.vy = shot.dy * shot.power * MAX_SPEED;
    strokes++;
}

function showNotice(text) {
    notice = text;
    noticeSteps = 120;   // two seconds
}

function finishHole() {
    scores.push(Math.min(strokes, MAX_STROKES));
    dragging = false;
    if (holeIndex === LEVELS.length - 1) {
        const total = totalStrokes();
        if (best === null || total < best) {
            saveBest(total);
        }
        screen = "finished";
    } else {
        screen = "holeDone";
    }
}

function totalStrokes() {
    return scores.reduce(function (sum, s) { return sum + s; }, 0);
}

// Strokes compared to par for the holes played: -2 is two under par.
function totalToPar() {
    let par = 0;
    for (let i = 0; i < scores.length; i++) {
        par += LEVELS[i].par;
    }
    return totalStrokes() - par;
}

function toParText(n) {
    if (n === 0) {
        return "even";
    }
    return n > 0 ? "+" + n : String(n);
}

// The name of a score on one hole.
function scoreName(strokesTaken, par) {
    if (strokesTaken === 1) {
        return "Hole in one!";
    }
    const names = { "-3": "Albatross!", "-2": "Eagle!", "-1": "Birdie!", "0": "Par", "1": "Bogey", "2": "Double bogey" };
    return names[strokesTaken - par] || toParText(strokesTaken - par) + " over par";
}

// --- Update ----------------------------------------------------------------

function update() {
    time++;
    if (noticeSteps > 0) {
        noticeSteps--;
    }

    const wasStill = ballStill();
    const result = rollStep(ball, course, time);

    // A mover or a windmill hit the ball while you were aiming.
    if (wasStill && !ballStill()) {
        dragging = false;
    }

    if (result === "sunk") {
        finishHole();
    } else if (result === "water") {
        strokes++;
        ball = { x: lastSpot.x, y: lastSpot.y, vx: 0, vy: 0 };
        showNotice("Splash! One stroke penalty.");
        if (strokes >= MAX_STROKES) {
            finishHole();
        }
    } else if (result === "stopped" && strokes >= MAX_STROKES) {
        showNotice("That's " + MAX_STROKES + " strokes. On to the next hole.");
        finishHole();
    }
}

// --- Drawing ---------------------------------------------------------------

function drawText(text, x, y, size, color, align) {
    ctx.fillStyle = color || "white";
    ctx.font = size + "px Arial";
    ctx.textAlign = align || "center";
    ctx.fillText(text, x, y);
}

function rectPath(rect) {
    ctx.beginPath();
    ctx.rect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1]);
}

function drawCourse() {
    const level = course.level;

    // The ground around the course.
    ctx.fillStyle = "#1b5e20";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // The green, with stripes like a mowed lawn. clip() keeps the stripes
    // inside the outline.
    ctx.beginPath();
    level.course.forEach(function (corner, i) {
        if (i === 0) {
            ctx.moveTo(corner[0], corner[1]);
        } else {
            ctx.lineTo(corner[0], corner[1]);
        }
    });
    ctx.closePath();
    ctx.save();
    ctx.clip();
    for (let x = 0; x < WIDTH; x += 40) {
        ctx.fillStyle = (x / 40) % 2 === 0 ? "#66bb6a" : "#5cb860";
        ctx.fillRect(x, 0, 40, HEIGHT);
    }
    ctx.restore();

    course.sand.forEach(function (rect) {
        ctx.fillStyle = "#e8d5a0";
        rectPath(rect);
        ctx.fill();
    });

    course.water.forEach(function (rect) {
        ctx.fillStyle = "#3fa9e0";
        rectPath(rect);
        ctx.fill();
        // A few waves.
        ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
        ctx.lineWidth = 2;
        for (let y = rect[1] + 15; y < rect[3] - 5; y += 25) {
            for (let x = rect[0] + 10; x < rect[2] - 20; x += 40) {
                ctx.beginPath();
                ctx.arc(x + 6, y, 6, Math.PI * 1.1, Math.PI * 1.9);
                ctx.stroke();
            }
        }
    });

    // The tee, where the ball starts.
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(level.start[0] - 18, level.start[1] - 18, 36, 36);

    // The walls round the edge, and the thin walls.
    ctx.strokeStyle = "#8d6e63";
    ctx.lineWidth = WALL_HALF * 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    level.course.forEach(function (corner, i) {
        if (i === 0) {
            ctx.moveTo(corner[0], corner[1]);
        } else {
            ctx.lineTo(corner[0], corner[1]);
        }
    });
    ctx.closePath();
    ctx.stroke();
    (level.walls || []).forEach(function (w) {
        ctx.beginPath();
        ctx.moveTo(w[0], w[1]);
        ctx.lineTo(w[2], w[3]);
        ctx.stroke();
    });

    (level.blocks || []).forEach(function (rect) {
        ctx.fillStyle = "#8d6e63";
        rectPath(rect);
        ctx.fill();
    });

    course.bumpers.forEach(function (bumper) {
        ctx.beginPath();
        ctx.arc(bumper[0], bumper[1], bumper[2], 0, Math.PI * 2);
        ctx.fillStyle = "#e53935";
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = "white";
        ctx.beginPath();
        ctx.arc(bumper[0], bumper[1], bumper[2] * 0.6, 0, Math.PI * 2);
        ctx.stroke();
    });

    drawHole(level.hole);

    course.movers.forEach(function (mover) {
        ctx.fillStyle = "#ffb300";
        ctx.strokeStyle = "#6d4c41";
        ctx.lineWidth = 2;
        rectPath(moverRect(mover, time));
        ctx.fill();
        ctx.stroke();
    });

    course.windmills.forEach(function (windmill) {
        ctx.strokeStyle = "#eeeeee";
        ctx.lineWidth = BLADE_HALF * 2;
        bladeSegments(windmill, time).forEach(function (seg) {
            ctx.beginPath();
            ctx.moveTo(seg.ax, seg.ay);
            ctx.lineTo(seg.bx, seg.by);
            ctx.stroke();
        });
        ctx.beginPath();
        ctx.arc(windmill.x, windmill.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = "#6d4c41";
        ctx.fill();
    });
}

function drawHole(hole) {
    const [x, y] = hole;
    ctx.beginPath();
    ctx.arc(x, y, HOLE_RADIUS - 1, 0, Math.PI * 2);
    ctx.fillStyle = "#111111";
    ctx.fill();

    // The flag.
    ctx.strokeStyle = "#dddddd";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y - 38);
    ctx.stroke();
    ctx.fillStyle = "#e53935";
    ctx.beginPath();
    ctx.moveTo(x, y - 38);
    ctx.lineTo(x + 20, y - 32);
    ctx.lineTo(x, y - 26);
    ctx.fill();
}

function drawBall() {
    // A shadow, a little to the right and down.
    ctx.beginPath();
    ctx.arc(ball.x + 2, ball.y + 2, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
}

function drawAim() {
    if (!dragging) {
        return;
    }
    const shot = puttFromDrag();
    if (shot.power === 0) {
        return;
    }

    // From green (soft) to red (full power).
    const color = "hsl(" + Math.round(120 - 120 * shot.power) + ", 85%, 50%)";
    const length = 30 + 170 * shot.power;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(ball.x + shot.dx * length, ball.y + shot.dy * length);
    ctx.stroke();
    ctx.setLineDash([]);

    // The power bar.
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(20, HEIGHT - 26, 164, 16);
    ctx.fillStyle = color;
    ctx.fillRect(22, HEIGHT - 24, 160 * shot.power, 12);
}

function drawHud() {
    const level = course.level;
    const text = "Hole " + (holeIndex + 1) + "/" + LEVELS.length + ": " + level.name +
        "    Par " + level.par + "    Strokes " + strokes + "    Total " + toParText(totalToPar());
    drawText(text, 20, 26, 16, "white", "left");

    if (holeIndex === 0 && strokes === 0 && !dragging) {
        drawText("Drag back from anywhere and let go to putt", WIDTH / 2, HEIGHT - 12, 16);
    }
    if (noticeSteps > 0) {
        drawText(notice, WIDTH / 2, HEIGHT / 2, 26, "yellow");
    }
}

function drawMessage(title, lines) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    drawText(title, WIDTH / 2, HEIGHT / 2 - 50, 40, "yellow");
    lines.forEach(function (line, index) {
        drawText(line, WIDTH / 2, HEIGHT / 2 + index * 28, 18);
    });
}

// The scorecard: two rows of ten holes.
function drawScorecard() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const total = totalStrokes();
    drawText("Scorecard", WIDTH / 2, 50, 32, "yellow");

    const cell = 52;
    const left = (WIDTH - 70 - cell * 10) / 2;
    for (let half = 0; half < 2; half++) {
        const top = 85 + half * 110;
        drawText("Hole", left, top, 15, "#bbbbbb", "left");
        drawText("Par", left, top + 28, 15, "#bbbbbb", "left");
        drawText("You", left, top + 56, 15, "#bbbbbb", "left");
        for (let i = 0; i < 10; i++) {
            const hole = half * 10 + i;
            const x = left + 70 + i * cell + cell / 2;
            const par = LEVELS[hole].par;
            const yours = scores[hole];
            // Under par is green, over par is red.
            const color = yours < par ? "#7CFC00" : yours > par ? "#ff8a80" : "white";
            drawText(String(hole + 1), x, top, 15, "#bbbbbb");
            drawText(String(par), x, top + 28, 15);
            drawText(String(yours), x, top + 56, 15, color);
        }
    }

    drawText("Total: " + total + " strokes (" + toParText(totalToPar()) + ")", WIDTH / 2, 320, 22);
    drawText(total === best ? "That's your best!" : "Your best: " + best, WIDTH / 2, 348, 16, "#bbbbbb");
    drawText("Click or tap to play again", WIDTH / 2, 380, 16);
}

function draw() {
    if (course === null) {
        // Before the first game: show the first hole behind the menu.
        course = buildCourse(LEVELS[0]);
        ball = { x: course.level.start[0], y: course.level.start[1], vx: 0, vy: 0 };
    }
    drawCourse();
    drawBall();

    if (screen === "menu") {
        const lines = [
            "Drag back from anywhere and let go to putt.",
            "The further you drag, the harder the putt.",
            "20 holes. Click or tap to start."
        ];
        if (best !== null) {
            lines.push("Your best: " + best + " strokes");
        }
        if (gameStarted) {
            lines.push("Esc: back to the game");
        }
        drawMessage("Mini Golf", lines);
    } else if (screen === "playing") {
        drawAim();
        drawHud();
    } else if (screen === "paused") {
        drawMessage("Pause", ["Press P to go on"]);
    } else if (screen === "holeDone") {
        const taken = scores[scores.length - 1];
        drawMessage(scoreName(taken, course.level.par), [
            "Hole " + (holeIndex + 1) + " in " + taken + (taken === 1 ? " stroke" : " strokes") + ", par " + course.level.par,
            "Total " + toParText(totalToPar()),
            "Click or tap for the next hole"
        ]);
    } else if (screen === "finished") {
        drawScorecard();
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

// --- Mouse, finger and keyboard ------------------------------------------

// The canvas can be shown smaller than 800x400 on a small screen. Convert
// from position on the screen to position in the canvas. clientLeft and
// clientWidth leave out the border around the canvas.
function canvasPosition(event) {
    const box = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - box.left - canvas.clientLeft) * (WIDTH / canvas.clientWidth),
        y: (event.clientY - box.top - canvas.clientTop) * (HEIGHT / canvas.clientHeight)
    };
}

// Click, tap or Enter: go on from a message.
function goOn() {
    if (screen === "menu") {
        newGame();
    } else if (screen === "holeDone") {
        startHole(holeIndex + 1);
    } else if (screen === "finished") {
        newGame();
    }
}

// Pointer events work the same for a mouse, a finger and a pen.
canvas.addEventListener("pointerdown", function (event) {
    if (screen !== "playing") {
        goOn();
        return;
    }
    if (!ballStill()) {
        return;   // wait until the ball has stopped
    }
    // Keep getting the moves even when the finger leaves the canvas.
    try {
        canvas.setPointerCapture(event.pointerId);
    } catch (error) {
        // Some browsers say no; dragging still works inside the canvas.
    }
    dragging = true;
    dragStart = canvasPosition(event);
    dragNow = dragStart;
});

canvas.addEventListener("pointermove", function (event) {
    if (dragging) {
        dragNow = canvasPosition(event);
    }
});

canvas.addEventListener("pointerup", function () {
    if (dragging && screen === "playing" && ballStill()) {
        putt();
    }
    dragging = false;
});

canvas.addEventListener("pointercancel", function () {
    dragging = false;
});

document.addEventListener("keydown", function (event) {
    const key = event.key;

    if (key === "Enter") {
        goOn();
    } else if (key === "Escape") {
        if (screen === "playing" || screen === "paused") {
            screen = "menu";
        } else if (screen === "menu" && gameStarted) {
            screen = "playing";
        }
    } else if (key === "p" || key === "P") {
        if (screen === "playing") {
            screen = "paused";
        } else if (screen === "paused") {
            screen = "playing";
        }
    }
});

// --- Start ---------------------------------------------------------------

requestAnimationFrame(gameLoop);
