const colors = Object.freeze({
  WHITE: "#ffffff",
  BLACK: "#000000",
  RED: "#ff0000",
  BLUE: "#0000ff",
  YELLOW: "#ffff00",
  ORANGE: "#FFA500",
  BEACH: "#e6cb9a",
});

const gameStates = Object.freeze({
  MENU: "MENU",
  CONTROLLS: "CONTROLLS",
  GAME: "GAME",
  PAUSE: "PAUSE",
  WINNER: "WINNER",
  GAMEOVER: "GAMEOVER",
});

const uiDisplay = {
  canvas: document.getElementById("gameCanvas"),
};

const ctx = uiDisplay.canvas.getContext("2d");

const net = { x: 400, y: 340, width: 10, height: 50 };
const gravity = 0.2;
const ground = 340;
let playerOne = getPlayer(200, colors.RED);
let playerTwo = getPlayer(600, colors.BLUE);
let ball = getBall(colors.ORANGE);
let servingPlayer = playerTwo;
let isTwoPlayer = false;

const menuItems = ["1 Player", "2 Player", "Controlls"];
let gameStarted = false;
let gameState = gameStates.MENU;
let menuIndex = 0;

function initGame() {
  playerOne = getPlayer(200, colors.RED);
  playerTwo = getPlayer(600, colors.BLUE);
  ball = getBall(colors.ORANGE);
  serveBall(servingPlayer);
}

function getPlayer(x, color) {
  return {
    x: x,
    y: 340,
    radius: 45,
    dx: 0,
    dy: 0,
    speed: 5,
    jumpPower: -7,
    onGround: true,
    score: 0,
    color: color,
  };
}

function getBall(color) {
  return {
    x: 400,
    y: 200,
    radius: 10,
    dx: 3,
    dy: -5,
    gravity: 0.2,
    active: true,
    color,
    color,
  };
}

function updateGame() {
  ballMove();
  ballCheckGroundCollision() && checkWinner();
  ballCheckNetCollision();
  playerOneMove();
  isTwoPlayer ? playerTwoMove() : aiMove(playerTwo);
  checkCollision(playerOne) && handleCollision(playerOne, ball);
  checkCollision(playerTwo) && handleCollision(playerTwo, ball);
}

function ballMove() {
  if (!ball.active) return;

  ball.x += ball.dx;
  ball.y += ball.dy;
  ball.dy += ball.gravity;

  if (
    ball.x - ball.radius < 0 ||
    ball.x + ball.radius > uiDisplay.canvas.width
  ) {
    ball.dx *= -1;
  }
}

function ballCheckNetCollision() {
  const netLeft = net.x - net.width / 2;
  const netRight = net.x + net.width / 2;
  const netTop = net.y - net.height;
  const netBottom = net.y;

  if (
    ball.x + ball.radius > netLeft &&
    ball.x - ball.radius < netRight &&
    ball.y + ball.radius > netTop &&
    ball.y - ball.radius < netBottom
  ) {
    // Simple bounce
    ball.dx *= -1;
    ball.dy *= -1;

    // Push the ball outside the net to prevent getting stuck
    if (ball.x < net.x) {
      ball.x = netLeft - ball.radius;
    } else {
      ball.x = netRight + ball.radius;
    }
  }
}

function ballCheckGroundCollision() {
  let givePoint = ball.active && ball.y + ball.radius >= ground;
  if (givePoint) {
    if (ball.x < net.x) {
      ball.active = false;
      playerTwo.score++;
      serveBall(playerTwo);
    } else {
      ball.active = false;
      playerOne.score++;
      serveBall(playerOne);
    }
  }
  return givePoint;
}

function checkWinner() {
  if (!isTwoPlayer && playerTwo.score >= 5) {
    gameState = gameStates.GAMEOVER;
  } else if (playerOne.score >= 5 || playerTwo.score >= 5) {
    gameState = gameStates.WINNER;
  }
}

function playerOneMove() {
  playerMove(playerOne);
  if (playerOne.x + playerOne.radius > net.x - net.width / 2) {
    playerOne.x = net.x - net.width / 2 - playerOne.radius;
  }
}

function playerTwoMove() {
  playerMove(playerTwo);
  if (playerTwo.x - playerTwo.radius < net.x + net.width / 2) {
    playerTwo.x = net.x + net.width / 2 + playerTwo.radius;
  }
}

function playerMove(player) {
  player.x += player.dx;
  player.y += player.dy;
  player.dy += gravity;

  if (player.y >= ground) {
    player.y = ground;
    player.dy = 0;
    player.onGround = true;
  }

  if (player.x - player.radius < 0) player.x = player.radius;
  if (player.x + player.radius > uiDisplay.canvas.width) {
    player.x = uiDisplay.canvas.width - player.radius;
  }
}

function aiMove(player) {
  if (ball.x < net.x) return;
  if (ball.x > net.x + 50 && ball.x < uiDisplay.canvas.width - 50) {
    player.x += ball.x > player.x ? player.speed : -player.speed;

    if (ball.y < player.y - 10 && player.onGround) {
      player.dy = player.jumpPower;
      player.onGround = false;
    }
  }

  player.y += player.dy;
  player.dy += gravity;

  if (player.y >= ground) {
    player.y = ground;
    player.dy = 0;
    player.onGround = true;
  }

  if (player.onGround) {
    player.dy = playerTwo.jumpPower;
    player.onGround = false;
    player.hitCount = 0;
  }
}

function checkCollision(player) {
  let dist = Math.hypot(
    ball.x - player.x,
    ball.y - (player.y - player.radius / 2)
  ); // Adjust height of player hitbox
  return dist < player.radius + ball.radius;
}

function handleCollision(player) {
  let angle = Math.atan2(
    ball.y - player.y,
    ball.x - (player.x + (ball.x > player.x ? 20 : -20))
  );
  ball.dx = Math.cos(angle) * 7;
  ball.dy = Math.sin(angle) * 9;
}

function serveBall(player) {
  setTimeout(() => {
    ball.x = player.x;
    ball.y = 20;
    ball.dx = 0;
    ball.dy = 0;
    servingPlayer = player;
  }, 100);

  setTimeout(() => (ball.active = true), 1000);
}

function drawPlayer(player) {
  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, Math.PI, 0);
  ctx.fill();
}

function drawBall() {
  ctx.fillStyle = ball.color;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawGame() {
  ctx.clearRect(0, 0, uiDisplay.canvas.width, uiDisplay.canvas.height);

  ctx.fillStyle = colors.BEACH;
  ctx.fillRect(0, ground, uiDisplay.canvas.width, uiDisplay.canvas.height);

  ctx.fillStyle = colors.BLACK;
  ctx.fillRect(
    net.x - net.width / 2,
    net.y - net.height,
    net.width,
    net.height
  );

  drawPlayer(playerOne);
  drawPlayer(playerTwo);
  drawBall();
}

function drawScoreCircles(start, player) {
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = colors.WHITE;

    if (i + 1 <= player.score) {
      ctx.fillStyle = colors.YELLOW;
    }

    start = start + 30;
    ctx.beginPath();
    ctx.arc(start, 40, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMenu() {
  ctx.fillStyle = colors.WHITE;
  ctx.font = "60px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "Volleyball",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 50
  );

  const startY = uiDisplay.canvas.height / 2 + 20;
  const lineHeight = 50;

  menuItems.forEach((text, index) => {
    if (menuIndex === index) {
      ctx.fillStyle = colors.YELLOW;
    } else {
      ctx.fillStyle = colors.WHITE;
    }

    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, uiDisplay.canvas.width / 2, startY + index * lineHeight);
  });
}

function drawControlls() {
  ctx.fillStyle = colors.WHITE;
  ctx.font = "40px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "Controlls",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 100
  );

  ctx.font = "20px Arial";

  ctx.fillText(
    "Pause:",
    uiDisplay.canvas.width / 2 - 100,
    uiDisplay.canvas.height / 2 + 50
  );
  ctx.fillText(
    "P",
    uiDisplay.canvas.width / 2 + 100,
    uiDisplay.canvas.height / 2 + 50
  );

  ctx.fillText(
    "Back to Menu:",
    uiDisplay.canvas.width / 2 - 100,
    uiDisplay.canvas.height / 2 + 75
  );
  ctx.fillText(
    "ESC",
    uiDisplay.canvas.width / 2 + 100,
    uiDisplay.canvas.height / 2 + 75
  );

  ctx.fillText(
    "Move left",
    uiDisplay.canvas.width / 2 - 100,
    uiDisplay.canvas.height / 2 + 125
  );
  ctx.fillText(
    "Arrow left",
    uiDisplay.canvas.width / 2 + 100,
    uiDisplay.canvas.height / 2 + 125
  );

  ctx.fillText(
    "Move right",
    uiDisplay.canvas.width / 2 - 100,
    uiDisplay.canvas.height / 2 + 150
  );
  ctx.fillText(
    "Arrow right",
    uiDisplay.canvas.width / 2 + 100,
    uiDisplay.canvas.height / 2 + 150
  );
}

function drawPause() {
  ctx.fillStyle = colors.WHITE;
  ctx.textAlign = "center";
  ctx.font = "40px Arial";
  ctx.fillText(
    "Pause",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2
  );
}

function drawWinner() {
  ctx.fillStyle = colors.WHITE;
  ctx.textAlign = "center";
  ctx.font = "40px Arial";
  let winner = "Red Player Wins!";
  if (playerTwo.score >= 5) {
    winner = "Blue Player Wins!";
  }
  ctx.fillText(
    winner,
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 100
  );
  ctx.font = "20px Arial";
  ctx.fillText(
    "Press enter to play again",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 50
  );
  ctx.fillText(
    "Press esc to go to menu",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 20
  );
}

function drawGameOver() {
  ctx.fillStyle = colors.WHITE;
  ctx.textAlign = "center";
  ctx.font = "40px Arial";
  ctx.fillText(
    "Game Over",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 100
  );
  ctx.font = "20px Arial";
  ctx.fillText(
    "Press enter to play again",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 50
  );
  ctx.fillText(
    "Press esc to go to menu",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 20
  );
}

function drawUI() {
  switch (gameState) {
    case gameStates.MENU:
      drawGame();
      drawMenu();
      break;
    case gameStates.CONTROLLS:
      drawGame();
      drawControlls();
      break;
    case gameStates.GAME:
      updateGame();
      drawGame();
      drawScoreCircles(80, playerOne);
      drawScoreCircles(500, playerTwo);
      break;
    case gameStates.PAUSE:
      drawGame();
      drawScoreCircles(80, playerOne);
      drawScoreCircles(500, playerTwo);
      drawPause();
      break;
    case gameStates.WINNER:
      drawGame();
      drawWinner();
      break;
    case gameStates.GAMEOVER:
      drawGame();
      drawGameOver();
      break;
  }
}

function gameLoop() {
  try {
    drawUI();
  } catch (error) {
    console.error(error);
  }
  requestAnimationFrame(gameLoop);
}

document.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  switch (key) {
    case "arrowleft":
      playerOne.dx = 0;
      break;

    case "arrowright":
      playerOne.dx = 0;
      break;

    case "a":
      isTwoPlayer && (playerTwo.dx = 0);
      break;

    case "d":
      isTwoPlayer && (playerTwo.dx = 0);
      break;
  }
});

document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();
  switch (gameState) {
    case gameStates.GAME:
      pressGame(key);
      break;
    case gameStates.PAUSE:
      pressPause(key);
      break;
    case gameStates.WINNER:
      pressWinner(key);
      break;
    case gameStates.GAMEOVER:
      pressGameOver(key);
      break;
    case gameStates.MENU:
      pressMenu(key);
      break;
    case gameStates.CONTROLLS:
      pressControlls(key);
      break;
  }
});

function pressMenu(key) {
  switch (key) {
    case "arrowup":
      menuIndex = menuIndex - 1 < 0 ? menuItems.length - 1 : menuIndex - 1;
      break;
    case "arrowdown":
      menuIndex = menuIndex + 1 > menuItems.length - 1 ? 0 : menuIndex + 1;
      break;
    case "escape":
      gameStarted && (gameState = gameStates.GAME);
      break;
    case "enter":
      if (menuItems[menuIndex] === "Controlls") {
        gameState = gameStates.CONTROLLS;
      } else if (menuItems[menuIndex] === "1 Player") {
        gameState = gameStates.GAME;
        isTwoPlayer = false;
        gameStarted = true;
        serveBall(playerOne);
      } else if (menuItems[menuIndex] === "2 Player") {
        gameState = gameStates.GAME;
        isTwoPlayer = true;
        gameStarted = true;
        serveBall(playerOne);
      }
  }
}

function pressControlls(key) {
  switch (key) {
    case "escape":
      gameState = gameStates.MENU;
      break;
  }
}

function pressGame(key) {
  switch (key) {
    case "escape":
      gameState = gameStates.MENU;
      break;

    case "p":
      gameState = gameStates.PAUSE;
      break;

    case "arrowleft":
      playerOne.dx = -playerOne.speed;
      break;

    case "arrowright":
      playerOne.dx = playerOne.speed;
      break;

    case "arrowup":
      if (playerOne.onGround) {
        playerOne.dy = playerOne.jumpPower;
        playerOne.onGround = false;
      }
      break;
    case "a":
      isTwoPlayer && (playerTwo.dx = -playerTwo.speed);
      break;

    case "d":
      isTwoPlayer && (playerTwo.dx = playerTwo.speed);
      break;

    case "w":
      if (isTwoPlayer && playerTwo.onGround) {
        playerTwo.dy = playerTwo.jumpPower;
        playerTwo.onGround = false;
      }
      break;
  }
}

function pressPause(key) {
  switch (key) {
    case "escape":
      gameState = gameStates.MENU;
      break;

    case "p":
      gameState = gameStates.GAME;
      break;
  }
}

function pressWinner(key) {
  switch (key) {
    case "escape":
      gameState = gameStates.MENU;
      gameStarted = false;
      break;

    case "enter":
      gameState = gameStates.GAME;
      gameStarted = true;
      initGame();
      break;
  }
}

function pressGameOver(key) {
  switch (key) {
    case "escape":
      gameState = gameStates.MENU;
      gameStarted = false;
      break;

    case "enter":
      gameState = gameStates.GAME;
      gameStarted = true;
      initGame();
      break;
  }
}

gameLoop();
