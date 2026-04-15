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

const PollSection = {
  section: null,
  buttons: [],
  resultRows: new Map(),
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

    this._renderQr();
    this._bindButtons();
    this._bindAdminReset();

    this._initFirebase();
    this._renderResults(this.defaults);
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
      button.disabled = disabled;
      button.setAttribute('aria-disabled', String(disabled));
      const key = button.getAttribute('data-poll-vote');
      button.classList.toggle('is-selected', Boolean(this.votedChoice) && key === this.votedChoice);
    });
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
    if (!window.firebase || !window.firebase.apps) {
      this._setError('Live sync is offline. Add Firebase config to enable real-time polling.');
      return;
    }

    const firebaseConfig = {
      apiKey: 'REPLACE_WITH_FIREBASE_API_KEY',
      authDomain: 'REPLACE_WITH_FIREBASE_AUTH_DOMAIN',
      databaseURL: 'REPLACE_WITH_FIREBASE_DATABASE_URL',
      projectId: 'REPLACE_WITH_FIREBASE_PROJECT_ID',
      storageBucket: 'REPLACE_WITH_FIREBASE_STORAGE_BUCKET',
      messagingSenderId: 'REPLACE_WITH_FIREBASE_MESSAGING_SENDER_ID',
      appId: 'REPLACE_WITH_FIREBASE_APP_ID'
    };

    const hasRealConfig = Object.values(firebaseConfig).every((value) => typeof value === 'string' && !value.startsWith('REPLACE_WITH_'));
    if (!hasRealConfig) {
      this._setError('Firebase placeholder config detected. Replace credentials to enable live voting.');
      return;
    }

    try {
      this.app = window.firebase.apps.length ? window.firebase.app() : window.firebase.initializeApp(firebaseConfig);
      this.db = window.firebase.database(this.app);
      this.pollRef = this.db.ref('polls/info_age_poll');
      this._setError('');
      this._listenForResults();
    } catch (error) {
      this._setError('Failed to initialize Firebase poll connection.');
    }
  },

  _listenForResults() {
    if (!this.pollRef) return;

    this.pollRef.on('value', (snapshot) => {
      const raw = snapshot && snapshot.val() ? snapshot.val() : {};
      const normalized = { ...this.defaults };

      this.optionKeys.forEach((key) => {
        const value = Number(raw[key]);
        normalized[key] = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
      });

      this._renderResults(normalized);
    }, () => {
      this._setError('Could not read live poll results. Check your Firebase database rules.');
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

    this._setError('');

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
    } catch (error) {
      this._setError('Vote failed. Please check your connection and try again.');
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
  section: null,
  disableBtn: null,
  restoreBtn: null,
  restoreWrap: null,
  statusEl: null,
  popupLayer: null,
  reflectionEl: null,
  disconnectAudio: null,
  restoreAudio: null,
  timers: [],
  popupInterval: null,
  textMap: new Map(),
  imageStyleMap: new Map(),
  isDisconnected: false,
  running: false,
  replacementCursor: 0,
  replacementBatchSize: 1,
  replacementDelay: 100,
  textReplacementQueue: [],
  errorMessages: [
    'Connection Lost',
    'Cannot reach server',
    'Network unreachable'
  ],

  init() {
    this.section = document.getElementById('simulator');
    if (!this.section) return;

    this.disableBtn = document.getElementById('sim-disable-btn');
    this.restoreBtn = document.getElementById('sim-restore-btn');
    this.restoreWrap = document.getElementById('sim-restore-wrap');
    this.statusEl = this.section.querySelector('[data-sim-status]');
    this.popupLayer = this.section.querySelector('[data-sim-popup-layer]');
    this.reflectionEl = this.section.querySelector('[data-sim-reflection]');
    this.disconnectAudio = document.getElementById('sim-audio-disconnect');
    this.restoreAudio = document.getElementById('sim-audio-restore');

    if (this.disableBtn) {
      this.disableBtn.addEventListener('click', () => this.disconnect());
    }

    if (this.restoreBtn) {
      this.restoreBtn.addEventListener('click', () => this.restore());
    }

    this._setStatus('Internet status: Online');
  },

  disconnect() {
    if (this.running || this.isDisconnected) return;

    this.running = true;
    this.isDisconnected = true;
    this._clearScheduledSteps();
    this._hideReflectionImmediate();
    this._hideRestoreButton();
    this._clearPopups();

    if (this.disableBtn) {
      this.disableBtn.disabled = true;
      this.disableBtn.setAttribute('aria-disabled', 'true');
    }

    this._setStatus('Internet status: Disconnecting...');
    this._playSound(this.disconnectAudio);

    this._enterGrayState();

    this._scheduleStep(() => {
      this._applyImageFilters();
      this._setStatus('Internet status: Signal degraded. Media unavailable.');
    }, 1000);

    this._scheduleStep(() => {
      this._prepareTextQueue();
      this._replaceTextGradually();
      this._setStatus('Internet status: Content load failure in progress.');
    }, 2000);

    this._scheduleStep(() => {
      this._startPopupStream();
      this._setStatus('Internet status: Multiple network errors detected.');
    }, 3000);

    this._scheduleStep(() => {
      this._showRestoreButton();
      this._setStatus('Internet status: Offline. Use restore to recover.');
      this.running = false;
    }, 8000);
  },

  restore() {
    if (!this.isDisconnected) return;

    this.running = false;
    this.isDisconnected = false;

    this._clearScheduledSteps();
    this._stopPopupStream();
    this._clearPopups();
    this._hideRestoreButton();
    this._restoreText();
    this._restoreImageFilters();
    this._exitGrayState();
    this._setStatus('Internet status: Restoring services...');
    this._playSound(this.restoreAudio);

    if (this.disableBtn) {
      this.disableBtn.disabled = false;
      this.disableBtn.setAttribute('aria-disabled', 'false');
    }

    this._showReflection();

    this._scheduleStep(() => {
      this._hideReflectionImmediate();
      this._setStatus('Internet status: Online');
    }, 6000);
  },

  _scheduleStep(callback, delayMs) {
    const timer = window.setTimeout(() => {
      this.timers = this.timers.filter((id) => id !== timer);
      callback();
    }, delayMs);
    this.timers.push(timer);
  },

  _clearScheduledSteps() {
    this.timers.forEach((timer) => window.clearTimeout(timer));
    this.timers = [];
  },

  _setStatus(message) {
    if (this.statusEl) {
      this.statusEl.textContent = message;
    }
  },

  _enterGrayState() {
    document.body.classList.add('internet-disabled');
  },

  _exitGrayState() {
    document.body.classList.remove('internet-disabled');
  },

  _applyImageFilters() {
    const images = Array.from(document.querySelectorAll('img')).filter((img) => !img.closest('[data-sim-preserve]'));
    images.forEach((img) => {
      if (!this.imageStyleMap.has(img)) {
        this.imageStyleMap.set(img, {
          filter: img.style.filter || '',
          transition: img.style.transition || ''
        });
      }

      img.style.transition = img.style.transition
        ? `${img.style.transition}, filter 320ms ease`
        : 'filter 320ms ease';
      img.style.filter = 'grayscale(100%) blur(4px)';
    });
  },

  _restoreImageFilters() {
    this.imageStyleMap.forEach((saved, img) => {
      if (!img) return;
      img.style.filter = saved.filter;
      img.style.transition = saved.transition;
    });
    this.imageStyleMap.clear();
  },

  _prepareTextQueue() {
    this.textReplacementQueue = [];
    this.replacementCursor = 0;

    const roots = [
      document.getElementById('impact'),
      document.getElementById('challenges'),
      document.getElementById('future'),
      document.getElementById('poll'),
      document.getElementById('simulator'),
      document.getElementById('credits')
    ].filter(Boolean);

    roots.forEach((root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT;
          const text = node.nodeValue || '';
          if (!text.trim()) return NodeFilter.FILTER_REJECT;

          const parent = node.parentElement;
          if (parent.closest('[data-sim-preserve]')) return NodeFilter.FILTER_REJECT;
          if (parent.closest('button, input, textarea, select, option, script, style, noscript, svg')) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      });

      let current = walker.nextNode();
      while (current) {
        this.textReplacementQueue.push(current);
        current = walker.nextNode();
      }
    });
  },

  _replaceTextGradually() {
    if (!this.isDisconnected) return;

    const nextNodes = this.textReplacementQueue.slice(this.replacementCursor, this.replacementCursor + this.replacementBatchSize);
    if (!nextNodes.length) return;

    nextNodes.forEach((node) => {
      if (!this.textMap.has(node)) {
        this.textMap.set(node, node.nodeValue || '');
      }
      node.nodeValue = '[Cannot Load]';
    });

    this.replacementCursor += this.replacementBatchSize;

    if (this.replacementCursor < this.textReplacementQueue.length) {
      this._scheduleStep(() => this._replaceTextGradually(), this.replacementDelay);
    }
  },

  _restoreText() {
    this.textMap.forEach((value, node) => {
      if (!node) return;
      node.nodeValue = value;
    });

    this.textMap.clear();
    this.textReplacementQueue = [];
    this.replacementCursor = 0;
  },

  _showRestoreButton() {
    if (!this.restoreWrap) return;
    this.restoreWrap.hidden = false;
    if (this.restoreBtn) {
      this.restoreBtn.focus();
    }
  },

  _hideRestoreButton() {
    if (!this.restoreWrap) return;
    this.restoreWrap.hidden = true;
  },

  _startPopupStream() {
    if (!this.popupLayer || this.popupInterval) return;
    this._spawnPopup();
    this.popupInterval = window.setInterval(() => {
      this._spawnPopup();
    }, 1500);
  },

  _stopPopupStream() {
    if (!this.popupInterval) return;
    window.clearInterval(this.popupInterval);
    this.popupInterval = null;
  },

  _spawnPopup() {
    if (!this.popupLayer || !this.isDisconnected) return;

    const popup = document.createElement('div');
    popup.className = 'simulator-error-popup';
    popup.textContent = this.errorMessages[Math.floor(Math.random() * this.errorMessages.length)];

    const topPct = 10 + Math.random() * 76;
    const leftPct = 6 + Math.random() * 76;
    popup.style.top = `${topPct}%`;
    popup.style.left = `${leftPct}%`;

    this.popupLayer.appendChild(popup);

    const leaveTimer = window.setTimeout(() => {
      popup.classList.add('is-leaving');
    }, 1800);

    const removeTimer = window.setTimeout(() => {
      popup.remove();
    }, 2100);

    this.timers.push(leaveTimer, removeTimer);
  },

  _clearPopups() {
    if (!this.popupLayer) return;
    this.popupLayer.innerHTML = '';
  },

  _showReflection() {
    if (!this.reflectionEl) return;
    this.reflectionEl.hidden = false;

    requestAnimationFrame(() => {
      this.reflectionEl.classList.add('is-visible');
    });
  },

  _hideReflectionImmediate() {
    if (!this.reflectionEl) return;
    this.reflectionEl.classList.remove('is-visible');
    this.reflectionEl.hidden = true;
  },

  _playSound(audioEl) {
    if (!audioEl) return;

    try {
      audioEl.currentTime = 0;
      const playPromise = audioEl.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }
    } catch (error) {
      // Sound effects are optional; silently continue when unavailable.
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
  PollSection.init();
  InternetSimulator.init();
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
