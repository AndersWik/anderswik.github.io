/*
 * Data size converter: bit, byte, KB, MB, GB and TB.
 *
 * The trick: turn every value into bits first, then from bits into the
 * unit we want. That way we need one rule per unit instead of one rule
 * for every pair of units.
 *
 *   1 byte = 8 bits
 *   1 KB   = 1000 bytes (decimal) or 1024 bytes (binary)
 *   1 MB   = 1000 KB or 1024 KB, and so on.
 *
 * You can type in either field; the other one is updated.
 */

// --- Elements on the page ------------------------------------------------

const leftUnit = document.getElementById("input-select");
const leftValue = document.getElementById("input-field");
const rightUnit = document.getElementById("output-select");
const rightValue = document.getElementById("output-field");
const baseSelect = document.getElementById("base-select");

// --- Helpers -------------------------------------------------------------

// How many times we multiply by 1000 (or 1024) to get from bytes to the unit.
const steps = {
    byte: 0,
    KB: 1,
    MB: 2,
    GB: 3,
    TB: 4
};

// How many bits there are in one of the unit, e.g. "KB" -> 8000.
function bitsIn(unit) {
    if (unit === "bit") {
        return 1;
    }
    const base = baseSelect.value === "binary" ? 1024 : 1000;
    return 8 * base ** steps[unit];  // "**" means "to the power of"
}

function convert(value, fromUnit, toUnit) {
    const bits = value * bitsIn(fromUnit);
    return bits / bitsIn(toUnit);
}

// Hide floating point noise like 0.30000000000000004,
// but keep very small and very large numbers.
function tidy(number) {
    return Number(number.toPrecision(12));
}

// Read the value in one field, convert it, and write it into the other.
function update(fromValue, fromUnit, toValue, toUnit) {
    const value = Number(fromValue.value);

    if (fromValue.value === "" || isNaN(value)) {
        toValue.value = "";
        return;
    }

    toValue.value = tidy(convert(value, fromUnit.value, toUnit.value));
}

function updateRight() {
    update(leftValue, leftUnit, rightValue, rightUnit);
}

function updateLeft() {
    update(rightValue, rightUnit, leftValue, leftUnit);
}

// --- Connect the page ----------------------------------------------------

// "input" fires on every change: typing, pasting, deleting...
leftValue.addEventListener("input", updateRight);
rightValue.addEventListener("input", updateLeft);

// Changing a unit or the base keeps the left value and recalculates the right.
leftUnit.addEventListener("change", updateRight);
rightUnit.addEventListener("change", updateRight);
baseSelect.addEventListener("change", updateRight);
