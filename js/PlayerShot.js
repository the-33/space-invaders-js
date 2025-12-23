class PlayerShot extends GameObject
{
    constructor(x, y, z = 0)
    {
        super(x, y, z, playerShotInitialDelay, playerShotTimer);

        this.canBeShot = true;
        this.isActive = false;
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
			this.width = img.width * unit;
			this.height = img.height * unit;
            this.maskNormal = await createBitmask(img, 1);

			spritesReady++;
		});

        loadImage("img/player-shot/player-shot-explosion.png", async (img) => {
			this.explosionSprite = img;
			this.explosionWidth = img.width * unit;
			this.explosionHeight = img.height * unit;
            this.maskExplosion = await createBitmask(img, 1);
            this.maskExplosion.offX = - Math.floor(this.maskExplosion.w/2);
            this.maskExplosion.offY = 0;

			spritesReady++;

            while(spritesReady < 2 && this.mask == null) {}

            this.isInitialized = true;
		});
    }

    start()
    {
        this.mask = this.maskNormal;
    }

    shoot(x, y)
    {
        if (!this.canBeShot) return;

        this.x = x;
        this.y = y;
        this.canBeShot = false;
        this.isActive = true;
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
    }

    update()
    {
        if(!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) { this.initialDelay--; return; }
        if (this.timer > 0) { this.timer--; return; }

        if (this.y <= 0) this.hit();

        if (this.isExploding)
        {
            this.explosionTimer--;
            if (this.explosionTimer == 0)
            {
                if (this.collidedShield != null) this.collidedShield.checkHitAndDamage(this);
                this.reset();
            }
        }
        else this.y -= playerShotSpeedV;
    }

    render()
    {
        if(!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) return;
        if (!this.isExploding) ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
        else ctx.drawImage(
            this.explosionSprite, 
            this.x - Math.floor(this.explosionWidth/2), 
            this.y <= 0 ? 0 : this.y, 
            this.explosionWidth, 
            this.explosionHeight
        );
    }
}