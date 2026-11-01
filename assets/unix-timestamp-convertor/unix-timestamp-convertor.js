/*
 * Unix timestamp converter: seconds, milliseconds, date/time and ISO 8601.
 *
 * The trick: turn every value into milliseconds since 1970-01-01 00:00:00 UTC
 * first (that is what JavaScript's Date uses), then from milliseconds into
 * the format we want. That way we need one rule per format instead of one
 * rule for every pair of formats.
 *
 *   Unix timestamp (seconds)      = milliseconds / 1000
 *   Unix timestamp (milliseconds) = milliseconds
 *   Date/Time                     = "2026-11-01 12:00:00" in the chosen time zone
 *   ISO 8601                      = "2026-11-01T11:00:00.000Z", always UTC
 *
 * You can type in either field; the other one is updated.
 */

// --- Elements on the page ------------------------------------------------

const leftFormat = document.getElementById("input-select");
const leftValue = document.getElementById("input-field");
const rightFormat = document.getElementById("output-select");
const rightValue = document.getElementById("output-field");
const zoneSelect = document.getElementById("zone-select");
const localOption = document.getElementById("local-option");
const details = document.getElementById("details");
const nowSeconds = document.getElementById("now-seconds");
const nowButton = document.getElementById("now-button");

// --- Helpers -------------------------------------------------------------

function useUtc() {
    return zoneSelect.value === "utc";
}

// 7 -> "07"
function pad(number) {
    return String(number).padStart(2, "0");
}

// Read "YYYY-MM-DD", "YYYY-MM-DD HH:MM" or "YYYY-MM-DD HH:MM:SS"
// in the chosen time zone. Returns milliseconds, or NaN if it can't be read.
function parseDateTime(text) {
    const match = text.match(
        /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
    );

    if (!match) {
        // Let the browser have a go at other formats, e.g. "Nov 1 2026 12:00"
        return Date.parse(text);
    }

    // Missing time parts become 0; months in JavaScript start at 0
    const [year, month, day, hour, minute, second] = match
        .slice(1)
        .map((part) => Number(part || 0));

    if (useUtc()) {
        return Date.UTC(year, month - 1, day, hour, minute, second);
    }
    return new Date(year, month - 1, day, hour, minute, second).getTime();
}

function toMilliseconds(text, format) {
    switch (format) {
        case "seconds":
            return Number(text) * 1000;
        case "milliseconds":
            return Number(text);
        case "datetime":
            return parseDateTime(text);
        case "iso":
            return Date.parse(text);
    }
}

function fromMilliseconds(ms, format) {
    const date = new Date(ms);

    switch (format) {
        case "seconds":
            return String(Math.floor(ms / 1000));
        case "milliseconds":
            return String(ms);
        case "datetime":
            if (useUtc()) {
                return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
                    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
            }
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
                `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
        case "iso":
            return date.toISOString();
    }
}

// "3 hours ago", "in 2 days"...
function relativeTime(ms) {
    const units = [
        ["year", 31556926],
        ["month", 2629743],
        ["week", 604800],
        ["day", 86400],
        ["hour", 3600],
        ["minute", 60],
        ["second", 1],
    ];
    const seconds = Math.round((ms - Date.now()) / 1000);
    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size || unit === "second") {
            return formatter.format(Math.round(seconds / size), unit);
        }
    }
}

// A friendly description under the time zone, e.g.
// "Sunday, 1 November 2026 at 12:00:00 CET (in 3 hours)"
function describe(ms) {
    const text = new Date(ms).toLocaleString("en-GB", {
        dateStyle: "full",
        timeStyle: "long",
        timeZone: useUtc() ? "UTC" : undefined,
    });
    return `${text} (${relativeTime(ms)})`;
}

// Read the value in one field, convert it, and write it into the other.
function update(fromValue, fromFormat, toValue, toFormat) {
    const text = fromValue.value.trim();
    const ms = toMilliseconds(text, fromFormat.value);

    // new Date() only handles about ±275 000 years around 1970
    if (text === "" || isNaN(ms) || isNaN(new Date(ms).getTime())) {
        toValue.value = "";
        details.textContent = text === "" ? "–" : "Can't read that value";
        return;
    }

    toValue.value = fromMilliseconds(ms, toFormat.value);
    details.textContent = describe(ms);
}

function updateRight() {
    update(leftValue, leftFormat, rightValue, rightFormat);
}

function updateLeft() {
    update(rightValue, rightFormat, leftValue, leftFormat);
}

// Show the current timestamp, updated every second.
function tick() {
    nowSeconds.textContent = Math.floor(Date.now() / 1000);
}

// --- Connect the page ----------------------------------------------------

// Show which time zone "Local" is, e.g. "Local (Europe/Stockholm)"
localOption.textContent = `Local (${Intl.DateTimeFormat().resolvedOptions().timeZone})`;

// "input" fires on every change: typing, pasting, deleting...
leftValue.addEventListener("input", updateRight);
rightValue.addEventListener("input", updateLeft);

// Changing a format or the time zone keeps the left value and recalculates the right.
leftFormat.addEventListener("change", updateRight);
rightFormat.addEventListener("change", updateRight);
zoneSelect.addEventListener("change", updateRight);

// Fill the left field with the current time in its format.
nowButton.addEventListener("click", () => {
    leftValue.value = fromMilliseconds(Date.now(), leftFormat.value);
    updateRight();
});

tick();
setInterval(tick, 1000);
