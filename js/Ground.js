class GroundLine extends GameObject {
  constructor(xL, yL, wPx, hPx, z = 0) {
    super(xL | 0, yL | 0, z, 0, 0);

    this._baseW = wPx | 0;
    this._baseH = hPx | 0;

    this.width = 0;
    this.height = 0;

    this.mask = null;

    this._c = document.createElement("canvas");
    this._ctx = this._c.getContext("2d", { willReadFrequently: true });
    this._imgData = null;
    this._pix = null;

    this._build();
  }

  _build() {
    const w = this._baseW | 0;
    const h = this._baseH | 0;

    const wordsPerRow = (w + 31) >>> 5;
    const data = new Uint32Array(wordsPerRow * h);

    for (let i = 0; i < data.length; i++) data[i] = 0xFFFFFFFF;

    const extraBits = (wordsPerRow << 5) - w;
    if (extraBits > 0) {
      const keepMask = (0xFFFFFFFF >>> extraBits) >>> 0;
      for (let row = 0; row < h; row++) {
        data[row * wordsPerRow + (wordsPerRow - 1)] &= keepMask;
      }
    }

    this.mask = { w, h, wordsPerRow, data, offX: 0, offY: 0 };

    this.width = w;
    this.height = h;

    this._c.width = w;
    this._c.height = h;
    this._ctx.clearRect(0, 0, w, h);
    this._ctx.imageSmoothingEnabled = false;
    this._ctx.fillStyle = "rgba(255,255,255,1)";
    this._ctx.fillRect(0, 0, w, h);

    this._imgData = this._ctx.getImageData(0, 0, w, h);
    this._pix = this._imgData.data;

    this.isInitialized = true;
  }

  reset() {
    this.isInitialized = false;

    this.isActive = true;

    this._build();
  }

  checkHitAndDamage(other) {
    if (!this.isInitialized || !this.isActive) return false;
    if (!other || !other.isInitialized || !other.isActive) return false;
    if (!this.mask || !other.mask) return false;

    const overlap = aabbOverlap(this, other);
    if (!overlap) return false;

    const aMaskX = (this.x | 0) + ((this.mask.offX ?? 0) | 0);
    const aMaskY = (this.y | 0) + ((this.mask.offY ?? 0) | 0);
    const bMaskX = (other.x | 0) + ((other.mask.offX ?? 0) | 0);
    const bMaskY = (other.y | 0) + ((other.mask.offY ?? 0) | 0);

    const ax0 = (overlap.x | 0) - aMaskX;
    const ay0 = (overlap.y | 0) - aMaskY;
    const bx0 = (overlap.x | 0) - bMaskX;
    const by0 = (overlap.y | 0) - bMaskY;

    const mw = overlap.w | 0;
    const mh = overlap.h | 0;
    if (mw <= 0 || mh <= 0) return false;

    let hit = false;
    let dirty = false;

    for (let my = 0; my < mh; my++) {
      const ay = ay0 + my;
      const by = by0 + my;

      if (ay < 0 || ay >= this.mask.h) continue;
      if (by < 0 || by >= other.mask.h) continue;

      for (let dx = 0; dx < mw; dx += 32) {
        const chunkW = Math.min(32, mw - dx);

        const bitsA = read32FromRow(this.mask, ay, ax0 + dx);
        const bitsB = read32FromRow(other.mask, by, bx0 + dx);

        const validMask = (chunkW === 32) ? 0xFFFFFFFF : ((1 << chunkW) - 1);
        let overlapBits = ((bitsA & bitsB) & validMask) >>> 0;

        if (overlapBits === 0) continue;

        hit = true;

        while (overlapBits) {
          const bit = lsbIndex32(overlapBits);
          const px = ax0 + dx + bit;

          clearBit(this.mask, px, ay);

          if (this._pix && px >= 0 && px < this.mask.w) {
            const p = (ay * this.mask.w + px) * 4;
            this._pix[p + 3] = 0;
            dirty = true;
          }

          overlapBits &= (overlapBits - 1);
        }
      }
    }

    if (hit && dirty && this._ctx && this._imgData) {
      this._ctx.putImageData(this._imgData, 0, 0);
    }

    return hit;
  }

  render(ctx) {
    if (!this.isInitialized || !this.isActive) return;
    if (this.initialDelay > 0) return;

    const u = unit;

    const offX = (this.mask?.offX ?? 0);
    const offY = (this.mask?.offY ?? 0);

    const sx = Math.round((this.x + offX) * u);
    const sy = Math.round((this.y + offY) * u);
    const sw = Math.round(this.width * u);
    const sh = Math.round(this.height * u);

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this._c, sx, sy, sw, sh);
  }
}