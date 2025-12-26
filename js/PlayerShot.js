class PlayerShot extends GameObject
{
    constructor(x, y, z = 0)
    {
        super(x, y, z, playerShotInitialDelay, playerShotTimer);

        this.canBeShot = true;
        this.isExploding = false;
        this.explosionTimer = playerShotExplosionTimer;

        this.sprite = null;

        this.maskNormal = null;
        this.maskExplosion = null;
        this.mask = null;

        this.collidedShield = null;

        this.width = 0;
        this.height = 0;

        this.explosionSprite = null;
        this.explosionWidth = 0;
        this.explosionHeight = 0;

        var spritesReady = 0;

        loadImage("img/player-shot/player-shot.png", async (img) => {
			this.sprite = img;
			this.width = img.width;
			this.height = img.height;
            this.maskNormal = await createBitmask(img, 1);

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 2);
		});

        loadImage("img/player-shot/player-shot-explosion.png", async (img) => {
			this.explosionSprite = img;
			this.explosionWidth = img.width;
			this.explosionHeight = img.height;
            this.maskExplosion = await createBitmask(img, 1);
            this.maskExplosion.offX = - 3;
            this.maskExplosion.offY = + 2;

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 2);
		});
    }

    start()
    {
        this.mask = this.maskNormal;
        this.isActive = false;
    }

    shoot(x, y)
    {
        if (!this.canBeShot) return;

        this.x = x;
        this.y = y;
        this.canBeShot = false;
        this.isActive = true;
        playerShotsCount++;
    }

    reset()
    {
        this.isActive = false;
        this.isExploding = false;
        this.canBeShot = true;
        this.collidedShield = null;
        this.mask = this.maskNormal;
        this.explosionTimer = playerShotExplosionTimer;
    }

    hit(collidedShield)
    {
        if (this.isExploding || !this.isActive) return;
        this.isExploding = true;
        this.mask = this.maskExplosion;
        this.collidedShield = collidedShield;

        if (this.y <= playerShotMaxY) this.y = playerShotMaxY;
    }

    update()
    {
        if(!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) { this.initialDelay--; return; }
        if (this.timer > 0) { this.timer--; return; }

        if (this.isExploding)
        {
            this.explosionTimer--;
            if (this.explosionTimer == 0)
            {
                if (this.collidedShield != null) this.collidedShield.checkHitAndDamage(this);
                this.reset();
            }
        }
        else
        {
            this.y -= playerShotSpeedV;

            if (plungerShot.isActive && !plungerShot.isExploding && pixelPerfectBitmask(this, plungerShot)) {
                plungerShot.hit();
                this.hit();
            }

            if (rollingShot.isActive && !rollingShot.isExploding && pixelPerfectBitmask(this, rollingShot)) {
                rollingShot.hit();
                this.hit();
            }

            if (squigglyShot.isActive && !squigglyShot.isExploding && pixelPerfectBitmask(this, squigglyShot)) {
                squigglyShot.hit();
                this.hit();
            }

            if (saucer.isActive && !saucer.isExploding && pixelPerfectBitmask(this, saucer)) {
                this.reset();
                saucer.kill();
            }

            if (this.y <= playerShotMaxY) this.hit();
        }
    }

    render()
    {
        if(!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) return;

        if (!this.isExploding) ctx.drawImage(this.sprite, this.x * unit, this.y * unit, this.width * unit, this.height * unit);
        else ctx.drawImage(
            this.explosionSprite, 
            (this.x - 3) * unit, 
            (this.y + 2) * unit, 
            this.explosionWidth * unit, 
            this.explosionHeight * unit
        );

        if (DEBUGMODE)
        {
            const A = maskBounds(this);
            ctx.strokeRect(Math.round(A.x * unit), Math.round(A.y * unit), Math.round(A.w * unit), Math.round(A.h * unit));
        }
    }
}