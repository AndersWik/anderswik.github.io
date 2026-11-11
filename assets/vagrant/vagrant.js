/*
 * Vagrantfile maker.
 *
 * The Vagrantfile templates on the server contain two placeholders:
 *
 *   vagrantip   replaced with the IP the user types
 *   vagranturl  replaced with the URL the user types
 *
 * Steps:
 *   1. Download the template the user picked (fetch).
 *   2. Replace the placeholders and show the result.
 *   3. Let the user download the result as a file.
 */

// --- State ---------------------------------------------------------------

// The template exactly as downloaded, with the placeholders still in it.
let template = "";

// --- Elements on the page ------------------------------------------------

const templateSelect = document.getElementById("vagrant-file-select");
const ipInput = document.getElementById("vagrant-ip");
const urlInput = document.getElementById("vagrant-url");
const fileText = document.getElementById("vagrant-file");
const downloadButton = document.getElementById("download");
const downloadLink = document.getElementById("download-content");

// --- Actions -------------------------------------------------------------

// Download the chosen template. "async" lets us use "await", which waits
// for the network without freezing the page.
async function loadTemplate() {
    fileText.value = "Loading...";

    try {
        const response = await fetch(templateSelect.value);

        // fetch() only throws when there is no network. A missing file
        // still "works" and gives an error page, so check the status.
        if (!response.ok) {
            throw new Error("HTTP " + response.status);
        }
        template = await response.text();
        showFile();
    } catch (error) {
        fileText.value = "Could not load the Vagrantfile.";
    }
}

// Fill in the placeholders and show the finished file.
function showFile() {
    let content = template;

    if (ipInput.value !== "") {
        content = content.replaceAll("vagrantip", ipInput.value);
    }
    if (urlInput.value !== "") {
        content = content.replaceAll("vagranturl", urlInput.value);
    }

    fileText.value = content;
}

// Put the text into the hidden <a download="Vagrantfile"> link and click it.
// A "data:" URL holds the file's content in the link itself.
function downloadFile() {
    downloadLink.href = "data:text/plain;charset=utf-8," + encodeURIComponent(fileText.value);
    downloadLink.click();
}

// --- Connect the page ----------------------------------------------------

// "input" fires on every change: typing, pasting, deleting...
ipInput.addEventListener("input", showFile);
urlInput.addEventListener("input", showFile);
templateSelect.addEventListener("change", loadTemplate);
downloadButton.addEventListener("click", downloadFile);

// --- Start ---------------------------------------------------------------

loadTemplate();
