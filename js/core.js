// Core app actions (error/modal/open/activate/load) with fs-picker + fallback support.

import { state, SNAPS_DIR } from './state.js';
import { dom, $ } from './dom.js';
import { dbGetAll, dbPut, dbSetMeta, upsertHandle } from './db.js';
import { escHtml, displayName } from './helpers.js';
import { rebuildTree } from './tree.js';
import { pickSnapsViaInput, setFallbackSource } from './fallbackPicker.js';

// Render a safe error message into the content panel.
export function showError(msg) {
  dom.contentBody.innerHTML = `<div class="err-msg">${escHtml(msg)}</div>`;
}

// Show nickname modal and resolve with entered label or empty string.
export function promptNickname(suggestedLabel) {
  return new Promise(resolve => {
    dom.modalInput.value = suggestedLabel || '';
    dom.modalOverlay.classList.add('open');
    dom.modalInput.focus();
    dom.modalInput.select();

    const finish = label => {
      dom.modalOverlay.classList.remove('open');
      $('modal-save').removeEventListener('click', onSave);
      $('modal-skip').removeEventListener('click', onSkip);
      dom.modalInput.removeEventListener('keydown', onKey);
      resolve(label);
    };

    const onSave = () => finish(dom.modalInput.value.trim());
    const onSkip = () => finish('');
    const onKey  = e => {
      if (e.key === 'Enter')  { e.preventDefault(); finish(dom.modalInput.value.trim()); }
      if (e.key === 'Escape') { e.preventDefault(); finish(''); }
    };

    $('modal-save').addEventListener('click', onSave);
    $('modal-skip').addEventListener('click', onSkip);
    dom.modalInput.addEventListener('keydown', onKey);
  });
}

// Set active source, refresh folder dropdown/tree, and show ready splash.
export async function loadRoot(handleOrNull, recOrFallback, renderDropdown, showReadySplash) {
  state.openPaths = new Set();

  if (state.sourceMode === 'fs-handle') {
    state.rootHandle = handleOrNull;
    dom.pathText.textContent = displayName(recOrFallback);
    dom.pathText.classList.add('has-path');

    const records = await dbGetAll();
    renderDropdown(records, state.currentRecId);
  } else {
    state.rootHandle = null;
    dom.pathText.textContent = state.fallback.label || 'Selected Folder';
    dom.pathText.classList.add('has-path');

    // In fallback mode there is no persistent handle list to show.
    renderDropdown([], null);
  }

  await rebuildTree();
  showReadySplash();
}

// Request permission for a stored handle and activate it.
export async function activateRecord(rec, renderDropdown, showReadySplash) {
  try {
    const perm = await rec.handle.requestPermission({ mode: 'read' });
    if (perm !== 'granted') {
      showError('Permission denied. Please try again.');
      return;
    }
  } catch {
    showError('This folder is no longer accessible. Please open it again via "Open a different snapshot folder".');
    return;
  }

  rec.lastOpened = Date.now();
  await dbPut(rec);
  await dbSetMeta('currentId', rec.id);
  state.currentRecId = rec.id;
  state.sourceMode = 'fs-handle';

  await loadRoot(rec.handle, rec, renderDropdown, showReadySplash);
}

// Open source picker:
// - showDirectoryPicker if available
// - fallback input[webkitdirectory] otherwise
export async function openSnaps(renderDropdown, showReadySplash) {
  const hasDirPicker = typeof window.showDirectoryPicker === 'function';

  if (!hasDirPicker) {
    // Fallback mode
    try {
      const bundle = await pickSnapsViaInput(dom.folderInputFallback);
      setFallbackSource(bundle);
      await loadRoot(null, bundle, renderDropdown, showReadySplash);
    } catch (e) {
      showError('Error: ' + e.message);
    }
    return;
  }

  // FS Access API mode
  try {
    const records = await dbGetAll();
    const startIn = records.length > 0 ? records[0].handle : 'documents';
    const parent  = await window.showDirectoryPicker({ mode: 'read', startIn });
    const suggestedNickname = await getSuggestedNicknameFromSelection(parent);
    const handle  = await resolveSnapsHandleFromSelection(parent);

    if (!handle) {
      showError(`"${SNAPS_DIR}" not found inside "${escHtml(parent.name)}". Please pick a folder that contains _snaps.`);
      return;
    }

    const { id, isNew } = await upsertHandle(handle);
    const allRecs = await dbGetAll();
    const rec = allRecs.find(r => r.id === id);

    if (isNew) {
      const label = await promptNickname(suggestedNickname);
      rec.label = label;
      await dbPut(rec);
    }

    await dbSetMeta('currentId', id);
    state.currentRecId = id;
    state.sourceMode = 'fs-handle';

    await loadRoot(handle, rec, renderDropdown, showReadySplash);
  } catch (e) {
    if (e.name !== 'AbortError') showError('Error: ' + e.message);
  }
}

// Return package folder name as nickname suggestion if selected folder looks like package root.
async function getSuggestedNicknameFromSelection(selectedDir) {
  if (!selectedDir || selectedDir.name === SNAPS_DIR) return '';

  try {
    const tests = await selectedDir.getDirectoryHandle('tests');
    const testthat = await tests.getDirectoryHandle('testthat');
    await testthat.getDirectoryHandle(SNAPS_DIR);
    return selectedDir.name; // e.g. "mypackage"
  } catch {
    return '';
  }
}

// Try to resolve a _snaps directory from any selected folder in package hierarchy.
async function resolveSnapsHandleFromSelection(selectedDir) {
  // Case 1: user directly selected _snaps
  if (selectedDir.name === SNAPS_DIR) return selectedDir;

  // Case 2: package-root or higher-level standard path: tests/testthat/_snaps
  try {
    const tests = await selectedDir.getDirectoryHandle('tests');
    const testthat = await tests.getDirectoryHandle('testthat');
    const snaps = await testthat.getDirectoryHandle(SNAPS_DIR);
    return snaps;
  } catch {
    // continue to recursive search
  }

  // Case 3: recursive descendant search for first folder named _snaps
  return await findDirectoryByName(selectedDir, SNAPS_DIR);
}

// Depth-first search for first descendant directory matching name.
async function findDirectoryByName(root, targetName) {
  for await (const entry of root.values()) {
    if (entry.kind !== 'directory') continue;
    if (entry.name === targetName) return entry;
    const nested = await findDirectoryByName(entry, targetName);
    if (nested) return nested;
  }
  return null;
}

// Wire path button toggle and outside-click close behavior for dropdown.
export function initPathDropdownEvents(onOpenDropdown) {
  dom.pathBtn.addEventListener('click', async e => {
    e.stopPropagation();
    const isOpen = dom.pathDropdown.classList.toggle('open');
    dom.pathBtn.classList.toggle('open', isOpen);
    if (isOpen) await onOpenDropdown();
  });

  document.addEventListener('click', e => {
    if (!$('path-dropdown-wrap').contains(e.target)) {
      dom.pathDropdown.classList.remove('open');
      dom.pathBtn.classList.remove('open');
    }
  });
}
