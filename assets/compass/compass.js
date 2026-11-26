/*
 * Compass: the dial turns so that N always points north, and the gold marker
 * at the top shows which way the phone is pointing.
 *
 * Phones tell us where north is in two different ways:
 *   iPhone   event.webkitCompassHeading, degrees clockwise from north
 *   Android  the "deviceorientationabsolute" event, where event.alpha is
 *            degrees counterclockwise from north, so the heading is 360 - alpha
 *
 * State:
 *   heading      which way the phone points, smoothed, 0 to 360 (null before the first reading)
 *   started      true once the sensor has been switched on
 *   gotEvent     true when the sensor has sent anything
 *   gotReading   true when it has sent a heading we can use
 */

// --- Settings --------------------------------------------------------------

const SMOOTHING = 0.2;   // 1 = no smoothing, smaller = calmer but slower
const DIRECTIONS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

// --- State -----------------------------------------------------------------

let heading = null;
let started = false;
let gotEvent = false;
let gotReading = false;

// --- Elements on the page --------------------------------------------------

const dial = document.getElementById("dial");
const ticks = document.getElementById("ticks");
const headingText = document.getElementById("heading");
const directionText = document.getElementById("direction");
const message = document.getElementById("message");
const startButton = document.getElementById("button-start");

// --- The dial --------------------------------------------------------------

// Draw a tick every 10 degrees, a longer one and a number every 30.
// SVG elements must be made with createElementNS, not createElement.
const SVG = "http://www.w3.org/2000/svg";

function drawTicks() {
    for (let degrees = 0; degrees < 360; degrees += 10) {
        const big = degrees % 30 === 0;
        const line = document.createElementNS(SVG, "line");
        line.setAttribute("y1", -96);
        line.setAttribute("y2", big ? -82 : -88);
        line.setAttribute("class", big ? "tick tick-big" : "tick");
        line.setAttribute("transform", `rotate(${degrees})`);
        ticks.appendChild(line);

        // N, E, S and W already have letters.
        if (big && degrees % 90 !== 0) {
            const text = document.createElementNS(SVG, "text");
            text.setAttribute("class", "degrees");
            text.setAttribute("y", -72);
            text.setAttribute("transform", `rotate(${degrees})`);
            text.textContent = degrees;
            ticks.appendChild(text);
        }
    }
}

// --- Helpers ---------------------------------------------------------------

// The shortest way from one angle to another, from -180 to 180.
// From 350 to 10 is +20, not -340.
function angleDifference(from, to) {
    return ((to - from + 540) % 360) - 180;
}

// How far the screen has turned: 0, 90, 180 or 270.
function screenAngle() {
    return screen.orientation ? screen.orientation.angle : window.orientation || 0;
}

// 0 -> "N", 40 -> "NE", 350 -> "N"
function directionName(degrees) {
    return DIRECTIONS[Math.round(degrees / 45) % 8];
}

// --- Drawing ---------------------------------------------------------------

function draw() {
    // Turn the dial the other way, so N stays pointing north.
    dial.setAttribute("transform", `rotate(${-heading})`);
    const rounded = Math.round(heading) % 360;
    headingText.textContent = rounded + "°";
    directionText.textContent = directionName(rounded);
}

// --- The sensor ------------------------------------------------------------

function onOrientation(event) {
    gotEvent = true;
    let reading;
    if (typeof event.webkitCompassHeading === "number" && event.webkitCompassHeading >= 0) {
        reading = event.webkitCompassHeading;          // iPhone
    } else if (event.absolute && event.alpha !== null) {
        reading = 360 - event.alpha;                    // Android
    } else {
        return;   // only a tilt, no north
    }
    gotReading = true;

    // When the screen turns to landscape, the top of the screen is a side of the phone.
    reading = (reading + screenAngle()) % 360;

    if (heading === null) {
        heading = reading;
    } else {
        // Smoothing the short way round, so 359 -> 1 doesn't spin past 180.
        heading = (heading + angleDifference(heading, reading) * SMOOTHING + 360) % 360;
    }
    draw();
}

async function start() {
    if (started) {
        return;
    }
    if (!window.DeviceOrientationEvent) {
        message.textContent = "This browser has no compass. Open the page on a phone.";
        return;
    }
    // iPhone and iPad ask the user first, and only after a click.
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
        try {
            const answer = await DeviceOrientationEvent.requestPermission();
            if (answer !== "granted") {
                message.textContent = "No permission to read the compass.";
                return;
            }
        } catch (error) {
            message.textContent = "Could not ask for the compass: " + error.message;
            return;
        }
    }
    // Android sends the north-based angles in their own event.
    if ("ondeviceorientationabsolute" in window) {
        window.addEventListener("deviceorientationabsolute", onOrientation);
    } else {
        window.addEventListener("deviceorientation", onOrientation);
    }
    started = true;
    startButton.disabled = true;
    message.textContent = "Hold your phone flat, away from metal and magnets.";

    // A computer often has the event but no sensor, so nothing ever comes.
    setTimeout(function () {
        if (!gotEvent) {
            message.textContent = "No compass found. Open the page on a phone.";
        } else if (!gotReading) {
            message.textContent = "This device can tell its tilt, but not where north is.";
        }
    }, 2000);
}

// --- Start -----------------------------------------------------------------

startButton.addEventListener("click", start);
drawTicks();
