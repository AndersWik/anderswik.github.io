/*
 * Memory: all cards lie face down, and every picture is on two cards.
 * Turn up two cards. If they match, they stay up; if not, they turn back.
 * Find all the pairs in as few moves as you can.
 */

// --- Settings ------------------------------------------------------------

// Where the pictures are. On a page of your own: "images/".
const IMAGE_FOLDER = "/assets/memory/images/";

const PICTURES = [
    "blue-star", "green-star", "purple-star", "yellow-star",
    "blue-triangel", "green-triangel", "purple-triangel", "yellow-triangel",
    "blue-square", "green-square", "purple-square", "yellow-square"
];
const TURN_BACK_TIME = 800;   // ms to look at two cards that don't match

// --- Elements on the page ------------------------------------------------

const board = document.getElementById("board");
const sizeSelect = document.getElementById("size");
const statusText = document.getElementById("status");
const restartButton = document.getElementById("restart");

// --- State ---------------------------------------------------------------

let cards = [];        // { name, element, up }
let open = [];         // the cards turned up this move (0, 1 or 2)
let moves = 0;
let pairsFound = 0;
let turnBackTimer = null;

// --- Helpers -------------------------------------------------------------

// A shuffled copy of a list (the Fisher-Yates shuffle).
function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = copy[i];
        copy[i] = copy[j];
        copy[j] = temp;
    }
    return copy;
}

function showStatus() {
    if (pairsFound === cards.length / 2) {
        statusText.textContent = "You found all the pairs in " + moves + " moves!";
    } else {
        statusText.textContent = "Moves: " + moves;
    }
}

// --- The game ------------------------------------------------------------

function newGame() {
    clearTimeout(turnBackTimer);

    // Two of each picture, in random order.
    const pairs = Number(sizeSelect.value);
    const names = PICTURES.slice(0, pairs);
    const deck = shuffle(names.concat(names));

    board.innerHTML = "";
    cards = deck.map(function (name) {
        const element = document.createElement("button");
        element.type = "button";
        element.className = "card down";
        const image = document.createElement("img");
        image.src = IMAGE_FOLDER + name + ".svg";
        image.alt = name.replace("-", " ");
        element.appendChild(image);
        board.appendChild(element);

        const card = { name: name, element: element, up: false };
        element.addEventListener("click", function () {
            turnUp(card);
        });
        return card;
    });

    open = [];
    moves = 0;
    pairsFound = 0;
    showStatus();
}

function turnUp(card) {
    // Not while two cards are showing, and not a card that is already up.
    if (open.length === 2 || card.up) {
        return;
    }
    card.up = true;
    card.element.classList.remove("down");
    open.push(card);

    if (open.length === 2) {
        moves++;
        if (open[0].name === open[1].name) {
            pairsFound++;
            open = [];   // a pair: they stay up
        } else {
            turnBackTimer = setTimeout(turnBack, TURN_BACK_TIME);
        }
    }
    showStatus();
}

function turnBack() {
    open.forEach(function (card) {
        card.up = false;
        card.element.classList.add("down");
    });
    open = [];
}

// --- Connect the page ----------------------------------------------------

sizeSelect.addEventListener("change", newGame);
restartButton.addEventListener("click", newGame);

newGame();
