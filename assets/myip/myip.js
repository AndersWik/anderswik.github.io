/*
 * My IP: ask the ipify service which public IP address we have.
 *
 * fetch() sends a request over the network. It takes a while, so
 * "async" and "await" let us wait for the answer without freezing the page.
 *
 * The answer is JSON text like {"ip":"81.230.12.34"}.
 * response.json() turns it into a JavaScript object.
 */

// --- Elements on the page ------------------------------------------------

const ipText = document.getElementById("ip");

// --- Actions -------------------------------------------------------------

async function showMyIp() {
    ipText.textContent = "Loading...";

    try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        ipText.textContent = data.ip;
    } catch (error) {
        // No network, or the service is down.
        ipText.textContent = "Could not get your IP";
    }
}

// --- Start ---------------------------------------------------------------

showMyIp();
