// =============================================================
// The Information Age — Interactive Website
// NSCI 110 Creative Presentation | BSCS 1-B Group 6
// =============================================================

'use strict';

const FORCE_MOTION_ALWAYS_ON = true;

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
  isReducedMotion: false,

  init() {
    this.canvas = document.getElementById('particle-canvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.isReducedMotion = FORCE_MOTION_ALWAYS_ON
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this._resize();
    this._spawnParticles();

    // Keep the visual "node" design visible for reduced-motion users,
    // but avoid continuous animation.
    if (this.isReducedMotion) {
      this._draw();
      return;
    }

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
const TimelineSection = {
  section: null,
  eras: [],
  hudName: null,
  hudRange: null,
  eraObserver: null,

  init() {
    this.section = document.getElementById('timeline');
    if (!this.section) return;

    this.eras = Array.from(this.section.querySelectorAll('[data-era]'));
    this.hudName = this.section.querySelector('[data-current-era-name]');
    this.hudRange = this.section.querySelector('[data-current-era-range]');

    if (!this.eras.length) return;

    this._bindCards();
    this._bindEraObserver();
    this._bindResize();
    this._updateHud(this.eras[0]);
  },

  _getCardParts(card) {
    return {
      toggle: card.querySelector('[data-card-toggle]'),
      panel: card.querySelector('[data-card-panel]')
    };
  },

  _bindCards() {
    this.eras.forEach((era) => {
      const cards = Array.from(era.querySelectorAll('[data-tech-card]'));

      cards.forEach((card) => {
        const { toggle, panel } = this._getCardParts(card);
        if (!toggle || !panel) return;

        panel.style.maxHeight = '0px';

        toggle.addEventListener('click', () => {
          this.toggleCard(card);
        });

        panel.addEventListener('transitionend', (event) => {
          if (event.propertyName !== 'max-height') return;
          if (card.classList.contains('is-open')) {
            panel.style.maxHeight = 'none';
          }
        });
      });

      era.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;

        const openCard = era.querySelector('[data-tech-card].is-open');
        if (!openCard) return;

        this.closeCard(openCard);
        const toggle = openCard.querySelector('[data-card-toggle]');
        if (toggle) toggle.focus();
      });
    });
  },

  _bindEraObserver() {
    if (!('IntersectionObserver' in window)) return;

    const ratios = new Map();
    this.eraObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios.set(entry.target, entry.isIntersecting ? entry.intersectionRatio : 0);
        });

        const bestMatch = Array.from(ratios.entries())
          .filter(([, ratio]) => ratio > 0)
          .sort((a, b) => b[1] - a[1])[0]?.[0];

        if (bestMatch) {
          this._updateHud(bestMatch);
        }
      },
      {
        threshold: [0, 0.2, 0.35, 0.5, 0.75],
        rootMargin: '-18% 0px -48% 0px'
      }
    );

    this.eras.forEach((era) => {
      ratios.set(era, 0);
      this.eraObserver.observe(era);
    });
  },

  _bindResize() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.eras.forEach((era) => {
          era.querySelectorAll('[data-tech-card].is-open').forEach((card) => {
            const { panel } = this._getCardParts(card);
            if (panel) {
              panel.style.maxHeight = 'none';
            }
          });
        });
      }, 150);
    }, { passive: true });
  },

  _updateHud(era) {
    if (this.hudName) {
      this.hudName.textContent = era.dataset.eraName || '';
    }
    if (this.hudRange) {
      this.hudRange.textContent = era.dataset.eraRange || '';
    }
  },

  toggleCard(card) {
    if (card.classList.contains('is-open')) {
      this.closeCard(card);
      return;
    }

    const era = card.closest('[data-era]');
    if (era) {
      era.querySelectorAll('[data-tech-card].is-open').forEach((openCard) => {
        if (openCard !== card) {
          this.closeCard(openCard);
        }
      });
    }

    this.openCard(card);
  },

  openCard(card) {
    const { toggle, panel } = this._getCardParts(card);
    if (!toggle || !panel) return;

    card.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    panel.style.maxHeight = '0px';

    requestAnimationFrame(() => {
      panel.style.maxHeight = `${panel.scrollHeight}px`;
    });
  },

  closeCard(card) {
    const { toggle, panel } = this._getCardParts(card);
    if (!toggle || !panel) return;

    if (panel.style.maxHeight === 'none') {
      panel.style.maxHeight = `${panel.scrollHeight}px`;
      panel.offsetHeight;
    }

    toggle.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    card.classList.remove('is-open');

    requestAnimationFrame(() => {
      panel.style.maxHeight = '0px';
    });
  }
};

const ImpactSection = {
  section: null,
  cards: [],

  init() {
    this.section = document.getElementById('impact');
    if (!this.section) return;

    this.cards = Array.from(this.section.querySelectorAll('[data-impact-card]'));
    if (!this.cards.length) return;

    this._bindCards();
    this._bindKeyboard();
  },

  _getToggle(card) {
    return card.querySelector('[data-impact-toggle]');
  },

  _setFaceVisibility(card, isFlipped) {
    const front = card.querySelector('[data-impact-face="front"]');
    const back = card.querySelector('[data-impact-face="back"]');

    if (front) {
      front.setAttribute('aria-hidden', isFlipped ? 'true' : 'false');
    }

    if (back) {
      back.setAttribute('aria-hidden', isFlipped ? 'false' : 'true');
    }
  },

  _updateLabel(card, isFlipped) {
    const toggle = this._getToggle(card);
    if (!toggle) return;

    const title = card.dataset.impactTitle || 'impact';
    const label = isFlipped
      ? `Show front of ${title} card`
      : `Flip ${title} card to see details`;

    toggle.setAttribute('aria-label', label);
  },

  _bindCards() {
    this.cards.forEach((card) => {
      const toggle = this._getToggle(card);
      if (!toggle) return;

      this._setFaceVisibility(card, false);
      this._updateLabel(card, false);

      toggle.addEventListener('click', () => {
        this.toggleCard(card);
      });
    });
  },

  _bindKeyboard() {
    this.section.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;

      const target = event.target instanceof Element ? event.target : null;
      const activeCard = target ? target.closest('[data-impact-card]') : null;

      if (activeCard && activeCard.classList.contains('is-flipped')) {
        event.preventDefault();
        this.closeCard(activeCard);
      }
    });
  },

  toggleCard(card) {
    if (card.classList.contains('is-flipped')) {
      this.closeCard(card);
      return;
    }

    this.openCard(card);
  },

  openCard(card) {
    const toggle = this._getToggle(card);
    if (!toggle) return;

    card.classList.add('is-flipped');
    toggle.setAttribute('aria-pressed', 'true');
    this._setFaceVisibility(card, true);
    this._updateLabel(card, true);
  },

  closeCard(card) {
    const toggle = this._getToggle(card);
    if (!toggle) return;

    card.classList.remove('is-flipped');
    toggle.setAttribute('aria-pressed', 'false');
    this._setFaceVisibility(card, false);
    this._updateLabel(card, false);
    toggle.focus();
  }
};

const ChallengesSection = {
  section: null,
  carousel: null,
  stage: null,
  cards: [],
  dots: [],
  prevButton: null,
  nextButton: null,
  activeIndex: 0,
  autoplayTimer: null,
  resumeTimer: null,
  autoplayDelay: 4800,
  resumeDelay: 8000,
  swipeThreshold: 48,
  isHovering: false,
  isFocusWithin: false,
  isTouching: false,
  touchStartX: 0,
  touchCurrentX: 0,
  autoplayAllowed: true,
  hoverQuery: window.matchMedia('(hover: hover)'),

  init() {
    this.section = document.getElementById('challenges');
    if (!this.section) return;

    this.carousel = this.section.querySelector('[data-challenges-carousel]');
    this.stage = this.section.querySelector('[data-challenge-stage]');
    this.cards = Array.from(this.section.querySelectorAll('[data-challenge-card]'));
    this.dots = Array.from(this.section.querySelectorAll('[data-challenge-dot]'));
    this.prevButton = this.section.querySelector('[data-challenge-prev]');
    this.nextButton = this.section.querySelector('[data-challenge-next]');

    if (!this.carousel || !this.stage || !this.cards.length) return;

    this._bindControls();
    this._bindHover();
    this._bindFocus();
    this._bindKeyboard();
    this._bindTouch();
    this._bindViewport();
    this.autoplayAllowed = this._isAutoplayAllowed();
    this._updateUi();
    this._startAutoplay();
  },

  _isAutoplayAllowed() {
    return !(window.innerWidth <= 900 || window.matchMedia('(pointer: coarse)').matches);
  },

  _bindViewport() {
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const nextState = this._isAutoplayAllowed();
        if (nextState === this.autoplayAllowed) return;

        this.autoplayAllowed = nextState;
        if (!this.autoplayAllowed) {
          this._pauseAutoplay();
          return;
        }

        this._scheduleResume();
      }, 180);
    }, { passive: true });
  },

  _bindControls() {
    if (this.prevButton) {
      this.prevButton.addEventListener('click', () => {
        this.goTo(this.activeIndex - 1, { userInitiated: true });
      });
    }

    if (this.nextButton) {
      this.nextButton.addEventListener('click', () => {
        this.goTo(this.activeIndex + 1, { userInitiated: true });
      });
    }

    this.dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        this.goTo(index, { userInitiated: true });
      });
    });
  },

  _bindHover() {
    if (!this.hoverQuery.matches) return;

    this.carousel.addEventListener('mouseenter', () => {
      this.isHovering = true;
      this._pauseAutoplay();
    });

    this.carousel.addEventListener('mouseleave', () => {
      this.isHovering = false;
      this._scheduleResume();
    });
  },

  _bindFocus() {
    this.carousel.addEventListener('focusin', () => {
      this.isFocusWithin = true;
      this._pauseAutoplay();
    });

    this.carousel.addEventListener('focusout', () => {
      requestAnimationFrame(() => {
        this.isFocusWithin = this.carousel.contains(document.activeElement);
        if (!this.isFocusWithin) {
          this._scheduleResume();
        }
      });
    });
  },

  _bindKeyboard() {
    this.carousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.goTo(this.activeIndex + 1, { userInitiated: true });
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.goTo(this.activeIndex - 1, { userInitiated: true });
      }
    });
  },

  _bindTouch() {
    this.stage.addEventListener('touchstart', (event) => {
      const touch = event.touches[0];
      if (!touch) return;

      this.isTouching = true;
      this.touchStartX = touch.clientX;
      this.touchCurrentX = touch.clientX;
      this._pauseAutoplay();
    }, { passive: true });

    this.stage.addEventListener('touchmove', (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      this.touchCurrentX = touch.clientX;
    }, { passive: true });

    this.stage.addEventListener('touchend', () => {
      const deltaX = this.touchCurrentX - this.touchStartX;
      this.isTouching = false;

      if (Math.abs(deltaX) >= this.swipeThreshold) {
        const direction = deltaX > 0 ? -1 : 1;
        this.goTo(this.activeIndex + direction, { userInitiated: true });
        return;
      }

      this._scheduleResume();
    }, { passive: true });

    this.stage.addEventListener('touchcancel', () => {
      this.isTouching = false;
      this._scheduleResume();
    }, { passive: true });
  },

  _pauseAutoplay() {
    clearTimeout(this.autoplayTimer);
    clearTimeout(this.resumeTimer);
    this.autoplayTimer = null;
    this.resumeTimer = null;
  },

  _startAutoplay() {
    if (!this.autoplayAllowed) return;
    if (this.autoplayTimer || this.isHovering || this.isFocusWithin || this.isTouching) return;

    this.autoplayTimer = window.setTimeout(() => {
      this.autoplayTimer = null;
      this.goTo(this.activeIndex + 1, { autoplay: true });
      this._startAutoplay();
    }, this.autoplayDelay);
  },

  _scheduleResume() {
    if (!this.autoplayAllowed) return;
    clearTimeout(this.resumeTimer);
    this.resumeTimer = null;

    if (this.isHovering || this.isFocusWithin || this.isTouching) return;

    this.resumeTimer = window.setTimeout(() => {
      this.resumeTimer = null;
      if (this.isHovering || this.isFocusWithin || this.isTouching) return;
      this.goTo(this.activeIndex + 1, { autoplay: true });
      this._startAutoplay();
    }, this.resumeDelay);
  },

  _getPosition(index) {
    const total = this.cards.length;
    const diff = (index - this.activeIndex + total) % total;

    if (diff === 0) return 'is-active';
    if (diff === 1) return 'is-next';
    if (diff === total - 1) return 'is-prev';
    if (diff === 2) return 'is-after';
    if (diff === total - 2) return 'is-before';
    return 'is-hidden';
  },

  _updateUi() {
    const positionClasses = ['is-active', 'is-prev', 'is-next', 'is-before', 'is-after', 'is-hidden'];

    this.cards.forEach((card, index) => {
      const position = this._getPosition(index);
      const isActive = position === 'is-active';

      card.classList.remove(...positionClasses);
      card.classList.add(position);
      card.dataset.position = position.replace('is-', '');
      card.setAttribute('aria-hidden', String(!isActive));
    });

    this.dots.forEach((dot, index) => {
      const isActive = index === this.activeIndex;
      dot.classList.toggle('is-active', isActive);

      if (isActive) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });

    this.carousel.dataset.activeIndex = String(this.activeIndex);
  },

  goTo(index, options = {}) {
    const { userInitiated = false, autoplay = false } = options;
    const total = this.cards.length;
    if (!total) return;

    const normalizedIndex = (index + total) % total;
    this.activeIndex = normalizedIndex;
    this._updateUi();

    if (userInitiated) {
      this._pauseAutoplay();
      this._scheduleResume();
      return;
    }

    if (autoplay) return;
  }
};

const FutureSection = {
  section: null,
  cards: [],
  layers: [],
  reduceMotionQuery: FORCE_MOTION_ALWAYS_ON
    ? { matches: false, addEventListener: () => {} }
    : window.matchMedia('(prefers-reduced-motion: reduce)'),

  init() {
    this.section = document.getElementById('future');
    if (!this.section) return;

    this.cards = Array.from(this.section.querySelectorAll('[data-future-card]'));
    this.layers = Array.from(this.section.querySelectorAll('[data-future-layer]'));

    if (!this.cards.length) return;

    this._bindCards();
    this._bindParallax();
    this._setParallax();
  },

  _getCardParts(card) {
    return {
      toggle: card.querySelector('[data-future-toggle]'),
      panel: card.querySelector('[data-future-panel]')
    };
  },

  _bindCards() {
    this.cards.forEach((card) => {
      const { toggle, panel } = this._getCardParts(card);
      if (!toggle || !panel) return;

      panel.style.maxHeight = '0px';

      toggle.addEventListener('click', () => {
        this.toggleCard(card);
      });

      panel.addEventListener('transitionend', (event) => {
        if (event.propertyName !== 'max-height') return;
        if (card.classList.contains('is-open')) {
          panel.style.maxHeight = 'none';
        }
      });
    });

    this.section.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;

      const openCard = this.section.querySelector('[data-future-card].is-open');
      if (!openCard) return;

      this.closeCard(openCard);
    });
  },

  _bindParallax() {
    if (!this.layers.length) return;

    this.reduceMotionQuery.addEventListener('change', () => {
      this._setParallax();
    });

    if (this.reduceMotionQuery.matches) return;

    let ticking = false;
    const update = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        this._setParallax();
        ticking = false;
      });
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
  },

  _setParallax() {
    if (!this.section) return;

    if (this.reduceMotionQuery.matches || window.innerWidth <= 900) {
      this.section.style.setProperty('--future-layer-1-x', '0px');
      this.section.style.setProperty('--future-layer-1-y', '0px');
      this.section.style.setProperty('--future-layer-2-x', '0px');
      this.section.style.setProperty('--future-layer-2-y', '0px');
      this.section.style.setProperty('--future-layer-3-x', '0px');
      this.section.style.setProperty('--future-layer-3-y', '0px');
      return;
    }

    const rect = this.section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const progress = Math.max(0, Math.min(1, (viewportHeight - rect.top) / (viewportHeight + rect.height)));
    const offset = progress - 0.5;

    this.section.style.setProperty('--future-layer-1-x', `${offset * 18}px`);
    this.section.style.setProperty('--future-layer-1-y', `${offset * -28}px`);
    this.section.style.setProperty('--future-layer-2-x', `${offset * -16}px`);
    this.section.style.setProperty('--future-layer-2-y', `${offset * 22}px`);
    this.section.style.setProperty('--future-layer-3-x', `${offset * 12}px`);
    this.section.style.setProperty('--future-layer-3-y', `${offset * -18}px`);
  },

  toggleCard(card) {
    if (card.classList.contains('is-open')) {
      this.closeCard(card);
      return;
    }

    this.cards.forEach((openCard) => {
      if (openCard !== card && openCard.classList.contains('is-open')) {
        this.closeCard(openCard, { restoreFocus: false });
      }
    });

    this.openCard(card);
  },

  openCard(card) {
    const { toggle, panel } = this._getCardParts(card);
    if (!toggle || !panel) return;

    card.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    panel.style.maxHeight = '0px';

    requestAnimationFrame(() => {
      panel.style.maxHeight = `${panel.scrollHeight}px`;
    });
  },

  closeCard(card, options = {}) {
    const { restoreFocus = true } = options;
    const { toggle, panel } = this._getCardParts(card);
    if (!toggle || !panel) return;

    if (panel.style.maxHeight === 'none') {
      panel.style.maxHeight = `${panel.scrollHeight}px`;
      panel.offsetHeight;
    }

    toggle.setAttribute('aria-expanded', 'false');
    panel.setAttribute('aria-hidden', 'true');
    card.classList.remove('is-open');

    requestAnimationFrame(() => {
      panel.style.maxHeight = '0px';
    });

    if (restoreFocus) {
      toggle.focus();
    }
  }
};

const PollSection = {
  section: null,
  buttons: [],
  resultRows: new Map(),
  loadingEl: null,
  confirmationEl: null,
  errorEl: null,
  totalEl: null,
  adminWrap: null,
  resetBtn: null,
  qrWrap: null,
  qrLink: null,
  app: null,
  db: null,
  pollRef: null,
  isSubmitting: false,
  hasRealtimeData: false,
  isFirebaseListenerBound: false,
  hasVoted: false,
  votedChoice: null,
  optionKeys: ['smartphone', 'internet', 'social_media', 'ai', 'streaming'],
  defaults: {
    smartphone: 0,
    internet: 0,
    social_media: 0,
    ai: 0,
    streaming: 0
  },
  storageKey: 'info_age_poll_vote',

  init() {
    this.section = document.getElementById('poll');
    if (!this.section) return;

    this.buttons = Array.from(this.section.querySelectorAll('[data-poll-vote]'));
    this.loadingEl = this.section.querySelector('[data-poll-loading]');
    this.confirmationEl = this.section.querySelector('[data-poll-confirmation]');
    this.errorEl = this.section.querySelector('[data-poll-error]');
    this.totalEl = this.section.querySelector('[data-poll-total]');
    this.adminWrap = this.section.querySelector('[data-poll-admin]');
    this.resetBtn = this.section.querySelector('[data-poll-reset]');
    this.qrWrap = this.section.querySelector('[data-poll-qr]');
    this.qrLink = this.section.querySelector('[data-poll-qr-link]');

    this.section.querySelectorAll('[data-poll-result]').forEach((row) => {
      const key = row.getAttribute('data-poll-result');
      if (!key) return;
      this.resultRows.set(key, {
        count: row.querySelector('[data-count]'),
        fill: row.querySelector('[data-fill]')
      });
    });

    const storedVote = localStorage.getItem(this.storageKey);
    if (storedVote && this.optionKeys.includes(storedVote)) {
      this.hasVoted = true;
      this.votedChoice = storedVote;
      this._setConfirmation('Thanks for voting! Your vote is already recorded on this browser.');
    }

    this._setLoading('Connecting to live poll...', true);
    this._renderQr();
    this._bindButtons();
    this._bindAdminReset();
    this._bindNetworkEvents();

    this._initFirebase();
    this._renderResults(this.defaults);
  },

  _setLoading(message, visible) {
    if (!this.loadingEl) return;
    this.loadingEl.textContent = message;
    this.loadingEl.classList.toggle('is-visible', Boolean(visible));
  },

  _setConfirmation(message) {
    if (this.confirmationEl) {
      this.confirmationEl.textContent = message;
    }
  },

  _setError(message) {
    if (this.errorEl) {
      this.errorEl.textContent = message;
    }
  },

  _setButtonsDisabled(disabled) {
    this.buttons.forEach((button) => {
      button.disabled = disabled || this.isSubmitting;
      button.setAttribute('aria-disabled', String(disabled));
      const key = button.getAttribute('data-poll-vote');
      button.classList.toggle('is-selected', Boolean(this.votedChoice) && key === this.votedChoice);
      button.classList.toggle('is-busy', this.isSubmitting);
    });
  },

  _bindNetworkEvents() {
    const applyNetworkState = () => {
      if (navigator.onLine) {
        this._setError('');
        if (!this.hasRealtimeData) {
          this._setLoading('Reconnecting to live poll...', true);
        }
        if (!this.pollRef) {
          this._initFirebase();
        }
        return;
      }

      this._setLoading('Offline mode: live updates paused.', true);
      this._setError('You are offline. Live vote sync is unavailable until connection is restored.');
      this._setButtonsDisabled(true);
    };

    window.addEventListener('online', applyNetworkState);
    window.addEventListener('offline', applyNetworkState);
    applyNetworkState();
  },

  _bindButtons() {
    this._setButtonsDisabled(this.hasVoted);

    this.buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.getAttribute('data-poll-vote');
        if (!key) return;
        this._submitVote(key);
      });
    });
  },

  _bindAdminReset() {
    const params = new URLSearchParams(window.location.search);
    const isAdmin = params.get('admin') === 'true';

    if (this.adminWrap) {
      this.adminWrap.hidden = !isAdmin;
    }

    if (!isAdmin || !this.resetBtn) return;

    this.resetBtn.addEventListener('click', async () => {
      if (!this.pollRef) {
        this._setError('Cannot reset poll yet. Firebase is not initialized.');
        return;
      }

      const confirmed = window.confirm('Reset poll results to zero for all options?');
      if (!confirmed) return;

      try {
        await this.pollRef.set({ ...this.defaults });
        this._setError('');
        this._setConfirmation('Poll has been reset by admin.');
      } catch (error) {
        this._setError('Failed to reset poll. Please try again.');
      }
    });
  },

  _initFirebase() {
    if (!navigator.onLine) {
      this._setLoading('Offline mode: live updates paused.', true);
      return;
    }

    if (!window.firebase || !window.firebase.apps) {
      this._setError('Live sync is offline. Add Firebase config to enable real-time polling.');
      this._setLoading('Live poll is unavailable in this build.', true);
      return;
    }

    const firebaseConfig = window.__FIREBASE_CONFIG__ || {
      apiKey: 'REPLACE_WITH_FIREBASE_API_KEY',
      authDomain: 'REPLACE_WITH_FIREBASE_AUTH_DOMAIN',
      databaseURL: 'REPLACE_WITH_FIREBASE_DATABASE_URL',
      projectId: 'REPLACE_WITH_FIREBASE_PROJECT_ID',
      storageBucket: 'REPLACE_WITH_FIREBASE_STORAGE_BUCKET',
      messagingSenderId: 'REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID',
      appId: 'REPLACE_WITH_FIREBASE_APP_ID'
    };

    const requiredKeys = [
      'apiKey',
      'authDomain',
      'databaseURL',
      'projectId',
      'storageBucket',
      'messagingSenderId',
      'appId'
    ];

    const hasRealConfig = requiredKeys.every((key) => {
      const value = firebaseConfig[key];
      return typeof value === 'string' && value.length > 0 && !value.startsWith('REPLACE_WITH_');
    });

    if (!hasRealConfig) {
      this._setError('Firebase config is incomplete. Paste your project config into window.__FIREBASE_CONFIG__ in index.html.');
      this._setLoading('Waiting for Firebase production credentials.', true);
      return;
    }

    try {
      this.app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(firebaseConfig);
      this.db = window.firebase.database(this.app);
      this.pollRef = this.db.ref('polls/info_age_poll');
      this._setError('');
      this._setLoading('Connecting to realtime results...', true);
      this._listenForResults();
    } catch (error) {
      this._setError('Failed to initialize Firebase poll connection.');
      this._setLoading('Live poll failed to initialize.', true);
    }
  },

  _listenForResults() {
    if (!this.pollRef || this.isFirebaseListenerBound) return;
    this.isFirebaseListenerBound = true;

    this.pollRef.on('value', (snapshot) => {
      const raw = snapshot && snapshot.val() ? snapshot.val() : {};
      const normalized = { ...this.defaults };

      this.optionKeys.forEach((key) => {
        const value = Number(raw[key]);
        normalized[key] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
      });

      this.hasRealtimeData = true;
      this._setLoading('Live results connected.', false);
      this._setButtonsDisabled(this.hasVoted);
      this._renderResults(normalized);
    }, () => {
      this._setError('Could not read live poll results. Check your Firebase database rules.');
      this._setLoading('Realtime listener failed. Retrying when available.', true);
      this.hasRealtimeData = false;
      this.isFirebaseListenerBound = false;
    });
  },

  async _submitVote(key) {
    if (!this.optionKeys.includes(key)) return;
    if (this.hasVoted) {
      this._setConfirmation('Thanks! You already voted from this browser.');
      return;
    }

    if (!this.pollRef) {
      this._setError('Voting is unavailable until Firebase credentials are configured.');
      return;
    }

    if (!navigator.onLine) {
      this._setError('You are offline. Please reconnect before voting.');
      return;
    }

    this._setError('');
    this.isSubmitting = true;
    this._setLoading('Submitting your vote...', true);
    this._setButtonsDisabled(this.hasVoted);

    try {
      const optionRef = this.pollRef.child(key);
      await optionRef.transaction((current) => {
        const base = Number(current);
        return Number.isFinite(base) ? base + 1 : 1;
      });

      this.hasVoted = true;
      this.votedChoice = key;
      localStorage.setItem(this.storageKey, key);
      this._setButtonsDisabled(true);
      this._setConfirmation('Thanks for voting! Your response has been recorded.');
      this._setLoading('Vote submitted. Waiting for realtime refresh...', true);
    } catch (error) {
      this._setError('Vote failed. Please check your connection and try again.');
      this._setLoading('Vote submission failed.', true);
    } finally {
      this.isSubmitting = false;
      this._setButtonsDisabled(this.hasVoted);
    }
  },

  _renderResults(results) {
    const total = this.optionKeys.reduce((sum, key) => sum + (results[key] || 0), 0);

    this.optionKeys.forEach((key) => {
      const row = this.resultRows.get(key);
      if (!row) return;

      const count = results[key] || 0;
      const pct = total > 0 ? (count / total) * 100 : 0;

      if (row.count) {
        row.count.textContent = String(count);
      }

      if (row.fill) {
        row.fill.style.width = `${pct.toFixed(1)}%`;
      }
    });

    if (this.totalEl) {
      this.totalEl.textContent = `${total} vote${total === 1 ? '' : 's'} total`;
    }
  },

  _renderQr() {
    const url = window.location.href;

    if (this.qrLink) {
      this.qrLink.href = url;
      this.qrLink.textContent = url;
    }

    if (!this.qrWrap || typeof window.QRCode === 'undefined') {
      return;
    }

    this.qrWrap.innerHTML = '';

    try {
      new window.QRCode(this.qrWrap, {
        text: url,
        width: 120,
        height: 120,
        colorDark: '#0a0a0f',
        colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
    } catch (error) {
      this._setError('QR code generation failed. Use the page link below instead.');
    }
  }
};

const InternetSimulator = {
  // DOM refs
  disableBtn: null,
  statusEl: null,
  overlay: null,
  terminalBody: null,
  popupZone: null,
  countdownEl: null,
  reflectionText: null,
  overlayRestoreBtn: null,
  disconnectAudio: null,
  restoreAudio: null,

  // State
  isDisconnected: false,
  timers: [],
  popupInterval: null,
  countdownInterval: null,
  countdownSec: 8,

  // Terminal lines that print during the simulation
  terminalLines: [
    { delay: 200,  cls: 'dim', text: '$ ping google.com' },
    { delay: 700,  cls: 'warn', text: 'Request timeout for icmp_seq 0' },
    { delay: 1100, cls: 'warn', text: 'Request timeout for icmp_seq 1' },
    { delay: 1500, cls: 'err',  text: '--- google.com ping statistics ---' },
    { delay: 1800, cls: 'err',  text: '3 packets transmitted, 0 received, 100% loss' },
    { delay: 2200, cls: 'dim',  text: '' },
    { delay: 2300, cls: 'dim',  text: '$ curl -I youtube.com' },
    { delay: 2700, cls: 'err',  text: 'curl: (6) Could not resolve host: youtube.com' },
    { delay: 3100, cls: 'dim',  text: '' },
    { delay: 3200, cls: 'dim',  text: '$ nslookup facebook.com' },
    { delay: 3600, cls: 'err',  text: ';; connection timed out; no servers could be reached' },
    { delay: 4000, cls: 'dim',  text: '' },
    { delay: 4100, cls: 'warn', text: 'Checking DNS servers...' },
    { delay: 4600, cls: 'err',  text: 'ERROR: All DNS servers unreachable' },
    { delay: 5000, cls: 'dim',  text: '' },
    { delay: 5100, cls: 'warn', text: 'Checking network interfaces...' },
    { delay: 5500, cls: 'ok',   text: 'eth0: UP   (192.168.1.5/24)' },
    { delay: 5700, cls: 'err',  text: 'gateway: UNREACHABLE' },
    { delay: 6000, cls: 'dim',  text: '' },
    { delay: 6100, cls: 'err',  text: '!!! INTERNET CONNECTION LOST !!!' },
    { delay: 6500, cls: 'dim',  text: 'Affected: messaging, maps, cloud, auth, payments...' },
    { delay: 7000, cls: 'dim',  text: 'Estimated 2.2 billion people experience this daily.' },
  ],

  // Popup messages — contained inside the overlay popup zone
  errorMessages: [
    { title: 'Google Chrome', body: 'ERR_INTERNET_DISCONNECTED' },
    { title: 'Network Error', body: 'Cannot reach server — check your connection' },
    { title: 'DNS Failure',   body: 'DNS_PROBE_FINISHED_NO_INTERNET' },
    { title: 'App Error',     body: 'Facebook — No network connection' },
    { title: 'Mail Failed',   body: 'Gmail — Unable to sync. Reconnecting...' },
    { title: 'Maps Offline',  body: 'Google Maps — Enable internet to load routes' },
  ],

  init() {
    this.disableBtn      = document.getElementById('sim-disable-btn');
    this.statusEl        = document.querySelector('[data-sim-status]');
    this.overlay         = document.getElementById('sim-overlay');
    this.terminalBody    = document.getElementById('sim-terminal-body');
    this.popupZone       = document.getElementById('sim-popup-zone');
    this.countdownEl     = document.getElementById('sim-countdown');
    this.reflectionText  = document.getElementById('sim-reflection-text');
    this.overlayRestoreBtn = document.getElementById('sim-overlay-restore');
    this.disconnectAudio = document.getElementById('sim-audio-disconnect');
    this.restoreAudio    = document.getElementById('sim-audio-restore');

    if (this.disableBtn) {
      this.disableBtn.addEventListener('click', () => this.disconnect());
    }
    if (this.overlayRestoreBtn) {
      this.overlayRestoreBtn.addEventListener('click', () => this.restore());
    }

    this._setStatus('Internet status: Online');
  },

  disconnect() {
    if (this.isDisconnected) return;
    this.isDisconnected = true;

    if (this.disableBtn) {
      this.disableBtn.disabled = true;
      this.disableBtn.setAttribute('aria-disabled', 'true');
    }
    this._setStatus('Internet status: Disconnected');
    this._playSound(this.disconnectAudio);

    // Show overlay
    this._showOverlay();

    // Print terminal lines on their scheduled delays
    this.terminalLines.forEach(({ delay, cls, text }) => {
      const t = window.setTimeout(() => {
        this._printLine(cls, text);
      }, delay);
      this.timers.push(t);
    });

    // Start error popups after 2.5s
    const popupStart = window.setTimeout(() => this._startPopupStream(), 2500);
    this.timers.push(popupStart);

    // Start countdown
    this._startCountdown();

    // After 8s: show reflection + restore button
    const endTimer = window.setTimeout(() => {
      this._stopPopupStream();
      this._showReflection();
    }, 8000);
    this.timers.push(endTimer);
  },

  restore() {
    if (!this.isDisconnected) return;
    this.isDisconnected = false;

    this._clearAll();
    this._playSound(this.restoreAudio);
    this._hideOverlay();
    this._setStatus('Internet status: Online');

    if (this.disableBtn) {
      this.disableBtn.disabled = false;
      this.disableBtn.setAttribute('aria-disabled', 'false');
    }
  },

  // ── Overlay ──────────────────────────────────────────────────
  _showOverlay() {
    if (!this.overlay) return;
    this.overlay.hidden = false;
    // Reset state
    if (this.terminalBody) this.terminalBody.innerHTML = '';
    if (this.reflectionText) this.reflectionText.hidden = true;
    if (this.overlayRestoreBtn) this.overlayRestoreBtn.hidden = true;
    if (this.popupZone) this.popupZone.innerHTML = '';
    requestAnimationFrame(() => {
      // opacity transition handled by CSS :not([hidden])
    });
  },

  _hideOverlay() {
    if (!this.overlay) return;
    this.overlay.style.opacity = '0';
    const t = window.setTimeout(() => {
      if (this.overlay) {
        this.overlay.hidden = true;
        this.overlay.style.opacity = '';
        if (this.terminalBody) this.terminalBody.innerHTML = '';
        if (this.reflectionText) this.reflectionText.hidden = true;
        if (this.overlayRestoreBtn) this.overlayRestoreBtn.hidden = true;
        if (this.popupZone) this.popupZone.innerHTML = '';
        if (this.countdownEl) this.countdownEl.textContent = '';
      }
    }, 420);
    this.timers.push(t);
  },

  // ── Terminal ─────────────────────────────────────────────────
  _printLine(cls, text) {
    if (!this.terminalBody) return;
    const span = document.createElement('span');
    span.className = `sim-terminal-line ${cls}`;
    span.textContent = text || '\u00a0';
    this.terminalBody.appendChild(span);
    this.terminalBody.scrollTop = this.terminalBody.scrollHeight;
  },

  // ── Countdown ────────────────────────────────────────────────
  _startCountdown() {
    let remaining = this.countdownSec;
    this._setCountdown(remaining);
    this.countdownInterval = window.setInterval(() => {
      remaining--;
      this._setCountdown(remaining);
      if (remaining <= 0) this._stopCountdown();
    }, 1000);
  },

  _stopCountdown() {
    if (this.countdownInterval) {
      window.clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
    if (this.countdownEl) this.countdownEl.textContent = '';
  },

  _setCountdown(sec) {
    if (!this.countdownEl) return;
    this.countdownEl.textContent = sec > 0
      ? `Restore available in ${sec}s`
      : '';
  },

  // ── Error Popups (inside overlay popup zone) ─────────────────
  _startPopupStream() {
    if (this.popupInterval) return;
    this._spawnPopup();
    this.popupInterval = window.setInterval(() => this._spawnPopup(), 1800);
  },

  _stopPopupStream() {
    if (this.popupInterval) {
      window.clearInterval(this.popupInterval);
      this.popupInterval = null;
    }
  },

  _spawnPopup() {
    if (!this.popupZone || !this.isDisconnected) return;

    const msg = this.errorMessages[Math.floor(Math.random() * this.errorMessages.length)];
    const popup = document.createElement('div');
    popup.className = 'sim-err-popup';

    // Position randomly within the zone
    popup.style.top  = `${Math.random() * 55}%`;
    popup.style.left = `${Math.random() * 30}%`;

    popup.innerHTML = `
      <div class="sim-err-popup-bar">${msg.title}</div>
      <div class="sim-err-popup-body">${msg.body}</div>
    `;
    this.popupZone.appendChild(popup);

    const leaveT  = window.setTimeout(() => popup.classList.add('is-leaving'), 2200);
    const removeT = window.setTimeout(() => popup.remove(), 2500);
    this.timers.push(leaveT, removeT);
  },

  // ── Reflection ───────────────────────────────────────────────
  _showReflection() {
    if (this.reflectionText)  this.reflectionText.hidden = false;
    if (this.overlayRestoreBtn) this.overlayRestoreBtn.hidden = false;
    if (this.overlayRestoreBtn) this.overlayRestoreBtn.focus();
  },

  // ── Helpers ──────────────────────────────────────────────────
  _clearAll() {
    this.timers.forEach((id) => window.clearTimeout(id));
    this.timers = [];
    this._stopPopupStream();
    this._stopCountdown();
  },

  _setStatus(msg) {
    if (this.statusEl) this.statusEl.textContent = msg;
  },

  _playSound(audioEl) {
    if (!audioEl) return;
    try {
      audioEl.currentTime = 0;
      const p = audioEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch (e) {}
  }
};

const ConclusionSection = {
  section: null,
  burstLayer: null,
  observer: null,
  hasBurstPlayed: false,
  reduceMotionQuery: FORCE_MOTION_ALWAYS_ON
    ? { matches: false, addEventListener: () => {} }
    : window.matchMedia('(prefers-reduced-motion: reduce)'),

  init() {
    this.section = document.getElementById('credits');
    if (!this.section) return;

    this.burstLayer = this.section.querySelector('[data-conclusion-burst]');
    if (!this.burstLayer) return;

    if (!('IntersectionObserver' in window)) {
      this._triggerBurst();
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          this._triggerBurst();
          if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
          }
        });
      },
      {
        threshold: 0.32,
        rootMargin: '0px 0px -14% 0px'
      }
    );

    this.observer.observe(this.section);
  },

  _triggerBurst() {
    if (this.hasBurstPlayed) return;
    this.hasBurstPlayed = true;

    if (this.reduceMotionQuery.matches) return;
    if (!this.burstLayer) return;

    const rect = this.section.getBoundingClientRect();
    const cx = rect.width * 0.5;
    const cy = Math.min(rect.height * 0.42, 260);
    const particleCount = window.innerWidth <= 768 ? 26 : 42;

    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('span');
      particle.className = 'conclusion-particle';

      const angle = Math.random() * Math.PI * 2;
      const distance = 48 + Math.random() * (window.innerWidth <= 768 ? 110 : 170);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - (18 + Math.random() * 38);
      const rot = -180 + Math.random() * 360;
      const size = 5 + Math.random() * 7;
      const hue = [160, 190, 210, 330, 35][Math.floor(Math.random() * 5)];

      particle.style.left = `${cx}px`;
      particle.style.top = `${cy}px`;
      particle.style.setProperty('--dx', `${dx}px`);
      particle.style.setProperty('--dy', `${dy}px`);
      particle.style.setProperty('--rot', `${rot}deg`);
      particle.style.setProperty('--size', `${size}px`);
      particle.style.setProperty('--hue', String(hue));

      this.burstLayer.appendChild(particle);
      particle.addEventListener('animationend', () => {
        particle.remove();
      }, { once: true });
    }
  }
};

const NetworkStatus = {
  banner: null,

  init() {
    this.banner = document.getElementById('network-banner');
    if (!this.banner) return;

    const update = () => {
      if (navigator.onLine) {
        this.banner.hidden = true;
        return;
      }
      this.banner.hidden = false;
    };

    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
  }
};

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
  const reduceMotion = FORCE_MOTION_ALWAYS_ON
    ? false
    : window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  Theme.init();
  RevealObserver.init();
  ScrollProgress.init();
  NavDots.init();
  TimelineSection.init();
  ImpactSection.init();
  ChallengesSection.init();
  FutureSection.init();
  PollSection.init();
  InternetSimulator.init();
  ConclusionSection.init();
  NetworkStatus.init();
  updateToggleIcon();

  // Phase 2: Hero
  ParticleCanvas.init();

  if (reduceMotion) {
    const typedText = document.getElementById('typed-text');
    const subtitle = document.getElementById('hero-subtitle');
    const members = document.getElementById('hero-members');
    if (typedText) typedText.textContent = TypeWriter.phrases[0];
    if (subtitle) subtitle.classList.add('visible');
    if (members) members.classList.add('visible');
  } else {
    TypeWriter.init();
  }

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      Theme.toggle();
      updateToggleIcon();
    });
  }
});
