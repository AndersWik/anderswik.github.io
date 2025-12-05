const ui = {
    inputSelect: document.getElementById("input-select"),
    inputField: document.getElementById("input-field"),
    outputSelect: document.getElementById("output-select"),
    outputField: document.getElementById("output-field"),
    baseSelect: document.getElementById("base-select")
}

const unit = {
    bit: "bit",
    byte: "byte",
    kb: "KB",
    mb: "MB",
    gb: "GB",
    tb: "TB"
}

const quantities = {
    decimal: 1000,
    binary: 1024
}

let bit = 0;
let size = 1000;

const setSize = function (value) {
    if (value === "decimal") {
        size = quantities.decimal;
    }
    else {
        size = quantities.binary;
    }
}

const setBytes = function (value, selectedUnit) {

    let isNumber = !isNaN(value);
    let b = 0;

    if (isNumber && selectedUnit === unit.bit) {

        b = parseFloat(value);
    }
    else if (isNumber && selectedUnit === unit.byte) {

        b = 8 * parseFloat(value);
    }
    else if (isNumber && selectedUnit === unit.kb) {

        b = 8 * size * parseFloat(value);
    }
    else if (isNumber && selectedUnit === unit.mb) {

        b = 8 * size * size * parseFloat(value);
    }
    else if (isNumber && selectedUnit === unit.gb) {

        b = 8 * size * size * size * parseFloat(value);
    }
    else if (isNumber && selectedUnit === unit.tb) {

        b = 8 * size * size * size * size * parseFloat(value);
    }
    return b;
}

const getOutput = function (b, selectedUnit) {

    let isNumber = !isNaN(b);
    let output = 0;

    if (isNumber && selectedUnit === unit.bit) {
        output = b;
    }
    else if (isNumber && selectedUnit === unit.byte) {

        output = b / 8;
    }
    else if (isNumber && selectedUnit === unit.kb) {

        output = b / 8 / size;
    }
    else if (isNumber && selectedUnit === unit.mb) {

        output = b / 8 / size / size;
    }
    else if (isNumber && selectedUnit === unit.gb) {

        output = b / 8 / size / size / size;
    }
    else if (isNumber && selectedUnit === unit.tb) {

        output = b / 8 / size / size / size / size;
    }
    return output;
}

const leftToRightUpdateUI = function () {

    let b = setBytes(ui.inputField.value, ui.inputSelect.value);

    if (b !== null) {
        bit = b;
    }

    let o = getOutput(bit, ui.outputSelect.value);

    if (o !== null) {
        ui.outputField.value = o;
    }
}

const rightToLeftUpdateUI = function () {

    let b = setBytes(ui.outputField.value, ui.outputSelect.value);

    if (b !== null) {
        bit = b;
    }

    let o = getOutput(bit, ui.inputSelect.value);

    if (o !== null) {
        ui.inputField.value = o;
    }
}

const updateUI = function (leftToRight) {

    if (leftToRight) {
        leftToRightUpdateUI();
    }
    else {
        rightToLeftUpdateUI();
    }
}

ui.inputSelect.addEventListener("change", function () {
    updateUI(true);
});

ui.inputField.addEventListener("change", function () {
    updateUI(true);
});

ui.outputSelect.addEventListener("change", function () {
    updateUI(true);
});

ui.outputField.addEventListener("change", function () {
    updateUI(false);
});

ui.baseSelect.addEventListener("change", function () {
    setSize(ui.baseSelect.value);
    updateUI(true);
});

ui.inputField.addEventListener("keyup", function() {
    updateUI(true);
});

ui.outputField.addEventListener("keyup", function() {
    updateUI(false);
});

setSize(ui.baseSelect.value);