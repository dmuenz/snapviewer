// SVG preview mode controls (visual/raw).

import { state } from './state.js';
import { $ } from './dom.js';

// Track current SVG render callbacks for active file preview.
let svgRenderers = {
  visual: null,
  raw: null
};

// Wire header buttons once.
export function initSvgMode() {
  $('svg-visual')?.addEventListener('click', () => setSvgMode('visual'));
  $('svg-raw')?.addEventListener('click', () => setSvgMode('raw'));
}

// Register callbacks for currently previewed file.
export function bindSvgRenderers(renderVisual, renderRaw) {
  svgRenderers.visual = renderVisual;
  svgRenderers.raw = renderRaw;
}

// Keep active button UI in sync with state.
export function updateSvgButtons() {
  $('svg-visual')?.classList.toggle('active', state.currentSvgMode === 'visual');
  $('svg-raw')?.classList.toggle('active', state.currentSvgMode === 'raw');
}

// Apply current mode for active file.
export function applySvgMode() {
  const fn = svgRenderers[state.currentSvgMode];
  if (typeof fn === 'function') fn();
}

// Set mode, persist in state, update UI, render current file using selected mode.
function setSvgMode(mode) {
  if (mode !== 'visual' && mode !== 'raw') return;
  state.currentSvgMode = mode;
  updateSvgButtons();
  applySvgMode();
}
