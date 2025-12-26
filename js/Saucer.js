class Saucer extends GameObject
{
    constructor(x, y, z = 0)
    {
        super(x, y, z, 0, 0);

        this.sprite = null;
        this.explosionSprite = null;

        this.mask = null;

        this.isExploding = false;
        this.explosionTimer = saucerExplosionAnimationDuration;

        this.width = 0;
        this.height = 0;

        this.direction = 1;

        var spritesReady = true;

        loadImage("img/saucer/saucer.png", async (img) => {
			this.sprite = img;
			this.width = img.width;
			this.height = img.height;
            this.mask = await createBitmask(img, 1);

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 2);
		});

        loadImage("img/saucer/dead.png", async (img) => {
			this.explosionSprite = img;

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 2);
		});
    }

    start()
    {
        this.y = saucerPosY;
        this.isActive = false;
    }

    launch()
    {
        if (this.isActive) return;

        this.direction = (playerShotsCount % 2 == 0) ? 1 : -1;

        if (this.direction == 1) this.x = 0 - this.width;
        else this.x = gameWidth;

        this.isActive = true;
    }

    reset()
    {
        this.explosionTimer = saucerExplosionAnimationDuration;
        this.isActive = false;
        this.isExploding = false;
    }

    kill()
    {
        this.isExploding = true;
        playerScore += saucerPointsTable[playerShotsCount%15];
    }

    update()
    {
        if(!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) { this.initialDelay--; return; }
        if (this.timer > 0) { this.timer--; return; }

        if (this.isExploding)
        {
            this.explosionTimer--;

            if (this.explosionTimer <= 0)
            {
                this.reset();
            }
        }
        else
        {
            if (this.x < 0 - this.width || this.x > gameWidth) this.reset();
            this.x += this.direction * saucerSpeedX;
        }
    }

    render()
    {
        if (!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) return;
        if (!this.isExploding) ctx.drawImage(this.sprite, this.x * unit, this.y * unit, this.width * unit, this.height * unit);
        else ctx.drawImage(
            this.explosionSprite, 
            this.x  * unit, 
            this.y * unit, 
            this.width * unit,
            this.height * unit
        );

        if (DEBUGMODE)
        {
            const A = maskBounds(this);
            ctx.strokeRect(Math.round(A.x * unit), Math.round(A.y * unit), Math.round(A.w * unit), Math.round(A.h * unit));
        }
    }
}