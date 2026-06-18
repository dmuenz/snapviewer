// Centralized DOM lookups so modules can share stable element references.

// Convenience helper for id-based element lookup.
export const $ = id => document.getElementById(id);

// Cached DOM references used throughout the app.
export const dom = {
  treeRoot: $('tree-root'),
  folderInputFallback: $('folder-input-fallback'),
  sortAlphaBtn: $('btn-sort-alpha'),
  sortRecentBtn: $('btn-sort-recent'),
  collapseAllBtn: $('btn-collapse-all'),
  filterInput: $('filter-input'),
  filterClearBtn: $('filter-clear-btn'),
  contentBody: $('content-body'),
  breadcrumb: $('breadcrumb-text'),
  dateBadge: $('file-date-badge'),
  imgToolbar: $('img-toolbar'),
  snapsHelpTooltip: $('snaps-help-tooltip'),
  appEl: $('app'),
  pathBtn: $('path-btn'),
  pathText: $('path-text'),
  pathDropdown: $('path-dropdown'),
  modalOverlay: $('modal-overlay'),
  modalInput: $('modal-input'),
  aboutBtn: $('about-btn'),
  aboutOverlay: $('about-overlay'),
  aboutClose: $('about-close'),
  tooltip: $('file-tooltip'),
  ttName: $('tt-name'),
  ttDate: $('tt-date'),
  ttSize: $('tt-size'),
  kbdHintChip: $('kbd-hint-chip'),
  kbdHintClose: $('kbd-hint-close')
};
