const ui = {
    outputMinutes: document.getElementById("output-minutes"),
    outputSeconds: document.getElementById("output-seconds"),
    buttonStart: document.getElementById("button-start"),
    buttonStop: document.getElementById("button-stop"),
    increaseMinutes: document.getElementById("increase-minutes"),
    decreaseMinutes: document.getElementById("decrease-minutes"),
    increaseSeconds: document.getElementById("increase-seconds"),
    decreaseSeconds: document.getElementById("decrease-seconds"),
    beepSound: document.getElementById("beep-sound")
}

let seconds = 0;
let runningInterval = null;
let soundInterval = null;

const padString = function (value) {
    value = value + "";
    if (value.length < 2) {
        value = "0" + value;
    }
    return value;
}

const removeAfter = function (value) {
    value = value + "";
    value = value.substring(0, value.indexOf("."));
    return value;
}

const setMinutes = function (delta) {
    let minutes = Math.floor(delta / 60);
    minutes = (minutes + "".length < 2 ? "0" + minutes : minutes);
    ui.outputMinutes.innerHTML = padString(minutes);
}

const setSeconds = function (delta) {
    let seconds = delta % 60;
    ui.outputSeconds.innerHTML = padString(seconds);
}

const beep = function () {
    ui.beepSound.play();
}

const running = function () {
    if (seconds > 0) {
        seconds -= 1;
        setMinutes(seconds);
        setSeconds(seconds);
    }
    else {
        soundInterval = setInterval(beep, 1000);
        clearInterval(runningInterval);
    }
}

const addSeconds = function (val) {
    if (seconds <= 3600 && (seconds + val) <= 3600) {
        seconds += val;
        setMinutes(seconds);
        setSeconds(seconds);
    }
}

const removeSeconds = function (val) {
    if (seconds >= 0 && (seconds - val) >= 0) {
        seconds -= val;
        setMinutes(seconds);
        setSeconds(seconds);
    }
}

ui.buttonStart.addEventListener("click", function () {
    runningInterval = setInterval(running, 1000);
});

ui.buttonStop.addEventListener("click", function () {
    if (runningInterval !== null) {
        clearInterval(runningInterval);
        runningInterval = null;
    }
    if (soundInterval !== null) {
        clearInterval(soundInterval);
        soundInterval = null;
    }
    setMinutes(seconds);
    setSeconds(seconds);
});

ui.increaseMinutes.addEventListener("click", function () {
    addSeconds(60);
});

ui.decreaseMinutes.addEventListener("click", function () {
    removeSeconds(60);
});

ui.increaseSeconds.addEventListener("click", function () {
    addSeconds(1);
});

ui.decreaseSeconds.addEventListener("click", function () {
    removeSeconds(1);
});