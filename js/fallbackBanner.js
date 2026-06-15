// Show/hide dismissible fallback-mode notice.

import { dom } from './dom.js';

const STORAGE_KEY = 'snapviewer.fallbackBannerDismissed';

// Show the banner unless user has dismissed it in this browser.
export function showFallbackBannerIfNeeded() {
  if (!dom.fallbackBanner) return;

  const dismissed = localStorage.getItem(STORAGE_KEY) === '1';
  dom.fallbackBanner.style.display = dismissed ? 'none' : 'flex';
}

// Hide banner and persist dismissal.
export function dismissFallbackBanner() {
  if (!dom.fallbackBanner) return;
  dom.fallbackBanner.style.display = 'none';
  localStorage.setItem(STORAGE_KEY, '1');
}

// Ensure close button is wired once.
export function initFallbackBanner() {
  if (!dom.fallbackBannerClose) return;
  dom.fallbackBannerClose.addEventListener('click', dismissFallbackBanner);
}

// Force-hide banner (used in full fs-handle mode).
export function hideFallbackBanner() {
  if (!dom.fallbackBanner) return;
  dom.fallbackBanner.style.display = 'none';
}
