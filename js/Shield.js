class Shield extends GameObject
{
  constructor(x, y, z = 0) {
    super(x, y, z, 0, 0);

    this.width = 0;
    this.height = 0;

    this.mask = null;

    this._c = document.createElement("canvas");
    this._ctx = this._c.getContext("2d", { willReadFrequently: true });
    this._imgData = null;
    this._pix = null;
    this._dirty = false;

    loadImage("img/shield/shield.png", async (img) => {
			const baseMask = await createBitmask(img, 1);

      this.mask = {
        w: baseMask.w,
        h: baseMask.h,
        wordsPerRow: baseMask.wordsPerRow,
        data: new Uint32Array(baseMask.data)
      };

      this.width = this.mask.w * unit;
      this.height = this.mask.h * unit;

      // textura inicial = imagen original (1:1 en pixels de máscara)
      this._c.width = this.mask.w;
      this._c.height = this.mask.h;
      this._ctx.clearRect(0, 0, this._c.width, this._c.height);
      this._ctx.drawImage(img, 0, 0, this._c.width, this._c.height);

      this._imgData = this._ctx.getImageData(0, 0, this._c.width, this._c.height);
      this._pix = this._imgData.data;

      this.isInitialized = true;
		});
  }

  start()
  {

  }

  checkHitAndDamage(other, u = unit) {
    if (!this.isInitialized || !this.isActive) return false;
    if (!other || !other.isInitialized || !other.isActive) return false;
    if (!this.mask || !other.mask) return false;
    if (!Number.isFinite(u) || u <= 0) return false;

    // AABB REAL de las máscaras (incluye offX/offY)
    const overlap = aabbOverlap(this, other, u);
    if (!overlap) return false;

    const aOffX = this.mask.offX ?? 0;
    const aOffY = this.mask.offY ?? 0;
    const bOffX = other.mask.offX ?? 0;
    const bOffY = other.mask.offY ?? 0;

    // Origen EN PANTALLA de cada máscara
    const aMaskX = this.x + aOffX * u;
    const aMaskY = this.y + aOffY * u;
    const bMaskX = other.x + bOffX * u;
    const bMaskY = other.y + bOffY * u;

    // Convertimos el overlap en pantalla -> coordenadas de máscara
    const ax0 = Math.floor((overlap.x - aMaskX) / u);
    const ay0 = Math.floor((overlap.y - aMaskY) / u);
    const ax1 = Math.ceil ((overlap.x + overlap.w - aMaskX) / u);
    const ay1 = Math.ceil ((overlap.y + overlap.h - aMaskY) / u);

    const bx0 = Math.floor((overlap.x - bMaskX) / u);
    const by0 = Math.floor((overlap.y - bMaskY) / u);
    const bx1 = Math.ceil ((overlap.x + overlap.w - bMaskX) / u);
    const by1 = Math.ceil ((overlap.y + overlap.h - bMaskY) / u);

    const mw = Math.min(ax1 - ax0, bx1 - bx0);
    const mh = Math.min(ay1 - ay0, by1 - by0);
    if (mw <= 0 || mh <= 0) return false;

    let hit = false;
    let dirty = false;

    // Recorremos filas solapadas
    for (let my = 0; my < mh; my++) {
      const ay = ay0 + my;
      const by = by0 + my;

      if (ay < 0 || ay >= this.mask.h || by < 0 || by >= other.mask.h) continue;

      // Recorremos en chunks de 32 (como tu pixelPerfectBitmask_unit)
      for (let dx = 0; dx < mw; dx += 32) {
        const chunkW = Math.min(32, mw - dx);

        const bitsA = read32FromRow(this.mask, ay, ax0 + dx);
        const bitsB = read32FromRow(other.mask, by, bx0 + dx);

        const validMask = (chunkW === 32) ? 0xFFFFFFFF : ((1 << chunkW) - 1);
        let overlapBits = ((bitsA & bitsB) & validMask) >>> 0;

        if (overlapBits === 0) continue;

        hit = true;

        // Borra EXACTAMENTE esos bits en el escudo
        while (overlapBits) {
          const bit = lsbIndex32(overlapBits); // 0..31 dentro del chunk
          const px = ax0 + dx + bit;           // x local en máscara del escudo

          clearBit(this.mask, px, ay);

          // borra visualmente (el canvas interno del escudo está en coords de máscara)
          if (this._pix) {
            if (px >= 0 && px < this.mask.w) {
              const p = (ay * this.mask.w + px) * 4;
              this._pix[p + 3] = 0; // alpha
              dirty = true;
            }
          }

          overlapBits &= (overlapBits - 1);
        }
      }
    }

    if (hit && dirty && this._ctx && this._imgData) {
      this._ctx.putImageData(this._imgData, 0, 0);
      this._dirty = false;
    }

    return hit;
  }

  update()
  {
    if (!playerShot.isActive || playerShot.isExploding) return;
    if(pixelPerfectBitmask(this, playerShot))
    {
      playerShot.hit(this);
    }
  }

  render(ctx) {
    if (!this.isInitialized || !this.isActive) return;
    if (this.initialDelay > 0) return;

    // dibuja escalado a tu "unit"
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this._c, this.x, this.y, this.width, this.height);
  }
}
