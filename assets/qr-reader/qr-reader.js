/*
 * QR Reader: read QR codes with the camera, or from a picture.
 *
 * The camera comes from navigator.mediaDevices.getUserMedia() and is shown
 * in a <video>. A few times a second we look for a QR code in the latest
 * picture. Chrome on Android and Mac has a QR reader built in, the
 * BarcodeDetector. Browsers without it, like Safari on iPhone and Firefox,
 * use jsQR instead, a small library that finds the code in the pixels.
 *
 * A code can hold anything, also a link to a bad site, so a link is never
 * opened by itself: you see where it goes, and tap Open link if you want.
 */

// --- Settings ------------------------------------------------------------

const SCAN_EVERY = 150;      // ms between two looks for a code
const VIDEO_SIZE = 640;      // jsQR: shrink the camera picture to at most this, it is faster
const PICTURE_SIZE = 1600;   // jsQR: the same for a picture, bigger, to find small codes
const HISTORY_KEY = "qr-reader-history";
const HISTORY_LENGTH = 10;

// --- State ---------------------------------------------------------------

let detector = null;         // the browser's BarcodeDetector, if it reads QR codes
let stream = null;           // the camera
let scanning = false;
let busy = false;            // still looking at the last picture?
let lastScan = 0;
let current = null;          // the code shown, as described by describe()
let history = loadHistory();

// jsQR needs the pixels, and a canvas gives them.
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d", { willReadFrequently: true });

// --- Elements on the page --------------------------------------------------

const message = document.getElementById("message");
const viewfinder = document.getElementById("viewfinder");
const video = document.getElementById("video");
const startButton = document.getElementById("button-start");
const resultBox = document.getElementById("result");
const resultType = document.getElementById("result-type");
const resultText = document.getElementById("result-text");
const resultHost = document.getElementById("result-host");
const openLink = document.getElementById("open-link");
const copyButton = document.getElementById("copy");
const fileInput = document.getElementById("file");
const historyBox = document.getElementById("history-box");
const historyList = document.getElementById("history");
const clearButton = document.getElementById("clear-history");
const engineText = document.getElementById("engine");

// --- Reading a code ----------------------------------------------------------

// The built-in reader, if the browser has one and it knows QR codes.
async function makeDetector() {
    if (!("BarcodeDetector" in window)) {
        return null;
    }
    try {
        const formats = await BarcodeDetector.getSupportedFormats();
        if (formats.includes("qr_code")) {
            return new BarcodeDetector({ formats: ["qr_code"] });
        }
    } catch (error) {
        // No built-in reader after all.
    }
    return null;
}

// Look for a QR code in a picture: the video, or an image. Returns the text
// in it, or null. "thorough" is for pictures: bigger, and also light codes
// on a dark background.
async function readCode(picture, width, height, thorough) {
    if (detector !== null) {
        try {
            const codes = await detector.detect(picture);
            return codes.length > 0 ? codes[0].rawValue : null;
        } catch (error) {
            return null;
        }
    }
    const scale = Math.min(1, (thorough ? PICTURE_SIZE : VIDEO_SIZE) / Math.max(width, height));
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    ctx.drawImage(picture, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(pixels.data, pixels.width, pixels.height, {
        inversionAttempts: thorough ? "attemptBoth" : "dontInvert"
    });
    return code ? code.data : null;
}

// --- The camera ----------------------------------------------------------------

async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        message.textContent = "This browser can't use a camera here. It needs a page on https.";
        return;
    }
    try {
        // "environment" is the camera on the back, if there is one.
        stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" },
            audio: false
        });
    } catch (error) {
        message.textContent = error.name === "NotFoundError"
            ? "No camera found. You can still read a QR code from a picture."
            : "The page may not use the camera. Allow it in the browser's settings.";
        return;
    }
    video.srcObject = stream;
    await video.play();
    scanning = true;
    viewfinder.classList.remove("found");
    startButton.textContent = "Stop";
    startButton.className = "btn btn-warning";
    message.textContent = "Point the camera at a QR code.";
    requestAnimationFrame(scan);
}

function stop(text) {
    scanning = false;
    if (stream !== null) {
        stream.getTracks().forEach(function (track) { track.stop(); });   // the camera light goes off
        stream = null;
    }
    video.srcObject = null;
    startButton.textContent = current === null ? "Start" : "Scan again";
    startButton.className = "btn btn-success";
    message.textContent = text;
}

// Every frame, but only look for a code every SCAN_EVERY ms, and never
// while the last look is still busy.
function scan(now) {
    if (!scanning) {
        return;
    }
    requestAnimationFrame(scan);
    if (busy || now - lastScan < SCAN_EVERY || video.readyState < video.HAVE_CURRENT_DATA) {
        return;
    }
    busy = true;
    lastScan = now;
    readCode(video, video.videoWidth, video.videoHeight, false).then(function (text) {
        busy = false;
        if (text !== null && scanning) {
            viewfinder.classList.add("found");
            if (navigator.vibrate) {
                navigator.vibrate(80);
            }
            show(text);
            remember(text);
            stop("Found a QR code.");
        }
    });
}

// --- Showing a code ------------------------------------------------------------

// What kind of code is it? A link, a Wi-Fi network, or just text.
function describe(text) {
    if (/^https?:\/\//i.test(text)) {
        let host = "";
        try {
            host = new URL(text).hostname;
        } catch (error) {
            // Not a real address after all: show it as text.
            return { type: "Text", text: text, copy: text };
        }
        return { type: "Link", text: text, copy: text, link: text, host: host };
    }
    if (/^WIFI:/i.test(text)) {
        // WIFI:T:WPA;S:name;P:password;; where \ makes the next letter plain.
        const fields = {};
        const pattern = /([A-Z]):((?:\\.|[^;])*);/g;
        let match;
        while ((match = pattern.exec(text.slice(5))) !== null) {
            fields[match[1]] = match[2].replace(/\\(.)/g, "$1");
        }
        if (fields.S) {
            return {
                type: "Wi-Fi network",
                text: "Network: " + fields.S + (fields.P ? "\nPassword: " + fields.P : ""),
                copy: fields.P || fields.S
            };
        }
    }
    return { type: "Text", text: text, copy: text };
}

function show(text) {
    current = describe(text);
    resultType.textContent = current.type;
    resultText.textContent = current.text;   // textContent, never innerHTML: a code may hold anything
    resultHost.hidden = !current.host;
    resultHost.textContent = current.host ? "Goes to " + current.host : "";
    openLink.hidden = !current.link;
    openLink.href = current.link || "#";
    copyButton.textContent = current.type === "Wi-Fi network" ? "Copy password" : "Copy";
    resultBox.hidden = false;
}

copyButton.addEventListener("click", async function () {
    if (current === null) {
        return;
    }
    const label = copyButton.textContent;
    try {
        await navigator.clipboard.writeText(current.copy);
        copyButton.textContent = "Copied";
    } catch (error) {
        copyButton.textContent = "Can't copy here";
    }
    setTimeout(function () { copyButton.textContent = label; }, 1500);
});

// --- Reading a picture ---------------------------------------------------------

fileInput.addEventListener("change", async function () {
    const file = fileInput.files[0];
    if (!file) {
        return;
    }
    if (scanning) {
        stop("");
    }
    let picture;
    try {
        picture = await createImageBitmap(file);
    } catch (error) {
        message.textContent = "That file isn't a picture this browser can open.";
        return;
    }
    const text = await readCode(picture, picture.width, picture.height, true);
    fileInput.value = "";
    if (text === null) {
        message.textContent = "No QR code found in the picture. Try a sharper one, or one closer to the code.";
        return;
    }
    show(text);
    remember(text);
    startButton.textContent = "Start";
    message.textContent = "Read a QR code from the picture.";
});

// --- Codes read before -----------------------------------------------------------

function loadHistory() {
    try {
        const saved = JSON.parse(localStorage.getItem(HISTORY_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

// Put a code first in the list, without doubles, and keep the newest few.
function remember(text) {
    history = [text].concat(history.filter(function (old) { return old !== text; })).slice(0, HISTORY_LENGTH);
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        // Not saved, but the list still works until the page is closed.
    }
    drawHistory();
}

function drawHistory() {
    historyList.textContent = "";
    history.forEach(function (text) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = text;
        button.addEventListener("click", function () { show(text); });
        item.appendChild(button);
        historyList.appendChild(item);
    });
    historyBox.hidden = history.length === 0;
}

clearButton.addEventListener("click", function () {
    history = [];
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        // Nothing saved to remove.
    }
    drawHistory();
});

// --- Start -----------------------------------------------------------------------

startButton.addEventListener("click", function () {
    if (scanning) {
        stop("Press Start to read a QR code.");
    } else {
        start();
    }
});

// Switch the camera off when the page is hidden, like when you change apps.
document.addEventListener("visibilitychange", function () {
    if (document.hidden && scanning) {
        stop("Press Start to read a QR code.");
    }
});

makeDetector().then(function (found) {
    detector = found;
    engineText.textContent = detector !== null
        ? "Reading QR codes with the browser's own BarcodeDetector."
        : "Reading QR codes with jsQR.";
});
drawHistory();
