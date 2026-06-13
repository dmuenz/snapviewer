// Sidebar/content splitter drag-to-resize behavior.

import { dom, $ } from './dom.js';

// Initialize horizontal drag resizer between sidebar and content.
export function initResizer() {
  const resizer = $('resizer');
  let dragging = false, startX = 0, startWidth = 0;

  // Begin drag.
  resizer.addEventListener('mousedown', e => {
    dragging = true;
    startX = e.clientX;
    startWidth = parseInt(getComputedStyle(dom.appEl).gridTemplateColumns.split(' ')[0], 10);
    resizer.classList.add('dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  });

  // Resize while dragging, clamped to min/max bounds.
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const w = Math.max(160, Math.min(window.innerWidth * 0.75, startWidth + e.clientX - startX));
    dom.appEl.style.gridTemplateColumns = `${w}px 4px 1fr`;
  });

  // End drag and restore cursor/selection styles.
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove('dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });
}
