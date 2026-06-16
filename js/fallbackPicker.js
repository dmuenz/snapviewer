// Fallback folder picker using <input webkitdirectory> and virtual tree construction.

import { SNAPS_DIR, state } from './state.js';

// Build an empty virtual directory node.
function makeDir(name, path = '') {
  return { kind: 'directory', name, path, children: [] };
}

// Build a virtual file node.
function makeFile(name, path, file) {
  return { kind: 'file', name, path, file };
}

// Insert a file path into virtual tree under root.
function insertPath(root, relPath, file) {
  const parts = relPath.split('/').filter(Boolean);
  let cur = root;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const isLast = i === parts.length - 1;
    const curPath = parts.slice(0, i + 1).join('/');

    if (isLast) {
      cur.children.push(makeFile(part, curPath, file));
    } else {
      let next = cur.children.find(c => c.kind === 'directory' && c.name === part);
      if (!next) {
        next = makeDir(part, curPath);
        cur.children.push(next);
      }
      cur = next;
    }
  }
}

// Open fallback picker and return parsed _snaps bundle.
export function pickSnapsViaInput(inputEl) {
  return new Promise((resolve, reject) => {
    const onChange = () => {
      try {
        const files = Array.from(inputEl.files || []);
        inputEl.removeEventListener('change', onChange);

        if (files.length === 0) {
          reject(new Error('No files selected.'));
          return;
        }

        // Find files that contain /_snaps/ in webkitRelativePath.
        const matches = [];
        for (const f of files) {
          const raw = (f.webkitRelativePath || '').replace(/\\/g, '/'); // e.g. mypackage/tests/testthat/_snaps/a.md
          const parts = raw.split('/').filter(Boolean);
        
          // rel to selected folder content (strip selected-folder segment)
          // webkitRelativePath is always "<selectedFolderName>/..."
          if (parts.length < 2) continue;
          const relFromSelected = parts.slice(1); // drop selected root dir name
        
          // Accepted if selected folder is _snaps directly:
          // relFromSelected like ["file.md"] (cannot reliably detect this from files alone),
          // or if files come through "_snaps/..." when selected folder is parent.
          //
          // Primary accepted package pattern:
          // tests/testthat/_snaps/<...>
          const stdPrefix = ['tests', 'testthat', SNAPS_DIR];
        
          const hasStdPrefix =
            relFromSelected.length >= 4 &&
            relFromSelected[0] === stdPrefix[0] &&
            relFromSelected[1] === stdPrefix[1] &&
            relFromSelected[2] === stdPrefix[2];
        
          // Also accept any selection where path includes ".../tests/testthat/_snaps/..."
          // relative to selected folder descendants:
          let idx = -1;
          for (let i = 0; i <= relFromSelected.length - 3; i++) {
            if (
              relFromSelected[i] === 'tests' &&
              relFromSelected[i + 1] === 'testthat' &&
              relFromSelected[i + 2] === SNAPS_DIR
            ) {
              idx = i;
              break;
            }
          }
        
          if (hasStdPrefix || idx >= 0) {
            const snapsStart = hasStdPrefix ? 3 : idx + 3;
            const relInsideSnaps = relFromSelected.slice(snapsStart).join('/');
            if (relInsideSnaps) {
              matches.push({ file: f, rel: relInsideSnaps });
            }
          }
        }

        if (matches.length === 0) {
          reject(new Error(`No "${SNAPS_DIR}" folder found in the selected directory.`));
          return;
        }

        const root = makeDir(SNAPS_DIR, '');
        const filesByPath = new Map();

        for (const m of matches) {
          insertPath(root, m.rel, m.file);
          filesByPath.set(m.rel, m.file);
        }

        // Best-effort label from selected root folder
        const firstRaw = (matches[0].file.webkitRelativePath || '').replace(/\\/g, '/');
        const guessedParent = firstRaw.split('/')[0] || 'Selected Folder';

        resolve({
          label: guessedParent,
          rootNode: root,
          filesByPath
        });
      } catch (err) {
        reject(err);
      } finally {
        // Reset so selecting same folder again still triggers change
        inputEl.value = '';
      }
    };

    inputEl.addEventListener('change', onChange, { once: true });
    inputEl.click();
  });
}

// Set current runtime to fallback source.
export function setFallbackSource(bundle) {
  state.sourceMode = 'fallback-files';
  state.rootHandle = null;
  state.currentRecId = null;
  state.openPaths = new Set();

  state.fallback.label = bundle.label || 'Selected Folder';
  state.fallback.rootNode = bundle.rootNode;
  state.fallback.filesByPath = bundle.filesByPath;
}
