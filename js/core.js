// Core app actions (error/modal/open/activate/load).

import { state, SNAPS_DIR } from './state.js';
import { dom, $ } from './dom.js';
import { dbGetAll, dbPut, dbSetMeta, upsertHandle } from './db.js';
import { escHtml, displayName } from './helpers.js';
import { rebuildTree } from './tree.js';

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

// Set active root handle, refresh folder dropdown/tree, and show ready splash.
export async function loadRoot(handle, rec, renderDropdown, showReadySplash) {
  state.rootHandle = handle;
  state.openPaths  = new Set();
  dom.pathText.textContent = displayName(rec);
  dom.pathText.classList.add('has-path');

  const records = await dbGetAll();
  renderDropdown(records, state.currentRecId);

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
    showError('This folder is no longer accessible. Please open it again via "Open a different _snaps folder".');
    return;
  }

  rec.lastOpened = Date.now();
  await dbPut(rec);
  await dbSetMeta('currentId', rec.id);
  state.currentRecId = rec.id;

  await loadRoot(rec.handle, rec, renderDropdown, showReadySplash);
}

// Open directory picker, resolve `_snaps`, persist handle, and load.
export async function openSnaps(renderDropdown, showReadySplash) {
  try {
    const records = await dbGetAll();
    const startIn = records.length > 0 ? records[0].handle : 'documents';
    const parent  = await window.showDirectoryPicker({ mode: 'read', startIn });

    let handle;
    try { handle = await parent.getDirectoryHandle(SNAPS_DIR); }
    catch { handle = parent.name === SNAPS_DIR ? parent : null; }

    if (!handle) {
      showError(`"${SNAPS_DIR}" not found inside "${escHtml(parent.name)}". Please pick a folder that contains _snaps.`);
      return;
    }

    const { id, isNew } = await upsertHandle(handle);
    const allRecs = await dbGetAll();
    const rec = allRecs.find(r => r.id === id);

    if (isNew) {
      const label = await promptNickname('');
      rec.label = label;
      await dbPut(rec);
    }

    await dbSetMeta('currentId', id);
    state.currentRecId = id;

    await loadRoot(handle, rec, renderDropdown, showReadySplash);
  } catch (e) {
    if (e.name !== 'AbortError') showError('Error: ' + e.message);
  }
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
