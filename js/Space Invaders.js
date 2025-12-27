var keysDown = {};
var prevKeys = {};
var hiScore = Number(localStorage.getItem("hiScore") || 0);

addEventListener("keydown", function (e) {
    keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
    delete keysDown[e.keyCode];
}, false);

var gameObjects = [];

function addGameObject(go) {
    gameObjects.push(go);
}

var player = new Player(0, 0);
var playerShot = new PlayerShot(0, 0);

addGameObject(player);
addGameObject(playerShot);

var shield1 = new Shield(shield1PosX, shieldsPosY);
var shield2 = new Shield(shield2PosX, shieldsPosY);
var shield3 = new Shield(shield3PosX, shieldsPosY);
var shield4 = new Shield(shield4PosX, shieldsPosY);

addGameObject(shield1);
addGameObject(shield2);
addGameObject(shield3);
addGameObject(shield4);

var ground = new GroundLine(0, groundLineY, gameWidth, 1)
addGameObject(ground);

loadAlienAssets();

var aliens = [];

function resetAliens()
{
  for(var i = 0; i < alienRowAmount; i++)
  {
    for(var j = 0; j < alienColumnAmount; j++)
    {
      aliens[i][j].start();
    }
  }

  alienRefPos[0] = alienRefStartingPosx;
  alienRefPos[1] = getAlienRefStartingPosY(level);
  alienRefNextPos[0] = alienRefPos[0];
  alienRefNextPos[1] = alienRefPos[1];

	referenceAlien.x = alienRefPos[0];
	referenceAlien.y = alienRefPos[1];

  row = 0;
  col = 0;
  directionApplied = false;
  directionChanged = false;
  aliensDirection = 1;

  firstStep = true;
}

var shieldsReset = true;

function resetShields()
{
  if (shieldsReset)
  {
    shield1.reset();
    shield2.reset();
    shield3.reset();
    shield4.reset();

    shieldsReset = false;
  }
  else
  {
    if (shield1.isInitialized && shield2.isInitialized && shield3.isInitialized && shield4.isInitialized) shieldsReset = true;
    else requestAnimationFrame(resetShields);
  }
}

function start() {
	for(var i=0; i<alienRowAmount; i++) {
    	aliens[i] = new Array(alienColumnAmount);
	}

	for(var i = 0; i < alienRowAmount; i++)
	{
		for(var j = 0; j < alienColumnAmount; j++)
		{
			var nextAlien;

			if (i == 0 || i == 1) nextAlien = new Alien(AlienType.OCTOPUS, 0, 0);
			if (i == 2 || i == 3) nextAlien = new Alien(AlienType.CRAB, 0, 0);
			if (i == 4) nextAlien = new Alien(AlienType.SQUID, 0, 0);
				
			aliens[i][j] = nextAlien;
			addGameObject(nextAlien);
		}
	}

	referenceAlien = aliens[0][0];
	referenceAlien.x = alienRefPos[0];
	referenceAlien.y = alienRefPos[1];

  for (let go of gameObjects) {
    go.start();
  }

  plungerShot.start();
  squigglyShot.start();
  rollingShot.start();
  saucer.start();
}

var directionApplied = false;
var firstStep = true;

function updateAliens()
{
  var currentMovingAlien = aliens[row][col];
  var newX;
  var newY;

  if (!currentMovingAlien.isDead && !currentMovingAlien.isActive) currentMovingAlien.isActive = true;

  if (currentMovingAlien == referenceAlien)
  {
    alienRefNextPos[0] += aliensDirection * ((aliensDirection > 0) ? ((aliensAlive == 1) ? aliensSpeedRightAngry : aliensSpeed) : aliensSpeed);
    newX = alienRefNextPos[0];
    newY = alienRefNextPos[1];
    
    if (directionChanged)
    {
      if (!directionApplied) directionApplied = true;
      else
      {
        directionApplied = false;
        directionChanged = false;
      }
    }

    referenceAlien.updatePosition(newX, newY);
    alienRefPos[0] = newX;
    alienRefPos[1] = newY;
    if (!firstStep) window.sound?.invaderStepNext();
    else firstStep = false;
  }
  else
  {
    newX = alienRefPos[0] + col * alienSpacing;
    newY = alienRefPos[1] - row * alienSpacing;
    currentMovingAlien.updatePosition(newX, newY);
  }

  do
  {
    if (++col > alienColumnAmount-1)
    {
      col = 0;
      if (++row > alienRowAmount-1) row = 0;
    }
  }
  while(aliens[row][col] != referenceAlien && aliens[row][col].isDead);
}

var plungerShot = new AlienShot(AlienShotType.PLUNGER, 0, 0);
var squigglyShot = new AlienShot(AlienShotType.SQUIGGLY, 0, 0);
var rollingShot = new AlienShot(AlienShotType.ROLLING, 0, 0);
var saucer = new Saucer(0, 0);

function findColumn(x)
{
  var columnIndex = 0;
  for (var i = 1; i < alienColumnAmount; i++)
  {
    if (x >= alienRefPos[0] + 16 * i) columnIndex = i;
  }
  return columnIndex;
}

function findInColumn(column)
{
  for (var i = 0; i < alienRowAmount; i++)
  {
    if (!aliens[i][column].isDead) return [aliens[i][column].x + 7, aliens[i][column].y + 18 - squigglyShot.height];
  }

  return false;
}

function canAliensFireNow(thisShot, otherA, otherB, reloadRate) {
  if (!alienFire || !thisShot.canbeShot || player.isDead) return false;

  if (otherA.delayTimer != 0 && otherA.delayTimer <= reloadRate) return false;
  if (otherB.delayTimer != 0 && otherB.delayTimer <= reloadRate) return false;

  return true;
}

function updateAlienEvents()
{
  var delay = getAlienShotDelay();

  shotSync = (shotSyncOverride !== null) ? shotSyncOverride : obj2TimerExtra;
  shotSyncOverride = null;

  if (shotSync == 0)
  {
    if (!rollingShot.canbeShot) rollingShot.update();
    else if (canAliensFireNow(rollingShot, plungerShot, squigglyShot, delay))
    {
      const column = findColumn(player.x + 8);
      const shootingPos = findInColumn(column);

      if (shootingPos !== false) {
        rollingShot.shoot(shootingPos[0], shootingPos[1]);
        rollingShot.delayTimer++;
      }
    }

    obj2TimerExtra = 2;
    return;
  }
  else if (shotSync == 1)
  {
    if (!skipPlunger)
    {
      if (!plungerShot.canbeShot) plungerShot.update();
      else if (canAliensFireNow(plungerShot, rollingShot, squigglyShot, delay))
      {
        const column = getNextPlungerShotColumn()-1;
        const shootingPos = findInColumn(column);

        if (shootingPos !== false) {
          plungerShot.shoot(shootingPos[0], shootingPos[1]);
          plungerShot.delayTimer++;
        }
      }
    }
  }
  else if (shotSync == 2)
  {
    if (!squigglyShot.canbeShot) squigglyShot.update();
    else if (saucer.isActive)
    {
      saucer.update();
    }
    else if (saucerFlag && aliensAlive >= 8)
    {
      saucer.launch();
      saucerFlag = false;
      window.sound?.ufoStart();
    }
    else if (canAliensFireNow(squigglyShot, rollingShot, plungerShot, delay))
    {
      const column = getNextSquigglyShotColumn()-1;
      const shootingPos = findInColumn(column);

      if (shootingPos !== false) {
        squigglyShot.shoot(shootingPos[0], shootingPos[1]);
        squigglyShot.delayTimer++;
      }
    }
  }

  if (obj2TimerExtra > 0) obj2TimerExtra--;
}

function update()
{

  if (playerScore > hiScore) {
  hiScore = playerScore;
  localStorage.setItem("hiScore", String(hiScore));
  }

  if (lives > 0)
  {
    if (!obtainedExtraLife && playerScore >= bonusScore)
      {
        lives++;
        obtainedExtraLife = true;
      }

    if(alienRefPos[1] > minAlienYToSaucer)
    {
      if (timeUntilSaucer == 0) {
          timeUntilSaucer = 0x0600;
          saucerFlag = true;
      }
      timeUntilSaucer--;
    }

    if (!player.isDead && player.initialDelay == 0)
    {
      if (--alienFireTimer <= 0)
      {
        alienFireTimer = 0;
        alienFire = true;
      }
    }
    
    for(let go of gameObjects)
    {
      go.update();
    }
    
    if (aliensAlive > 0)
    {
      if (!player.isDead)
      {
        updateAliens();
      }
      updateAlienEvents();
    }
    else
    {
      level++;
      player.x = playerStartPosition[0];
      player.initialDelay = playerInitialDelay;
      aliensAlive = alienRowAmount * alienColumnAmount;

      playerShot.reset();
      plungerShot.reset();
      squigglyShot.reset();
      rollingShot.reset();
      saucer.reset();

      skipPlunger = false;
      shotSync = 2;
      obj2TimerExtra = 2;
      timeUntilSaucer = saucerTimer;
      saucerFlag = false;

      resetShields();
      ground.reset();

      alienFire = false;
      alienFireTimer = alienFireDelay;

      resetAliens();

      sound._stepIndex = 0;
    }

    if (DEBUGMODE)
    {
      if (keysDown[keyMap.R]) gameUpdateRate = 1/2000;
      else gameUpdateRate = 1/60;
    }
  }
  else if (player.deadAnimationTimer <= 0)
  {
    
  }
  else player.update();
}

function pad4(n) {
  n = Math.max(0, n | 0);
  return String(n).padStart(4, "0");
}

function recolorWhiteBands(ctx, w, h, yMaxRed, yMinGreen, opts = {}) {
  const {
    whiteThreshold = 250,

    tolerance = 5,
  } = opts;

  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;

  const yTopEnd = Math.max(0, Math.min(h, yMaxRed | 0));
  const yBottomStart = Math.max(0, Math.min(h, yMinGreen | 0));

  for (let y = 0; y < h; y++) {
    let mode = 0;
    if (y < yTopEnd) mode = 1;
    else if (y >= yBottomStart) mode = 2;
    else continue;

    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const a = d[i + 3];
      if (a === 0) continue;

      const r = d[i], g = d[i + 1], b = d[i + 2];

      if (
        r >= whiteThreshold - tolerance &&
        g >= whiteThreshold - tolerance &&
        b >= whiteThreshold - tolerance
      ) {
        if (mode === 1) {
          d[i] = 255; d[i + 1] = 0;   d[i + 2] = 0;
        } else {
          d[i] = 0;   d[i + 1] = 255; d[i + 2] = 0;
        }
      }
    }
  }

  ctx.putImageData(img, 0, 0);
}

function render() 
{
  // Background
  ctx.fillStyle = "#111111FF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render in z-order
  gameObjects.sort((a, b) => a.z - b.z);

  for (let go of gameObjects) {
  if (go.initialDelay <= 0) go.render(ctx);
  }

  if (!skipPlunger) plungerShot.render();
  squigglyShot.render();
  rollingShot.render();
  saucer.render();

  recolorWhiteBands(ctx, canvas.width, canvas.height, (saucerPosY + saucer.height + 3) * unit, (shieldsPosY - 3) * unit, {
    whiteThreshold: 255,
    tolerance: 0
  });

  drawHUD(ctx);
}

function drawHUD(ctx) {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  ctx.fillStyle = "white";
  ctx.textBaseline = "top";
  ctx.font = `${8 * unit}px Invaders`;

  const topY = 0 * unit;

  // LABELS
  ctx.fillText("SCORE<1> HI-SCORE SCORE<2>", 10 * unit, topY);
  ctx.fillText(
    String(playerScore).padStart(4, "0"),
    24 * unit,
    16 * unit
  );

  // NUMBERS
  const midX = canvas.width / 2;
  ctx.fillText(
    String(hiScore).padStart(4, "0"),
    88 * unit,
    16 * unit
  );

  ctx.fillText(
    "0000",
    168 * unit,
    16 * unit
  );

  const livesX = 9 * unit;
  const hudBottomY = (255 - 16) * unit;

  ctx.textBaseline = "top";
  ctx.fillStyle = "white";
  ctx.font = `${8 * unit}px Invaders`;
  ctx.fillText(String(lives), livesX, hudBottomY);

  const iconSrc = player?.hudIconGreen || player?.spriteAlive;
  if (player && iconSrc) {
    const scale = 1;
    const iconW = player.width * unit * scale;
    const iconH = player.height * unit * scale;

    const startX = livesX + 16 * unit;
    const gap = 0 * unit;

    const iconY = hudBottomY; 

    for (let i = 0; i < Math.min(lives - 1, 3); i++) {
      const x = startX + i * (iconW + gap);
      ctx.drawImage(iconSrc, x, iconY, iconW, iconH);
    }
  }

  ctx.fillText(
    "CREDIT 00",
    136 * unit,
    hudBottomY
  );

  ctx.restore();
}


function loadImage(src, callback)
{
	const img = new Image();
	img.onload = () => callback(img);
	img.src = src;
}

const clamp = (num, min, max) => Math.max(min, Math.min(num, max));

var lastTime = 0;
var accumulator = 0;

function main(timestamp) {
  canvas.height = window.innerHeight;
  canvas.width = canvas.height * 0.875;
  unit = canvas.height/256; 
  ctx.imageSmoothingEnabled = false;
  ctx.strokeStyle = "lime";

  if (!lastTime) lastTime = timestamp;
  var dt = (timestamp - lastTime) / 1000;

	while (accumulator >= gameUpdateRate) {
  if (!window.__paused) update();
  accumulator -= gameUpdateRate;
}


	accumulator += dt;

    render();

    lastTime = timestamp;
    requestAnimationFrame(main);
}

function waitForGOInit()
{
	let allReady = gameObjects.every(go => go.isInitialized) 
    && allAlienAssetsLoaded()
    && plungerShot.isInitialized
    && rollingShot.isInitialized
    && squigglyShot.isInitialized
    && sound._ready;

	if(!allReady) requestAnimationFrame(waitForGOInit);
	else
	{
		start();
		requestAnimationFrame(main);
	}
}

window.__startWhenReady = function () {
  waitForGOInit();
};
