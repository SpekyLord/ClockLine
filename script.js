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

// ── Scroll Progress Bar ──────────────────────────────────────
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
  ScrollProgress.init();
  NavDots.init();
  updateToggleIcon();

  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      Theme.toggle();
      updateToggleIcon();
    });
  }
});
