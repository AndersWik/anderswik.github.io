const colors = Object.freeze({
  WHITE: "#ffffff",
  RED: "#ff0000",
  ORANGE: "#FFA500",
  BLUE: "#0000ff",
  GRAY: "#808080",
});

const gameStates = Object.freeze({
  MENU: "MENU",
  GAME: "GAME",
  PAUSE: "PAUSE",
  CONTINUE: "CONTINUE",
  WINNER: "WINNER",
  GAMEOVER: "GAMEOVER",
});

let score = 0;
let level = 1;
let missiles = [];
let enemyMissiles = [];
let explosions = [];
let cities;
let gameState = gameStates.MENU;
let maxEnemyMissiles = 20;
let enemyMissilesSpawned = 0;
let enemyMissilesSpeed = 0.3;
let gameStarted = false;

const uiDisplay = {
  canvas: document.getElementById("gameCanvas"),
  score: document.getElementById("score"),
  level: document.getElementById("level"),
};

const menuVars = {};

const ctx = uiDisplay.canvas.getContext("2d");
uiDisplay.canvas.width = 800;
uiDisplay.canvas.height = 500;

function initGame() {
  score = 0;
  level = 1;
  missiles = [];
  enemyMissiles = [];
  explosions = [];
  cities = [100, 250, 400, 550, 700].map((x) => ({
    x,
    y: uiDisplay.canvas.height - 50,
    alive: true,
  }));
  maxEnemyMissiles = 20;
  enemyMissilesSpawned = 0;
  enemyMissilesSpeed = 0.3;
  uiDisplay.score.textContent = score;
  uiDisplay.level.textContent = level;
  setInterval(spawnEnemyMissile, 1000);
}

function initMenu() {
  menuVars.enemyMissiles = [];
  menuVars.cities = [100, 250, 400, 550, 700].map((x) => ({
    x,
    y: uiDisplay.canvas.height - 50,
    alive: true,
  }));
  menuVars.maxEnemyMissiles = 20;
  menuVars.enemyMissilesSpawned = 0;
  setInterval(spawnMenuMissile, 1000);
}

function nextLevel() {
  cities = [100, 250, 400, 550, 700].map((x) => ({
    x,
    y: uiDisplay.canvas.height - 50,
    alive: true,
  }));
  maxEnemyMissiles = maxEnemyMissiles + 5;
  enemyMissilesSpeed = enemyMissilesSpeed + 0.1;
  enemyMissilesSpawned = 0;
}

class Missile {
  constructor(x, y, targetX, targetY, speed = 3, isEnemy = false) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;
    this.speed = speed;
    this.isEnemy = isEnemy;
    this.dx = (targetX - x) / (Math.hypot(targetX - x, targetY - y) / speed);
    this.dy = (targetY - y) / (Math.hypot(targetX - x, targetY - y) / speed);
  }
  draw() {
    ctx.strokeStyle = this.isEnemy ? colors.RED : colors.WHITE;
    ctx.beginPath();
    ctx.moveTo(this.startX, this.startY);
    ctx.lineTo(this.x, this.y);
    ctx.stroke();
  }
  update() {
    this.x += this.dx;
    this.y += this.dy;
    if (Math.hypot(this.x - this.targetX, this.y - this.targetY) < this.speed) {
      gameState === gameStates.GAME &&
        explosions.push(new Explosion(this.targetX, this.targetY));
      return true;
    }
    return false;
  }
}

class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 1;
    this.maxRadius = 40;
  }
  draw() {
    ctx.fillStyle = colors.ORANGE;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  update() {
    this.radius += 2;
    return this.radius > this.maxRadius;
  }
}

function spawnEnemyMissile() {
  if (gameState != gameStates.GAME) return;
  if (enemyMissilesSpawned >= maxEnemyMissiles) return;
  let x = Math.random() * uiDisplay.canvas.width;
  let targetCity = cities.filter((c) => c.alive)[
    Math.floor(Math.random() * cities.filter((c) => c.alive).length)
  ];
  if (targetCity) {
    enemyMissiles.push(
      new Missile(x, 0, targetCity.x, targetCity.y, enemyMissilesSpeed, true)
    );
    enemyMissilesSpawned++;
  }
}

function addMissile(e) {
  if (gameState != gameStates.GAME) return;
  let x = uiDisplay.canvas.width / 2;
  let y = uiDisplay.canvas.height - 50;
  missiles.push(new Missile(x, y, e.offsetX, e.offsetY));
}

function updateGame() {
  if (gameState != gameStates.GAME) return;
  missiles = missiles.filter((missile) => !missile.update());
  enemyMissiles = enemyMissiles.filter((missile) => !missile.update());
  explosions = explosions.filter((explosion) => !explosion.update());

  for (let i = 0; i < enemyMissiles.length; i++) {
    for (let j = 0; j < explosions.length; j++) {
      if (
        Math.hypot(
          enemyMissiles[i].x - explosions[j].x,
          enemyMissiles[i].y - explosions[j].y
        ) < explosions[j].radius
      ) {
        enemyMissiles.splice(i, 1);
        score++;
        uiDisplay.score.textContent = score;
        break;
      }
    }
  }

  for (let i = 0; i < enemyMissiles.length; i++) {
    cities.forEach((city) => {
      if (
        city.alive &&
        Math.hypot(enemyMissiles[i].x - city.x, enemyMissiles[i].y - city.y) <
          20
      ) {
        city.alive = false;
        enemyMissiles.splice(i, 1);
      }
    });
  }

  if (cities.every((city) => !city.alive)) {
    gameState = gameStates.GAMEOVER;
  } else if (
    enemyMissilesSpawned >= maxEnemyMissiles &&
    enemyMissiles.length < 1 &&
    explosions.length < 1 &&
    missiles.length < 1
  ) {
    if (level < 5) {
      score += cities.filter((city) => city.alive).length * 10;
      uiDisplay.score.textContent = score;
      level++;
      uiDisplay.level.textContent = level;
      gameState = gameStates.CONTINUE;
    } else {
      gameState = gameStates.WINNER;
    }
  }
}

function drawGame() {
  ctx.clearRect(0, 0, uiDisplay.canvas.width, uiDisplay.canvas.height);
  ctx.fillStyle = colors.BLUE;
  ctx.fillRect(0, uiDisplay.canvas.height - 50, uiDisplay.canvas.width, 50);

  cities.forEach((city) => {
    if (city.alive) {
      ctx.fillStyle = colors.GRAY;
      ctx.fillRect(city.x - 20, city.y - 20, 40, 20);
    }
  });

  missiles.forEach((missile) => missile.draw());
  enemyMissiles.forEach((missile) => missile.draw());
  explosions.forEach((explosion) => explosion.draw());
}

function spawnMenuMissile() {
  if (gameState != gameStates.MENU) return;
  if (menuVars.enemyMissilesSpawned >= menuVars.maxEnemyMissiles) return;
  let x = Math.random() * uiDisplay.canvas.width;
  let targetCity = menuVars.cities.filter((c) => c.alive)[
    Math.floor(Math.random() * cities.filter((c) => c.alive).length)
  ];
  if (targetCity) {
    menuVars.enemyMissiles.push(
      new Missile(x, 0, targetCity.x, targetCity.y, enemyMissilesSpeed, true)
    );
    menuVars.enemyMissilesSpawned++;
  }
}

function updateMenuGame() {
  if (gameState != gameStates.MENU) return;
  menuVars.enemyMissiles = menuVars.enemyMissiles.filter(
    (missile) => !missile.update()
  );
  for (let i = 0; i < menuVars.enemyMissiles.length; i++) {
    menuVars.cities.forEach((city) => {
      if (
        city.alive &&
        Math.hypot(
          menuVars.enemyMissiles[i].x - city.x,
          menuVars.enemyMissiles[i].y - city.y
        ) < 20
      ) {
        city.alive = false;
        menuVars.enemyMissiles.splice(i, 1);
      }
    });
  }
  menuVars.cities.every((city) => !city.alive) &&
    menuVars.enemyMissiles.length < 1 &&
    initMenu();
}

function drawMenuGame() {
  ctx.clearRect(0, 0, uiDisplay.canvas.width, uiDisplay.canvas.height);
  ctx.fillStyle = colors.BLUE;
  ctx.fillRect(0, uiDisplay.canvas.height - 50, uiDisplay.canvas.width, 50);

  menuVars.cities.forEach((city) => {
    if (city.alive) {
      ctx.fillStyle = colors.GRAY;
      ctx.fillRect(city.x - 20, city.y - 20, 40, 20);
    }
  });

  menuVars.enemyMissiles.forEach((missile) => missile.draw());
}

function drawMenu() {
  ctx.fillStyle = colors.WHITE;
  ctx.textAlign = "center";
  ctx.font = "40px Arial";
  ctx.fillText(
    "Missile Command",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 100
  );

  const startY = uiDisplay.canvas.height / 2 - 50;
  const lineHeight = 50;

  if (gameStarted) {
    ctx.font = "20px Arial";
    ctx.fillText(
      "Press enter to start",
      uiDisplay.canvas.width / 2,
      uiDisplay.canvas.height / 2
    );
    ctx.fillText(
      "Press esc to return to game",
      uiDisplay.canvas.width / 2,
      uiDisplay.canvas.height / 2 + lineHeight
    );
  } else {
    ctx.font = "20px Arial";
    ctx.fillText(
      "Press enter to start",
      uiDisplay.canvas.width / 2,
      uiDisplay.canvas.height / 2
    );
  }
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

function drawContinue() {
  ctx.clearRect(0, 0, uiDisplay.canvas.width, uiDisplay.canvas.height);
  ctx.fillStyle = colors.WHITE;
  ctx.textAlign = "center";
  ctx.font = "40px Arial";
  ctx.fillText(
    "Next level",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 50
  );
  ctx.font = "20px Arial";
  ctx.fillText(
    "Press enter to continue",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2
  );
}

function drawWinner() {
  ctx.fillStyle = colors.WHITE;
  ctx.textAlign = "center";
  ctx.font = "40px Arial";
  ctx.fillText(
    "Winner",
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
      updateMenuGame();
      drawMenuGame();
      drawMenu();
      break;

    case gameStates.GAME:
      updateGame();
      drawGame();
      break;

    case gameStates.PAUSE:
      drawGame();
      drawPause();
      break;

    case gameStates.CONTINUE:
      drawContinue();
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

uiDisplay.canvas.addEventListener("click", addMissile);

document.addEventListener("keydown", function (event) {
  const key = event.key.toLowerCase();

  switch (gameState) {
    case gameStates.GAME:
      pressGame(key);
      break;
    case gameStates.PAUSE:
      pressPause(key);
      break;
    case gameStates.CONTINUE:
      pressContinue(key);
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
  }
});

function pressMenu(key) {
  switch (key) {
    case "escape":
      gameStarted && (gameState = gameStates.GAME);
      break;

    case "enter":
      gameState = gameStates.GAME;
      gameStarted = true;
      initGame();
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

function pressContinue(key) {
  switch (key) {
    case "escape":
      gameState = gameStates.MENU;
      break;

    case "enter":
      gameState = gameStates.GAME;
      nextLevel();
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

initMenu();
initGame();
gameLoop();
