/*
 * Color Hex: pick a color with sliders and see it in different formats.
 *
 * A screen color is made of red, green and blue light, each 0-255.
 * The same color can be written in different ways:
 *
 *   rgb(255, 136, 0)          three numbers
 *   #ff8800                   the same three numbers in hexadecimal
 *   rgba(255, 136, 0, 0.5)    plus alpha: how see-through it is (0-1)
 *
 * The sliders on the page are the "state": every time one moves we read
 * them all and redraw everything from scratch (the render function).
 *
 * Lighter/darker/favorite colors are links like <a href="#ff8800">.
 * Clicking one changes the "#..." part of the page address, and we
 * listen for that change to load the color.
 */

// --- Elements on the page ------------------------------------------------

const redSlider = document.getElementById("red");
const greenSlider = document.getElementById("green");
const blueSlider = document.getElementById("blue");
const alphaSlider = document.getElementById("alpha");
const hexInput = document.getElementById("hex");

const rgbPanel = document.getElementById("color-panel-rgb");
const rgbText = document.getElementById("color-panel-text-rgb");
const rgbaPanel = document.getElementById("color-panel-rgba");
const rgbaText = document.getElementById("color-panel-text-rgba");
const hexPanel = document.getElementById("color-panel-hex");
const hexText = document.getElementById("color-panel-text-hex");
const invertedPanel = document.getElementById("color-panel-inverted");
const invertedText = document.getElementById("color-panel-text-inverted");

const lighterList = document.getElementById("lighter-color-container");
const darkerList = document.getElementById("darker-color-container");
const favoriteList = document.getElementById("favorite-color-container");

const favorites = ["#afc0bc", "#7c878f", "#253746", "#8db9ca", "#ca9a8e",
                   "#d9c89e", "#899064", "#6ba4b8", "#d9d9d6", "#caffca"];

// --- Color helpers -------------------------------------------------------
// A color is an object like { red: 255, green: 136, blue: 0 }.

// Keep a value inside 0-255 and make it a whole number.
function clamp(value) {
    return Math.min(255, Math.max(0, Math.round(value)));
}

// { red: 255, green: 136, blue: 0 } -> "#ff8800"
function toHex(color) {
    const parts = [color.red, color.green, color.blue].map(function (value) {
        return clamp(value).toString(16).padStart(2, "0");
    });
    return "#" + parts.join("");
}

// "#ff8800" -> { red: 255, green: 136, blue: 0 }, or null if not valid.
function fromHex(hex) {
    hex = hex.replace("#", "");

    if (!/^[0-9a-f]{6}$/i.test(hex)) {
        return null;
    }
    return {
        red: parseInt(hex.slice(0, 2), 16),
        green: parseInt(hex.slice(2, 4), 16),
        blue: parseInt(hex.slice(4, 6), 16)
    };
}

// A see-through color on a white page looks like a lighter solid color.
// Mix each part with white (255) depending on alpha.
function onWhite(color, alpha) {
    function mix(value) {
        return clamp(alpha * value + (1 - alpha) * 255);
    }
    return { red: mix(color.red), green: mix(color.green), blue: mix(color.blue) };
}

// The opposite color: black <-> white, red <-> cyan...
function invert(color) {
    return { red: 255 - color.red, green: 255 - color.green, blue: 255 - color.blue };
}

// Add the same amount to every part. Positive = lighter, negative = darker.
function shade(color, amount) {
    return {
        red: clamp(color.red + amount),
        green: clamp(color.green + amount),
        blue: clamp(color.blue + amount)
    };
}

// --- Drawing -------------------------------------------------------------

function paintPanel(panel, text, background, textColor) {
    panel.style.backgroundColor = background;
    panel.style.color = textColor;
    text.textContent = "background-color: " + background + ";";
}

// Fill a list with color links, e.g. <a href="#ff8800">#ff8800</a>.
function showSwatches(list, hexColors) {
    list.innerHTML = "";

    hexColors.forEach(function (hex) {
        const link = document.createElement("a");
        link.href = hex;
        link.className = "go-to-color col-sm-6 col-md-3";
        link.style.backgroundColor = hex;
        link.style.color = toHex(invert(fromHex(hex)));

        const label = document.createElement("span");
        label.textContent = hex;
        link.appendChild(label);

        list.appendChild(link);
    });
}

// Read the sliders and redraw the whole page from them.
function render() {
    const color = {
        red: Number(redSlider.value),
        green: Number(greenSlider.value),
        blue: Number(blueSlider.value)
    };
    const alpha = Number(alphaSlider.value) / 100;

    const solid = onWhite(color, alpha);
    const solidHex = toHex(solid);
    const invertedHex = toHex(invert(solid));

    const rgb = "rgb(" + solid.red + ", " + solid.green + ", " + solid.blue + ")";
    const rgba = "rgba(" + color.red + ", " + color.green + ", " + color.blue + ", " + alpha + ")";

    paintPanel(rgbPanel, rgbText, rgb, invertedHex);
    paintPanel(rgbaPanel, rgbaText, rgba, invertedHex);
    paintPanel(hexPanel, hexText, solidHex, invertedHex);
    paintPanel(invertedPanel, invertedText, invertedHex, solidHex);

    hexInput.value = toHex(color);

    // 10 lighter and 10 darker versions, 5 steps apart.
    const lighter = [];
    const darker = [];
    for (let step = 0; step < 50; step += 5) {
        lighter.push(toHex(shade(color, step)));
        darker.push(toHex(shade(color, -step)));
    }
    showSwatches(lighterList, lighter);
    showSwatches(darkerList, darker);
}

// Move the sliders to a hex color (fully solid) and redraw.
function loadHex(hex) {
    const color = fromHex(hex);

    if (color === null) {
        return;
    }
    redSlider.value = color.red;
    greenSlider.value = color.green;
    blueSlider.value = color.blue;
    alphaSlider.value = 100;
    render();
}

// --- Connect the page ----------------------------------------------------

// "input" fires all the time while a slider is dragged.
redSlider.addEventListener("input", render);
greenSlider.addEventListener("input", render);
blueSlider.addEventListener("input", render);
alphaSlider.addEventListener("input", render);

// A valid hex typed in the box goes into the address, e.g. ".../colorhex/#ff8800".
// That makes the color easy to share, and triggers "hashchange" below.
hexInput.addEventListener("input", function () {
    if (fromHex(hexInput.value) !== null) {
        window.location.hash = hexInput.value.replace("#", "");
    }
});

// The "#..." part of the address changed (typed hex or clicked swatch).
window.addEventListener("hashchange", function () {
    loadHex(window.location.hash);
});

// --- Start ---------------------------------------------------------------

showSwatches(favoriteList, favorites);

if (fromHex(window.location.hash) !== null) {
    loadHex(window.location.hash);
} else {
    render();
}
