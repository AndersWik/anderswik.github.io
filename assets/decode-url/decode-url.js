/*
 * URL decode / encode.
 *
 * Some characters (spaces, åäö, quotes, < >...) are not allowed in a URL.
 * URL encoding replaces each of them with "%" and a code:
 *
 *   "hello world"  <->  "hello%20world"
 */

// --- Elements on the page ------------------------------------------------

const encodedText = document.getElementById("encoded-text");
const plainText = document.getElementById("decoded-text");
const decodeButton = document.getElementById("decode-btn");
const encodeButton = document.getElementById("encode-btn");

// --- What the buttons do -------------------------------------------------

function decode() {
    // decodeURIComponent() decodes every "%" code.
    // It throws an error on broken codes like "%E0%A4%A", so catch that.
    try {
        plainText.value = decodeURIComponent(encodedText.value);
    } catch (error) {
        plainText.value = "That is not a valid URL encoded text.";
    }
}

function encode() {
    encodedText.value = encodeURI(plainText.value);
}

// --- Connect the buttons -------------------------------------------------

decodeButton.addEventListener("click", decode);
encodeButton.addEventListener("click", encode);
