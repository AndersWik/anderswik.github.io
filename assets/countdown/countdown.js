/*
 * Countdown to a date given in the page address, e.g.
 *
 *   ?to=2026-12-24T15:00:00&title=Christmas&url=https://.../tree.jpg
 *
 * A plain HTML form with method="get" on the page writes the address for us.
 *
 *   to     the date and time to count down to (required)
 *   title  text shown as the heading (optional)
 *   url    an image to show when the countdown is done (optional)
 *
 * Every second we work out how long is left and split it into
 * days, hours, minutes and seconds.
 */

// --- Elements on the page ------------------------------------------------

const titleText = document.getElementById("countdown-title");
const daysText = document.getElementById("output-days");
const hoursText = document.getElementById("output-hours");
const minutesText = document.getElementById("output-minutes");
const secondsText = document.getElementById("output-seconds");
const imageContainer = document.getElementById("image-container");

// --- Settings from the address -------------------------------------------

// URLSearchParams reads the "?to=...&title=..." part of the address.
const params = new URLSearchParams(window.location.search);
const endDate = new Date(params.get("to"));
const imageUrl = params.get("url");

// --- State ---------------------------------------------------------------

let timer = null;

// --- Helpers -------------------------------------------------------------

// 7 -> "07"
function twoDigits(number) {
    return String(number).padStart(2, "0");
}

// new Date("not a date") gives an "Invalid Date" whose time is NaN.
function isValidDate(date) {
    return !isNaN(date.getTime());
}

// --- Actions -------------------------------------------------------------

function showTimeLeft(totalSeconds) {
    const days = Math.floor(totalSeconds / (24 * 60 * 60));
    const hours = Math.floor(totalSeconds / (60 * 60)) % 24;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const seconds = totalSeconds % 60;

    daysText.textContent = twoDigits(days);
    hoursText.textContent = twoDigits(hours);
    minutesText.textContent = twoDigits(minutes);
    secondsText.textContent = twoDigits(seconds);
}

function finish() {
    clearInterval(timer);

    // The "blink" class has a CSS animation.
    [daysText, hoursText, minutesText, secondsText].forEach(function (element) {
        element.classList.add("blink");
    });

    if (imageUrl) {
        const image = document.createElement("img");
        image.src = imageUrl;
        image.style.width = "100%";
        imageContainer.appendChild(image);
    }
}

// Called once every second.
function tick() {
    // Subtracting two dates gives the difference in milliseconds.
    const secondsLeft = Math.ceil((endDate - new Date()) / 1000);

    if (secondsLeft <= 0) {
        showTimeLeft(0);
        finish();
    } else {
        showTimeLeft(secondsLeft);
    }
}

// --- Start ---------------------------------------------------------------

// get() gives null when it is missing and "" when the form field was empty.
if (params.get("title")) {
    // textContent (not innerHTML) so nobody can put HTML or scripts
    // into the page through the address.
    titleText.textContent = params.get("title");
}

// Without "to" in the address, new Date(null) is 1970-01-01, which is a
// valid date. So check that there is a "to" as well.
if (params.get("to") && isValidDate(endDate)) {
    timer = setInterval(tick, 1000);
    tick(); // show the time right away instead of after one second
} else {
    titleText.textContent = "Add a date to the address, e.g. ?to=1999-12-31T23:59:00";
}
