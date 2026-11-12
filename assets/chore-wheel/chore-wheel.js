/*
 * Chore wheel: add chores and people, spin the wheel, and see who does what.
 *
 * The chores are slices of a wheel drawn on a canvas. The people's names
 * sit around the wheel. The wheel spins with a CSS transition, and when it
 * stops, each person gets the chore their name points at.
 */

// --- Settings ------------------------------------------------------------

const COLORS = ["#ff0000", "#ffff00", "#00ff00", "#0000ff", "#ff00ff", "#ffa500", "#a020f0", "#6495ed"];
const SPIN_TIME = 4000;   // ms, the same as the transition in the CSS
const TURNS = 10;         // whole turns before it slows down

// --- Elements on the page ------------------------------------------------

const wheel = document.getElementById("wheel");
const ctx = wheel.getContext("2d");
const namesContainer = document.getElementById("names-container");
const choreForm = document.getElementById("chore-form");
const choreInput = document.getElementById("choreInput");
const personForm = document.getElementById("person-form");
const personInput = document.getElementById("personInput");
const spinButton = document.getElementById("spinButton");
const choreList = document.getElementById("choreList");
const peopleList = document.getElementById("peopleList");
const resultText = document.getElementById("result");

// --- State ---------------------------------------------------------------

let chores = [];
let people = [];
let rotation = 0;      // degrees the wheel is turned, 0-359
let spinning = false;

// --- Helpers -------------------------------------------------------------

// Angles of the people around the wheel, in degrees. The first person is
// at the top (-90°, because 0° points right and angles go clockwise).
function personAngle(index) {
    return index * 360 / people.length - 90;
}

// Which chore is under the person at this angle when the wheel has turned
// "rotation" degrees? Turn the angle back by the rotation to find the place
// on the unturned wheel, then see which slice that is.
function choreAt(angle) {
    const sliceSize = 360 / chores.length;
    const onWheel = ((angle - rotation) % 360 + 360) % 360; // keep it 0-359
    return chores[Math.floor(onWheel / sliceSize)];
}

// --- Drawing -------------------------------------------------------------

function drawWheel() {
    const center = wheel.width / 2;
    const sliceAngle = 2 * Math.PI / chores.length;

    ctx.clearRect(0, 0, wheel.width, wheel.height);

    chores.forEach(function (chore, i) {
        // A slice: from the center, along the edge, back to the center.
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, center, i * sliceAngle, (i + 1) * sliceAngle);
        ctx.closePath();
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fill();
        ctx.stroke();

        // The text: turn the canvas to the middle of the slice and write
        // it along the radius, ending near the edge.
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(i * sliceAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "black";
        ctx.font = "bold 16px Arial";
        ctx.fillText(chore, center - 30, 5);
        ctx.restore();
    });

    // The names are HTML elements around the wheel. Their positions are in
    // percent, so they follow the wheel when it is shown smaller.
    namesContainer.innerHTML = "";
    people.forEach(function (person, i) {
        const radians = personAngle(i) * Math.PI / 180;
        const label = document.createElement("div");
        label.className = "name-label";
        label.style.left = (50 + Math.cos(radians) * 57) + "%";
        label.style.top = (50 + Math.sin(radians) * 57) + "%";
        label.textContent = person;
        namesContainer.appendChild(label);
    });
}

// A list of items, each with a remove button.
function showList(list, items, remove) {
    list.innerHTML = "";
    items.forEach(function (item, index) {
        const li = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "remove";
        button.textContent = "X";
        button.setAttribute("aria-label", "Remove " + item);
        button.addEventListener("click", function () {
            remove(index);
        });
        li.append(button, item);   // append() with text adds it as text, not HTML
        list.appendChild(li);
    });
}

function render() {
    showList(choreList, chores, removeChore);
    showList(peopleList, people, removePerson);
    drawWheel();
}

// --- Actions -------------------------------------------------------------

function addItem(event, input, items) {
    event.preventDefault();   // don't let the form reload the page
    const text = input.value.trim();
    if (spinning || text === "") {
        return;
    }
    items.push(text);
    input.value = "";
    resultText.textContent = "";
    render();
}

function removeChore(index) {
    if (!spinning) {
        chores.splice(index, 1);
        render();
    }
}

function removePerson(index) {
    if (!spinning) {
        people.splice(index, 1);
        render();
    }
}

function spinWheel() {
    if (spinning) {
        return;
    }
    if (chores.length === 0 || people.length === 0) {
        resultText.textContent = "Please add at least one chore and one person first!";
        return;
    }

    spinning = true;
    spinButton.disabled = true;
    resultText.textContent = "";

    // Spin from where the wheel is now, many turns plus a random angle.
    // The CSS transition makes the turn smooth and slow down at the end.
    const extra = Math.floor(Math.random() * 360);
    wheel.style.transition = "transform " + SPIN_TIME + "ms ease-out";
    wheel.style.transform = "rotate(" + (rotation + TURNS * 360 + extra) + "deg)";

    setTimeout(function () {
        // Jump back to the same angle without the extra turns, so the
        // numbers don't keep growing. It looks exactly the same.
        rotation = (rotation + extra) % 360;
        wheel.style.transition = "none";
        wheel.style.transform = "rotate(" + rotation + "deg)";

        resultText.textContent = people.map(function (person, i) {
            return person + ": " + choreAt(personAngle(i));
        }).join("\n");

        spinning = false;
        spinButton.disabled = false;
    }, SPIN_TIME);
}

// --- Connect the page ----------------------------------------------------

choreForm.addEventListener("submit", function (event) {
    addItem(event, choreInput, chores);
});
personForm.addEventListener("submit", function (event) {
    addItem(event, personInput, people);
});
spinButton.addEventListener("click", spinWheel);
