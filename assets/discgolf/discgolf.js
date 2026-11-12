/*
 * Disc golf score card.
 *
 * The page has three views: setup (players and course), play (one hole and
 * one player at a time) and card (a table with every score).
 *
 * Everything the app knows is in one object, "state". Every button changes
 * the state and then calls changed(), which saves the state in the browser
 * and draws the page again from it. So a reload, or closing the phone,
 * never loses the round.
 */

// --- State ---------------------------------------------------------------

const STORAGE_KEY = "discgolf-scorecard";

function newState() {
    return {
        view: "setup",  // "setup", "play" or "card"
        players: [],    // ["Anna", "Bo"]
        holes: 0,       // number of holes on the course
        par: [],        // par[hole]
        scores: [],     // scores[player][hole], null until entered
        hole: 0,        // the hole shown in the play view
        player: 0       // the player shown in the play view
    };
}

let state = loadState();

// --- Elements on the page ------------------------------------------------

function byId(id) {
    return document.getElementById(id);
}

const views = { setup: byId("setup"), play: byId("play"), card: byId("card") };

// Setup
const playerForm = byId("player-form");
const playerNameInput = byId("player-name");
const playerList = byId("player-list");
const noPlayersText = byId("no-players");
const courseSizeRadios = document.querySelectorAll("input[name='course-size']");
const customHolesInput = byId("custom-holes");
const defaultParInput = byId("default-par");
const startRoundButton = byId("start-round");

// Play
const holeNumberText = byId("hole-number");
const holeCountText = byId("hole-count");
const prevHoleButton = byId("prev-hole");
const nextHoleButton = byId("next-hole");
const parText = byId("par-value");
const parMinusButton = byId("par-minus");
const parPlusButton = byId("par-plus");
const playerNameText = byId("player-current");
const prevPlayerButton = byId("prev-player");
const nextPlayerButton = byId("next-player");
const scoreText = byId("score-value");
const scoreLabel = byId("score-label");
const scoreMinusButton = byId("score-minus");
const scorePlusButton = byId("score-plus");
const playerTotalText = byId("player-total");
const playerDots = byId("player-dots");
const showCardButton = byId("show-card");
const newRoundButton = byId("new-round");

// Card
const scorecardTable = byId("scorecard");
const backToPlayButton = byId("back-to-play");

// --- Saving --------------------------------------------------------------

// localStorage keeps text in the browser, also after a reload. It can be
// turned off (private windows), so every use is inside try/catch.
function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        // Not saved, but the app still works until the page is closed.
    }
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        // Only use it if it looks like our state, not something old or broken.
        if (saved && Array.isArray(saved.players) && Array.isArray(saved.scores)) {
            return saved;
        }
    } catch (error) {
        // Fall through and start fresh.
    }
    return newState();
}

// Call this after every change to the state.
function changed() {
    saveState();
    render();
}

// --- Helpers -------------------------------------------------------------

// Keep a number between min and max.
function clamp(number, min, max) {
    return Math.min(max, Math.max(min, number));
}

function selectedHoleCount() {
    const size = document.querySelector("input[name='course-size']:checked").value;

    if (size === "custom") {
        return clamp(parseInt(customHolesInput.value, 10) || 1, 1, 99);
    }
    return Number(size);
}

// The score shown for the current player and hole. Before anything is
// entered we show par, which is the most likely score.
function currentScore() {
    const score = state.scores[state.player][state.hole];
    return score === null ? state.par[state.hole] : score;
}

function setCurrentScore(score) {
    state.scores[state.player][state.hole] = Math.max(1, score);
}

// Strokes so far, and how far over or under par that is.
function playerTotals(player) {
    let strokes = 0;
    let par = 0;

    state.scores[player].forEach(function (score, hole) {
        if (score !== null) {
            strokes += score;
            par += state.par[hole];
        }
    });
    return { strokes: strokes, diff: strokes - par };
}

// 0 -> "E" (even), 2 -> "+2", -1 -> "-1"
function formatDiff(diff) {
    if (diff === 0) {
        return "E";
    }
    return diff > 0 ? "+" + diff : String(diff);
}

const SCORE_NAMES = {
    "-3": "Albatross",
    "-2": "Eagle",
    "-1": "Birdie",
    "0": "Par",
    "1": "Bogey",
    "2": "Double bogey",
    "3": "Triple bogey"
};

function scoreName(score, par) {
    if (score === 1) {
        return "Ace!";
    }
    const diff = score - par;
    return SCORE_NAMES[diff] || formatDiff(diff);
}

// A CSS class that colors a score: under, even or over par.
function scoreClass(score, par) {
    if (score === null) {
        return "";
    }
    if (score < par) {
        return "dg-under";
    }
    if (score > par) {
        return "dg-over";
    }
    return "dg-even";
}

// --- Drawing -------------------------------------------------------------

function render() {
    // Show the current view and hide the other two.
    for (const name in views) {
        views[name].hidden = name !== state.view;
    }

    if (state.view === "setup") {
        renderSetup();
    } else if (state.view === "play") {
        renderPlay();
    } else {
        renderCard();
    }
}

function renderSetup() {
    playerList.innerHTML = "";

    state.players.forEach(function (name, index) {
        const item = document.createElement("li");
        const nameText = document.createElement("span");
        nameText.textContent = name;

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "dg-small-btn";
        removeButton.textContent = "×";
        removeButton.setAttribute("aria-label", "Remove " + name);
        removeButton.addEventListener("click", function () {
            state.players.splice(index, 1);   // remove 1 item at index
            changed();
        });

        item.append(nameText, removeButton);
        playerList.appendChild(item);
    });

    noPlayersText.hidden = state.players.length > 0;
    startRoundButton.disabled = state.players.length === 0;
    showCustomHoles();
}

function renderPlay() {
    const par = state.par[state.hole];
    const score = currentScore();
    const entered = state.scores[state.player][state.hole] !== null;
    const isFirst = state.hole === 0 && state.player === 0;
    const isLast = state.hole === state.holes - 1 && state.player === state.players.length - 1;

    holeNumberText.textContent = state.hole + 1;
    holeCountText.textContent = state.holes;
    prevHoleButton.disabled = state.hole === 0;
    nextHoleButton.disabled = state.hole === state.holes - 1;
    parText.textContent = par;

    playerNameText.textContent = state.players[state.player];
    prevPlayerButton.disabled = isFirst;
    nextPlayerButton.disabled = isLast;

    // A score that is only a suggestion (par) is shown grey.
    scoreText.textContent = score;
    scoreText.className = "dg-score-value " + (entered ? scoreClass(score, par) : "dg-pending");
    scoreLabel.textContent = scoreName(score, par);

    const totals = playerTotals(state.player);
    playerTotalText.textContent = "Total: " + totals.strokes + " (" + formatDiff(totals.diff) + ")";

    // One dot per player: filled when their score on this hole is entered.
    playerDots.innerHTML = "";
    state.players.forEach(function (name, index) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "dg-dot";
        dot.classList.toggle("dg-dot-active", index === state.player);
        dot.classList.toggle("dg-dot-done", state.scores[index][state.hole] !== null);
        dot.title = name;
        dot.setAttribute("aria-label", name);
        dot.addEventListener("click", function () {
            state.player = index;
            changed();
        });
        playerDots.appendChild(dot);
    });
}

function renderCard() {
    scorecardTable.innerHTML = "";

    // Header: Hole, Par, then one column per player.
    const head = scorecardTable.createTHead().insertRow();
    ["Hole", "Par"].concat(state.players).forEach(function (text) {
        const cell = document.createElement("th");
        cell.textContent = text;
        head.appendChild(cell);
    });

    // One row per hole. Clicking a score opens it in the play view.
    const body = scorecardTable.createTBody();
    for (let hole = 0; hole < state.holes; hole++) {
        const row = body.insertRow();
        row.insertCell().textContent = hole + 1;
        row.insertCell().textContent = state.par[hole];

        state.players.forEach(function (name, player) {
            const score = state.scores[player][hole];
            const cell = row.insertCell();
            cell.textContent = score === null ? "–" : score;
            cell.className = scoreClass(score, state.par[hole]);
            cell.addEventListener("click", function () {
                state.hole = hole;
                state.player = player;
                state.view = "play";
                changed();
            });
        });
    }

    // Footer: the totals.
    const foot = scorecardTable.createTFoot().insertRow();
    foot.insertCell().textContent = "Total";
    foot.insertCell().textContent = state.par.reduce(function (sum, par) {
        return sum + par;
    }, 0);
    state.players.forEach(function (name, player) {
        const totals = playerTotals(player);
        foot.insertCell().textContent = totals.strokes + " (" + formatDiff(totals.diff) + ")";
    });
}

// The number box is only shown when "Custom" is picked.
function showCustomHoles() {
    const size = document.querySelector("input[name='course-size']:checked").value;
    customHolesInput.hidden = size !== "custom";
}

// --- Actions -------------------------------------------------------------

function addPlayer(event) {
    // A form normally sends the page to the server and reloads it. We
    // handle it here instead, so stop that.
    event.preventDefault();

    const name = playerNameInput.value.trim();
    if (name === "") {
        return;
    }
    state.players.push(name);
    playerNameInput.value = "";
    playerNameInput.focus();
    changed();
}

function startRound() {
    const holes = selectedHoleCount();
    const par = clamp(parseInt(defaultParInput.value, 10) || 3, 2, 9);

    state.holes = holes;
    state.par = Array(holes).fill(par);
    // One list of scores per player, all empty (null) to begin with.
    state.scores = state.players.map(function () {
        return Array(holes).fill(null);
    });
    state.hole = 0;
    state.player = 0;
    state.view = "play";
    changed();
}

// Next player, or the first player on the next hole. Moving on also
// saves the score that is shown, so par only needs one tap.
function nextPlayer() {
    setCurrentScore(currentScore());

    if (state.player < state.players.length - 1) {
        state.player++;
    } else if (state.hole < state.holes - 1) {
        state.player = 0;
        state.hole++;
    }
    changed();
}

function prevPlayer() {
    if (state.player > 0) {
        state.player--;
    } else if (state.hole > 0) {
        state.player = state.players.length - 1;
        state.hole--;
    }
    changed();
}

function changeHole(step) {
    state.hole = clamp(state.hole + step, 0, state.holes - 1);
    state.player = 0;
    changed();
}

function changePar(step) {
    state.par[state.hole] = clamp(state.par[state.hole] + step, 2, 9);
    changed();
}

function changeScore(step) {
    setCurrentScore(currentScore() + step);
    changed();
}

function showView(view) {
    state.view = view;
    changed();
}

function newRound() {
    if (!confirm("Start a new round? The current scores will be cleared.")) {
        return;
    }
    state.scores = [];
    showView("setup");
}

// Arrow keys work in the play view, but not while typing in a box.
function onKey(event) {
    if (state.view !== "play" || event.target.tagName === "INPUT") {
        return;
    }
    const actions = {
        ArrowRight: nextPlayer,
        ArrowLeft: prevPlayer,
        ArrowUp: function () { changeScore(1); },
        ArrowDown: function () { changeScore(-1); }
    };
    if (actions[event.key]) {
        event.preventDefault();   // don't scroll the page
        actions[event.key]();
    }
}

// --- Connect the page ----------------------------------------------------

playerForm.addEventListener("submit", addPlayer);
courseSizeRadios.forEach(function (radio) {
    radio.addEventListener("change", showCustomHoles);
});
startRoundButton.addEventListener("click", startRound);

prevHoleButton.addEventListener("click", function () { changeHole(-1); });
nextHoleButton.addEventListener("click", function () { changeHole(1); });
parMinusButton.addEventListener("click", function () { changePar(-1); });
parPlusButton.addEventListener("click", function () { changePar(1); });
prevPlayerButton.addEventListener("click", prevPlayer);
nextPlayerButton.addEventListener("click", nextPlayer);
scoreMinusButton.addEventListener("click", function () { changeScore(-1); });
scorePlusButton.addEventListener("click", function () { changeScore(1); });

showCardButton.addEventListener("click", function () { showView("card"); });
backToPlayButton.addEventListener("click", function () { showView("play"); });
newRoundButton.addEventListener("click", newRound);

document.addEventListener("keydown", onKey);

// --- Start ---------------------------------------------------------------

render();
