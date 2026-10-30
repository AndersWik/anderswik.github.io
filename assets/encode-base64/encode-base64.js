const ui = {
    decodeBtn: document.getElementById("decode-btn"),
    encodeBtn: document.getElementById("encode-btn")
}

ui.encodeBtn.addEventListener("click", function () {
    var text = document.getElementById("decoded-text").value;
    document.getElementById("encoded-text").value = btoa(text);
});

ui.decodeBtn.addEventListener("click", function () {
    var text = document.getElementById("encoded-text").value;
    document.getElementById("decoded-text").value = atob(text);
});