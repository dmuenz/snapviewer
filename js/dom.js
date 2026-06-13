// Centralized DOM lookups so modules can share stable element references.

// Convenience helper for id-based element lookup.
export const $ = id => document.getElementById(id);

// Cached DOM references used throughout the app.
export const dom = {
  treeRoot: $('tree-root'),
  sortBtn: $('btn-sort'),
  sortLabel: $('sort-label'),
  filterBtn: $('btn-filter'),
  clearBtn: $('btn-clear'),
  filterBar: $('filter-bar'),
  filterInput: $('filter-input'),
  contentBody: $('content-body'),
  breadcrumb: $('breadcrumb-text'),
  imgToolbar: $('img-toolbar'),
  appEl: $('app'),
  pathBtn: $('path-btn'),
  pathText: $('path-text'),
  pathDropdown: $('path-dropdown'),
  modalOverlay: $('modal-overlay'),
  modalInput: $('modal-input'),
  tooltip: $('file-tooltip'),
  ttName: $('tt-name'),
  ttDate: $('tt-date'),
  ttSize: $('tt-size')
};
