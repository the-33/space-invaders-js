class Player extends GameObject
{
    constructor(x, y, z = 0)
    {
        super(x, y, z, playerInitialDelay, playerMoveTimer);

        this.isDead = false;
        this.canShoot = true;
        this.respawnTimer = respawnDelay;
        this.deadAnimationTimer = deadAnimationInterval;

        this.spriteAlive = null;
        this.mask = null;
        this.spriteDead1 = null;
        this.spriteDead2 = null;

        this.width = 0;
        this.height = 0;
        
        var spritesReady = 0;
        
        loadImage("img/player/player.png", async (img) => {
			this.spriteAlive = img;
			this.width = img.width;
			this.height = img.height;
            this.mask = await createBitmask(img, 1);

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 3);
		});

        loadImage("img/player/player-death/1.png", (img) => {
			this.spriteDead1 = img;

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 3);
		});

        loadImage("img/player/player-death/2.png", (img) => {
			this.spriteDead2 = img;

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 3);
		});

        this.currentSprite = null;
    }

    start()
	{
        this.isDead = false;
        this.currentSprite = this.spriteAlive;
        this.x = playerStartPosition[0];
        this.y = playerStartPosition[1];
	}

    update()
    {
        if (!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) { this.initialDelay--; return; }
        if (this.timer > 0) { this.timer--; return; }

        this.timer = playerMoveTimer;

        if (!this.isDead)
        {
            if ((keysDown[keyMap.A] || keysDown[keyMap.LEFT]) && this.x > playerMinX) this.x -= playerSpeedH;
            if ((keysDown[keyMap.D] || keysDown[keyMap.RIGHT]) && this.x < playerMaxX) this.x += playerSpeedH;
            if (keysDown[keyMap.SPACE])
            {
                if (this.canShoot && playerShot.canBeShot) playerShot.shoot(this.x + Math.floor(this.width/2), this.y);
                this.canShoot = false;
            }
            else this.canShoot = true;
        }
        else
        {
            this.deadAnimationTimer--;
            this.respawnTimer--;
            alienFire = false;
            alienFireTimer = alienFireDelay;

            if (this.deadAnimationTimer <= 0 && this.respawnTimer >= respawnDelay- deadAnimationDuration)
            {
                this.currentSprite = (this.currentSprite === this.spriteDead1) ? this.spriteDead2 : this.spriteDead1;
                this.deadAnimationTimer = deadAnimationInterval;
            }

            if (this.respawnTimer == respawnDelay - deadAnimationDuration) 
                if (lives > 0) lives--;

            if (this.respawnTimer == 0)
            {
                this.x = playerStartPosition[0];
                this.y = playerStartPosition[1];

                this.isDead = false;
                this.currentSprite = this.spriteAlive;
                this.respawnTimer = respawnDelay;
                this.deadAnimationTimer = deadAnimationInterval;
            }
        }
    }

    render(ctx)
    {
        if (!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) return;
        if (this.isDead && this.respawnTimer <= respawnDelay - deadAnimationDuration) return;

        ctx.drawImage(this.currentSprite, this.x * unit, this.y * unit, this.width * unit, this.height * unit);

        if (DEBUGMODE)
        {
            const A = maskBounds(this);
            ctx.strokeRect(Math.round(A.x * unit), Math.round(A.y * unit), Math.round(A.w * unit), Math.round(A.h * unit));
        }
    }
}