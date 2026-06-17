// Toolbar controls for tree viewer and associated state updates.

import { state } from './state.js';
import { dom } from './dom.js';
import { rebuildTree } from './tree.js';

// Wire control event handlers for sort and filter UI.
export function initControls() {
  // Sort: A–Z
  dom.sortAlphaBtn.addEventListener('click', () => {
    if (state.sortMode === 'alpha') return;
    state.sortMode = 'alpha';
    syncSortButtons();
    rebuildTree();
  });

  // Sort: Recent
  dom.sortRecentBtn.addEventListener('click', () => {
    if (state.sortMode === 'time') return;
    state.sortMode = 'time';
    syncSortButtons();
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

  // Initial state of sort buttons.
  syncSortButtons();

  // Initial clear-button visibility.
  syncFilterClearButton();
}

// Keep sort segmented buttons' active/pressed state in sync with current sort mode.
function syncSortButtons() {
  const alpha = state.sortMode === 'alpha';
  dom.sortAlphaBtn.classList.toggle('active', alpha);
  dom.sortAlphaBtn.setAttribute('aria-pressed', alpha ? 'true' : 'false');

  dom.sortRecentBtn.classList.toggle('active', !alpha);
  dom.sortRecentBtn.setAttribute('aria-pressed', !alpha ? 'true' : 'false');
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