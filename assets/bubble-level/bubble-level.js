/*
 * Bubble level: lay the phone on a surface and the bubble shows which way it
 * tilts. The bubble floats to the high side, like the air bubble in a real level.
 *
 * The phone tells us how it is tilted with the "deviceorientation" event:
 *   beta   tilt front to back, in degrees (positive when the top edge is up)
 *   gamma  tilt left to right, in degrees (positive when the right edge is down)
 *
 * State:
 *   tiltX, tiltY    the tilt, smoothed, in degrees
 *   offsetX/Y       the tilt saved by Calibrate, subtracted from every reading
 *   started         true once the sensor has been switched on
 *   wasLevel        true if the last reading was level, so we only buzz once
 */

// --- Settings --------------------------------------------------------------

const MAX_ANGLE = 10;     // the bubble touches the edge at this many degrees
const LEVEL_ANGLE = 0.5;  // closer to flat than this counts as level
const SMOOTHING = 0.2;    // 1 = no smoothing, smaller = calmer but slower
const STORAGE_KEY = "bubble-level-offset";

// --- State -----------------------------------------------------------------

let tiltX = 0;
let tiltY = 0;
let offsetX = 0;
let offsetY = 0;
let started = false;
let wasLevel = false;
let gotReading = false;

// --- Elements on the page --------------------------------------------------

const vial = document.getElementById("vial");
const bubble = document.getElementById("bubble");
const angleXText = document.getElementById("angle-x");
const angleYText = document.getElementById("angle-y");
const message = document.getElementById("message");
const startButton = document.getElementById("button-start");
const calibrateButton = document.getElementById("button-calibrate");
const resetButton = document.getElementById("button-reset");

// --- Helpers ---------------------------------------------------------------

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

// Turn the phone's tilt into the tilt on the screen. When the screen turns
// to landscape, the phone's left-right is the screen's up-down.
function toScreen(x, y) {
    const angle = (screen.orientation ? screen.orientation.angle : window.orientation || 0) * Math.PI / 180;
    return {
        x: x * Math.cos(angle) + y * Math.sin(angle),
        y: -x * Math.sin(angle) + y * Math.cos(angle)
    };
}

// --- Drawing ---------------------------------------------------------------

function draw() {
    const x = tiltX - offsetX;
    const y = tiltY - offsetY;
    const tilt = toScreen(x, y);

    // The bubble goes to the high side: the other way from the tilt.
    let bx = -tilt.x / MAX_ANGLE;
    let by = -tilt.y / MAX_ANGLE;

    // Keep the bubble inside the circle: if it is too far out, scale it back.
    const distance = Math.hypot(bx, by);
    if (distance > 1) {
        bx = bx / distance;
        by = by / distance;
    }

    const room = (vial.clientWidth - bubble.offsetWidth) / 2;
    bubble.style.transform = `translate(${bx * room}px, ${by * room}px)`;

    angleXText.textContent = tilt.x.toFixed(1) + "°";
    angleYText.textContent = tilt.y.toFixed(1) + "°";

    const level = Math.abs(tilt.x) < LEVEL_ANGLE && Math.abs(tilt.y) < LEVEL_ANGLE;
    vial.classList.toggle("level", level);
    if (level && !wasLevel && navigator.vibrate) {
        navigator.vibrate(40);
    }
    wasLevel = level;
}

// --- The sensor ------------------------------------------------------------

function onOrientation(event) {
    if (event.beta === null || event.gamma === null) {
        return;
    }
    gotReading = true;
    // Smoothing: move only part of the way to the new reading, so the
    // bubble doesn't shake. tilt = tilt + (new - tilt) * 0.2
    tiltX = tiltX + (event.gamma - tiltX) * SMOOTHING;
    tiltY = tiltY + (event.beta - tiltY) * SMOOTHING;
    draw();
}

async function start() {
    if (started) {
        return;
    }
    if (!window.DeviceOrientationEvent) {
        message.textContent = "This browser has no tilt sensor. Open the page on a phone.";
        return;
    }
    // iPhone and iPad ask the user first, and only after a click.
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
            const answer = await DeviceOrientationEvent.requestPermission();
            if (answer !== "granted") {
                message.textContent = "No permission to read the tilt sensor.";
                return;
            }
        } catch (error) {
            message.textContent = "Could not ask for the tilt sensor: " + error.message;
            return;
        }
    }
    window.addEventListener("deviceorientation", onOrientation);
    started = true;
    startButton.disabled = true;
    message.textContent = "Lay your phone on a surface.";

    // A computer often has the event but no sensor, so nothing ever comes.
    setTimeout(function () {
        if (!gotReading) {
            message.textContent = "No tilt sensor found. Open the page on a phone.";
        }
    }, 2000);
}

// --- Calibration -----------------------------------------------------------

// Save the current tilt as "flat". Good for a phone with a camera bump,
// or a table you know is level.
function calibrate() {
    offsetX = tiltX;
    offsetY = tiltY;
    saveOffset();
    draw();
}

function reset() {
    offsetX = 0;
    offsetY = 0;
    saveOffset();
    draw();
}

// localStorage can throw, for example in a private window, so we try.
function saveOffset() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ x: offsetX, y: offsetY }));
    } catch (error) {
        // Not saved, but the level still works.
    }
}

function loadOffset() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved) {
            offsetX = saved.x;
            offsetY = saved.y;
        }
    } catch (error) {
        // Nothing saved, start from 0.
    }
}

// --- Connect the buttons ---------------------------------------------------

startButton.addEventListener("click", start);
calibrateButton.addEventListener("click", calibrate);
resetButton.addEventListener("click", reset);

loadOffset();
