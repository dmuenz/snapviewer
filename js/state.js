// Centralized app constants and mutable runtime state shared across modules.

export const EXT_IMG   = new Set(['svg','png','jpg','jpeg','gif','webp','bmp','ico','avif','tiff']);
export const EXT_MD    = new Set(['md','markdown']);
export const SNAPS_DIR = '_snaps';

// Runtime state object used by UI/controllers/rendering modules.
export const state = {
  // Data source mode
  // 'fs-handle' for showDirectoryPicker mode
  // 'fallback-files' for webkitdirectory mode
  sourceMode: 'fs-handle',

  // FS Access API mode
  rootHandle: null,
  currentRecId: null,

  // Fallback virtual folder state
  fallback: {
    label: '',
    filesByPath: new Map(), // key: relative path within _snaps, value: File
    rootNode: null          // virtual tree root
  },

  // Common UI state
  sortMode: 'alpha',
  filterText: '',
  activeRow: null,
  currentZoom: 'zoom-fit-width',
  currentMdMode: 'visual',
  currentMedia: null,
  treeGeneration: 0,
  openPaths: new Set()
};
