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

// ── Initialise on DOM Ready ──────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Theme.init();

  // Phase 1+: Additional init calls will be added here as sections are built.
});
