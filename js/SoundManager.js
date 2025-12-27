class SoundManager {
  constructor(opts = {}) {
    this.enabled = opts.enabled ?? true;     // SFX
    this.musicEnabled = opts.musicEnabled ?? true; // for loops like UFO hum
    this.volume = opts.volume ?? 0.8;

    this._poolSize = opts.poolSize ?? 6;
    this._sounds = new Map();     // key -> Audio[] pool
    this._loops = new Map();      // key -> Audio (loop)
    this._ready = false;

    this.manifest = {
      shoot: "sfx/shoot.wav",
      invaderKilled: "sfx/invader-killed.wav",
      explosion: "sfx/explosion.wav",

      ufoAlive: "sfx/ufo/alive.wav",
      ufoDead: "sfx/ufo/dead.wav",

      step1: "sfx/invaders/1.wav",
      step2: "sfx/invaders/2.wav",
      step3: "sfx/invaders/3.wav",
      step4: "sfx/invaders/4.wav",
    };
  }

  // Call once after a user gesture is guaranteed
  async init() {
    // Create pools
    for (const [key, url] of Object.entries(this.manifest)) {
      const pool = [];
      for (let i = 0; i < this._poolSize; i++) {
        const a = new Audio(url);
        a.preload = "auto";
        a.volume = this.volume;
        pool.push(a);
      }
      this._sounds.set(key, pool);
    }

    // Loop channels (single instance)
    this._loops.set("ufoAlive", this._makeLoop(this.manifest.ufoAlive));
    this._ready = true;

    this._unlock();
  }

  _makeLoop(url) {
    const a = new Audio(url);
    a.preload = "auto";
    a.loop = true;
    a.volume = this.volume;
    return a;
  }

  _unlock() {
    // best-effort unlock
    try {
      const a = new Audio();
      a.muted = true;
      a.play().catch(() => {});
      a.pause();
    } catch {}
  }

  setEnabled(v) { this.enabled = !!v; }
  setMusicEnabled(v) {
    this.musicEnabled = !!v;
    if (!this.musicEnabled) this.stopLoop("ufoAlive");
  }
  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    // update all
    for (const pool of this._sounds.values()) {
      for (const a of pool) a.volume = this.volume;
    }
    for (const a of this._loops.values()) {
      a.volume = this.volume;
    }
  }

  play(key, { volume = 1.0 } = {}) {
    if (!this._ready) return;
    if (!this.enabled) return;

    const pool = this._sounds.get(key);
    if (!pool || pool.length === 0) return;

    // Find a free audio in pool
    let a = pool.find(x => x.paused || x.ended);
    if (!a) a = pool[0]; // steal first

    try {
      a.currentTime = 0;
      a.volume = this.volume * Math.max(0, Math.min(1, volume));
      a.play().catch(() => {});
    } catch {}
  }

  playLoop(key, { volume = 1.0 } = {}) {
    if (!this._ready) return;
    if (!this.musicEnabled) return;

    const a = this._loops.get(key);
    if (!a) return;

    try {
      if (!a.paused) return;
      a.currentTime = 0;
      a.volume = this.volume * Math.max(0, Math.min(1, volume));
      a.play().catch(() => {});
    } catch {}
  }

  stopLoop(key) {
    const a = this._loops.get(key);
    if (!a) return;
    try {
      a.pause();
      a.currentTime = 0;
    } catch {}
  }

  // Convenience helpers
  playShoot() { this.play("shoot", { volume: 0.9 }); }
  playInvaderKilled() { this.play("invaderKilled", { volume: 0.9 }); }
  playExplosion() { this.play("explosion", { volume: 1.0 }); }

  ufoStart() { this.playLoop("ufoAlive", { volume: 0.7 }); }
  ufoStop() { this.stopLoop("ufoAlive"); }
  ufoDead() { this.play("ufoDead", { volume: 1.0 }); }

  invaderStepNext() {
    // 1-2-3-4 loop
    if (!this._stepIndex) this._stepIndex = 0;
    const keys = ["step1", "step2", "step3", "step4"];
    this.play(keys[this._stepIndex], { volume: 0.65 });
    this._stepIndex = (this._stepIndex + 1) % 4;
  }
}

// Global instance
window.sound = new SoundManager({ enabled: true, musicEnabled: true, volume: 0.8, poolSize: 6 });
