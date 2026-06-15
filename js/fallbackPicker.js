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
          const raw = (f.webkitRelativePath || '').replace(/\\/g, '/');
          const idx = raw.indexOf(`/${SNAPS_DIR}/`);
          if (idx >= 0) {
            const rel = raw.slice(idx + (`/${SNAPS_DIR}/`).length);
            if (rel) matches.push({ file: f, rel });
          } else if (raw.startsWith(`${SNAPS_DIR}/`)) {
            const rel = raw.slice(`${SNAPS_DIR}/`.length);
            if (rel) matches.push({ file: f, rel });
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
