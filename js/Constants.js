var canvasParent = document.getElementById('canvas-parent');
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d", { willReadFrequently: true });
canvas.height = window.innerHeight;
canvas.width = canvas.height * 0.875;
canvas.style.position = "absolute";
canvasParent.appendChild(canvas);
ctx.imageSmoothingEnabled = false;
ctx.strokeStyle = "lime";

const tryInit = (spritesReady, number) => {
  if (spritesReady >= number) {
    return true;
  }
};

//-------Game parameters-------
var unit = canvas.height/256;
const gameWidth = 224;
const gameHeight = 256;
var gameUpdateRate = 1/60;

const DEBUGMODE = false;

var lives = 3;
var level = 1;
var playerShotsCount = 0;
var playerScore = 0;
var obtainedExtraLife = false;
const bonusScore = 1500;

const playfieldLeft  = 9;
const playfieldRight = 215;

//-------Player constants-------
const playerInitialDelay = 128;
const playerMoveTimer = 0; // This is allways 0, the original code has this so the player can be slowed down but it is set to 0
const playerSpeedH = 1;

const deadAnimationDuration = 30;
const deadAnimationInterval = 5;
const respawnDelay = 128;

const playerMinX = 16;
const playerMaxX = 186;
const playerStartPosition = [playerMinX, 215];

//-------Player shot constants-------
const playerShotSpeedV = 4;
const playerShotInitialDelay = 0;
const playerShotTimer = 0;
const playerShotExplosionTimer = 16;
const playerShotMaxY = gameHeight - 223 - 8;

//-------Alien positioning and movement-------
const alienDeadAnimationTimer = 16;
const alienRowAmount = 5;
const alienColumnAmount = 11;

var col = 0;
var row = 0;

var aliensAlive = alienRowAmount * alienColumnAmount; // At the start 55

const alienRefStartingPosx = 23;
const alienRefStartingPosYRound1 = 120; // Level 1

const alienRefStartingPosYTable = [ 96, 80, 72, 72, 72, 64, 64, 64 ];

// To calculate the starting pos in each level except level 1
function getAlienRefStartingPosY(level) {
    if (level === 1) return 255 - 8 - alienRefStartingPosYRound1;
    return 255 - 8 - alienRefStartingPosYTable[(level - 2) % alienRefStartingPosYTable.length];
}

var alienRefPos = [alienRefStartingPosx, getAlienRefStartingPosY(level)]; // Position of the bottom left alien
var referenceAlien = null;
var alienRefNextPos = [alienRefPos[0], alienRefPos[1]];
const alienSpacing = 16; // From bottom left corner
var aliensDirection = 1;
var directionChanged = false;

const aliensSpeed = 2;
const aliensSpeedRightAngry = 3; // When there is only 1 alien

// We have to update the position of the aliens one at a time, 
// first we add to alienRefNextPos.x the value:
// aliensDirection * (alienDirection > 0) ? ((aliensAlive == 1) ? aliensSpeedRightAngry : aliensSpeed) : aliensSpeed
// then we do alienRefPos = alienRefNextPos and every alienDrawinRate seconds
// we move the next one to alienRefPos + (col * alienSpacin, row * alienSpacing)
// if any alien hits the left or right wall AlienRefPos.y += 8 and aliensDirection *= -1;
// until we arrive at the reference alien where we start again

//-------Alien shooting-------
var alienFire = false;
const alienFireDelay = 48;
var alienFireTimer = alienFireDelay;

var skipPlunger = false;

const alienShotSpeedNormal = 4;
const alienShotSpeedAngry = 5; // When there is 8 or less aliens

var obj2TimerExtra = 2;
var shotSync = 2;
var shotSyncOverride = null;

function forceSquigglyTurnNextFrame() {
  shotSyncOverride = 2;
}

// Delay in ticks
const alienShotDelay200Points = 48; // When player has 200 points or less
const alienShotDelay1000Points = 16; // When player has 1000 points or less
const alienShotDelay2000Points = 11; // When player has 2000 points or less
const alienShotDelay3000Points = 8; // When player has 3000 points or less
const alienShotDelayMoreThan3000Points = 7; // When player has more than 3000

function getAlienShotDelay()
{
  var delay = alienShotDelay200Points;

  if (playerScore > 200) delay = alienShotDelay1000Points;
  if (playerScore > 1000) delay = alienShotDelay2000Points;
  if (playerScore > 2000) delay = alienShotDelay3000Points;
  if (playerScore > 3000) delay = alienShotDelayMoreThan3000Points;

  return delay;
}

// Shot positions

const shootingColumnTable = [1,7,1,1,1,4,11,1,6,3,1,1,11,9,2,8,2,11,4,7,10];

let plungerShotColumnIndex = 0;
let squigglyShotColumnIndex = 6;

function getNextPlungerShotColumn() {
  const column = shootingColumnTable[plungerShotColumnIndex];
  plungerShotColumnIndex = (plungerShotColumnIndex + 1) % 16;
  return column;
}

function getNextSquigglyShotColumn() {
  const column = shootingColumnTable[squigglyShotColumnIndex];
  squigglyShotColumnIndex = 6 + ((squigglyShotColumnIndex - 6 + 1) % 9);
  return column;
}

//-------Flying saucer-------

const minAlienYToSaucer = 255 - 128;
const saucerTimer = 1536;

var timeUntilSaucer = saucerTimer;
var saucerFlag = false;

const saucerSpeedX = 2;
const saucerPosY = playerShotMaxY + 9;

const saucerExplosionAnimationDuration = 16;

const saucerPointsTable = [100, 50, 50, 100, 150, 100, 100, 50, 300, 100, 100, 100, 50, 150, 100, 50];

//-------Shields-------

const shieldsPosY = 191;

const shield1PosX = 32;
const shield2PosX = (55 + 22);
const shield3PosX = (78 + 22*2);
const shield4PosX = (101 + 22*3);

//-------Ground-------

const groundLineY = 238;