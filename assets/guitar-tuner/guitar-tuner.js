/*
 * Guitar Tuner: listen with the microphone, find the pitch of the note,
 * and show how far it is from the nearest note, in cents.
 *
 * A note is a wave that repeats: the low E string about 82 times a second,
 * 82 hertz (Hz). To find the pitch, we find how long the wave takes to
 * repeat. We compare the sound with itself, shifted a little later
 * (autocorrelation): when the shift is one whole wave, the two line up.
 *
 * A cent is a hundredth of a half step. Within 5 cents is in tune.
 */

// --- Settings ------------------------------------------------------------

const A4 = 440;                       // the A above middle C, in Hz
const NOTE_NAMES = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"];
const STRINGS = [                     // standard tuning, low to high: MIDI note numbers
    { name: "E", midi: 40 }, { name: "A", midi: 45 }, { name: "D", midi: 50 },
    { name: "G", midi: 55 }, { name: "B", midi: 59 }, { name: "E", midi: 64 }
];
const LOWEST = 60;                    // Hz: below the low E (82 Hz), with room to spare
const HIGHEST = 1200;                 // Hz: above the high E at the 12th fret
const QUIET = 0.01;                   // softer than this is no sound
const CLARITY = 0.9;                  // how clearly the wave must repeat
const IN_TUNE = 5;                    // cents
const HOLD = 1500;                    // ms the last note stays on the screen after the sound stops

// --- State ---------------------------------------------------------------

let audio = null;       // the AudioContext
let stream = null;      // the microphone
let analyser = null;
let samples = null;     // the latest sound, as numbers from -1 to 1
let listening = false;
let recent = [];        // the last few pitches found, to calm the needle
let lastHeard = 0;      // when a note was last found

// --- Elements on the page --------------------------------------------------

const message = document.getElementById("message");
const needle = document.getElementById("needle");
const noteText = document.getElementById("note");
const centsText = document.getElementById("cents");
const frequencyText = document.getElementById("frequency");
const stringsBox = document.getElementById("strings");
const startButton = document.getElementById("button-start");
const ticks = document.getElementById("ticks");

// --- Notes -------------------------------------------------------------------

// A frequency as a MIDI note number, with decimals: 440 Hz is 69, and every
// half step is 1 more. Twelve half steps make an octave, which doubles the
// frequency, so it is a logarithm with base 2.
function midiFromFrequency(frequency) {
    return 69 + 12 * Math.log2(frequency / A4);
}

function frequencyFromMidi(midi) {
    return A4 * Math.pow(2, (midi - 69) / 12);
}

// 64 -> "E4": the note name, and the octave number.
function noteName(midi) {
    return NOTE_NAMES[midi % 12] + (Math.floor(midi / 12) - 1);
}

// --- Finding the pitch ---------------------------------------------------------

// The pitch of the sound in "buffer", in Hz, or null if there is no clear note.
// This is the McLeod method, a kind of autocorrelation: for every shift
// (lag), how well does the sound match itself that much later? 1 is a
// perfect match, 0 none at all, -1 the exact opposite.
function detectPitch(buffer, sampleRate) {
    // Too quiet: no note.
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
    }
    if (Math.sqrt(sum / buffer.length) < QUIET) {
        return null;
    }

    const minLag = Math.floor(sampleRate / HIGHEST);
    const maxLag = Math.min(Math.floor(sampleRate / LOWEST), Math.floor(buffer.length / 2));
    const size = buffer.length - maxLag;
    const match = new Float32Array(maxLag + 1);
    for (let lag = minLag; lag <= maxLag; lag++) {
        let together = 0;
        let energy = 0;
        for (let i = 0; i < size; i++) {
            together += buffer[i] * buffer[i + lag];
            energy += buffer[i] * buffer[i] + buffer[i + lag] * buffer[i + lag];
        }
        match[lag] = energy > 0 ? 2 * together / energy : 0;
    }

    // The peaks of the match, one between each time it crosses 0. A
    // guitar string also rings at 2, 3 and 4 times its note (overtones),
    // and a shift of two whole waves matches as well as one. So we don't
    // take the highest peak, but the first one that is nearly as high:
    // that is one whole wave.
    const peaks = [];
    let lag = minLag;
    while (lag < maxLag && match[lag] > 0) {
        lag++;   // start after the first dip below 0
    }
    while (lag < maxLag) {
        while (lag < maxLag && match[lag] <= 0) {
            lag++;
        }
        let best = lag;
        while (lag < maxLag && match[lag] > 0) {
            if (match[lag] > match[best]) {
                best = lag;
            }
            lag++;
        }
        if (match[best] > 0) {
            peaks.push(best);
        }
    }
    if (peaks.length === 0) {
        return null;
    }
    const highest = Math.max(...peaks.map(function (p) { return match[p]; }));
    if (highest < CLARITY) {
        return null;   // the sound doesn't repeat clearly: noise, or many strings at once
    }
    const period = peaks.find(function (p) { return match[p] >= highest * 0.9; });

    // The true peak is often between two lags. A parabola through the peak
    // and its two neighbours finds where it really is.
    const a = match[period - 1];
    const b = match[period];
    const c = match[period + 1];
    const shift = (a - c) / (2 * (a - 2 * b + c)) || 0;
    return sampleRate / (period + shift);
}

// Calm the needle: keep the last 8 pitches, about 0.13 seconds. Take the
// middle one (the median), leave out the ones far from it, like a wrong
// octave or the next string, and average the rest. Averaging makes the
// small errors from noise cancel out, and leaving out the odd ones means
// one bad reading can't make the needle jump.
function steady(frequency) {
    recent.push(frequency);
    if (recent.length > 8) {
        recent.shift();
    }
    const sorted = recent.slice().sort(function (a, b) { return a - b; });
    const middle = sorted[Math.floor(sorted.length / 2)];
    const close = recent.filter(function (f) {
        return Math.abs(1200 * Math.log2(f / middle)) < 30;
    });
    return close.reduce(function (sum, f) { return sum + f; }, 0) / close.length;
}

// --- Showing it ----------------------------------------------------------------

function showPitch(frequency) {
    const midi = midiFromFrequency(frequency);
    const nearest = Math.round(midi);
    const cents = Math.round((midi - nearest) * 100);

    noteText.textContent = noteName(nearest);
    frequencyText.textContent = frequency.toFixed(1) + " Hz (" + noteName(nearest) + " is " + frequencyFromMidi(nearest).toFixed(1) + " Hz)";
    // -50 cents is all the way left, +50 all the way right: 60 degrees each way.
    // As a style, not an attribute, so the CSS transition makes it glide.
    needle.style.transform = "rotate(" + (cents / 50 * 60) + "deg)";

    const inTune = Math.abs(cents) <= IN_TUNE;
    if (inTune) {
        centsText.textContent = "In tune";
    } else if (cents < 0) {
        centsText.textContent = cents + " cents: tune up";
    } else {
        centsText.textContent = "+" + cents + " cents: tune down";
    }
    noteText.classList.toggle("good", inTune);
    centsText.classList.toggle("good", inTune);
    needle.classList.toggle("good", inTune);

    // The string this is closest to, measured in half steps.
    let closest = 0;
    STRINGS.forEach(function (string, i) {
        if (Math.abs(midi - string.midi) < Math.abs(midi - STRINGS[closest].midi)) {
            closest = i;
        }
    });
    Array.from(stringsBox.children).forEach(function (button, i) {
        button.classList.toggle("near", i === closest);
        button.classList.toggle("good", i === closest && Math.abs(midi - STRINGS[i].midi) * 100 <= IN_TUNE);
    });
}

function showSilence() {
    noteText.textContent = "–";
    centsText.innerHTML = "&nbsp;";
    frequencyText.innerHTML = "&nbsp;";
    needle.style.transform = "rotate(0deg)";
    [noteText, centsText, needle].forEach(function (element) { element.classList.remove("good"); });
    Array.from(stringsBox.children).forEach(function (button) { button.classList.remove("near", "good"); });
}

// The tick marks on the dial: every 10 cents, a longer one in the middle.
function drawTicks() {
    for (let cents = -50; cents <= 50; cents += 10) {
        const angle = (cents / 50 * 60 - 90) * Math.PI / 180;
        const inner = cents === 0 ? 70 : 78;
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", Math.cos(angle) * inner);
        line.setAttribute("y1", Math.sin(angle) * inner);
        line.setAttribute("x2", Math.cos(angle) * 90);
        line.setAttribute("y2", Math.sin(angle) * 90);
        line.setAttribute("class", "tick");
        ticks.appendChild(line);
    }
}

// --- Listening ---------------------------------------------------------------

async function start() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        message.textContent = "This browser can't use a microphone here. It needs a page on https.";
        return;
    }
    try {
        // Echo cancellation and noise suppression are made for voices, and
        // can change the sound of a string, so we turn them off.
        stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
        });
    } catch (error) {
        message.textContent = "The page may not use the microphone. Allow it in the browser's settings.";
        return;
    }
    audio = audio || new AudioContext();
    analyser = audio.createAnalyser();
    analyser.fftSize = 4096;   // about 0.09 seconds of sound: more than two waves of the low E
    audio.createMediaStreamSource(stream).connect(analyser);
    samples = new Float32Array(analyser.fftSize);
    listening = true;
    recent = [];
    startButton.textContent = "Stop";
    startButton.className = "btn btn-warning";
    message.textContent = "Listening. Play one string.";
    listen();
}

function stop() {
    listening = false;
    if (stream !== null) {
        stream.getTracks().forEach(function (track) { track.stop(); });   // the microphone light goes off
        stream = null;
    }
    startButton.textContent = "Start";
    startButton.className = "btn btn-success";
    message.textContent = "Press Start to tune.";
    showSilence();
}

// About 60 times a second: read the sound, and look for a note.
function listen() {
    if (!listening) {
        return;
    }
    analyser.getFloatTimeDomainData(samples);
    const frequency = detectPitch(samples, audio.sampleRate);
    if (frequency !== null) {
        lastHeard = performance.now();
        showPitch(steady(frequency));
    } else if (performance.now() - lastHeard > HOLD) {
        recent = [];
        showSilence();
    }
    requestAnimationFrame(listen);
}

// --- Reference tones -----------------------------------------------------------

// Play a string's note for 2 seconds, so you can tune by ear. A triangle
// wave sounds a bit like a string, and it fades out like one.
function playNote(midi) {
    audio = audio || new AudioContext();
    const tone = audio.createOscillator();
    const volume = audio.createGain();
    tone.type = "triangle";
    tone.frequency.value = frequencyFromMidi(midi);
    volume.gain.setValueAtTime(0.4, audio.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 2);
    tone.connect(volume).connect(audio.destination);
    tone.start();
    tone.stop(audio.currentTime + 2);
}

function drawStrings() {
    STRINGS.forEach(function (string) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "string";
        button.innerHTML = string.name + "<small>" + (Math.floor(string.midi / 12) - 1) + "</small>";
        button.setAttribute("aria-label", "Play " + noteName(string.midi));
        button.addEventListener("click", function () { playNote(string.midi); });
        stringsBox.appendChild(button);
    });
}

// --- Start -----------------------------------------------------------------

startButton.addEventListener("click", function () {
    if (listening) {
        stop();
    } else {
        start();
    }
});

drawTicks();
drawStrings();
