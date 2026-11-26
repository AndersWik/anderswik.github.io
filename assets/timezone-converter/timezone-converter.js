/*
 * Time Zone Converter: a date and time in one time zone, shown in another.
 *
 * A moment in time is kept as an "instant": milliseconds since
 * 1 January 1970 UTC, like Date.now(). The same instant is a different
 * wall clock time in every time zone. The browser's Intl.DateTimeFormat
 * knows every time zone's rules, also summer time, so we ask it:
 *
 *   instant -> wall time in a zone    Intl.DateTimeFormat with timeZone
 *   wall time in a zone -> instant    no ready function: see wallTimeToInstant()
 *
 * Time zones have names like "Europe/Stockholm" (the IANA names).
 */

// --- Settings --------------------------------------------------------------

const SAVE_KEY = "timezone-converter";
const DEFAULT_TO = "America/New_York";

// --- Elements on the page --------------------------------------------------

const whenInput = document.getElementById("when");
const fromInput = document.getElementById("from");
const toInput = document.getElementById("to");
const zoneList = document.getElementById("zones");
const nowButton = document.getElementById("now");
const swapButton = document.getElementById("swap");
const fromText = document.getElementById("from-text");
const toTimeText = document.getElementById("to-time");
const toDateText = document.getElementById("to-date");
const differenceText = document.getElementById("difference");
const noteText = document.getElementById("note");

// --- Time zones ------------------------------------------------------------

// The time zone the computer is set to, like "Europe/Stockholm".
function systemZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

// Every time zone the browser knows. Older browsers can't list them,
// so then we offer a few common ones.
function allZones() {
    if (typeof Intl.supportedValuesOf === "function") {
        return Intl.supportedValuesOf("timeZone");
    }
    return ["UTC", "Europe/London", "Europe/Stockholm", "Europe/Berlin", "America/New_York",
        "America/Chicago", "America/Los_Angeles", "Asia/Tokyo", "Asia/Kolkata", "Australia/Sydney"];
}

// Is this a time zone the browser knows? Intl.DateTimeFormat throws an
// error for a name it doesn't know, so we try it.
function isZone(name) {
    try {
        new Intl.DateTimeFormat("en", { timeZone: name });
        return name !== "";
    } catch (error) {
        return false;
    }
}

// "America/New_York" -> "New York"
function placeName(zone) {
    return zone.split("/").pop().replace(/_/g, " ");
}

// --- Wall time and instants ------------------------------------------------

// The wall clock time in a zone at an instant, as numbers.
// formatToParts gives the pieces one by one, so we don't have to read
// a text like "4/12/2026, 15:30" that looks different in every language.
function wallTime(zone, instant) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: zone,
        hourCycle: "h23",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
    }).formatToParts(new Date(instant));
    const get = function (type) {
        return Number(parts.find(function (part) { return part.type === type; }).value);
    };
    return {
        year: get("year"), month: get("month"), day: get("day"),
        hour: get("hour"), minute: get("minute"), second: get("second")
    };
}

// How many minutes the zone is ahead of UTC at an instant: 60 for
// Stockholm in winter, 120 in summer, -300 for New York in winter.
// The trick: read the wall time as if it were UTC, and compare.
function offsetMinutes(zone, instant) {
    const w = wallTime(zone, instant);
    const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second);
    const wholeSeconds = Math.floor(instant / 1000) * 1000;
    return Math.round((asUtc - wholeSeconds) / 60000);
}

// The instant when the wall clock in a zone shows this time. There is no
// ready function for this, so we guess and correct:
//   1. Pretend the time is UTC. That is wrong by the zone's offset.
//   2. Take away the offset at that guess.
//   3. Near a summer time change the offset at the guess can be the
//      wrong one, so take away the offset at the new instant instead.
function wallTimeToInstant(w, zone) {
    const guess = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
    const first = guess - offsetMinutes(zone, guess) * 60000;
    return guess - offsetMinutes(zone, first) * 60000;
}

// --- Text ----------------------------------------------------------------

function twoDigits(n) {
    return String(n).padStart(2, "0");
}

// 90 -> "UTC+01:30", -300 -> "UTC-05:00", 0 -> "UTC"
function offsetText(minutes) {
    if (minutes === 0) {
        return "UTC";
    }
    const sign = minutes > 0 ? "+" : "-";
    const m = Math.abs(minutes);
    return "UTC" + sign + twoDigits(Math.floor(m / 60)) + ":" + twoDigits(m % 60);
}

// 330 -> "5 hours 30 minutes"
function durationText(minutes) {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    const parts = [];
    if (hours > 0) {
        parts.push(hours + (hours === 1 ? " hour" : " hours"));
    }
    if (rest > 0) {
        parts.push(rest + " minutes");
    }
    return parts.join(" ");
}

// The value a datetime-local input wants: "2026-12-24T15:00".
function inputValue(w) {
    return w.year + "-" + twoDigits(w.month) + "-" + twoDigits(w.day) +
        "T" + twoDigits(w.hour) + ":" + twoDigits(w.minute);
}

// "2026-12-24T15:00" -> numbers. null if the box is empty or half filled in.
function readInput(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
    if (!match) {
        return null;
    }
    return {
        year: Number(match[1]), month: Number(match[2]), day: Number(match[3]),
        hour: Number(match[4]), minute: Number(match[5])
    };
}

// The time and the date in the browser's own language and way of writing.
function formatTime(instant, zone) {
    return new Intl.DateTimeFormat(undefined, { timeZone: zone, timeStyle: "short" }).format(instant);
}

function formatDate(instant, zone) {
    return new Intl.DateTimeFormat(undefined, { timeZone: zone, dateStyle: "full" }).format(instant);
}

// --- Converting --------------------------------------------------------------

function convert() {
    const from = fromInput.value.trim();
    const to = toInput.value.trim();
    const w = readInput(whenInput.value);

    // A red box for a time zone the browser doesn't know.
    fromInput.classList.toggle("is-invalid", !isZone(from));
    toInput.classList.toggle("is-invalid", !isZone(to));
    if (!isZone(from) || !isZone(to) || w === null) {
        toTimeText.textContent = "--:--";
        toDateText.textContent = "";
        fromText.textContent = "";
        differenceText.textContent = w === null ? "Choose a date and time." : "Choose a time zone from the list.";
        noteText.hidden = true;
        return;
    }
    save(from, to);

    const instant = wallTimeToInstant(w, from);
    const fromOffset = offsetMinutes(from, instant);
    const toOffset = offsetMinutes(to, instant);

    fromText.textContent = formatTime(instant, from) + " in " + placeName(from) + " (" + offsetText(fromOffset) + ") is";
    toTimeText.textContent = formatTime(instant, to);
    toDateText.textContent = formatDate(instant, to) + " in " + placeName(to) + " (" + offsetText(toOffset) + ")";

    // How far ahead or behind, and if it is another day there.
    const ahead = toOffset - fromOffset;
    if (ahead === 0) {
        differenceText.textContent = "The same time in both places.";
    } else {
        differenceText.textContent = placeName(to) + " is " + durationText(Math.abs(ahead)) +
            (ahead > 0 ? " ahead of " : " behind ") + placeName(from) + ".";
    }
    const fromDay = wallTime(from, instant);
    const toDay = wallTime(to, instant);
    const dayChange = Math.round((Date.UTC(toDay.year, toDay.month - 1, toDay.day) -
        Date.UTC(fromDay.year, fromDay.month - 1, fromDay.day)) / 86400000);
    if (dayChange === 1) {
        differenceText.textContent += " It is the next day there.";
    } else if (dayChange === -1) {
        differenceText.textContent += " It is the day before there.";
    }

    // When the clocks jump forward for summer time, an hour is skipped.
    // A time in that hour doesn't exist, and the instant we found shows
    // another time on the clock.
    if (fromDay.hour !== w.hour || fromDay.minute !== w.minute) {
        noteText.textContent = inputValue(w).replace("T", " ") + " doesn't exist in " + placeName(from) +
            ": the clocks jump forward that night. It is shown as " + formatTime(instant, from) + ".";
        noteText.hidden = false;
    } else {
        noteText.hidden = true;
    }
}

// --- Buttons -----------------------------------------------------------------

// The time now, as the wall clock shows it in the "from" zone.
function setNow() {
    const zone = isZone(fromInput.value.trim()) ? fromInput.value.trim() : systemZone();
    whenInput.value = inputValue(wallTime(zone, Date.now()));
    convert();
}

function swap() {
    const from = fromInput.value;
    fromInput.value = toInput.value;
    toInput.value = from;
    convert();
}

// --- Saving ----------------------------------------------------------------

function save(from, to) {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({ from: from, to: to }));
    } catch (error) {
        // Not saved, but the converter still works.
    }
}

function load() {
    try {
        return JSON.parse(localStorage.getItem(SAVE_KEY)) || {};
    } catch (error) {
        return {};
    }
}

// --- Start -----------------------------------------------------------------

// Fill the list the inputs suggest from as you type.
allZones().forEach(function (zone) {
    const option = document.createElement("option");
    option.value = zone;
    zoneList.appendChild(option);
});

const saved = load();
fromInput.value = isZone(saved.from) ? saved.from : systemZone();
toInput.value = isZone(saved.to) ? saved.to : DEFAULT_TO;

whenInput.addEventListener("input", convert);
fromInput.addEventListener("input", convert);
toInput.addEventListener("input", convert);
nowButton.addEventListener("click", setNow);
swapButton.addEventListener("click", swap);

setNow();
