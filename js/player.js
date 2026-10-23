// Schritt-für-Schritt-Steuerung: vor/zurück, Abspielen, Geschwindigkeit, Tastatur.

const SPEEDS = [0.5, 1, 2, 4];

export class Player {
  constructor(root, onStep) {
    this.onStep = onStep;
    this.steps = [];
    this.index = 0;
    this.timer = null;
    this.speed = 1;
    root.innerHTML = `
      <div class="player">
        <div class="buttons">
          <button class="icon" data-act="first" title="Zum Anfang (Pos1)" aria-label="Zum Anfang">⏮</button>
          <button class="icon" data-act="prev" title="Schritt zurück (←)" aria-label="Schritt zurück">‹</button>
          <button class="icon play" data-act="play" title="Abspielen (Leertaste)" aria-label="Abspielen">▶</button>
          <button class="icon" data-act="next" title="Schritt vor (→)" aria-label="Schritt vor">›</button>
          <button class="icon" data-act="last" title="Zum Ende (Ende)" aria-label="Zum Ende">⏭</button>
        </div>
        <input type="range" class="scrub" min="0" max="0" value="0" aria-label="Schritt wählen">
        <span class="counter" aria-live="off"></span>
        <button class="speed" title="Geschwindigkeit">1×</button>
      </div>`;
    this.scrub = root.querySelector('.scrub');
    this.counter = root.querySelector('.counter');
    this.playBtn = root.querySelector('.play');
    this.speedBtn = root.querySelector('.speed');
    this.root = root;

    root.addEventListener('click', (e) => {
      const act = e.target.closest('[data-act]')?.dataset.act;
      if (act === 'first') this.go(0);
      if (act === 'prev') this.go(this.index - 1);
      if (act === 'next') this.go(this.index + 1);
      if (act === 'last') this.go(this.steps.length - 1);
      if (act === 'play') this.toggle();
    });
    this.scrub.addEventListener('input', () => { this.pause(); this.go(Number(this.scrub.value)); });
    this.speedBtn.addEventListener('click', () => {
      this.speed = SPEEDS[(SPEEDS.indexOf(this.speed) + 1) % SPEEDS.length];
      this.speedBtn.textContent = `${this.speed}×`;
      if (this.timer) { this.pause(); this.play(); }
    });
    this.keyHandler = (e) => {
      if (e.target.closest('input, textarea, select, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const map = { ArrowRight: () => this.go(this.index + 1), ArrowLeft: () => this.go(this.index - 1), ' ': () => this.toggle(), Home: () => this.go(0), End: () => this.go(this.steps.length - 1) };
      if (map[e.key]) { e.preventDefault(); if (e.key !== ' ') this.pause(); map[e.key](); }
    };
    document.addEventListener('keydown', this.keyHandler);
  }

  destroy() {
    this.pause();
    document.removeEventListener('keydown', this.keyHandler);
  }

  load(steps, keepPosition = false) {
    this.pause();
    this.steps = steps;
    this.scrub.max = Math.max(0, steps.length - 1);
    this.go(keepPosition ? Math.min(this.index, steps.length - 1) : 0);
  }

  go(i) {
    if (!this.steps.length) return;
    this.index = Math.max(0, Math.min(this.steps.length - 1, i));
    this.scrub.value = this.index;
    this.counter.textContent = `Schritt ${this.index + 1} / ${this.steps.length}`;
    if (this.index === this.steps.length - 1) this.pause();
    this.onStep(this.steps[this.index], this.index);
  }

  toggle() {
    if (this.timer) this.pause(); else this.play();
  }

  play() {
    if (this.index >= this.steps.length - 1) this.go(0);
    this.playBtn.textContent = '⏸';
    this.playBtn.setAttribute('aria-label', 'Pause');
    this.timer = setInterval(() => this.go(this.index + 1), 900 / this.speed);
  }

  pause() {
    clearInterval(this.timer);
    this.timer = null;
    this.playBtn.textContent = '▶';
    this.playBtn.setAttribute('aria-label', 'Abspielen');
  }
}
