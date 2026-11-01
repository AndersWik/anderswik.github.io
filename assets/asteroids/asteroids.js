const colors = Object.freeze({
  WHITE: "#ffffff",
  BLACK: "#000000",
  YELLOW: "#ffff00",
  RED: "#ff0000",
  BLUE: "#0000FF",
  GREEN: "#00ff00",
  PINK: "#E81E63",
  GRAY: "#808080",
});

const gameStates = Object.freeze({
  MENU: "MENU",
  CONTROLLS: "CONTROLLS",
  POWERUPS: "POWERUPS",
  GAME: "GAME",
  PAUSE: "PAUSE",
  CONTINUE: "CONTINUE",
  WINNER: "WINNER",
  GAMEOVER: "GAMEOVER",
});

const asteroidLabels = Object.freeze({
  LARGE: "LARGE",
  MEDIUM: "MEDIUM",
  SMALL: "SMALL",
});

const PowerUpsLabels = Object.freeze({
  SPEED: "SPEED",
  TRIPLE: "TRIPLE",
  QUINTUPLE: "QUINTUPLE",
  HEALTH: "HEALTH",
});

const PowerUpsColors = Object.freeze({
  [PowerUpsLabels.SPEED]: colors.YELLOW,
  [PowerUpsLabels.TRIPLE]: colors.RED,
  [PowerUpsLabels.QUINTUPLE]: colors.PINK,
  [PowerUpsLabels.HEALTH]: colors.GREEN,
});

const uiDisplay = {
  canvas: document.getElementById("gameCanvas"),
};

let intervals = {
  spawnPowerUpInterval: undefined,
  spawnAsteroidInterval: undefined,
  spawnEnemiesInterval: undefined,
  powerUpInterval: 10000,
  asteroidInterval: 3000,
  enemiesInterval: 5000,
};

const ctx = uiDisplay.canvas.getContext("2d");
uiDisplay.canvas.width = 800;
uiDisplay.canvas.height = 600;

let ship = getShip();
let bullets = [];
let asteroids = [];
let enemies = [];
let currentLevelPowerUps = [];
let powerUps = [];
let powerUpsTimeout;
let level = 1;
let score = 0;
let spawnedAsteroids = 0;
let maxAsteroids = 5 + level;
let spawnedEnemies = 0;
let maxEnemies = 0;

const menuItems = ["Start", "Controlls", "Power-ups"];
let gameStarted = false;
let gameState = gameStates.MENU;
let menuIndex = 0;

let stars = [];

function getShip() {
  return {
    x: 400,
    y: 300,
    dx: 0,
    dy: 0,
    angle: 0,
    radius: 20,
    health: 100,
    shot: "",
    isShooting: false,
    lastShotTime: 0,
    fireRate: 200,
    active: true,
    rotating: 0,
  };
}

function initGame() {
  ship = getShip();
  bullets = [];
  asteroids = [];
  enemies = [];
  powerUps = [];
  level = 1;
  spawnedAsteroids = 0;
  maxAsteroids = 5 + level;
  spawnedEnemies = 0;
  maxEnemies = 0;
}

function initLevel() {
  spawnedAsteroids = 0;
  maxAsteroids = 5 + level;
  asteroids = [];
  enemies = [];
  updateIntervals();
  updateCurrentLevelPowerUps();
}

function updateCurrentLevelPowerUps() {
  switch (level) {
    case 1:
      currentLevelPowerUps.push(PowerUpsLabels.HEALTH);
      break;
    case 2:
      currentLevelPowerUps.push(PowerUpsLabels.TRIPLE);
      break;
    case 3:
      currentLevelPowerUps.push(PowerUpsLabels.QUINTUPLE);
      break;
    case 4:
      currentLevelPowerUps.push(PowerUpsLabels.SPEED);
  }
}

function initStars() {
  let numberOfStars = 100;
  for (let i = 0; i < numberOfStars; i++) {
    stars.push({
      x: Math.random() * uiDisplay.canvas.width,
      y: Math.random() * uiDisplay.canvas.height,
      radius: Math.random() * 2,
      brightness: Math.random(),
      speed: Math.random() * 0.02 + 0.01,
    });
  }
}

function initIntervals() {
  intervals.spawnPowerUpInterval = setInterval(
    spawnPowerUp,
    intervals.powerUpInterval
  );
  intervals.spawnAsteroidInterval = setInterval(
    spawnAsteroid,
    intervals.asteroidInterval
  );
  intervals.spawnEnemiesIntervall = setInterval(
    spawnEnemies,
    intervals.enemiesInterval
  );
}

function updateIntervals() {
  intervals.asteroidInterval =
    intervals.asteroidInterval - 100 > 100
      ? intervals.asteroidInterval - 100
      : 100;
  clearInterval(intervals.spawnAsteroidInterval);
  intervals.spawnAsteroidInterval = setInterval(
    spawnAsteroid,
    intervals.asteroidInterval
  );
}

function spawnAsteroid() {
  if (spawnedAsteroids >= maxAsteroids) return;
  if (gameState !== gameStates.GAME) return;
  spawnedAsteroids++;
  const side = Math.random() * 4;
  let x, y, dx, dy;
  if (side < 1) {
    x = -10;
    y = Math.random() * uiDisplay.canvas.height;
    dx = Math.random() * 2 + 1;
    dy = Math.random() * 2 - 1;
  } else if (side < 2) {
    x = uiDisplay.canvas.width + 10;
    y = Math.random() * uiDisplay.canvas.height;
    dx = -Math.random() * 2 - 1;
    dy = Math.random() * 2 - 1;
  } else if (side < 3) {
    x = Math.random() * uiDisplay.canvas.width;
    y = -10;
    dx = Math.random() * 2 - 1;
    dy = Math.random() * 2 + 1;
  } else {
    x = Math.random() * uiDisplay.canvas.width;
    y = uiDisplay.canvas.height + 10;
    dx = Math.random() * 2 - 1;
    dy = -Math.random() * 2 - 1;
  }
  asteroids.push({
    x,
    y,
    dx,
    dy,
    radius: 50,
    type: asteroidLabels.LARGE,
    active: true,
  });
}

function spawnPowerUp() {
  if (gameState !== gameStates.GAME) return;
  const side = Math.random() * 4;
  let x, y, dx, dy;
  if (side < 1) {
    x = -10;
    y = Math.random() * uiDisplay.canvas.height;
    dx = Math.random() * 2 + 1;
    dy = Math.random() * 2 - 1;
  } else if (side < 2) {
    x = uiDisplay.canvas.width + 10;
    y = Math.random() * uiDisplay.canvas.height;
    dx = -Math.random() * 2 - 1;
    dy = Math.random() * 2 - 1;
  } else if (side < 3) {
    x = Math.random() * uiDisplay.canvas.width;
    y = -10;
    dx = Math.random() * 2 - 1;
    dy = Math.random() * 2 + 1;
  } else {
    x = Math.random() * uiDisplay.canvas.width;
    y = uiDisplay.canvas.height + 10;
    dx = Math.random() * 2 - 1;
    dy = -Math.random() * 2 - 1;
  }
  let powerUpKeys = Object.keys(currentLevelPowerUps);
  let randomKey = powerUpKeys[Math.floor(Math.random() * powerUpKeys.length)];
  let typeLabel = currentLevelPowerUps[randomKey];
  let powerUp = {
    x,
    y,
    dx,
    dy,
    radius: 10,
    type: typeLabel,
    color: PowerUpsColors[typeLabel],
    active: true,
  };
  powerUps.push(powerUp);
  setTimeout(() => (powerUp.active = false), 10000);
}

function spawnEnemies() {
  if (gameState !== gameStates.GAME) return;
}

function updateObjects(objects) {
  objects.forEach((o) => {
    o.x += o.dx;
    o.y += o.dy;
    if (o.x < 0) o.x += uiDisplay.canvas.width;
    if (o.x > uiDisplay.canvas.width) o.x -= uiDisplay.canvas.width;
    if (o.y < 0) o.y += uiDisplay.canvas.height;
    if (o.y > uiDisplay.canvas.height) o.y -= uiDisplay.canvas.height;
  });
}

function checkCollision(obj1, obj2) {
  const dx = obj1.x - obj2.x;
  const dy = obj1.y - obj2.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < obj1.radius + obj2.radius;
}

function splitAsteroid(asteroid) {
  if (asteroid.type === asteroidLabels.LARGE) {
    asteroids.push(
      {
        x: asteroid.x,
        y: asteroid.y,
        dx: Math.random() * 2 - 1,
        dy: Math.random() * 2 - 1,
        radius: 30,
        type: asteroidLabels.MEDIUM,
        active: true,
      },
      {
        x: asteroid.x,
        y: asteroid.y,
        dx: Math.random() * 2 - 1,
        dy: Math.random() * 2 - 1,
        radius: 30,
        type: asteroidLabels.MEDIUM,
        active: true,
      }
    );
  } else if (asteroid.type === asteroidLabels.MEDIUM) {
    asteroids.push(
      {
        x: asteroid.x,
        y: asteroid.y,
        dx: Math.random() * 2 - 1,
        dy: Math.random() * 2 - 1,
        radius: 15,
        type: asteroidLabels.SMALL,
        active: true,
      },
      {
        x: asteroid.x,
        y: asteroid.y,
        dx: Math.random() * 2 - 1,
        dy: Math.random() * 2 - 1,
        radius: 15,
        type: asteroidLabels.SMALL,
        active: true,
      }
    );
  }
}

function activatePowerUp(type) {
  switch (type) {
    case PowerUpsLabels.SPEED:
      ship.speedMultiplier = 2;
      if (powerUpsTimeout) {
        clearTimeout(powerUpsTimeout);
      }
      powerUpsTimeout = setTimeout(() => (ship.speedMultiplier = 1), 10000);
      break;
    case PowerUpsLabels.TRIPLE:
      ship.shot = PowerUpsLabels.TRIPLE;
      if (powerUpsTimeout) {
        clearTimeout(powerUpsTimeout);
      }
      powerUpsTimeout = setTimeout(() => (ship.shot = ""), 10000);
      break;
    case PowerUpsLabels.QUINTUPLE:
      ship.shot = PowerUpsLabels.QUINTUPLE;
      if (powerUpsTimeout) {
        clearTimeout(powerUpsTimeout);
      }
      powerUpsTimeout = setTimeout(() => (ship.shot = ""), 10000);
      break;
    case PowerUpsLabels.HEALTH:
      ship.health = ship.health + 10;
      ship.health > 100 && (ship.health = 100);
      break;
  }
}

function handleCollisions() {
  powerUps.forEach((powerUp) => {
    if (checkCollision(ship, powerUp)) {
      powerUp.active = false;
      activatePowerUp(powerUp.type);
    }
  });

  bullets.forEach((bullet) => {
    powerUps.forEach((powerUp) => {
      if (checkCollision(bullet, powerUp)) {
        powerUp.active = false;
      }
    });
    asteroids.forEach((asteroid) => {
      if (checkCollision(bullet, asteroid)) {
        bullet.active = false;
        asteroid.active = false;
        score = score + 10;
        splitAsteroid(asteroid);
      }
    });
  });

  asteroids.forEach((asteroid) => {
    if (checkCollision(ship, asteroid)) {
      let normalX = asteroid.x - ship.x;
      let normalY = asteroid.y - ship.y;
      let magnitude = Math.sqrt(normalX * normalX + normalY * normalY);
      normalX /= magnitude;
      normalY /= magnitude;

      let relativeVelocityX = ship.dx - asteroid.dx;
      let relativeVelocityY = ship.dy - asteroid.dy;
      let speed = relativeVelocityX * normalX + relativeVelocityY * normalY;

      if (speed < 0) return; // Already moving away

      // Reflect velocity for bouncing
      ship.dx -= normalX;
      ship.dy -= normalY;
      asteroid.dx += normalX;
      asteroid.dy += normalY;

      ship.health = ship.health - 5;
      ship.hurt = true;

      if (ship.health <= 0) {
        ship.active = false;
        gameState = gameStates.GAMEOVER;
      }
    }
  });
}

function getBullet(speed, spreadAngle) {
  return {
    x: ship.x + Math.cos(ship.angle - spreadAngle) * 20,
    y: ship.y + Math.sin(ship.angle - spreadAngle) * 20,
    dx: Math.cos(ship.angle - spreadAngle) * speed,
    dy: Math.sin(ship.angle - spreadAngle) * speed,
    angle: ship.angle + spreadAngle,
    radius: 2,
    active: true,
  };
}

function shootBullet() {
  if (!ship.isShooting) return;

  let now = Date.now();
  if (now - ship.lastShotTime < ship.fireRate) return;

  const speed = 5;
  const spreadAngleLeft = -0.15;
  const spreadAngleRight = 0.15;

  // Create main bullet (straight shot)
  let bulletsToAdd = [getBullet(speed, 0)];

  switch (ship.shot) {
    case PowerUpsLabels.QUINTUPLE:
      bulletsToAdd.push(getBullet(speed, spreadAngleLeft * 2));
      bulletsToAdd.push(getBullet(speed, spreadAngleRight * 2));
    case PowerUpsLabels.TRIPLE:
      bulletsToAdd.push(getBullet(speed, spreadAngleLeft));
      bulletsToAdd.push(getBullet(speed, spreadAngleRight));
      break;
  }

  // Add bullets to array and set expiration
  bulletsToAdd.forEach((bullet) => {
    bullets.push(bullet);
    setTimeout(() => (bullet.active = false), 1500);
  });

  ship.lastShotTime = now;
}

function checkLevelCompletion() {
  let asteroidsComplete =
    spawnedAsteroids >= maxAsteroids && asteroids.length < 1;
  let enemiesComplete = spawnedEnemies >= maxEnemies && enemies.length < 1;

  if (asteroidsComplete && enemiesComplete) {
    level++;
    gameState = gameStates.CONTINUE;
  }
}

function updateGame() {
  if (ship.hurt) ship.hurt = false;
  ship.angle += ship.rotating;
  ship.x += ship.dx;
  ship.y += ship.dy;
  updateObjects([...bullets, ...asteroids, ...enemies, ...powerUps, ship]);
  handleCollisions();

  bullets = bullets.filter((b) => b.active);
  asteroids = asteroids.filter((a) => a.active);
  enemies = enemies.filter((e) => e.active);
  powerUps = powerUps.filter((e) => e.active);

  checkLevelCompletion();
  shootBullet();
}

function drawStars() {
  ctx.clearRect(0, 0, uiDisplay.canvas.width, uiDisplay.canvas.height); // Clear canvas

  // Background color (dark space)
  ctx.fillStyle = colors.BLACK;
  ctx.fillRect(0, 0, uiDisplay.canvas.width, uiDisplay.canvas.height);

  stars.forEach((star) => {
    // Adjust brightness (twinkling effect)
    star.brightness += star.speed * (Math.random() > 0.5 ? 1 : -1);
    if (star.brightness < 0.1) star.brightness = 0.1;
    if (star.brightness > 1) star.brightness = 1;

    // Draw star
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`; // White star with opacity
    ctx.fill();
  });
}

function drawShip() {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-15, -10);
  ctx.lineTo(-15, 10);
  ctx.closePath();
  ctx.strokeStyle = colors.WHITE;
  ctx.stroke();
  ctx.restore();
}

function drawBullets() {
  ctx.fillStyle = colors.WHITE;
  bullets.forEach((b) => {
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawAsteroids() {
  ctx.strokeStyle = colors.GRAY;
  asteroids.forEach((a) => {
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawPowerUps() {
  powerUps.forEach((p) => {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
  });
}

function getHealthColor(health) {
  let red = Math.min(255, 255 - health * 2.55);
  let green = Math.min(255, health * 2.55);
  return `rgb(${red}, ${green}, 0)`;
}

function drawHurt() {
  if (ship.hurt) {
    ctx.fillStyle = "rgba(225,0,0,0.5)";
    ctx.fillRect(0, 0, uiDisplay.canvas.width, uiDisplay.canvas.height);
  }
}

function drawLifeBar() {
  let maxHealth = 100;
  let barWidth = 100;
  let marginRight = 20;
  ctx.fillStyle = colors.GRAY;
  ctx.fillRect(
    uiDisplay.canvas.width - (barWidth + marginRight),
    55,
    barWidth,
    15
  );
  ctx.fillStyle = getHealthColor(ship.health);
  ctx.fillRect(
    uiDisplay.canvas.width - (barWidth + marginRight),
    55,
    ship.health,
    15
  );
  ctx.strokeStyle = colors.BLACK;
  ctx.strokeRect(
    uiDisplay.canvas.width - (barWidth + marginRight),
    55,
    barWidth,
    15
  );

  ctx.fillStyle = colors.WHITE;
  ctx.font = "20px Arial";
  ctx.textAlign = "left";
  let text = `Score: ${score} | Level: ${level}`;
  let textWidth = ctx.measureText(text).width;
  ctx.fillText(
    text,
    uiDisplay.canvas.width - (barWidth + textWidth + marginRight + marginRight),
    70
  );
}

function drawGame() {
  drawStars();
  drawShip();
  drawBullets();
  drawAsteroids();
  drawPowerUps();
  drawHurt();
}

function drawMenu() {
  ctx.fillStyle = colors.WHITE;
  ctx.font = "60px Arial";
  ctx.textAlign = "center";
  ctx.fillText(
    "Asteroids",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 50
  );

  const startY = uiDisplay.canvas.height / 2 + 20;
  const lineHeight = 50;

  menuItems.forEach((text, index) => {
    if (menuIndex === index) {
      ctx.font = "20px Arial";
      ctx.strokeStyle = colors.BLUE;
      ctx.lineWidth = 3;
      ctx.shadowColor = colors.BLUE;
      ctx.shadowBlur = 7;
      ctx.strokeText(
        text,
        uiDisplay.canvas.width / 2,
        startY + index * lineHeight
      );
    }
    ctx.font = "20px Arial";
    ctx.fillStyle = colors.WHITE;
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

function drawPowerUp() {
  ctx.fillStyle = colors.WHITE;
  ctx.textAlign = "center";
  ctx.font = "40px Arial";
  ctx.fillText(
    "Power-ups",
    uiDisplay.canvas.width / 2,
    uiDisplay.canvas.height / 2 - 100
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

function drawContinue() {
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
      drawGame();
      drawMenu();
      break;
    case gameStates.CONTROLLS:
      drawGame();
      drawControlls();
      break;
    case gameStates.POWERUPS:
      drawGame();
      drawPowerUp();
      break;
    case gameStates.GAME:
      updateGame();
      drawGame();
      drawLifeBar();
      break;
    case gameStates.PAUSE:
      drawGame();
      drawPause();
      break;
    case gameStates.CONTINUE:
      drawGame();
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

document.addEventListener("keyup", (e) => {
  const key = e.key.toLowerCase();
  switch (key) {
    case "arrowleft":
      ship.rotating = 0;
      break;

    case "arrowright":
      ship.rotating = 0;
      break;

    case " ":
      ship.isShooting = false;
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
    case gameStates.CONTROLLS:
      pressControlls(key);
      break;
    case gameStates.POWERUPS:
      pressPowerups(key);
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
      } else if (menuItems[menuIndex] === "Power-ups") {
        gameState = gameStates.POWERUPS;
      } else {
        gameState = gameStates.GAME;
        gameStarted = true;
        initGame();
      }
      break;
  }
}

function pressControlls(key) {
  switch (key) {
    case "escape":
      gameState = gameStates.MENU;
      break;
  }
}

function pressPowerups(key) {
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
      ship.rotating = -0.1;
      break;

    case "arrowright":
      ship.rotating = 0.1;
      break;

    case "arrowup":
      ship.dx += Math.cos(ship.angle) * 0.2;
      ship.dy += Math.sin(ship.angle) * 0.2;
      break;

    case " ":
      ship.isShooting = true;
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
      initLevel();
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

initIntervals();
initStars();
initLevel();
gameLoop();
