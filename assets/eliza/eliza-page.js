const eliza = new Eliza(DOCTOR_SCRIPT);
const log = document.getElementById('log');
const input = document.getElementById('input');

function say(text, cls) {
    const p = document.createElement('p');
    p.className = 'line ' + cls;
    p.textContent = text;
    log.appendChild(p);
    log.scrollTop = log.scrollHeight;
}

say(eliza.greeting(), 'eliza');

document.getElementById('form').addEventListener('submit', function (e) {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    say(text.toUpperCase(), 'user');
    setTimeout(function () { say(eliza.respond(text), 'eliza'); }, 300);
});