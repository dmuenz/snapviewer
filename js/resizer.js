// Sidebar/content splitter drag-to-resize behavior.

import { dom, $ } from './dom.js';
import { setRootVar, getRootVar } from './styleVars.js';

// Initialize horizontal drag resizer between sidebar and content.
export function initResizer() {
  const resizer = $('resizer');
  let dragging = false, startX = 0, startWidth = 0;

  // Parse current --sidebar-w (e.g., "360px") into pixels, with a computed fallback.
  function currentSidebarWidth() {
    const varVal = getRootVar('--sidebar-w').trim();
    const n = parseFloat(varVal || '0');
    if (Number.isFinite(n) && n > 0) return n;

    // Fallback to computed grid first column width (e.g., "360px 4px 1fr")
    const firstCol = (getComputedStyle(dom.appEl).gridTemplateColumns || '').split(' ')[0];
    const c = parseFloat(firstCol || '0');
    return Number.isFinite(c) && c > 0 ? c : 360; // last-resort default
  }

  // Calculate dynamic bounds based on viewport width.
  function computeBounds(vw) {
    const min = 160;                        // hard minimum for sidebar
    const max75 = vw * 0.75;                // no more than 75% of viewport
    const maxContentAware = Math.max(vw - 320, min); // leave at least ~320px for content
    const max = Math.min(max75, maxContentAware);
    return { min, max };
  }

  // Clamp --sidebar-w to current bounds (call on load and on resize).
  function clampSidebarWidth() {
    const vw = window.innerWidth || 0;
    if (!vw) return;

    const { min, max } = computeBounds(vw);
    const cur = currentSidebarWidth();
    const clamped = Math.max(min, Math.min(max, cur));

    // Update only if needed to avoid unnecessary style recalcs.
    if (Math.abs(clamped - cur) > 0.5) {
      setRootVar('--sidebar-w', `${clamped}px`);
    }
  }

  // Begin drag.
  resizer.addEventListener('mousedown', e => {
    dragging = true;
    startX = e.clientX;
    startWidth = currentSidebarWidth();
    resizer.classList.add('dragging');
    document.body.classList.add('is-resizing');
  });

  // Resize while dragging, clamped to min/max bounds.
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const delta = e.clientX - startX;

    const { min, max } = computeBounds(window.innerWidth);
    const w = Math.max(min, Math.min(max, startWidth + delta));

    setRootVar('--sidebar-w', `${w}px`);
  });

  // End drag and restore cursor/selection styles.
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove('dragging');
    document.body.classList.remove('is-resizing');
  });

  // Clamp once at startup (in case CSS default is out-of-bounds for current viewport).
  clampSidebarWidth();

  // Clamp on window resize (rAF-throttled).
  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      // If the user is actively dragging, skip (mousemove handler already clamps).
      if (!dragging) clampSidebarWidth();
    });
  });
}
