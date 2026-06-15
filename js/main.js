// App entry point that initializes all UI modules and starts boot flow.

'use strict';

import { state } from './state.js';
import { dbGetAll } from './db.js';
import { initPathDropdownEvents, openSnaps, activateRecord } from './core.js';
import { renderDropdown } from './dropdown.js';
import { showSplash, showReturnSplash, showReadySplash } from './splash.js';
import { initControls } from './controls.js';
import { initResizer } from './resizer.js';
import { initZoom } from './zoom.js';
import { initTooltipTracking } from './tooltip.js';

// Shared dropdown action callbacks used everywhere dropdown is rendered.
const dropdownActions = {
  onOpenSnaps: () => openSnaps(withRenderDropdown, showReadySplash),
  onActivateRecord: rec => activateRecord(rec, withRenderDropdown, showReadySplash),
  onEmptyHistory: () => showSplash(dropdownActions.onOpenSnaps, withRenderDropdown, { fallbackMode: false })
};

// Wrapper to keep call sites concise.
function withRenderDropdown(records, activeId) {
  renderDropdown(records, activeId, dropdownActions);
}

// Path dropdown open handler (reload records each open).
initPathDropdownEvents(async () => {
  // In fallback mode we have no persisted handles list.
  if (state.sourceMode !== 'fs-handle') {
    withRenderDropdown([], null);
    return;
  }
  const records = await dbGetAll();
  withRenderDropdown(records, state.currentRecId);
});

// Initialize non-core UI handlers.
initControls();
initResizer();
initZoom();
initTooltipTracking();

// Boot flow.
(async function boot() {
  const hasDirPicker = typeof window.showDirectoryPicker === 'function';

  // If no handle API, show fallback-aware splash.
  if (!hasDirPicker) {
    showSplash(dropdownActions.onOpenSnaps, withRenderDropdown, { fallbackMode: true });
    return;
  }

  const records = await dbGetAll();
  if (records.length === 0) {
    showSplash(dropdownActions.onOpenSnaps, withRenderDropdown, { fallbackMode: false });
    return;
  }

  const mostRecent = records[0];
  showReturnSplash(
    mostRecent,
    records,
    () => dropdownActions.onActivateRecord(mostRecent),
    dropdownActions.onOpenSnaps,
    withRenderDropdown
  );
})();
