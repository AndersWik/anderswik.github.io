/*
 * Rock Paper Scissors against the computer. Rock beats scissors, scissors
 * beat paper, and paper beats rock. The computer picks at random.
 */

// --- Settings ------------------------------------------------------------

// Where the pictures are. On a page of your own: "images/".
const IMAGE_FOLDER = "/assets/rock-paper-scissors/images/";

const CHOICES = ["Rock", "Paper", "Scissors"];

// What each choice beats.
const BEATS = { Rock: "Scissors", Paper: "Rock", Scissors: "Paper" };

// --- Elements on the page ------------------------------------------------

const playerImage = document.getElementById("playerImage");
const playerChoiceText = document.getElementById("playerChoice");
const playerScoreText = document.getElementById("playerScore");
const computerImage = document.getElementById("computerImage");
const computerChoiceText = document.getElementById("computerChoice");
const computerScoreText = document.getElementById("computerScore");
const resultText = document.getElementById("result");

// --- State ---------------------------------------------------------------

let playerScore = 0;
let computerScore = 0;

// --- The game ------------------------------------------------------------

function showChoice(choice, image, text) {
    image.src = IMAGE_FOLDER + choice + ".svg";
    image.alt = choice;
    text.textContent = choice;
}

function play(playerChoice) {
    const computerChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    showChoice(playerChoice, playerImage, playerChoiceText);
    showChoice(computerChoice, computerImage, computerChoiceText);

    if (playerChoice === computerChoice) {
        resultText.textContent = "It's a draw!";
    } else if (BEATS[playerChoice] === computerChoice) {
        playerScore++;
        resultText.textContent = playerChoice + " beats " + computerChoice + ". You win!";
    } else {
        computerScore++;
        resultText.textContent = computerChoice + " beats " + playerChoice + ". The computer wins!";
    }
    playerScoreText.textContent = playerScore;
    computerScoreText.textContent = computerScore;
}

// --- Connect the page ----------------------------------------------------

// One button for each choice: <button data-choice="Rock">.
document.querySelectorAll("[data-choice]").forEach(function (button) {
    button.addEventListener("click", function () {
        play(button.dataset.choice);
    });
});
