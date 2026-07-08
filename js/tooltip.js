// File hover tooltip content, positioning, hide timing, and mouse tracking.

import { dom } from './dom.js';
import { formatDate, formatBytes } from './helpers.js';
import { setTooltipVars } from './styleVars.js';

let ttHideTimer = null;

// Resolve a File object from either source mode.
async function resolveFile(fileRef) {
  if (!fileRef) throw new Error('Missing file reference.');

  if (fileRef.kind === 'fs-file-handle') return await fileRef.handle.getFile();
  if (fileRef.kind === 'fallback-file') return fileRef.file;
  if (typeof fileRef.getFile === 'function') return await fileRef.getFile();

  throw new Error('Unsupported file reference.');
}

// Populate/show tooltip for a file entry hover event.
export async function showTooltip(e, fileRef) {
  clearTimeout(ttHideTimer);
  try {
    const file = await resolveFile(fileRef);
    dom.ttName.textContent = fileRef.name || file.name || 'File';
    dom.ttDate.textContent = formatDate(file.lastModified);
    dom.ttSize.textContent = formatBytes(file.size);
  } catch {
    dom.ttName.textContent = fileRef?.name || 'File';
    dom.ttDate.textContent = '—';
    dom.ttSize.textContent = '—';
  }
  positionTooltip(e);
  dom.tooltip.classList.add('visible');
}

// Hide tooltip with a short delay to prevent flicker.
export function hideTooltip() {
  ttHideTimer = setTimeout(() => dom.tooltip.classList.remove('visible'), 80);
}

// Keep tooltip near cursor while visible.
export function initTooltipTracking() {
  document.addEventListener('mousemove', e => {
    if (dom.tooltip.classList.contains('visible')) positionTooltip(e);
  });
}

// Position tooltip with viewport-edge avoidance.
function positionTooltip(e) {
  const pad = 14;
  const tw  = dom.tooltip.offsetWidth  || 260;
  const th  = dom.tooltip.offsetHeight || 80;

  let x = e.clientX + pad;
  let y = e.clientY + pad;

  if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - pad;
  if (y + th > window.innerHeight - 8) y = e.clientY - th - pad;

  setTooltipVars(x, y);
}
