const STORAGE_KEY = "discgolf-scorecard";

const ui = {
  setup: document.getElementById("setup"),
  play: document.getElementById("play"),
  card: document.getElementById("card"),
  playerForm: document.getElementById("player-form"),
  playerName: document.getElementById("player-name"),
  playerList: document.getElementById("player-list"),
  noPlayers: document.getElementById("no-players"),
  courseSizes: document.querySelectorAll("input[name='course-size']"),
  customHoles: document.getElementById("custom-holes"),
  defaultPar: document.getElementById("default-par"),
  startRound: document.getElementById("start-round"),
  holeNumber: document.getElementById("hole-number"),
  holeCount: document.getElementById("hole-count"),
  prevHole: document.getElementById("prev-hole"),
  nextHole: document.getElementById("next-hole"),
  parValue: document.getElementById("par-value"),
  parMinus: document.getElementById("par-minus"),
  parPlus: document.getElementById("par-plus"),
  playerCurrent: document.getElementById("player-current"),
  prevPlayer: document.getElementById("prev-player"),
  nextPlayer: document.getElementById("next-player"),
  scoreValue: document.getElementById("score-value"),
  scoreLabel: document.getElementById("score-label"),
  scoreMinus: document.getElementById("score-minus"),
  scorePlus: document.getElementById("score-plus"),
  playerTotal: document.getElementById("player-total"),
  playerDots: document.getElementById("player-dots"),
  showCard: document.getElementById("show-card"),
  newRound: document.getElementById("new-round"),
  backToPlay: document.getElementById("back-to-play"),
  scorecard: document.getElementById("scorecard"),
};

let state = loadState() || {
  view: "setup",
  players: [],
  holes: 0,
  par: [],
  scores: [], // scores[player][hole], null until entered
  hole: 0,
  player: 0,
};

/* ---------- Persistence ---------- */

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch (e) {
    return null;
  }
}

/* ---------- Helpers ---------- */

function selectedHoleCount() {
  const size = document.querySelector("input[name='course-size']:checked").value;
  if (size === "custom") {
    return Math.min(99, Math.max(1, parseInt(ui.customHoles.value, 10) || 1));
  }
  return parseInt(size, 10);
}

function currentScore() {
  const score = state.scores[state.player][state.hole];
  return score === null ? state.par[state.hole] : score;
}

function setCurrentScore(value) {
  state.scores[state.player][state.hole] = Math.max(1, value);
}

function playerTotals(playerIndex) {
  let strokes = 0;
  let par = 0;
  state.scores[playerIndex].forEach((score, hole) => {
    if (score !== null) {
      strokes += score;
      par += state.par[hole];
    }
  });
  return { strokes, diff: strokes - par };
}

function formatDiff(diff) {
  if (diff === 0) return "E";
  return diff > 0 ? "+" + diff : String(diff);
}

function scoreName(score, par) {
  if (score === 1) return "Ace!";
  const names = {
    "-3": "Albatross",
    "-2": "Eagle",
    "-1": "Birdie",
    0: "Par",
    1: "Bogey",
    2: "Double bogey",
    3: "Triple bogey",
  };
  const diff = score - par;
  return names[diff] || formatDiff(diff);
}

function scoreClass(score, par) {
  if (score === null) return "";
  if (score < par) return "dg-under";
  if (score > par) return "dg-over";
  return "dg-even";
}

/* ---------- Rendering ---------- */

function render() {
  ui.setup.hidden = state.view !== "setup";
  ui.play.hidden = state.view !== "play";
  ui.card.hidden = state.view !== "card";

  if (state.view === "setup") renderSetup();
  if (state.view === "play") renderPlay();
  if (state.view === "card") renderCard();
}

function renderSetup() {
  ui.playerList.innerHTML = "";
  state.players.forEach((name, index) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = name;
    const remove = document.createElement("button");
    remove.className = "dg-small-btn";
    remove.setAttribute("aria-label", "Remove " + name);
    remove.innerHTML = "&times;";
    remove.addEventListener("click", () => {
      state.players.splice(index, 1);
      saveState();
      render();
    });
    li.append(span, remove);
    ui.playerList.appendChild(li);
  });
  ui.noPlayers.hidden = state.players.length > 0;
  ui.startRound.disabled = state.players.length === 0;
}

function renderPlay() {
  const par = state.par[state.hole];
  const score = currentScore();
  const entered = state.scores[state.player][state.hole] !== null;

  ui.holeNumber.textContent = state.hole + 1;
  ui.holeCount.textContent = state.holes;
  ui.prevHole.disabled = state.hole === 0;
  ui.nextHole.disabled = state.hole === state.holes - 1;
  ui.parValue.textContent = par;

  ui.playerCurrent.textContent = state.players[state.player];
  ui.prevPlayer.disabled = state.hole === 0 && state.player === 0;
  ui.nextPlayer.disabled =
    state.hole === state.holes - 1 && state.player === state.players.length - 1;

  ui.scoreValue.textContent = score;
  ui.scoreValue.className = "dg-score-value " + (entered ? scoreClass(score, par) : "dg-pending");
  ui.scoreLabel.textContent = scoreName(score, par);

  const totals = playerTotals(state.player);
  ui.playerTotal.textContent =
    "Total: " + totals.strokes + " (" + formatDiff(totals.diff) + ")";

  ui.playerDots.innerHTML = "";
  state.players.forEach((name, index) => {
    const dot = document.createElement("button");
    dot.className = "dg-dot";
    if (index === state.player) dot.classList.add("dg-dot-active");
    if (state.scores[index][state.hole] !== null) dot.classList.add("dg-dot-done");
    dot.setAttribute("aria-label", name);
    dot.title = name;
    dot.addEventListener("click", () => {
      state.player = index;
      saveState();
      render();
    });
    ui.playerDots.appendChild(dot);
  });
}

function renderCard() {
  const table = ui.scorecard;
  table.innerHTML = "";

  const head = table.createTHead().insertRow();
  ["Hole", "Par"].concat(state.players).forEach((text) => {
    const th = document.createElement("th");
    th.textContent = text;
    head.appendChild(th);
  });

  const body = table.createTBody();
  for (let hole = 0; hole < state.holes; hole++) {
    const row = body.insertRow();
    row.insertCell().textContent = hole + 1;
    row.insertCell().textContent = state.par[hole];
    state.players.forEach((_, player) => {
      const score = state.scores[player][hole];
      const cell = row.insertCell();
      cell.textContent = score === null ? "–" : score;
      cell.className = scoreClass(score, state.par[hole]);
      cell.addEventListener("click", () => {
        state.hole = hole;
        state.player = player;
        state.view = "play";
        saveState();
        render();
      });
    });
  }

  const foot = table.createTFoot().insertRow();
  foot.insertCell().textContent = "Total";
  foot.insertCell().textContent = state.par.reduce((a, b) => a + b, 0);
  state.players.forEach((_, player) => {
    const totals = playerTotals(player);
    foot.insertCell().textContent = totals.strokes + " (" + formatDiff(totals.diff) + ")";
  });
}

/* ---------- Navigation ---------- */

function goNextPlayer() {
  // Moving forward confirms the shown score (par by default)
  setCurrentScore(currentScore());
  if (state.player < state.players.length - 1) {
    state.player++;
  } else if (state.hole < state.holes - 1) {
    state.player = 0;
    state.hole++;
  }
  saveState();
  render();
}

function goPrevPlayer() {
  if (state.player > 0) {
    state.player--;
  } else if (state.hole > 0) {
    state.player = state.players.length - 1;
    state.hole--;
  }
  saveState();
  render();
}

function changeHole(step) {
  state.hole = Math.min(state.holes - 1, Math.max(0, state.hole + step));
  state.player = 0;
  saveState();
  render();
}

/* ---------- Events ---------- */

ui.playerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = ui.playerName.value.trim();
  if (!name) return;
  state.players.push(name);
  ui.playerName.value = "";
  ui.playerName.focus();
  saveState();
  render();
});

ui.courseSizes.forEach((radio) => {
  radio.addEventListener("change", () => {
    ui.customHoles.hidden = radio.value !== "custom" || !radio.checked;
  });
});

ui.startRound.addEventListener("click", () => {
  const holes = selectedHoleCount();
  const par = Math.min(9, Math.max(2, parseInt(ui.defaultPar.value, 10) || 3));
  state.holes = holes;
  state.par = Array(holes).fill(par);
  state.scores = state.players.map(() => Array(holes).fill(null));
  state.hole = 0;
  state.player = 0;
  state.view = "play";
  saveState();
  render();
});

ui.prevHole.addEventListener("click", () => changeHole(-1));
ui.nextHole.addEventListener("click", () => changeHole(1));
ui.prevPlayer.addEventListener("click", goPrevPlayer);
ui.nextPlayer.addEventListener("click", goNextPlayer);

ui.parMinus.addEventListener("click", () => {
  state.par[state.hole] = Math.max(2, state.par[state.hole] - 1);
  saveState();
  render();
});

ui.parPlus.addEventListener("click", () => {
  state.par[state.hole] = Math.min(9, state.par[state.hole] + 1);
  saveState();
  render();
});

ui.scoreMinus.addEventListener("click", () => {
  setCurrentScore(currentScore() - 1);
  saveState();
  render();
});

ui.scorePlus.addEventListener("click", () => {
  setCurrentScore(currentScore() + 1);
  saveState();
  render();
});

ui.showCard.addEventListener("click", () => {
  state.view = "card";
  saveState();
  render();
});

ui.backToPlay.addEventListener("click", () => {
  state.view = "play";
  saveState();
  render();
});

ui.newRound.addEventListener("click", () => {
  if (!confirm("Start a new round? The current scores will be cleared.")) return;
  state.view = "setup";
  state.scores = [];
  saveState();
  render();
});

document.addEventListener("keydown", (event) => {
  if (state.view !== "play" || event.target.tagName === "INPUT") return;
  const actions = {
    ArrowRight: goNextPlayer,
    ArrowLeft: goPrevPlayer,
    ArrowUp: () => ui.scorePlus.click(),
    ArrowDown: () => ui.scoreMinus.click(),
  };
  if (actions[event.key]) {
    event.preventDefault();
    actions[event.key]();
  }
});

render();
