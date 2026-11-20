// Count the clicks on the button.
const button = document.getElementById("hello");
const clicksText = document.getElementById("clicks");
let clicks = 0;

button.addEventListener("click", function () {
    clicks++;
    clicksText.textContent = clicks + (clicks === 1 ? " click" : " clicks");
});
