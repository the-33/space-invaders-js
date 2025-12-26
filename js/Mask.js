function makePool(n = 2) {
  return Array.from({ length: n }, () => {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d", { willReadFrequently: true });
    return { c, ctx, busy: false };
  });
}

const pool = makePool(4);

async function createBitmask(img, alphaThreshold = 10) {
  let slot;
  while (!(slot = pool.find(p => !p.busy))) {
    await new Promise(r => setTimeout(r, 0));
  }

  slot.busy = true;
  try {
    const w = img.width, h = img.height;
    slot.c.width = w; slot.c.height = h;
    slot.ctx.clearRect(0, 0, w, h);
    slot.ctx.drawImage(img, 0, 0);

    const pixels = slot.ctx.getImageData(0, 0, w, h).data;
    const wordsPerRow = (w + 31) >>> 5;
    const data = new Uint32Array(wordsPerRow * h);

    for (let y = 0; y < h; y++) {
      const rowBase = y * wordsPerRow;
      for (let x = 0; x < w; x++) {
        if (pixels[(y * w + x) * 4 + 3] >= alphaThreshold) {
          data[rowBase + (x >>> 5)] |= (1 << (x & 31));
        }
      }
    }

    return { w, h, wordsPerRow, data, offX: 0, offY: 0 };
  } finally {
    slot.busy = false;
  }
}

function maskBounds(obj) {
  const offX = (obj.mask?.offX ?? 0) | 0;
  const offY = (obj.mask?.offY ?? 0) | 0;

  const x = ((obj.x ?? 0) | 0) + offX;
  const y = ((obj.y ?? 0) | 0) + offY;

  const w = obj.mask ? (obj.mask.w | 0) : ((obj.width ?? 0) | 0);
  const h = obj.mask ? (obj.mask.h | 0) : ((obj.height ?? 0) | 0);

  return { x, y, w, h };
}

function aabbOverlap(a, b) {
  const A = maskBounds(a);
  const B = maskBounds(b);

  const x1 = Math.max(A.x, B.x);
  const y1 = Math.max(A.y, B.y);
  const x2 = Math.min(A.x + A.w, B.x + B.w);
  const y2 = Math.min(A.y + A.h, B.y + B.h);

  if (x2 <= x1 || y2 <= y1) return null;
  return { x: x1 | 0, y: y1 | 0, w: (x2 - x1) | 0, h: (y2 - y1) | 0 };
}

function read32FromRow(mask, y, bitX) {
  if (!mask || !Number.isFinite(y) || !Number.isFinite(bitX)) return 0;

  const { wordsPerRow, data } = mask;

  const wordIndex = (bitX >>> 5);
  const shift = (bitX & 31);
  const base = y * wordsPerRow + wordIndex;

  if (base < 0 || base >= data.length) return 0;

  const lo = data[base] >>> shift;
  if (shift === 0) return lo;

  const next = base + 1;
  const rowEnd = (y + 1) * wordsPerRow;
  const hi = (next < rowEnd) ? (data[next] << (32 - shift)) : 0;

  return (lo | hi) >>> 0;
}

function pixelPerfectBitmask(a, b) {
  const overlap = aabbOverlap(a, b);
  if (!overlap) return false;

  if (!a?.mask || !b?.mask) return false;

  const aOffX = (a.mask.offX ?? 0) | 0;
  const aOffY = (a.mask.offY ?? 0) | 0;
  const bOffX = (b.mask.offX ?? 0) | 0;
  const bOffY = (b.mask.offY ?? 0) | 0;

  const ax0ScreenL = ((a.x ?? 0) | 0) + aOffX;
  const ay0ScreenL = ((a.y ?? 0) | 0) + aOffY;
  const bx0ScreenL = ((b.x ?? 0) | 0) + bOffX;
  const by0ScreenL = ((b.y ?? 0) | 0) + bOffY;

  const ax0 = (overlap.x - ax0ScreenL) | 0;
  const ay0 = (overlap.y - ay0ScreenL) | 0;
  const bx0 = (overlap.x - bx0ScreenL) | 0;
  const by0 = (overlap.y - by0ScreenL) | 0;

  const mw = overlap.w | 0;
  const mh = overlap.h | 0;
  if (mw <= 0 || mh <= 0) return false;

  for (let my = 0; my < mh; my++) {
    const ay = ay0 + my;
    const by = by0 + my;

    if (ay < 0 || ay >= (a.mask.h | 0) || by < 0 || by >= (b.mask.h | 0)) continue;

    for (let dx = 0; dx < mw; dx += 32) {
      const chunkW = Math.min(32, mw - dx);

      const bitsA = read32FromRow(a.mask, ay, ax0 + dx);
      const bitsB = read32FromRow(b.mask, by, bx0 + dx);

      const validMask = (chunkW === 32) ? 0xFFFFFFFF : ((1 << chunkW) - 1);

      if (((bitsA & bitsB) & validMask) !== 0) return true;
    }
  }

  return false;
}

function clearBit(mask, x, y) {
  const { wordsPerRow, data } = mask;
  if (x < 0 || x >= mask.w || y < 0 || y >= mask.h) return;
  const idx = y * wordsPerRow + (x >>> 5);
  data[idx] &= ~(1 << (x & 31));
}

function lsbIndex32(x) {
  const lsb = x & -x;
  return 31 - Math.clz32(lsb);
}