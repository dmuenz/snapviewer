// Markdown preview mode controls (visual/raw).

import { state } from './state.js';
import { $ } from './dom.js';

// Track current markdown render callbacks for active file preview.
let mdRenderers = {
  visual: null,
  raw: null
};

// Wire header buttons once.
export function initMdMode() {
  $('md-visual')?.addEventListener('click', () => setMdMode('visual'));
  $('md-raw')?.addEventListener('click', () => setMdMode('raw'));
}

// Register callbacks for currently previewed markdown file.
export function bindMdRenderers(renderVisual, renderRaw) {
  mdRenderers.visual = renderVisual;
  mdRenderers.raw = renderRaw;
}

// Keep active button UI in sync with state.
export function updateMdButtons() {
  $('md-visual')?.classList.toggle('active', state.currentMdMode === 'visual');
  $('md-raw')?.classList.toggle('active', state.currentMdMode === 'raw');
}

// Apply current mode for active markdown file.
export function applyMdMode() {
  const fn = mdRenderers[state.currentMdMode];
  if (typeof fn === 'function') fn();
}

// Set mode, persist in state, update UI, render current file using selected mode.
function setMdMode(mode) {
  if (mode !== 'visual' && mode !== 'raw') return;
  state.currentMdMode = mode;
  updateMdButtons();
  applyMdMode();
}
