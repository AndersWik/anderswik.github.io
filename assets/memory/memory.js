const images = {
  xs: ["blue-star", "green-star", "purple-star", "yellow-star"],
  s: [
    "blue-star",
    "green-star",
    "purple-star",
    "yellow-star",
    "blue-triangel",
    "green-triangel",
  ],
  m: [
    "blue-star",
    "green-star",
    "purple-star",
    "yellow-star",
    "blue-triangel",
    "green-triangel",
    "purple-triangel",
    "yellow-triangel",
  ],
  l: [
    "blue-star",
    "green-star",
    "purple-star",
    "yellow-star",
    "blue-triangel",
    "green-triangel",
    "purple-triangel",
    "yellow-triangel",
    "blue-square",
    "green-square",
  ],
  xl: [
    "blue-star",
    "green-star",
    "purple-star",
    "yellow-star",
    "blue-triangel",
    "green-triangel",
    "purple-triangel",
    "yellow-triangel",
    "blue-square",
    "green-square",
    "purple-square",
    "yellow-square",
  ],
};

let shuffled = [];
let selected = [];
let matched = [];
let size = "xs";

const uiDisplay = {
  board: document.getElementById("board"),
  shuffle: document.getElementById("shuffle"),
  size: document.getElementById("size"),
  overlay: document.getElementById("overlay"),
  resultMessage: document.getElementById("resultMessage"),
  restart: document.getElementById("restart"),
};

function init() {
  shuffled = [];
  selected = [];
  matched = [];
  createDeck();
  shuffle();
  setupCards();
}

function createDeck() {
  shuffled = images[size].slice();
  let temp = images[size].slice();
  shuffled = shuffled.concat(temp);
}

function shuffle() {
  for (let i = 0; i < shuffled.length; i++) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
}

function setupCards() {
  uiDisplay.board.innerHTML = "";
  shuffled.forEach((name, index) => {
    let card = document.createElement("div");
    let image = document.createElement("img");
    image.src = "/assets/memory/images/" + name + ".svg";
    card.appendChild(image);
    card.classList.add("card", "hidden");
    card.dataset.index = index;
    card.dataset.name = name;
    card.addEventListener("click", flipCard);
    uiDisplay.board.appendChild(card);
  });
}

function flipCard() {
  if (selected.length < 2 && !matched.includes(this.dataset.index)) {
    this.classList.remove("hidden");
    selected.push(this);
  }

  if (selected.length === 2) {
    setTimeout(checkMatch, 500);
  }
}

function checkMatch() {
  if (selected[0].dataset.name === selected[1].dataset.name) {
    matched.push(selected[0].dataset.index, selected[1].dataset.index);
  } else {
    selected.forEach((card) => {
      card.classList.add("hidden");
    });
  }
  selected = [];
  if (matched.length === shuffled.length) {
    uiDisplay.overlay.style.display = "block";
    uiDisplay.resultMessage.innerHTML = "You Win!";
  }
}

uiDisplay.restart.addEventListener("click", function () {
  uiDisplay.overlay.style.display = "none";
  init();
});

uiDisplay.size.addEventListener("change", function () {
  size = uiDisplay.size.value;
  init();
});

window.onload = function () {
  init();
};
