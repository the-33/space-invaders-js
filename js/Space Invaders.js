var keysDown = {};
var prevKeys = {};

addEventListener("keydown", function (e) {
    keysDown[e.keyCode] = true;
}, false);

addEventListener("keyup", function (e) {
    delete keysDown[e.keyCode];
}, false);

function makePool(n = 2) {
  return Array.from({ length: n }, () => {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d", { willReadFrequently: true });
    return { c, ctx, busy: false };
  });
}

const pool = makePool(4);

async function createBitmask(img, alphaThreshold = 10) {
  let slot;
  while (!(slot = pool.find(p => !p.busy))) {
    await new Promise(r => setTimeout(r, 0));
  }

  slot.busy = true;
  try {
    const w = img.width, h = img.height;
    slot.c.width = w; slot.c.height = h;
    slot.ctx.clearRect(0, 0, w, h);
    slot.ctx.drawImage(img, 0, 0);

    const pixels = slot.ctx.getImageData(0, 0, w, h).data;
    const wordsPerRow = (w + 31) >>> 5;
    const data = new Uint32Array(wordsPerRow * h);

    for (let y = 0; y < h; y++) {
      const rowBase = y * wordsPerRow;
      for (let x = 0; x < w; x++) {
        if (pixels[(y * w + x) * 4 + 3] >= alphaThreshold) {
          data[rowBase + (x >>> 5)] |= (1 << (x & 31));
        }
      }
    }

    return { w, h, wordsPerRow, data, offX: 0, offY: 0 };
  } finally {
    slot.busy = false;
  }
}

function maskBounds(obj, u = unit) {
  const offX = obj.mask?.offX ?? 0;
  const offY = obj.mask?.offY ?? 0;

  const x = obj.x + offX * u;
  const y = obj.y + offY * u;
  const w = obj.mask ? obj.mask.w * u : obj.width;
  const h = obj.mask ? obj.mask.h * u : obj.height;

  return { x, y, w, h };
}

function aabbOverlap(a, b, u = unit) {
  const A = maskBounds(a, u);
  const B = maskBounds(b, u);

  const x1 = Math.max(A.x, B.x);
  const y1 = Math.max(A.y, B.y);
  const x2 = Math.min(A.x + A.w, B.x + B.w);
  const y2 = Math.min(A.y + A.h, B.y + B.h);

  if (x2 <= x1 || y2 <= y1) return null;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

function read32FromRow(mask, y, bitX) {
  if (!mask || !Number.isFinite(y) || !Number.isFinite(bitX)) return 0;

  const { wordsPerRow, data } = mask;

  const wordIndex = (bitX >>> 5);
  const shift = (bitX & 31);
  const base = y * wordsPerRow + wordIndex;

  if (base < 0 || base >= data.length) return 0;

  const lo = data[base] >>> shift;
  if (shift === 0) return lo;

  const next = base + 1;
  const rowEnd = (y + 1) * wordsPerRow;
  const hi = (next < rowEnd) ? (data[next] << (32 - shift)) : 0;

  return (lo | hi) >>> 0;
}

function pixelPerfectBitmask(a, b, u = unit) {
  const overlap = aabbOverlap(a, b, u);
  if (!overlap) return false;

  if (!a.mask || !b.mask) return false;
  if (!Number.isFinite(u) || u <= 0) return false;

  const aOffX = a.mask.offX ?? 0;
  const aOffY = a.mask.offY ?? 0;
  const bOffX = b.mask.offX ?? 0;
  const bOffY = b.mask.offY ?? 0;

  // origen en pantalla de cada máscara
  const axScreen = a.x + aOffX * u;
  const ayScreen = a.y + aOffY * u;
  const bxScreen = b.x + bOffX * u;
  const byScreen = b.y + bOffY * u;

  const ax0 = Math.floor((overlap.x - axScreen) / u);
  const ay0 = Math.floor((overlap.y - ayScreen) / u);
  const ax1 = Math.ceil ((overlap.x + overlap.w - axScreen) / u);
  const ay1 = Math.ceil ((overlap.y + overlap.h - ayScreen) / u);

  const bx0 = Math.floor((overlap.x - bxScreen) / u);
  const by0 = Math.floor((overlap.y - byScreen) / u);
  const bx1 = Math.ceil ((overlap.x + overlap.w - bxScreen) / u);
  const by1 = Math.ceil ((overlap.y + overlap.h - byScreen) / u);

  const mw = Math.min(ax1 - ax0, bx1 - bx0);
  const mh = Math.min(ay1 - ay0, by1 - by0);
  if (mw <= 0 || mh <= 0) return false;

  for (let my = 0; my < mh; my++) {
    const ay = ay0 + my;
    const by = by0 + my;

    if (ay < 0 || ay >= a.mask.h || by < 0 || by >= b.mask.h) continue;

    for (let dx = 0; dx < mw; dx += 32) {
      const chunkW = Math.min(32, mw - dx);

      const bitsA = read32FromRow(a.mask, ay, ax0 + dx);
      const bitsB = read32FromRow(b.mask, by, bx0 + dx);

      const validMask = (chunkW === 32) ? 0xFFFFFFFF : ((1 << chunkW) - 1);
      if (((bitsA & bitsB) & validMask) !== 0) return true;
    }
  }

  return false;
}

function clearBit(mask, x, y) {
  const { wordsPerRow, data } = mask;
  if (x < 0 || x >= mask.w || y < 0 || y >= mask.h) return;
  const idx = y * wordsPerRow + (x >>> 5);
  data[idx] &= ~(1 << (x & 31));
}

function lsbIndex32(x) {
  const lsb = x & -x;
  return 31 - Math.clz32(lsb);
}

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
}

var directionApplied = false;

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

function update()
{
  if (lives > 0)
  {
    for(let go of gameObjects)
    {
      go.update();
    }
    
    if (aliensAlive > 0)
    {
      if (!player.isDead) updateAliens();
    }
    else
    {
      level++;
      resetAliens();
    }

    if (keysDown[keyMap.R]) gameUpdateRate = 1/2000;
    else gameUpdateRate = 1/60;
  }
  else if (player.deadAnimationTimer <= 0)
  {
    player.isActive = false;
    playerShot.isActive = false;
    for(var i = 0; i < alienRowAmount; i++)
    {
      for(var j = 0; j < alienColumnAmount; j++)
      {
        aliens[i][j].isActive = false;
      }
    }
  }
  else player.update();
}

function render() 
{
  // Background
  ctx.fillStyle = "#222222FF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Render in z-order
  gameObjects.sort((a, b) => a.z - b.z);

  for (let go of gameObjects) {
  if (go.initialDelay <= 0) go.render(ctx);
  }
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
    if (!lastTime) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000;

	while (accumulator >= gameUpdateRate)
	{
		update();
		accumulator -= gameUpdateRate;
	}

	accumulator += dt;

    render();

    lastTime = timestamp;
    requestAnimationFrame(main);
}

function waitForGOInit()
{
	let allReady = gameObjects.every(go => go.isInitialized) && allAlienAssetsLoaded();

	if(!allReady) requestAnimationFrame(waitForGOInit);
	else
	{
		start();
		requestAnimationFrame(main);
	}
}

waitForGOInit();