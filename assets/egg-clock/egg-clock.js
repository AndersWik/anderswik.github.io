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
let audio = null;   // made on the first Start, see beep()

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

// Make a short beep with the Web Audio API, so we need no sound file.
// An oscillator makes a tone; 880 is the pitch in hertz (a high A).
function beep() {
    const tone = audio.createOscillator();
    tone.frequency.value = 880;
    tone.connect(audio.destination);       // to the speakers
    tone.start();
    tone.stop(audio.currentTime + 0.3);    // 0.3 seconds long
}

// --- Actions -------------------------------------------------------------

// Add (positive) or remove (negative) time, but stay within 0 and one hour.
function changeTime(seconds) {
    secondsLeft = Math.min(MAX_SECONDS, Math.max(0, secondsLeft + seconds));
    showTime();
}

// Called once every second while the clock runs.
function tick() {
    if (secondsLeft > 0) {
        secondsLeft = secondsLeft - 1;
        showTime();
    }
    // Also true if the time was set to 0 with the buttons while running.
    if (secondsLeft === 0) {
        clearInterval(timer);
        timer = null;
        beep();
        beeper = setInterval(beep, 1000);
    }
}

function start() {
    // Browsers only allow sound after the user has clicked something,
    // so the audio is made here and not when the page loads.
    if (audio === null) {
        audio = new AudioContext();
    }
    // Don't start twice (the clock would run at double speed),
    // and there is nothing to count down from 0.
    if (timer !== null || secondsLeft === 0) {
        return;
    }
    // Stop a beep that is still going from the last time.
    clearInterval(beeper);
    beeper = null;
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
