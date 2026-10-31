let headsCount = 0;
let tailsCount = 0;
let coinSwitch = true;

const uiDisplay = {
  flipCoinBtn: document.getElementById("flipCoinBtn"),
  resultHeads: document.getElementById("resultHeads"),
  resultTails: document.getElementById("resultTails"),
  resultCoinHeads: document.getElementById("resultCoinHeads"),
  resultCoinTails: document.getElementById("resultCoinTails"),
};

function flipCoin() {
  uiDisplay.flipCoinBtn.style.transform = "scale(1.2)";
  uiDisplay.flipCoinBtn.style.transition = "all 0.5s ease-in-out";

  let coinInterval = setInterval(switchCoin, 200);

  setTimeout(() => {
    uiDisplay.flipCoinBtn.style.transform = "scale(1)";
  }, 500);

  setTimeout(() => {
    clearInterval(coinInterval);
    coinInterval = null;

    const randomNum = Math.random();
    randomNum > 0.5 ? headsCount++ : tailsCount++;
    setCoin(randomNum > 0.5);
    setInfo();
  }, 4000);
}

function setInfo() {
  uiDisplay.resultHeads.innerHTML = "Heads: " + headsCount;
  uiDisplay.resultTails.innerHTML = "Tails: " + tailsCount;
}

function setCoin(isHeads) {
  if (isHeads) {
    uiDisplay.resultCoinHeads.style.display = "block";
    uiDisplay.resultCoinTails.style.display = "none";
  } else {
    uiDisplay.resultCoinHeads.style.display = "none";
    uiDisplay.resultCoinTails.style.display = "block";
  }
}

function switchCoin() {
  setCoin(coinSwitch);
  coinSwitch = !coinSwitch;
}

uiDisplay.flipCoinBtn.addEventListener("click", flipCoin);
