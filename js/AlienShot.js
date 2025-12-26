const AlienShotType = {
    PLUNGER: 1,
    ROLLING: 2,
    SQUIGGLY: 3
};

class AlienShot extends GameObject
{
    constructor(type, x, y, z = 0)
    {
        super(x, y, z, 0, 0);

        this.width = 3;
        this.height = 8;

        this.explosionWidth = 0;
        this.explosionHeight = 0;

        this.sprites = [];
        this.explosionSprite = null;

        this.masks = [];
        this.explosionMask = null;

        this.sprite = null;
        this.mask = null;

        this.animationIndex = 0;

        this.isExploding = false;
        this.canbeShot = true;
        this.collidedShield = null;

        this.delayTimer = 0;

        var folderName = "";
        var spritesReady = 0;

        switch(type)
        {
            case AlienShotType.PLUNGER:
                folderName = "img/alien-shots/plunger/";
                break;
            case AlienShotType.ROLLING:
                folderName = "img/alien-shots/rolling/";
                break;
            case AlienShotType.SQUIGGLY:
            default:
                folderName = "img/alien-shots/squiggly/";
        }

        loadImage(folderName + "1.png", async (img) => {

			this.sprites[0] = img;
            this.masks[0] = await createBitmask(img, 1);

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 5);
		});

        loadImage(folderName + "2.png", async (img) => {
			this.sprites[1] = img;
            this.masks[1] = await createBitmask(img, 1);

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 5);
		});

        loadImage(folderName + "3.png", async (img) => {
			this.sprites[2] = img;
            this.masks[2] = await createBitmask(img, 1);

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 5);
		});

        loadImage(folderName + "4.png", async (img) => {
			this.sprites[3] = img;
            this.masks[3] = await createBitmask(img, 1);

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 5);
		});

        loadImage("img/alien-shots/explosion.png", async (img) => {
			this.explosionSprite = img;
            this.explosionMask = await createBitmask(img, 1);
            this.explosionMask.offX = -2;
            this.explosionMask.offY = 0;
            
            this.explosionHeight = img.height;
            this.explosionWidth = img.width;

			spritesReady++;
            this.isInitialized = tryInit(spritesReady, 5);
		});
    }

    start()
    {
        this.isActive = false;
        this.sprite = this.sprites[0];
        this.mask = this.masks[0];
    }

    reset()
    {
        this.isActive = false;
        this.isExploding = false;
        this.canbeShot = true;
        this.animationIndex = 0;
        this.sprite = this.sprites[0];
        this.mask = this.masks[0];
        this.collidedShield = null;
        this.delayTimer = 0;
    }

    hit(shield)
    {
        if (!this.isActive || this.isExploding) return;

        this.isExploding = true;
        this.sprite = this.explosionSprite;
        this.mask = this.explosionMask;
        this.collidedShield = shield;

        if (this.y + this.height >= groundLineY) ground.checkHitAndDamage(this);
    }
    
    shoot(x, y)
    {
        if (!this.canbeShot) return;

        this.delayTimer = 0;

        this.x = x;
        this.y = y;

        this.canbeShot = false;
        this.isActive = true;
    }

    update()
    {
        if(!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) { this.initialDelay--; return; }
        if (this.timer > 0) { this.timer--; return; }

        this.delayTimer++;

        if (this.isExploding)
        {
            this.y += (aliensAlive > 8) ? alienShotSpeedNormal : alienShotSpeedAngry;
            if (this.collidedShield != null) this.collidedShield.checkHitAndDamage(this);
            this.reset();
        }
        else
        {
            this.y += (aliensAlive > 8) ? alienShotSpeedNormal : alienShotSpeedAngry;
            if (++this.animationIndex >= this.sprites.length) this.animationIndex = 0;
            this.sprite = this.sprites[this.animationIndex];
            this.mask = this.masks[this.animationIndex];

            if (shield1.checkHitAndDamage(this)) this.hit(shield1);
            if (shield2.checkHitAndDamage(this)) this.hit(shield2);
            if (shield3.checkHitAndDamage(this)) this.hit(shield3);
            if (shield4.checkHitAndDamage(this)) this.hit(shield4);

            if (!player.isDead && pixelPerfectBitmask(this, player))
            {
                player.isDead = true;
                this.reset();
            }

            if (this.y + this.height >= groundLineY)
            {
                this.y = groundLineY - this.height + 1;
                this.hit();
            } 
        }
    }

    render()
    {
        if (!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) return;
        if (!this.isExploding) ctx.drawImage(this.sprite, this.x * unit, this.y * unit, this.width * unit, this.height * unit);
        else ctx.drawImage(
            this.explosionSprite, 
            (this.x - 2)  * unit, 
            (this.y) * unit, 
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