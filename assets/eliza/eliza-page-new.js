/*
 * The Eliza page: show the conversation and send what the user types to
 * the Eliza program (eliza.js) running the DOCTOR script (doctor.js).
 */

// --- Elements on the page ------------------------------------------------

const log = document.getElementById("log");
const form = document.getElementById("form");
const input = document.getElementById("input");

// --- The program ---------------------------------------------------------

const eliza = new Eliza(DOCTOR_SCRIPT);

// --- Actions -------------------------------------------------------------

// Add one line to the conversation. "who" is "eliza" or "user".
function say(text, who) {
    const line = document.createElement("p");
    line.className = "line " + who;
    line.textContent = text;
    log.appendChild(line);

    // Scroll down so the newest line can be seen.
    log.scrollTop = log.scrollHeight;
}

function send(event) {
    // Don't let the form reload the page.
    event.preventDefault();

    const text = input.value.trim();
    if (text === "") {
        return;
    }
    input.value = "";
    say(text.toUpperCase(), "user");

    // Wait a moment before answering, so it feels like a conversation.
    setTimeout(function () {
        say(eliza.respond(text), "eliza");
    }, 300);
}

// --- Connect the page ----------------------------------------------------

form.addEventListener("submit", send);

// --- Start ---------------------------------------------------------------

say(eliza.greeting(), "eliza");
