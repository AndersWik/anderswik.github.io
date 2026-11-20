/*
 * Code Playground: write HTML, CSS and JavaScript and see the result at once.
 *
 * The four text boxes are put into a template of a whole HTML page, and the
 * page is shown in an <iframe>. The iframe is "sandboxed": the code in it runs
 * as if it came from another site, so it can't read this page or the data
 * this site has saved.
 *
 * console.log() in the code is caught by a small script we put first in the
 * page. It sends each message here with postMessage(), and we list it under
 * the result.
 *
 * There is no browser extension of the playground: extension pages may not
 * run inline scripts, and an iframe made with srcdoc gets the same rule, so
 * the code in the boxes could not run.
 */

// --- Elements on the page ------------------------------------------------

const headCode = document.getElementById("head-code");
const htmlCode = document.getElementById("html-code");
const cssCode = document.getElementById("css-code");
const jsCode = document.getElementById("js-code");
const codeBoxes = [headCode, htmlCode, cssCode, jsCode];

const librarySelect = document.getElementById("library");
const runButton = document.getElementById("run");
const autoRunBox = document.getElementById("auto-run");
const downloadButton = document.getElementById("download");
const resetButton = document.getElementById("reset");

const preview = document.getElementById("preview");
const consoleList = document.getElementById("console");
const clearConsoleButton = document.getElementById("clear-console");

// --- Settings ------------------------------------------------------------

const STORAGE_KEY = "code-playground";
const RUN_DELAY = 600;           // ms to wait after the last key before running
const MAX_CONSOLE_LINES = 200;

// --- Data ----------------------------------------------------------------

// Each library is one or more tags for <head>. The versions are fixed, so a
// new version of a library can't suddenly break the code.
const LIBRARIES = [
    { group: "CSS frameworks", name: "Bootstrap 5.3 (CSS and JS)", tags: [
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">',
        '<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>'] },
    { group: "CSS frameworks", name: "Bootstrap 5.3 (only CSS)", tags: [
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">'] },
    { group: "CSS frameworks", name: "Tailwind CSS 3.4", tags: [
        '<script src="https://cdn.tailwindcss.com/3.4.17"></script>'] },
    { group: "CSS frameworks", name: "Pico CSS 2", tags: [
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2.0.6/css/pico.min.css">'] },
    { group: "CSS frameworks", name: "Normalize.css 8", tags: [
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/normalize.css@8.0.1/normalize.min.css">'] },
    { group: "CSS frameworks", name: "Animate.css 4", tags: [
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/animate.css@4.1.1/animate.min.css">'] },

    { group: "Icons", name: "Bootstrap Icons 1.11", tags: [
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">'] },
    { group: "Icons", name: "Font Awesome 6.5", tags: [
        '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">'] },

    { group: "JavaScript", name: "jQuery 3.7", tags: [
        '<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>'] },
    { group: "JavaScript", name: "Vue 3.4", tags: [
        '<script src="https://cdn.jsdelivr.net/npm/vue@3.4.21/dist/vue.global.prod.js"></script>'] },
    { group: "JavaScript", name: "Alpine.js 3.13", tags: [
        '<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.13.10/dist/cdn.min.js"></script>'] },
    { group: "JavaScript", name: "Lodash 4.17", tags: [
        '<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>'] },
    { group: "JavaScript", name: "Day.js 1.11", tags: [
        '<script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>'] },

    { group: "Charts", name: "Chart.js 4.4", tags: [
        '<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js"></script>'] },
    { group: "Charts", name: "D3 7.9", tags: [
        '<script src="https://cdn.jsdelivr.net/npm/d3@7.9.0/dist/d3.min.js"></script>'] }
];

// What the boxes hold the first time, and after Reset.
const EXAMPLE = {
    head: "",
    html: [
        "<h1>Hello, world!</h1>",
        "<button id=\"hello\">Click me</button>",
        "<p id=\"clicks\">0 clicks</p>"
    ].join("\n"),
    css: [
        "body {",
        "  font-family: sans-serif;",
        "  padding: 16px;",
        "}",
        "",
        "h1 {",
        "  color: #e8b455;",
        "}"
    ].join("\n"),
    js: [
        "const button = document.getElementById(\"hello\");",
        "const clicksText = document.getElementById(\"clicks\");",
        "let clicks = 0;",
        "",
        "button.addEventListener(\"click\", function () {",
        "  clicks++;",
        "  clicksText.textContent = clicks + \" clicks\";",
        "  console.log(\"Clicked\", clicks, \"times\");",
        "});"
    ].join("\n")
};

// Put first in the result page. It wraps console.log() and friends, and
// catches errors, and sends them to this page with postMessage(). "*" means
// any receiver: the sandboxed page doesn't have an origin we could name.
// "<\/script>" is written with a backslash so it doesn't end a <script> that
// this code is inside of (see the tutorial).
const CONSOLE_CATCHER = `<script>
(function () {
  function show(value) {
    if (typeof value === "string") return value;
    if (value instanceof Error) return value.name + ": " + value.message;
    if (value === undefined) return "undefined";
    if (typeof value === "function") return String(value);
    try { return JSON.stringify(value); } catch (error) { return String(value); }
  }
  function send(type, values, line) {
    parent.postMessage({ playground: true, type: type, text: values.map(show).join(" "), line: line }, "*");
  }
  ["log", "info", "warn", "error"].forEach(function (type) {
    const original = console[type];
    console[type] = function () {
      send(type, Array.from(arguments));
      original.apply(console, arguments);
    };
  });
  window.addEventListener("error", function (event) {
    send("error", [event.message], event.lineno);
  });
  window.addEventListener("unhandledrejection", function (event) {
    send("error", ["Uncaught (in promise)", event.reason]);
  });
  // Called on the line just before the JavaScript box. An error's stack
  // holds "line:column" for each function: [0] is this one, [1] the caller.
  // Browsers count lines a little differently, so we ask instead of guessing.
  window.__playgroundStart = function () {
    const places = (new Error().stack || "").match(/:\\d+:\\d+/g) || [];
    if (places.length > 1) {
      send("start", [], Number(places[1].split(":")[1]) + 1);
    }
  };
})();
<\/script>`;

// --- State ---------------------------------------------------------------

let runTimer = null;
let jsFirstLine = 0;         // the line in the page where the JavaScript box starts,
                             // first our own count, then the browser's ("start")

// --- Building the page ---------------------------------------------------

function readCode() {
    return { head: headCode.value, html: htmlCode.value, css: cssCode.value, js: jsCode.value };
}

// "</script>" inside the JavaScript would end the <script> tag early, and
// "</style>" inside the CSS the <style> tag. A backslash stops that and means
// the same thing to JavaScript and CSS.
function escapeEnd(code, tagName) {
    return code.replace(new RegExp("</" + tagName, "gi"), "<\\/" + tagName);
}

// The whole page as text, and the line the JavaScript starts on.
// forPreview adds the console catcher, which a downloaded file doesn't need.
function buildPage(code, forPreview) {
    const lines = [
        "<!DOCTYPE html>",
        "<html lang=\"en\">",
        "<head>",
        "<meta charset=\"utf-8\">",
        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
        "<title>Playground</title>"
    ];
    if (forPreview) {
        lines.push(CONSOLE_CATCHER);
    }
    lines.push(
        code.head,
        "<style>",
        escapeEnd(code.css, "style"),
        "</style>",
        "</head>",
        "<body>",
        code.html,
        // In the preview, a small script first tells which line the code starts on.
        forPreview ? "<script>__playgroundStart();<\/script><script>" : "<script>"
    );
    const top = lines.join("\n") + "\n";

    return {
        text: top + escapeEnd(code.js, "script") + "\n</script>\n</body>\n</html>\n",
        jsFirstLine: top.split("\n").length
    };
}

// --- Console -------------------------------------------------------------

function addConsoleLine(type, text, line) {
    const item = document.createElement("li");
    item.className = type;

    // Errors tell the line in the whole page. Turn it into a line in the box.
    if (line) {
        const where = document.createElement("span");
        where.className = "where";
        where.textContent = line >= jsFirstLine
            ? "JavaScript line " + (line - jsFirstLine + 1) + ": "
            : "Page line " + line + ": ";
        item.appendChild(where);
    }
    item.appendChild(document.createTextNode(text));
    consoleList.appendChild(item);

    while (consoleList.children.length > MAX_CONSOLE_LINES) {
        consoleList.firstElementChild.remove();
    }
    consoleList.scrollTop = consoleList.scrollHeight;
}

function clearConsole() {
    consoleList.replaceChildren();
}

// --- Running -------------------------------------------------------------

function run() {
    clearTimeout(runTimer);
    clearConsole();

    const page = buildPage(readCode(), true);
    jsFirstLine = page.jsFirstLine;

    // Setting srcdoc loads the text as a new page in the iframe.
    preview.srcdoc = page.text;
}

// Wait until the typing stops, so the page isn't reloaded on every key.
function runSoon() {
    clearTimeout(runTimer);
    if (autoRunBox.checked) {
        runTimer = setTimeout(run, RUN_DELAY);
    }
}

// Messages from the page in the iframe: where the JavaScript starts, and console lines.
function receiveMessage(event) {
    if (event.source !== preview.contentWindow || !event.data || !event.data.playground) {
        return;
    }
    if (event.data.type === "start") {
        jsFirstLine = event.data.line;
        return;
    }
    addConsoleLine(event.data.type, String(event.data.text), event.data.line);
}

// --- Saving --------------------------------------------------------------

// localStorage keeps text in the browser, also after a reload. It can be
// turned off (private windows), so every use is inside try/catch.
function save() {
    try {
        const state = readCode();
        state.autoRun = autoRunBox.checked;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        // Not saved, but the playground still works.
    }
}

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved && typeof saved.html === "string") {
            return saved;
        }
    } catch (error) {
        // Fall through and use the example.
    }
    return EXAMPLE;
}

function fill(code) {
    headCode.value = code.head || "";
    htmlCode.value = code.html || "";
    cssCode.value = code.css || "";
    jsCode.value = code.js || "";
    if (typeof code.autoRun === "boolean") {
        autoRunBox.checked = code.autoRun;
    }
}

// Call this after every change to the code.
function changed() {
    save();
    runSoon();
}

// --- Libraries -----------------------------------------------------------

function fillLibraryList() {
    let group = null;
    LIBRARIES.forEach(function (library, index) {
        if (!group || group.label !== library.group) {
            group = document.createElement("optgroup");
            group.label = library.group;
            librarySelect.appendChild(group);
        }
        group.appendChild(new Option(library.name, String(index)));
    });
}

function addLibrary() {
    const library = LIBRARIES[Number(librarySelect.value)];
    librarySelect.value = "";
    if (!library) {
        return;
    }

    // Skip tags that are already there.
    const newTags = library.tags.filter(function (tag) {
        return !headCode.value.includes(tag);
    });
    if (newTags.length > 0) {
        const before = headCode.value.trimEnd();
        headCode.value = (before ? before + "\n" : "") + newTags.join("\n");
        changed();
    }
}

// --- Buttons -------------------------------------------------------------

// Save the page as a file. A Blob is a file in memory, and
// URL.createObjectURL() gives it an address a link can point to.
function download() {
    const blob = new Blob([buildPage(readCode(), false).text], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "playground.html";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

// Reset needs two clicks, so the code isn't lost by mistake.
function reset() {
    if (resetButton.dataset.sure) {
        delete resetButton.dataset.sure;
        resetButton.textContent = "Reset";
        fill(EXAMPLE);
        save();
        run();
        return;
    }
    resetButton.dataset.sure = "yes";
    resetButton.textContent = "Click again to reset";
    setTimeout(function () {
        delete resetButton.dataset.sure;
        resetButton.textContent = "Reset";
    }, 3000);
}

// Tab normally moves to the next field. In a code box it should indent.
// Esc first lets Tab leave the box, so keyboard users don't get stuck.
function handleKeys(event) {
    const box = event.target;
    if (event.key === "Escape") {
        box.dataset.leave = "yes";
        return;
    }
    if (event.key !== "Tab" || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey || box.dataset.leave) {
        delete box.dataset.leave;
        return;
    }
    event.preventDefault();
    box.setRangeText("  ", box.selectionStart, box.selectionEnd, "end");
    changed();
}

// --- Connect the page ----------------------------------------------------

codeBoxes.forEach(function (box) {
    box.addEventListener("input", changed);
    box.addEventListener("keydown", handleKeys);
});
librarySelect.addEventListener("change", addLibrary);
runButton.addEventListener("click", run);
autoRunBox.addEventListener("change", function () {
    save();
    runSoon();
});
downloadButton.addEventListener("click", download);
resetButton.addEventListener("click", reset);
clearConsoleButton.addEventListener("click", clearConsole);
window.addEventListener("message", receiveMessage);

// --- Start ---------------------------------------------------------------

fillLibraryList();
fill(load());
run();
