const ui = {
    panelRgba: document.getElementById("color-panel-rgba"),
    panelTextRgba: document.getElementById("color-panel-text-rgba"),
    panelRgb: document.getElementById("color-panel-rgb"),
    panelTextRgb: document.getElementById("color-panel-text-rgb"),
    panelHex: document.getElementById("color-panel-hex"),
    panelTextHex: document.getElementById("color-panel-text-hex"),
    panelInverted: document.getElementById("color-panel-inverted"),
    panelTextInverted: document.getElementById("color-panel-text-inverted"),
    lighterColorContainer: document.getElementById("lighter-color-container"),
    darkerColorContainer: document.getElementById("darker-color-container"),
    favoriteColorContainer: document.getElementById("favorite-color-container"),
    inputHex: document.getElementById("hex"),
    inputAlpha: document.getElementById("alpha"),
    inputRed: document.getElementById("red"),
    inputGreen: document.getElementById("green"),
    inputBlue: document.getElementById("blue")
}

const favorites = ["#afc0bc", "#7c878f", "#253746;", "#8dB9ca;", "#ca9a8e;", "#d9c89e", "#899064", "#6ba4B8", "#d9d9d6", "#caffca"];

let lighterColors = [];
let darkerColors = [];

let rgbaColor = {}
let rgbColor = {}
let invertedColor = {}

const rgbToHex = function (red, green, blue) {

    r = Math.max(Math.min(255, red), 0).toString(16)
    g = Math.max(Math.min(255, green), 0).toString(16)
    b = Math.max(Math.min(255, blue), 0).toString(16)

    const rr = (r.length < 2 ? '0' : '') + r
    const gg = (g.length < 2 ? '0' : '') + g
    const bb = (b.length < 2 ? '0' : '') + b

    return `#${rr}${gg}${bb}`
}

const rgbaToRgb = function (rgbaIn, rgbOut) {

    rgbOut.red = Math.round((1 - rgbaIn.alpha) * 255 + rgbaIn.alpha * rgbaIn.red);
    rgbOut.green = Math.round((1 - rgbaIn.alpha) * 255 + rgbaIn.alpha * rgbaIn.green);
    rgbOut.blue = Math.round((1 - rgbaIn.alpha) * 255 + rgbaIn.alpha * rgbaIn.blue);
    rgbOut.hex = rgbToHex(rgbOut.red, rgbOut.green, rgbOut.blue);
    rgbToHex(rgbOut.red, rgbOut.green, rgbOut.blue);
    return rgbOut;
}

const invertRgb = function (rgbIn, rgbOut) {

    rgbOut.red = (255 - rgbIn.red);
    rgbOut.green = (255 - rgbIn.green);
    rgbOut.blue = (255 - rgbIn.blue);
    rgbOut.hex = rgbToHex(rgbOut.red, rgbOut.green, rgbOut.blue);
    return rgbOut;
}

const hexToRgba = function (hexIn, rgbaOut) {

    hexIn = hexIn.replace("#", '');

    if (hexIn.match(/^[0-9A-Fa-f]{6}$/)) {

        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexIn);
        rgbaOut.alpha = 1;
        rgbaOut.red = parseInt(result[1], 16);
        rgbaOut.green = parseInt(result[2], 16);
        rgbaOut.blue = parseInt(result[3], 16);
    }
    return rgbaOut;
}

const initUIfromHex = function (hexIn) {

    hexIn = hexIn.replace("#", '');

    if (hexIn.match(/^[0-9A-Fa-f]{6}$/)) {

        let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexIn);
        ui.inputAlpha.value = 100;
        ui.inputRed.value = parseInt(result[1], 16);
        ui.inputGreen.value = parseInt(result[2], 16);
        ui.inputBlue.value = parseInt(result[3], 16);
    }
}

const fillRgbaFromUI = function (rgbaOut) {

    rgbaOut.red = ui.inputRed.value;
    rgbaOut.green = ui.inputGreen.value;
    rgbaOut.blue = ui.inputBlue.value;
    rgbaOut.alpha = (ui.inputAlpha.value / 100);
    return rgbaOut;
}

const setPanelAndText = function (panel, text, color, invColor) {

    panel.setAttribute("style", "color: " + invColor + "; background-color:" + color + ";");
    text.innerHTML = "background-color:" + color + ";";
}

const createGoToHref = function (hex, hexInverted) {

    let a = document.createElement('a');
    a.setAttribute('href', hex);
    a.setAttribute('class', 'go-to-color col-sm-6 col-md-3');
    a.setAttribute('style', 'color:' + hexInverted + '; background-color:' + hex + ';');
    a.innerHTML = "<span>" + hex + "</span>";
    return a;
}

const emptyArray = function (array) {
    while (array.length > 0) {
        array.pop();
    }
}

// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors

const colorShade = (col, amt) => {
  col = col.replace(/^#/, '')
  if (col.length === 3) col = col[0] + col[0] + col[1] + col[1] + col[2] + col[2]

  let [r, g, b] = col.match(/.{2}/g);
  ([r, g, b] = [parseInt(r, 16) + amt, parseInt(g, 16) + amt, parseInt(b, 16) + amt])

  return rgbToHex(r, g, b);
}

const setLighterColors = function () {

    emptyArray(lighterColors);
    let inputHex = rgbToHex(rgbaColor.red, rgbaColor.green, rgbaColor.blue);
    for (var i = 0; i < 50; i = i + 5) {
        let hex = colorShade(inputHex, i);
        lighterColors.push(hex);
    }
}

const setDarkerColors = function () {

    emptyArray(darkerColors);
    let inputHex = rgbToHex(rgbaColor.red, rgbaColor.green, rgbaColor.blue);
    for (var i = 0; i < 50; i = i + 5) {
        let hex = colorShade(inputHex, -i);
        darkerColors.push(hex);
    }
}

const fillColorContainer = function (colors, colorContainer) {

    let rgbaColorClone = JSON.parse(JSON.stringify(rgbaColor));
    colorContainer.innerHTML = "";

    for (var i = 0; i < colors.length; i++) {

        hexToRgba(colors[i], rgbaColorClone);
        let newRgb = rgbaToRgb(rgbaColorClone, {});
        let newInverted = invertRgb(newRgb, {});

        let goToColorHref = createGoToHref(colors[i], newInverted.hex);
        goToColorHref.addEventListener("click", function (event) {
            initUIfromHex(newRgb.hex);
            updateUI();
        });
        colorContainer.appendChild(goToColorHref);
    }
}

const updateUI = function () {

    fillRgbaFromUI(rgbaColor)
    rgbaToRgb(rgbaColor, rgbColor);
    invertRgb(rgbColor, invertedColor);

    let backgroundRgba = "rgb(" + rgbaColor.red + "," + rgbaColor.green + "," + rgbaColor.blue + "," + rgbaColor.alpha + ")";
    let backgroundRgb = "rgb(" + rgbColor.red + "," + rgbColor.green + "," + rgbColor.blue + ")";

    setPanelAndText(ui.panelRgba, ui.panelTextRgba, backgroundRgba, invertedColor.hex);
    setPanelAndText(ui.panelRgb, ui.panelTextRgb, backgroundRgb, invertedColor.hex);
    setPanelAndText(ui.panelHex, ui.panelTextHex, rgbColor.hex, invertedColor.hex);
    setPanelAndText(ui.panelInverted, ui.panelTextInverted, invertedColor.hex, rgbColor.hex);

    setLighterColors();
    fillColorContainer(lighterColors, ui.lighterColorContainer);
    setDarkerColors();
    fillColorContainer(darkerColors, ui.darkerColorContainer);
}

ui.inputAlpha.addEventListener("change", function () {

    updateUI();
});

ui.inputRed.addEventListener("change", function () {

    updateUI();
});

ui.inputGreen.addEventListener("change", function () {

    updateUI();
});

ui.inputBlue.addEventListener("change", function () {

    updateUI();
});

ui.inputHex.addEventListener("keypress", function (event) {

    if (event.key === "Enter" && /^#[0-9A-F]{6}$/i.test(ui.inputHex.value)) {
        window.location.hash = ui.inputHex.value;
    }

    initUIfromHex(ui.inputHex.value);
    updateUI();
});

initUIfromHex(window.location.hash);
fillColorContainer(favorites, ui.favoriteColorContainer);
updateUI();