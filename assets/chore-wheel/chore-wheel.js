let colors = [
  "#ff0000",
  "#FFFF00",
  "#00FF00",
  "#0000FF",
  "#FF00FF",
  "#FFA500",
  "#A020F0",
  "#6495ED",
];
let chores = [];
let people = [];
let spinning = false;

const uiDisplay = {
  wheelCanvas: document.getElementById("wheel"),
  namesContainer: document.getElementById("names-container"),
  choreInput: document.getElementById("choreInput"),
  choreButton: document.getElementById("choreButton"),
  personInput: document.getElementById("personInput"),
  personButton: document.getElementById("personButton"),
  spinButton: document.getElementById("spinButton"),
  choreList: document.getElementById("choreList"),
  peopleList: document.getElementById("peopleList"),
  result: document.getElementById("result"),
};

let ctx = uiDisplay.wheelCanvas.getContext("2d");

function addChore() {
  if (spinning) {
    return;
  }
  let chore = uiDisplay.choreInput.value;
  if (chore) {
    chores.push(chore);
    uiDisplay.choreInput.value = "";
    updateLists();
    drawWheel();
  }
}

function addPerson() {
  if (spinning) {
    return;
  }
  let person = uiDisplay.personInput.value;
  if (person) {
    people.push(person);
    uiDisplay.personInput.value = "";
    updateLists();
    drawWheel();
  }
}

function removeChore(index) {
  if (spinning) {
    return;
  }
  chores.splice(index, 1);
  updateLists();
  drawWheel();
}

function removePerson(index) {
  if (spinning) {
    return;
  }
  people.splice(index, 1);
  updateLists();
  drawWheel();
}

function updateLists() {
  updateListWithItems(chores, uiDisplay.choreList, "removeChore");
  updateListWithItems(people, uiDisplay.peopleList, "removePerson");
}

function updateListWithItems(items, list, clickFunction) {
  list.innerHTML = "";
  items.forEach((item, index) => {
    let li = document.createElement("li");
    li.innerHTML = `<button class="remove" onclick="${clickFunction}(${index})">X</button> ${item}`;
    list.appendChild(li);
  });
}

function getColor(index) {
  return colors[index % colors.length];
}

function drawWheel() {
  ctx.clearRect(
    0,
    0,
    uiDisplay.wheelCanvas.width,
    uiDisplay.wheelCanvas.height
  );
  uiDisplay.namesContainer.innerHTML = "";
  let numSlices = chores.length;
  if (numSlices === 0) return;
  let sliceAngle = (2 * Math.PI) / numSlices;
  for (let i = 0; i < numSlices; i++) {
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 150, i * sliceAngle, (i + 1) * sliceAngle);
    ctx.fillStyle = getColor(i);
    ctx.fill();
    ctx.stroke();

    // Draw chore names inside the slices
    let angle = i * sliceAngle + sliceAngle / 2;
    ctx.save();
    ctx.translate(150, 150);
    ctx.rotate(angle);
    ctx.textAlign = "right";
    ctx.fillStyle = "black";
    ctx.font = "bold 16px Arial";
    ctx.fillText(chores[i] || "", 120, 5);
    ctx.restore();
  }

  // Draw names outside the circle
  for (let i = 0; i < people.length; i++) {
    let angle = (i * (2 * Math.PI)) / people.length - Math.PI / 2;
    // Positions in % so the labels follow the wheel when it scales down
    let x = 50 + Math.cos(angle) * (170 / 3);
    let y = 50 + Math.sin(angle) * (170 / 3);
    let nameLabel = document.createElement("div");
    nameLabel.className = "name-label";
    nameLabel.style.left = `${x}%`;
    nameLabel.style.top = `${y}%`;
    nameLabel.style.whiteSpace = "nowrap";
    nameLabel.innerText = people[i];
    uiDisplay.namesContainer.appendChild(nameLabel);
  }
}

function spinWheel() {
  if (spinning) {
    return;
  } else if (chores.length === 0 || people.length === 0) {
    uiDisplay.result.innerText = "Please add chores and people first!";
    return;
  } else if (chores.length === 0) {
    uiDisplay.result.innerText = "Please add chores first!";
    return;
  } else if (people.length === 0) {
    uiDisplay.result.innerText = "Please add people first!";
    return;
  }

  spinning = true;
  let spins = 10;
  let lastRotation = Math.floor(Math.random() * 360);
  let finalAngle = spins * 360 + lastRotation;

  uiDisplay.wheelCanvas.style.transition = "transform 4s ease-out";
  uiDisplay.wheelCanvas.style.transform = `rotate(${finalAngle}deg)`;

  setTimeout(() => {
    uiDisplay.wheelCanvas.style.transition = "none";
    uiDisplay.wheelCanvas.style.transform = `rotate(${lastRotation}deg)`;
    spinning = false;
  }, 4000);
}

uiDisplay.choreButton.addEventListener("click", addChore);
uiDisplay.personButton.addEventListener("click", addPerson);
uiDisplay.spinButton.addEventListener("click", spinWheel);
