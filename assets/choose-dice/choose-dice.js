const uiDisplay = {
  diceTypes: document.getElementById("dice-type"),
  dicePreview: document.getElementById("dice-preview"),
  dicePrevText: document.getElementById("preview-text"),
  diceBtn: document.getElementById("roll-dice-btn"),
  diceSelected: document.getElementById("dice-selected"),
  diceResult: document.getElementById("dice-result"),
};

uiDisplay.diceTypes.addEventListener("change", function () {
  uiDisplay.dicePrevText.textContent = uiDisplay.diceTypes.value;
  uiDisplay.dicePreview.style.backgroundImage = setDiceBackground(
    uiDisplay.diceTypes.value
  );
  uiDisplay.diceSelected.textContent = setDiceChoosen(
    uiDisplay.diceTypes.value
  );
});

function setDiceBackground(value) {
  let result = "";
  switch (value) {
    case "4":
      result = "url(/assets/choose-dice/images/d4.svg)";
      break;
    case "6":
      result = "url(/assets/choose-dice/images/d6.svg)";
      break;
    case "8":
      result = "url(/assets/choose-dice/images/d8.svg)";
      break;
    case "10":
      result = "url(/assets/choose-dice/images/d10.svg)";
      break;
    case "12":
      result = "url(/assets/choose-dice/images/d12.svg)";
      break;
    case "20":
      result = "url(/assets/choose-dice/images/d20.svg)";
      break;
  }
  return result;
}

function setDiceChoosen(value) {
  let result = "";
  switch (value) {
    case "4":
      result = "D4 (4 sides) selected";
      break;
    case "6":
      result = "D6 (6 sides) selected";
      break;
    case "8":
      result = "D8 (8 sides) selected";
      break;
    case "10":
      result = "D10 (10 sides) selected";
      break;
    case "12":
      result = "D12 (12 sides) selected";
      break;
    case "20":
      result = "D20 (20 sides) selected";
      break;
  }
  return result;
}

function rollDice() {
  uiDisplay.dicePreview.classList.add("spin");
  setTimeout(() => {
    uiDisplay.dicePreview.classList.remove("spin");
  }, 1000);
  const diceType = uiDisplay.diceTypes.value;
  const result = Math.floor(Math.random() * (diceType - 1) + 1);
  uiDisplay.dicePrevText.textContent = result;
  uiDisplay.diceResult.textContent = "You rolled " + result;
}

window.onload = function () {
  uiDisplay.diceSelected.textContent = "Select a die and click Roll!";
};

uiDisplay.diceBtn.addEventListener("click", rollDice);
