// Image viewer zoom controls (fit width/fit height/full) and active button state.

import { state } from './state.js';
import { dom, $ } from './dom.js';

// Wire zoom toolbar button click handlers.
export function initZoom() {
  ['zoom-fit-width','zoom-fit-height','zoom-full'].forEach(id => {
    $(id).addEventListener('click', () => {
      state.currentZoom = id;
      updateZoomButtons();
      applyZoom();
    });
  });
}

// Update active styling on zoom buttons based on current zoom mode.
export function updateZoomButtons() {
  ['zoom-fit-width','zoom-fit-height','zoom-full'].forEach(id =>
    $(id).classList.toggle('active', id === state.currentZoom));
}

// Apply current zoom class to current preview image element.
function applyZoom() {
  const el = dom.contentBody.querySelector('#img-output img');
  if (!el) return;
  el.classList.remove('zoom-fit-width','zoom-fit-height','zoom-full');
  el.classList.add(state.currentZoom);
}
