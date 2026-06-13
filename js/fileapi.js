// Abstraction layer for directory access via showDirectoryPicker (Chrome/Edge) or webkitdirectory (Firefox/Safari).
// Provides a unified interface and tracks session type for UI adaptation.

import { SNAPS_DIR } from './state.js';

// Detect which API is available
const HAS_DIRECTORY_PICKER = typeof window.showDirectoryPicker === 'function';

export const BROWSER_CAPABILITIES = {
  hasDirectoryPicker: HAS_DIRECTORY_PICKER,
  canPersist: HAS_DIRECTORY_PICKER // Only Directory API supports persistence
};

/**
 * Attempt to open a directory via showDirectoryPicker (if available) or file input (fallback).
 * Returns { root, isTemporary, errorMsg }.
 *   root: A handle-like object with async iteration support
 *   isTemporary: true if using webkitdirectory (session-only), false if using Directory API (persistent)
 *   errorMsg: string if failed
 */
export async function pickDirectory() {
  try {
    if (HAS_DIRECTORY_PICKER) {
      return await pickDirectoryNative();
    } else {
      return await pickDirectoryFallback();
    }
  } catch (e) {
    if (e.name === 'AbortError') {
      return { root: null, isTemporary: false, errorMsg: null }; // User cancelled
    }
    return { root: null, isTemporary: false, errorMsg: e.message };
  }
}

/**
 * Native Directory API (Chrome, Edge)
 */
async function pickDirectoryNative() {
  const parent = await window.showDirectoryPicker({ mode: 'read', startIn: 'documents' });

  let handle;
  try {
    handle = await parent.getDirectoryHandle(SNAPS_DIR);
  } catch {
    handle = parent.name === SNAPS_DIR ? parent : null;
  }

  if (!handle) {
    const errorMsg = `"${SNAPS_DIR}" not found inside "${parent.name}". Please pick a folder that contains _snaps.`;
    return { root: null, isTemporary: false, errorMsg };
  }

  return { root: handle, isTemporary: false, errorMsg: null };
}

/**
 * Fallback: webkitdirectory input (Firefox, Safari, also works in Chrome/Edge)
 * Reconstructs a handle-like object from FileList.
 */
async function pickDirectoryFallback() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.webkitdirectory = true;
    input.hidden = true;

    input.onchange = (e) => {
      const files = Array.from(e.target.files || []);
      document.body.removeChild(input);

      if (files.length === 0) {
        resolve({ root: null, isTemporary: false, errorMsg: null }); // User cancelled
        return;
      }

      // Reconstruct folder structure from FileList
      const root = reconstructDirectoryHandle(files);

      // Check if _snaps folder exists
      if (!hasSnapsFolder(files)) {
        const errorMsg = `"${SNAPS_DIR}" folder not found. Please select a folder that contains _snaps.`;
        resolve({ root: null, isTemporary: false, errorMsg });
        return;
      }

      resolve({ root, isTemporary: true, errorMsg: null });
    };

    input.onerror = () => {
      document.body.removeChild(input);
      resolve({ root: null, isTemporary: false, errorMsg: 'File picker error' });
    };

    document.body.appendChild(input);
    input.click();
  });
}

/**
 * Check if any file path contains _snaps folder
 */
function hasSnapsFolder(files) {
  return Array.from(files).some(f => f.webkitRelativePath.startsWith(SNAPS_DIR + '/'));
}

/**
 * Reconstruct a handle-like object from FileList that supports async iteration.
 * Structure: { values(), getDirectoryHandle(), name, getFile() methods }
 */
function reconstructDirectoryHandle(files) {
  const fileMap = new Map(); // path -> File object
  const dirSet = new Set(); // set of directory paths

  // Populate map and directory set
  for (const file of files) {
    fileMap.set(file.webkitRelativePath, file);
    const parts = file.webkitRelativePath.split('/');
    for (let i = 0; i < parts.length - 1; i++) {
      dirSet.add(parts.slice(0, i + 1).join('/'));
    }
  }

  // Return root handle
  return createHandleForPath('', fileMap, dirSet, files);
}

/**
 * Create a handle object for a given path
 */
function createHandleForPath(basePath, fileMap, dirSet, allFiles) {
  // Get all immediate children of this directory
  const children = new Map(); // name -> { kind, path, file? }

  for (const [filePath, file] of fileMap) {
    const parts = filePath.split('/').filter(Boolean);
    if (basePath === '') {
      // Root level
      if (parts.length === 1) {
        children.set(parts[0], { kind: 'file', path: filePath, file });
      } else if (parts.length > 1) {
        children.set(parts[0], { kind: 'directory', path: parts[0] });
      }
    } else {
      const baseParts = basePath.split('/').filter(Boolean);
      if (parts.length === baseParts.length + 1) {
        children.set(parts[baseParts.length], { kind: 'file', path: filePath, file });
      } else if (parts.length > baseParts.length + 1 && filePath.startsWith(basePath + '/')) {
        children.set(parts[baseParts.length], { kind: 'directory', path: parts.slice(0, baseParts.length + 1).join('/') });
      }
    }
  }

  // Deduplicate and create entry objects
  const entries = new Map(); // name -> entry object
  for (const [name, info] of children) {
    if (!entries.has(name)) {
      entries.set(name, {
        name,
        kind: info.kind,
        path: info.path,
        file: info.file || null
      });
    }
  }

  // Generator function for async iteration
  async function* valuesGenerator() {
    for (const entry of entries.values()) {
      if (entry.kind === 'file') {
        yield {
          name: entry.name,
          kind: 'file',
          getFile: async () => entry.file,
          getDirectoryHandle: null
        };
      } else {
        yield {
          name: entry.name,
          kind: 'directory',
          getFile: null,
          getDirectoryHandle: async () => createHandleForPath(entry.path, fileMap, dirSet, allFiles)
        };
      }
    }
  }

  // Create handle object
  const handle = {
    name: basePath ? basePath.split('/').pop() : 'root',
    path: basePath,

    // values() method for for-await-of compatibility
    values() {
      return valuesGenerator();
    },

    // Support [Symbol.asyncIterator] for for-await-of (alternative)
    [Symbol.asyncIterator]() {
      return valuesGenerator();
    },

    // Get a subdirectory by name
    async getDirectoryHandle(name) {
      const child = entries.get(name);
      if (!child || child.kind !== 'directory') {
        throw new Error(`Directory "${name}" not found`);
      }
      return createHandleForPath(child.path, fileMap, dirSet, allFiles);
    }
  };

  return handle;
}
