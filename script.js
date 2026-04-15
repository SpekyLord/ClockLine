// =============================================================
// The Information Age — Interactive Website
// NSCI 110 Creative Presentation | BSCS 1-B Group 6
// =============================================================

'use strict';

// ── Theme Management ─────────────────────────────────────────
const Theme = {
  /** Read saved preference and apply it on page load. */
  init() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    // Dark is the default (set on <html> in markup), so no action needed
    // if saved === 'dark' or nothing is saved.
  },

  /** Toggle between dark and light and persist the choice. */
  toggle() {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.replace('dark', 'light');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.replace('light', 'dark');
      localStorage.setItem('theme', 'dark');
    }
  },

  /** Returns 'dark' | 'light' */
  current() {
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  }
};

// ── TypeWriter ───────────────────────────────────────────────
const TypeWriter = {
  phrases: [
    'Welcome to the Information Age',
    'From Telegraph to AI',
    'The Story of How We Changed Everything'
  ],
  typeSpeed:   50,   // ms per character while typing
  eraseSpeed:  30,   // ms per character while erasing
  pauseAfter:  2000, // ms to wait after phrase is fully typed
  pauseBefore: 400,  // ms to wait before typing next phrase

  el:          null,
  phraseIndex: 0,
  charIndex:   0,
  isErasing:   false,
  subtitleShown: false,

  init() {
    this.el = document.getElementById('typed-text');
    if (!this.el) return;
    this._tick();
  },

  _tick() {
    const phrase = this.phrases[this.phraseIndex];

    if (this.isErasing) {
      // Remove one character
      this.charIndex--;
      this.el.textContent = phrase.slice(0, this.charIndex);

      if (this.charIndex === 0) {
        this.isErasing = false;
        this.phraseIndex = (this.phraseIndex + 1) % this.phrases.length;
        setTimeout(() => this._tick(), this.pauseBefore);
      } else {
        setTimeout(() => this._tick(), this.eraseSpeed);
      }
    } else {
      // Add one character
      this.charIndex++;
      this.el.textContent = phrase.slice(0, this.charIndex);

      if (this.charIndex === phrase.length) {
        // Phrase complete — show subtitle on first phrase
        if (!this.subtitleShown) {
          this.subtitleShown = true;
          const subtitle = document.getElementById('hero-subtitle');
          const members  = document.getElementById('hero-members');
          if (subtitle) subtitle.classList.add('visible');
          if (members)  members.classList.add('visible');
        }
        // Pause then start erasing
        setTimeout(() => {
          this.isErasing = true;
          this._tick();
        }, this.pauseAfter);
      } else {
        setTimeout(() => this._tick(), this.typeSpeed);
      }
    }
  }
};

// ── Particle Canvas ───────────────────────────────────────────
const ParticleCanvas = {
  canvas:    null,
  ctx:       null,
  particles: [],
  mouse:     { x: null, y: null },
  raf:       null,
  COUNT:     50,      // particles on desktop
  MOBILE_COUNT: 28,   // particles on mobile (≤768px)
  MAX_DIST:  130,     // max px between linked particles
  MOUSE_PULL: 80,     // px radius of mouse influence

  init() {
    this.canvas = document.getElementById('particle-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this._resize();
    this._spawnParticles();
    this._bindEvents();
    this._loop();
  },

  _resize() {
    const hero = document.getElementById('hero');
    this.canvas.width  = hero ? hero.offsetWidth  : window.innerWidth;
    this.canvas.height = hero ? hero.offsetHeight : window.innerHeight;
  },

  _spawnParticles() {
    const count = window.innerWidth <= 768 ? this.MOBILE_COUNT : this.COUNT;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x:  Math.random() * this.canvas.width,
        y:  Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        r:  Math.random() * 2 + 1.5   // radius 1.5–3.5px
      });
    }
  },

  _bindEvents() {
    // Track mouse position relative to the canvas
    const hero = document.getElementById('hero');
    if (hero) {
      hero.addEventListener('mousemove', (e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      }, { passive: true });
      hero.addEventListener('mouseleave', () => {
        this.mouse.x = null;
        this.mouse.y = null;
      });
    }

    // Resize with debounce
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this._resize();
        this._spawnParticles();
      }, 200);
    }, { passive: true });
  },

  _loop() {
    this.raf = requestAnimationFrame(() => this._loop());
    this._update();
    this._draw();
  },

  _update() {
    const W = this.canvas.width;
    const H = this.canvas.height;

    for (const p of this.particles) {
      // Mouse pull — gently drift toward cursor
      if (this.mouse.x !== null) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.MOUSE_PULL) {
          p.vx += dx * 0.0008;
          p.vy += dy * 0.0008;
        }
      }

      // Apply velocity with gentle damping
      p.vx *= 0.99;
      p.vy *= 0.99;

      // Speed cap
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 1.5) {
        p.vx = (p.vx / speed) * 1.5;
        p.vy = (p.vy / speed) * 1.5;
      }

      p.x += p.vx;
      p.y += p.vy;

      // Wrap around edges
      if (p.x < -p.r)     p.x = W + p.r;
      if (p.x > W + p.r)  p.x = -p.r;
      if (p.y < -p.r)     p.y = H + p.r;
      if (p.y > H + p.r)  p.y = -p.r;
    }
  },

  _draw() {
    const ctx   = this.ctx;
    const W     = this.canvas.width;
    const H     = this.canvas.height;
    const isDark = document.documentElement.classList.contains('dark');
    const dotColor  = isDark ? 'rgba(0,212,255,0.7)'  : 'rgba(0,150,200,0.6)';
    const lineColor = isDark ? 'rgba(0,212,255,'       : 'rgba(0,150,200,';

    ctx.clearRect(0, 0, W, H);

    // Draw connecting lines
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a  = this.particles[i];
        const b  = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < this.MAX_DIST) {
          const alpha = (1 - d / this.MAX_DIST) * 0.4;
          ctx.strokeStyle = lineColor + alpha + ')';
          ctx.lineWidth   = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw particles
    for (const p of this.particles) {
      ctx.fillStyle = dotColor;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};

// ── Scroll Progress Bar ──────────────────────────────────────
const RevealObserver = {
  elements: [],
  observer: null,

  init() {
    this.elements = Array.from(document.querySelectorAll('.reveal'));
    if (!this.elements.length) return;

    if (!('IntersectionObserver' in window)) {
      this.elements.forEach((element) => element.classList.add('visible'));
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('visible');
          this.observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.18,
        rootMargin: '0px 0px -10% 0px'
      }
    );

    this.elements.forEach((element) => this.observer.observe(element));
  }
};

// ── Scroll Progress Bar ───────────────────────────────────────
const ScrollProgress = {
  bar: null,

  init() {
    this.bar = document.getElementById('scroll-progress');
    if (!this.bar) return;
    window.addEventListener('scroll', () => this.update(), { passive: true });
    this.update(); // set initial value
  },

  update() {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const pct          = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    this.bar.style.width = pct + '%';
  }
};

// ── Navigation Dots ──────────────────────────────────────────
const NavDots = {
  dots: [],
  sections: [],
  observer: null,

  init() {
    this.dots     = Array.from(document.querySelectorAll('.nav-dot'));
    this.sections = this.dots
      .map(dot => document.getElementById(dot.dataset.section))
      .filter(Boolean);

    if (!this.sections.length) return;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            // Deactivate all dots, then activate the matching one
            this.dots.forEach(d => d.classList.remove('active'));
            const active = this.dots.find(
              d => d.dataset.section === entry.target.id
            );
            if (active) active.classList.add('active');
          }
        });
      },
      { threshold: 0.4 }
    );

    this.sections.forEach(section => this.observer.observe(section));
  }
};

// ── Theme Toggle Button ──────────────────────────────────────
function updateToggleIcon() {
  const moon = document.getElementById('icon-moon');
  const sun  = document.getElementById('icon-sun');
  if (!moon || !sun) return;

  if (Theme.current() === 'dark') {
    moon.style.display = '';
    sun.style.display  = 'none';
  } else {
    moon.style.display = 'none';
    sun.style.display  = '';
  }
}

// ── Initialise on DOM Ready ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();
  RevealObserver.init();
  ScrollProgress.init();
  NavDots.init();
  updateToggleIcon();

  // Phase 2: Hero
  ParticleCanvas.init();
  TypeWriter.init();

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      Theme.toggle();
      updateToggleIcon();
    });
  }
});
