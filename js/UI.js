class GameUI {
  constructor() {
    this.gameState = "menu"; 
    this.soundEnabled = true;
    this.musicEnabled = true;

    this._hasEverPlayed = false;
    this._escHeld = false;

    this.ui = null;

    this.init();
  }

  async init() {
    if (!document.body) {
      window.addEventListener("DOMContentLoaded", () => this.init());
      return;
    }

    this.injectStyles();

    this.ui = document.createElement("div");
    this.ui.id = "game-ui";
    document.body.appendChild(this.ui);

    await document.fonts.ready;

    // ESC toggles pause during play
    window.addEventListener("keydown", (e) => {
      const isEsc = e.key === "Escape" || e.keyCode === 27;
      if (!isEsc) return;
      if (this._escHeld) return;
      this._escHeld = true;
      this.togglePause();
    });
    window.addEventListener("keyup", (e) => {
      const isEsc = e.key === "Escape" || e.keyCode === 27;
      if (isEsc) this._escHeld = false;
    });

    this.showMenu();

    const tick = () => {
      this.update();
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #game-ui{
        position:fixed; inset:0;
        display:flex; align-items:center; justify-content:center;
        z-index:1000;
        background: rgba(0,0,0,0.72);
        pointer-events:auto;
      }
      #game-ui.hidden{ display:none; }

      .arcade-card{
        position: relative;
        width: min(520px, 92vw);
        padding: 26px 22px 22px;
        border-radius: 18px;
        background: rgba(8,10,14,0.90);
        border: 2px solid rgba(255,255,255,0.10);
        box-shadow:
          0 18px 55px rgba(0,0,0,0.65),
          inset 0 0 0 2px rgba(0,255,0,0.08);
        overflow:hidden;
      }

      /* scanlines */
      .arcade-card::before{
        content:"";
        position:absolute; inset:0;
        background: repeating-linear-gradient(
          to bottom,
          rgba(255,255,255,0.04),
          rgba(255,255,255,0.04) 1px,
          rgba(0,0,0,0.00) 3px,
          rgba(0,0,0,0.00) 6px
        );
        opacity:0.25;
        pointer-events:none;
      }

      .arcade-title{
        font-family: Invaders, monospace;
        font-weight: 800;
        letter-spacing: 3px;
        text-align:center;
        font-size: 40px;
        margin-bottom: 18px;
        margin-left: 15px;
        color: #eaffea;
        text-shadow:
          0 0 10px rgba(0,255,0,0.25),
          0 0 20px rgba(0,255,0,0.12);
        user-select:none;
      }

      .arcade-sub{
        font-family: Invaders, monospace;
        text-align:center;
        font-size: 12px;
        color: rgba(255,255,255,0.80);
        margin-bottom: 18px;
        margin-left: 15px;
        user-select:none;
      }

      .arcade-grid{
        display:flex;
        flex-direction:column;
        gap: 12px;
        align-items:center;
      }

      .arcade-row{
        display:flex;
        gap: 12px;
        justify-content:center;
        flex-wrap: wrap;
      }

      .btn-arcade{
        min-width: 240px;
        padding: 14px 18px;
        padding-left: 29px;
        border-radius: 14px;
        border: 2px solid rgba(255,255,255,0.12);
        background: linear-gradient(to bottom, rgba(28,34,44,0.95), rgba(10,12,16,0.95));
        color: #eaffea;
        font-family: Invaders, monospace;
        font-size: 18px;
        letter-spacing: 2px;
        cursor:pointer;
        user-select:none;

        box-shadow:
          0 10px 0 rgba(0,0,0,0.35),
          inset 0 0 0 2px rgba(0,255,0,0.06);
        transition: transform .08s ease, box-shadow .08s ease, filter .08s ease;
      }
      .btn-arcade:hover{
        filter: brightness(1.08);
        transform: translateY(-2px);
      }
      .btn-arcade:active{
        transform: translateY(4px);
        box-shadow:
          0 6px 0 rgba(0,0,0,0.30),
          inset 0 0 0 2px rgba(0,255,0,0.05);
      }

      .btn-primary{
        border-color: rgba(0,255,0,0.25);
        box-shadow:
          0 10px 0 rgba(0,0,0,0.35),
          inset 0 0 0 2px rgba(0,255,0,0.14);
      }

      .btn-danger{
        border-color: rgba(255,70,70,0.30);
        box-shadow:
          0 10px 0 rgba(0,0,0,0.35),
          inset 0 0 0 2px rgba(255,70,70,0.10);
      }

      .toggle-line{
        width: 100%;
        display:flex;
        justify-content: space-between;
        align-items:center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 2px solid rgba(255,255,255,0.10);
        background: rgba(0,0,0,0.25);
        font-family: Invaders, monospace;
        color: rgba(255,255,255,0.88);
        letter-spacing: 1px;
      }

      .toggle-pill{
        min-width: 90px;
        text-align:center;
        padding: 8px 10px;
        border-radius: 999px;
        border: 2px solid rgba(255,255,255,0.12);
        background: rgba(20,24,32,0.9);
        cursor:pointer;
        user-select:none;
      }
      .toggle-on{
        border-color: rgba(0,255,0,0.25);
        box-shadow: 0 0 14px rgba(0,255,0,0.10);
      }
      .toggle-off{
        border-color: rgba(255,255,255,0.10);
        opacity: 0.85;
      }
    `;
    document.head.appendChild(style);
  }

  setOverlayVisible(visible) {
    if (visible) this.ui.classList.remove("hidden");
    else this.ui.classList.add("hidden");
  }

  renderCard(title, subtitle, bodyHtml) {
    this.ui.innerHTML = `
      <div class="arcade-card">
        <div class="arcade-title">${title}</div>
        ${subtitle ? `<div class="arcade-sub">${subtitle}</div>` : ""}
        <div class="arcade-grid">${bodyHtml}</div>
      </div>
    `;
  }

  //  Screens
  showMenu() {
    this.gameState = "menu";
    window.__paused = true;
    this.setOverlayVisible(true);

    this.renderCard(
      "SPACE INVADERS",
      "A/D or <span style = \"font-size: 20px;\">←</span>/<span style = \"font-size: 20px;\">→</span> move • SPACE shoot • ESC pause",
      `
        <button id="ui-play" class="btn-arcade btn-primary">PLAY</button>
        <button id="ui-settings" class="btn-arcade">SETTINGS</button>
      `
    );

    document.getElementById("ui-play").onclick = () => this.startGame();
    document.getElementById("ui-settings").onclick = () => this.showSettings();
  }

  showSettings() {
  this.gameState = "settings";
  window.__paused = true;
  this.setOverlayVisible(true);

  const soundClass = this.soundEnabled ? "toggle-pill toggle-on" : "toggle-pill toggle-off";
  const musicClass = this.musicEnabled ? "toggle-pill toggle-on" : "toggle-pill toggle-off";

  this.renderCard(
    "SETTINGS",
    "",
    `
      <div class="toggle-line">
        <div>SOUND</div>
        <div id="ui-sound" class="${soundClass}">${this.soundEnabled ? "ON" : "OFF"}</div>
      </div>

      <div class="toggle-line">
        <div>MUSIC</div>
        <div id="ui-music" class="${musicClass}">${this.musicEnabled ? "ON" : "OFF"}</div>
      </div>

      <div class="arcade-row">
        <button id="ui-back" class="btn-arcade">BACK</button>
      </div>
    `
  );

  // SOUND toggle
  document.getElementById("ui-sound").onclick = () => {
    this.soundEnabled = !this.soundEnabled;
    window.sound?.setEnabled(this.soundEnabled);   
    this.showSettings();                           
  };

  // MUSIC toggle
  document.getElementById("ui-music").onclick = () => {
    this.musicEnabled = !this.musicEnabled;
    window.sound?.setMusicEnabled(this.musicEnabled); 
    this.showSettings();                              
  };

  document.getElementById("ui-back").onclick = () => {
    if (this._hasEverPlayed) {
      this.showPause();
    } else {
      this.showMenu();
    }
  };
}


  showPause() {
    this.gameState = "paused";
    window.__paused = true;
    this.setOverlayVisible(true);

    this.renderCard(
      "PAUSED",
      "Press ESC again to continue.",
      `
        <button id="ui-resume" class="btn-arcade btn-primary">RESUME</button>
        <button id="ui-settings" class="btn-arcade">SETTINGS</button>
        <button id="ui-menu" class="btn-arcade">NEW GAME</button>
      `
    );

    document.getElementById("ui-resume").onclick = () => this.resumeGame();
    document.getElementById("ui-settings").onclick = () => this.showSettings();
    document.getElementById("ui-menu").onclick = () => this.retryGame();
  }

  showGameOver() {
    this.gameState = "gameover";
    window.__paused = true;
    this.setOverlayVisible(true);

    const scoreVal = (typeof playerScore !== "undefined") ? playerScore : 0;

    this.renderCard(
      "GAME OVER",
      `Score: ${scoreVal}`,
      `
        <button id="ui-retry" class="btn-arcade btn-primary">RETRY</button>
      `
    );

    document.getElementById("ui-retry").onclick = () => this.retryGame();
  }

  // Actions
  startGame() {
  this._hasEverPlayed = true;
  this.gameState = "playing";
  window.__paused = false;
  this.setOverlayVisible(false);

  // SOUND INIT
  if (window.sound && !window.sound._ready) {
    window.sound.init();
  }
  window.sound?.setEnabled(this.soundEnabled);
  window.sound?.setMusicEnabled(this.musicEnabled);

  if (!window.__gameBooted) {
    window.__gameBooted = true;
    if (typeof window.__startWhenReady === "function") {
      window.__startWhenReady();
    }
  }
}


  pauseGame() {
    if (this.gameState !== "playing") return;
    this.showPause();
  }

  resumeGame() {
    this.gameState = "playing";
    window.__paused = false;
    this.setOverlayVisible(false);
  }

  togglePause() {
    if (!this._hasEverPlayed) return;

    if (this.gameState === "playing") this.pauseGame();
    else if (this.gameState === "paused") this.resumeGame();
  }

  retryGame() {
    // Minimal safe reset (same philosophy as your previous UI)
    lives = 3;
    level = 1;
    playerScore = 0;
    playerShotsCount = 0;
    obtainedExtraLife = false;

    aliensAlive = alienRowAmount * alienColumnAmount;

    if (player) {
      player.isDead = false;
      player.isActive = true;
      player.x = playerStartPosition[0];
      player.y = playerStartPosition[1];
      player.initialDelay = playerInitialDelay;
      player.respawnTimer = respawnDelay;
      player.deadAnimationTimer = deadAnimationInterval;
      player.currentSprite = player.spriteAlive ?? player.currentSprite;
    }

    if (playerShot) {
      playerShot.reset?.();
      playerShot.isActive = false;
      playerShot.canBeShot = true;
    }

    plungerShot?.reset?.();
    squigglyShot?.reset?.();
    rollingShot?.reset?.();
    saucer?.reset?.();

    resetShields();
    ground.reset();

    sound._stepIndex = 0;

    alienFire = false;
    alienFireTimer = alienFireDelay;

    timeUntilSaucer = saucerTimer;
    saucerFlag = false;

    skipPlunger = false;
    shotSync = 2;
    obj2TimerExtra = 2;
    shotSyncOverride = null;

    resetAliens?.();

    // Resume
    this.gameState = "playing";
    window.__paused = false;
    this.setOverlayVisible(false);
  }

  // ---------- Runtime checks ----------
  update() {
    if (!this._hasEverPlayed) return;

    if (typeof lives === "number") {
      if (lives <= 0 && this.gameState === "playing") {
        this.showGameOver();
      }
    }
  }
}

// Create global UI instance
const gameUI = new GameUI();
