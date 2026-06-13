// Toolbar controls for sort/filter/clear and associated state updates.

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

  // Toggle filter input visibility.
  dom.filterBtn.addEventListener('click', () => {
    const v = dom.filterBar.classList.toggle('visible');
    dom.filterBtn.classList.toggle('active', v);
    if (v) dom.filterInput.focus(); else clearFilter();
  });

  // Apply live filter text as user types.
  dom.filterInput.addEventListener('input', () => {
    state.filterText = dom.filterInput.value.trim().toLowerCase();
    rebuildTree();
  });

  // Clear filter text and hide filter bar.
  dom.clearBtn.addEventListener('click', () => {
    clearFilter();
    dom.filterBar.classList.remove('visible');
    dom.filterBtn.classList.remove('active');
  });
}

// Reset filter state/input and rebuild tree.
function clearFilter() {
  state.filterText = '';
  dom.filterInput.value = '';
  rebuildTree();
}
