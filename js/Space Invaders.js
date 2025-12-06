var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas.style.position = "absolute";
document.body.appendChild(canvas);

var bgPattern;
var tileReady = false;
var tileImage = new Image();
tileImage.onload = function () {
    tileReady = true;
    bgPattern = ctx.createPattern(tileImage, "repeat");
};
tileImage.src = "img/bgPattern.png";

var keysDown = {};

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

function start() {
    for (let go of gameObjects) {
     	go.start();
    }
}

function update(dt) {
    for (let go of gameObjects) {
			go.update(dt);
    }
}

function render() {
    // Background
    if (tileReady) {
        ctx.fillStyle = bgPattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Render in z-order
    gameObjects.sort((a, b) => a.z - b.z);

    for (let go of gameObjects) {
		go.render(ctx);
    }
}

function loadImage(src, callback)
{
	const img = new Image();
	img.onload = () => callback(img);
	img.src = src;
}

const clamp = (num, min, max) => Math.max(min, Math.min(num, max));

function isOverlapping(object1, object2)
{
	let overlapingX = (
		object1.x >= object2.x &&
		object1.x <= object2.x + object2.width
	) || (
		object1.x + object1.width >= object2.x &&
		object1.x + object1.width <= object2.x + object2.width
	);

	let overlapingY = (
		object1.y >= object2.y &&
		object1.y <= object2.y + object2.height
	) || (
		object1.y + object1.height >= object2.y &&
		object1.y + object1.height <= object2.y + object2.height
	);

	return overlapingX && overlapingY;
}

var lastTime = 0;

function main(timestamp) {
    if (!lastTime) lastTime = timestamp;
    var dt = (timestamp - lastTime) / 1000;

    update(dt);
    render();

    lastTime = timestamp;
    requestAnimationFrame(main);
}

function waitForGOInit()
{
	let allReady = gameObjects.every(go => go.isInitialized);

	if(!allReady) requestAnimationFrame(waitForGOInit);
	else
	{
		start();
		requestAnimationFrame(main);
	}
}

waitForGOInit();