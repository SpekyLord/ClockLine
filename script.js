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
    this._updateUi();
    this._startAutoplay();
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
    if (this.autoplayTimer || this.isHovering || this.isFocusWithin || this.isTouching) return;

    this.autoplayTimer = window.setTimeout(() => {
      this.autoplayTimer = null;
      this.goTo(this.activeIndex + 1, { autoplay: true });
      this._startAutoplay();
    }, this.autoplayDelay);
  },

  _scheduleResume() {
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
  reduceMotionQuery: window.matchMedia('(prefers-reduced-motion: reduce)'),

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

    if (this.reduceMotionQuery.matches) {
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
  TimelineSection.init();
  ImpactSection.init();
  ChallengesSection.init();
  FutureSection.init();
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
