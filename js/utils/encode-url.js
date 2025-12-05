const ui = {
    decodeBtn: document.getElementById("decode-btn"),
    encodeBtn: document.getElementById("encode-btn"),
    decodedText: document.getElementById("decoded-text"),
    encodedText: document.getElementById("encoded-text"),
    escapedCss: document.getElementById("escaped-css")
}

ui.encodeBtn.addEventListener("click", function () {
    let text = ui.decodedText.value;
    let escapedText = encodeURI(text);
    ui.encodedText.value = escapedText;

    ui.escapedCss.value = ".myImage:before {" +
        "    background-image: url('data:image/svg+xml;charset=US-ASCII," + escapedText + ");" +
        "    background-size: 100% 100%;" +
        "    background-repeat: no-repeat;" +
        "}";
});

ui.decodeBtn.addEventListener("click", function () {
    let text = ui.encodedText.value;
    ui.decodedText.value = decodeURI(text);
});