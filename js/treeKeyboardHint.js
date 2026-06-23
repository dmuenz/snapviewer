// Show keyboard hint chip at sidebar bottom.
// Behavior:
// - First-ever visit: stays visible until user dismisses.
// - After first dismissal: reappears on each reload and auto-hides after short time.

import { dom } from './dom.js';

const STORAGE_KEY = 'snapviewer.treeKeyboardHint.hasDismissedOnce';
const AUTO_HIDE_MS = 8000;

let autoHideTimer = null;

// Show hint chip and apply first-time vs returning behavior.
export function showKeyboardHint() {
  if (!dom.kbdHintChip) return;

  // Reset visual state.
  dom.kbdHintChip.classList.remove('is-hiding');
  dom.kbdHintChip.style.display = 'flex';

  // Clear any previous timer.
  clearTimeout(autoHideTimer);

  const hasDismissedOnce = localStorage.getItem(STORAGE_KEY) === '1';

  // Only auto-hide for users who have explicitly dismissed before.
  if (hasDismissedOnce) {
    autoHideTimer = setTimeout(() => {
      hideWithFade();
    }, AUTO_HIDE_MS);
  }
}

// Fade out, then hide after opacity transition ends.
function hideWithFade() {
  if (!dom.kbdHintChip || dom.kbdHintChip.style.display === 'none') return;

  const chip = dom.kbdHintChip;

  // If already hiding, do nothing.
  if (chip.classList.contains('is-hiding')) return;

  const onEnd = (e) => {
    // Only act on this element's opacity transition.
    if (e.target !== chip || e.propertyName !== 'opacity') return;

    chip.style.display = 'none';
    chip.classList.remove('is-hiding');
    chip.removeEventListener('transitionend', onEnd);
  };

  chip.addEventListener('transitionend', onEnd);
  chip.classList.add('is-hiding');
}

// Wire close button behavior.
export function initKeyboardHint() {
  if (!dom.kbdHintClose) return;

  dom.kbdHintClose.addEventListener('click', () => {
    // Mark that user has explicitly dismissed at least once.
    localStorage.setItem(STORAGE_KEY, '1');

    clearTimeout(autoHideTimer);
    hideWithFade();
  });
}
