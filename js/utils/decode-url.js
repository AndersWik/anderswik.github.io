const ui = {
    decodeBtn: document.getElementById("decode-btn"),
    encodeBtn: document.getElementById("encode-btn"),
    decodedText: document.getElementById("decoded-text"),
    encodedText: document.getElementById("encoded-text"),
    escapedCss: document.getElementById("escaped-css")
}

ui.encodeBtn.addEventListener("click", function () {    
    let text = ui.decodedText.value;
    ui.encodedText.value = encodeURI(text);
});

ui.decodeBtn.addEventListener("click", function () {
    let text = ui.encodedText.value;
    ui.decodedText.value = decodeURI(text);
});