const AlienType = {
    CRAB: 1,
    SQUID: 2,
    OCTOPUS: 3
};

let crabSprite1 = null;
let crabSprite2 = null;
let crabMask1 = null;
let crabMask2 = null;

let octopusSprite1 = null;
let octopusSprite2 = null;
let octopusMask1 = null;
let octopusMask2 = null;

let squidSprite1 = null;
let squidSprite2 = null;
let squidMask1 = null;
let squidMask2 = null;

let alienDeadSprite = null;

function loadAlienAssets()
{
    loadImage("img/aliens/crab/1.png", async (img) => {
        crabSprite1 = img;
        crabMask1 = await createBitmask(img, 1);
    });

    loadImage("img/aliens/crab/2.png", async (img) => {
        crabSprite2 = img;
        crabMask2 = await createBitmask(img, 1);
    });

    loadImage("img/aliens/octopus/1.png", async (img) => {
        octopusSprite1 = img;
        octopusMask1 = await createBitmask(img, 1);
    });

    loadImage("img/aliens/octopus/2.png", async (img) => {
        octopusSprite2 = img;
        octopusMask2 = await createBitmask(img, 1);
    });

    loadImage("img/aliens/squid/1.png", async (img) => {
        squidSprite1 = img;
        squidMask1 = await createBitmask(img, 1);
    });

    loadImage("img/aliens/squid/2.png", async (img) => {
        squidSprite2 = img;
        squidMask2 = await createBitmask(img, 1);
    });

    loadImage("img/aliens/death.png", async (img) => {
        alienDeadSprite = img;
    });
}

function allAlienAssetsLoaded() {
    return (
        crabSprite1 !== null &&
        crabSprite2 !== null &&
        crabMask1   !== null &&
        crabMask2   !== null &&

        octopusSprite1 !== null &&
        octopusSprite2 !== null &&
        octopusMask1   !== null &&
        octopusMask2   !== null &&

        squidSprite1 !== null &&
        squidSprite2 !== null &&
        squidMask1   !== null &&
        squidMask2   !== null &&

        alienDeadSprite !== null
    );
}

class Alien extends GameObject
{
    constructor(type, x, y, z = 0)
    {
        super(x, y, z, 0, 0);

        this.type = type;

        this.sprite1 = null;
        this.sprite2 = null;
        this.spriteDead = alienDeadSprite;

        this.mask1 = null;
        this.mask2 = null;

        this.rightPadding = 0;
        this.leftPadding = 0;

        this.isDead = false;
        this.deadTimer = alienDeadAnimationTimer;

        switch(type)
        {
            case AlienType.CRAB:
                this.sprite1 = crabSprite1;
                this.sprite2 = crabSprite2;
                this.mask1 = crabMask1;
                this.mask2 = crabMask2;
                this.rightPadding = 2;
                this.leftPadding = 3;
                break;
            case AlienType.SQUID:
                this.sprite1 = squidSprite1;
                this.sprite2 = squidSprite2;
                this.mask1 = squidMask1;
                this.mask2 = squidMask2;
                this.rightPadding = 4;
                this.leftPadding = 4;
                break;
            case AlienType.OCTOPUS:
            default:
                this.sprite1 = octopusSprite1;
                this.sprite2 = octopusSprite2;
                this.mask1 = octopusMask1;
                this.mask2 = octopusMask2;
                this.rightPadding = 2;
                this.leftPadding = 2;
        }

        this.width = 16;
        this.height = 8;

        this.currentSprite = this.sprite1;
        this.mask = this.mask1;

        this.isInitialized = true;
    }

    start()
	{
        this.isActive = false;
        this.currentSprite = this.sprite1;
        this.mask = this.mask1;
        this.isDead = false;
        this.deadTimer = alienDeadAnimationTimer;
	}

    updatePosition(x, y)
    {
        if(!this.isInitialized || !this.isActive) return;

        this.x = x;
        this.y = y;

        if (this.isDead) return;

        if (this.currentSprite == this.sprite1) this.currentSprite = this.sprite2;
        else this.currentSprite = this.sprite1;

        if (this.currentSprite == this.sprite1) this.mask = this.mask1;
        else this.mask = this.mask2;

        if ((this.x  <= playfieldLeft - this.leftPadding || this.x >= playfieldRight - this.width + this.rightPadding) && !directionChanged)
        {
            aliensDirection *= -1;
            alienRefNextPos[1] += 8;
            directionChanged = true;
        }
        
        this.checkCollisionWithShields();
        this.checkInvasion();
    }

    checkCollisionWithBullet()
    {
        if(!playerShot.isActive || playerShot.isExploding) return;
        if (pixelPerfectBitmask(this, playerShot))
        {
            this.isDead = true;
            playerShot.reset();
            aliensAlive--;
            if (aliensAlive == 1) skipPlunger = true;
            switch(this.type)
            {
                case AlienType.CRAB:
                    playerScore += 20;
                    break;
                case AlienType.SQUID:
                    playerScore += 30;
                    break;
                case AlienType.OCTOPUS:
                default:
                    playerScore += 10;
            }
        }
    }

    checkCollisionWithShields()
    {
        shield1.checkHitAndDamage(this);
        shield2.checkHitAndDamage(this);
        shield3.checkHitAndDamage(this);
        shield4.checkHitAndDamage(this);
    }

    checkInvasion()
    {
        if(player.isDead) return;
        if (this.y + this.height >= player.y) 
        {
            player.isDead = true;
            lives = 0;
        }
    }

    update()
    {
        if(!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) { this.initialDelay--; return; }
        if (this.timer > 0) { this.timer--; return; }

        if (this.isDead)
        {
            this.deadTimer--;
            if (this.deadTimer == 0) this.isActive = false;
        }
        else this.checkCollisionWithBullet();
    }

    render(ctx)
    {
        if(!this.isInitialized || !this.isActive) return;
        if (this.initialDelay > 0) return;

        if (!this.isDead) ctx.drawImage(this.currentSprite, this.x * unit, this.y * unit, this.width * unit, this.height * unit);
        else ctx.drawImage(this.spriteDead, this.x * unit, this.y * unit, this.width * unit, this.height * unit);

        if (DEBUGMODE)
        {
            const A = maskBounds(this);
            ctx.strokeRect(Math.round(A.x * unit), Math.round(A.y * unit), Math.round(A.w * unit), Math.round(A.h * unit));
        }
    }
}