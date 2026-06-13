// Centralized app constants and mutable runtime state shared across modules.

export const EXT_IMG   = new Set(['svg','png','jpg','jpeg','gif','webp','bmp','ico','avif','tiff']);
export const EXT_MD    = new Set(['md','markdown']);
export const SNAPS_DIR = '_snaps';

// Runtime state object used by UI/controllers/rendering modules.
export const state = {
  rootHandle: null,
  currentRecId: null,
  sortMode: 'alpha',
  filterText: '',
  activeRow: null,
  currentZoom: 'zoom-fit-width',
  currentMedia: null,
  treeGeneration: 0,
  openPaths: new Set()
};
