/*
 * URL encode / decode.
 *
 * Some characters (spaces, åäö, quotes, < >...) are not allowed in a URL.
 * URL encoding replaces each of them with "%" and a code:
 *
 *   "hello world"  ->  "hello%20world"
 *
 * The page also builds a CSS snippet that puts an SVG image straight into
 * the CSS as a "data URL", which is a common use for URL encoding.
 */

// --- Elements on the page ------------------------------------------------

const plainText = document.getElementById("decoded-text");
const encodedText = document.getElementById("encoded-text");
const cssText = document.getElementById("escaped-css");
const encodeButton = document.getElementById("encode-btn");
const decodeButton = document.getElementById("decode-btn");

// --- Helpers -------------------------------------------------------------

// encodeURI() leaves "#" alone because it has a meaning in URLs.
// In a data URL "#" would cut the image short, so encode it as well.
function encodeForSvg(text) {
    return encodeURI(text).replaceAll("#", "%23");
}

function buildCss(encodedSvg) {
    return ".myImage:before {\n" +
        "    background-image: url(\"data:image/svg+xml;charset=US-ASCII," + encodedSvg + "\");\n" +
        "    background-size: 100% 100%;\n" +
        "    background-repeat: no-repeat;\n" +
        "}";
}

// --- What the buttons do -------------------------------------------------

function encode() {
    encodedText.value = encodeURI(plainText.value);
    cssText.value = buildCss(encodeForSvg(plainText.value));
}

function decode() {
    // decodeURIComponent() decodes every "%" code, including "%23".
    // It throws an error on broken codes like "%E0%A4%A", so catch that.
    try {
        plainText.value = decodeURIComponent(encodedText.value);
    } catch (error) {
        plainText.value = "That is not a valid URL encoded text.";
    }
}

// --- Connect the buttons -------------------------------------------------

encodeButton.addEventListener("click", encode);
decodeButton.addEventListener("click", decode);
