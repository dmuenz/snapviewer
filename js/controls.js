// Toolbar controls for tree viewer and associated state updates.

import { state } from './state.js';
import { dom } from './dom.js';
import { rebuildTree } from './tree.js';

// Wire control event handlers for sort and filter UI.
export function initControls() {
  // Toggle sort mode between alpha and recent.
  dom.sortBtn.addEventListener('click', () => {
    state.sortMode = state.sortMode === 'alpha' ? 'time' : 'alpha';
    dom.sortLabel.textContent = state.sortMode === 'alpha' ? 'A–Z' : 'Recent';
    dom.sortBtn.classList.toggle('active', state.sortMode === 'time');
    rebuildTree();
  });

  // Collapse all folders in the tree.
  dom.collapseAllBtn.addEventListener('click', () => {
    collapseAllFolders();
  });
 
  // Live filter as user types.
  dom.filterInput.addEventListener('input', () => {
    state.filterText = dom.filterInput.value.trim().toLowerCase();
    syncFilterClearButton();
    rebuildTree();
  });

  // ESC clears filter when typing in the filter box.
  dom.filterInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      e.preventDefault();
      if (dom.filterInput.value.length > 0) {
        clearFilter();
      }
    }
  });

  // Inset clear button.
  dom.filterClearBtn.addEventListener('click', () => {
    clearFilter();
    dom.filterInput.focus();
  });

  // Initial clear-button visibility.
  syncFilterClearButton();
}

// Collapse all expanded folders and rebuild tree.
function collapseAllFolders() {
  state.openPaths = new Set();
  rebuildTree();
}

// Reset filter state/input and rebuild tree.
function clearFilter() {
  state.filterText = '';
  dom.filterInput.value = '';
  syncFilterClearButton();
  rebuildTree();
}

// Show clear X only when there is text.
function syncFilterClearButton() {
  const hasText = dom.filterInput.value.trim().length > 0;
  dom.filterClearBtn.classList.toggle('hidden', !hasText);
}