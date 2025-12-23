var canvasParent = document.getElementById('canvas-parent');
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.height = window.innerHeight;
canvas.width = canvas.height * 0.875;
canvas.style.position = "absolute";
canvasParent.appendChild(canvas);
ctx.imageSmoothingEnabled = false;

//-------Game parameters-------
const unit = canvas.height/256;
const gameWidth = 224;
const gameHeight = 256;
var gameUpdateRate = 1/60;

var lives = 3;
var level = 1;
var playerShotsCount = 0;
var playerScore = 0;

const playfieldLeft  = 9  * unit;
const playfieldRight = 215 * unit;

//-------Player constants-------
const playerInitialDelay = 128;
const playerMoveTimer = 0; // This is allways 0, the original code has this so the player can be slowed down but it is set to 0
const playerSpeedH = unit;

const deadAnimationDuration = 30;
const deadAnimationInterval = 5;
const respawnDelay = 128;

const playerMinX = 32  * unit;
const playerMaxX = 176 * unit;
const playerStartPosition = [playerMinX, 223 * unit];

//-------Player shot constants-------
const playerShotSpeedV = 4 * unit;
const playerShotInitialDelay = 0;
const playerShotTimer = 0;
const playerShotExplosionTimer = 16;

//-------Alien positioning and movement-------
const alienDeadAnimationTimer = 16;
const alienRowAmount = 5;
const alienColumnAmount = 11;

var col = 0;
var row = 0;

var aliensAlive = alienRowAmount * alienColumnAmount; // At the start 55

const alienRefStartingPosx = 23 * unit;
const alienRefStartingPosYRound1 = 120 * unit; // Level 1

const alienRefStartingPosYTable = [ 96, 80, 72, 72, 72, 64, 64, 64 ];

// To calculate the starting pos in each level except level 1
function getAlienRefStartingPosY(level) {
    if (level === 1) return alienRefStartingPosYRound1;
    return alienRefStartingPosYTable[(level - 2) % alienRefStartingPosYTable.length] * unit;
}

var alienRefPos = [alienRefStartingPosx, getAlienRefStartingPosY(level)]; // Position of the bottom left alien
var referenceAlien = null;
var alienRefNextPos = [alienRefPos[0], alienRefPos[1]];
const alienSpacing = 16 * unit; // From bottom left corner
var aliensDirection = 1;
var directionChanged = false;

const aliensSpeed = 2 * unit;
const aliensSpeedRightAngry = 3 * unit; // When there is only 1 alien

// We have to update the position of the aliens one at a time, 
// first we add to alienRefNextPos.x the value:
// aliensDirection * (alienDirection > 0) ? ((aliensAlive == 1) ? aliensSpeedRightAngry : aliensSpeed) : aliensSpeed
// then we do alienRefPos = alienRefNextPos and every alienDrawinRate seconds
// we move the next one to alienRefPos + (col * alienSpacin, row * alienSpacing)
// if any alien hits the left or right wall AlienRefPos.y += 8 and aliensDirection *= -1;
// until we arrive at the reference alien where we start again

//-------Alien shooting-------
const alienShotTimer = 3; // Each 3 frames the shot advances 4 or 5 units
const alienShotSpeedNormal = 4 * unit;
const alienShotSpeedAngry = 5 * unit; // When there is 8 or less aliens

var alienshotSpeed = alienShotSpeedNormal;

// Delay in ticks
const alienShotDelay200Points = 48; // When player has 200 points or less
const alienShotDelay1000Points = 16; // When player has 1000 points or less
const alienShotDelay2000Points = 11; // When player has 2000 points or less
const alienShotDelay3000Points = 8; // When player has 3000 points or less
const alienShotDelayMoreThan3000Points = 7; // When player has more than 3000

var alienShotDelay = alienShotDelay200Points;

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

//-------Shields-------

const shieldsPosY = 192 * unit;

const shield1PosX = 32 * unit;
const shield2PosX = (55 + 22) * unit;
const shield3PosX = (78 + 22*2) * unit;
const shield4PosX = (101 + 22*3) * unit;