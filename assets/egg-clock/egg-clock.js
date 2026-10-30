/*
 * Egg clock: count down from a chosen time and beep when it reaches zero.
 *
 * State:
 *   secondsLeft  how much time is left, in seconds
 *   timer        the running countdown (null when stopped)
 *   beeper       the repeating beep (null when quiet)
 *
 * setInterval(fn, 1000) calls fn once every second until clearInterval()
 * stops it. It returns an id that we keep so we can stop it later.
 */

// --- State ---------------------------------------------------------------

let secondsLeft = 0;
let timer = null;
let beeper = null;

const MAX_SECONDS = 60 * 60; // one hour

// --- Elements on the page ------------------------------------------------

const minutesText = document.getElementById("output-minutes");
const secondsText = document.getElementById("output-seconds");
const startButton = document.getElementById("button-start");
const stopButton = document.getElementById("button-stop");
const addMinuteButton = document.getElementById("increase-minutes");
const removeMinuteButton = document.getElementById("decrease-minutes");
const addSecondButton = document.getElementById("increase-seconds");
const removeSecondButton = document.getElementById("decrease-seconds");
const beepSound = document.getElementById("beep-sound");

// --- Helpers -------------------------------------------------------------

// 7 -> "07"
function twoDigits(number) {
    return String(number).padStart(2, "0");
}

// 125 seconds -> "02" minutes and "05" seconds
function showTime() {
    minutesText.textContent = twoDigits(Math.floor(secondsLeft / 60));
    secondsText.textContent = twoDigits(secondsLeft % 60);
}

function beep() {
    beepSound.currentTime = 0; // rewind, in case it is still playing
    beepSound.play();
}

// --- Actions -------------------------------------------------------------

// Add (positive) or remove (negative) time, but stay within 0 and one hour.
function changeTime(seconds) {
    const newTime = secondsLeft + seconds;

    if (newTime >= 0 && newTime <= MAX_SECONDS) {
        secondsLeft = newTime;
        showTime();
    }
}

// Called once every second while the clock runs.
function tick() {
    secondsLeft = secondsLeft - 1;
    showTime();

    if (secondsLeft === 0) {
        clearInterval(timer);
        timer = null;
        beep();
        beeper = setInterval(beep, 1000);
    }
}

function start() {
    // Don't start twice (the clock would run at double speed),
    // and there is nothing to count down from 0.
    if (timer !== null || secondsLeft === 0) {
        return;
    }
    timer = setInterval(tick, 1000);
}

// Pause the countdown and stop any beeping.
function stop() {
    clearInterval(timer);
    clearInterval(beeper);
    timer = null;
    beeper = null;
}

// --- Connect the buttons -------------------------------------------------

startButton.addEventListener("click", start);
stopButton.addEventListener("click", stop);

addMinuteButton.addEventListener("click", function () { changeTime(60); });
removeMinuteButton.addEventListener("click", function () { changeTime(-60); });
addSecondButton.addEventListener("click", function () { changeTime(1); });
removeSecondButton.addEventListener("click", function () { changeTime(-1); });
