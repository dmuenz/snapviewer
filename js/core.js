// Core app actions (error/modal/open/activate/load).

import { state, SNAPS_DIR } from './state.js';
import { dom, $ } from './dom.js';
import { dbGetAll, dbPut, dbSetMeta, upsertHandle } from './db.js';
import { escHtml, displayName } from './helpers.js';
import { rebuildTree } from './tree.js';
import { pickDirectory, BROWSER_CAPABILITIES } from './fileapi.js';

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

  // If session-only (webkitdirectory), add visual indicator
  if (rec.isTemporary) {
    dom.pathText.title = 'Session-only (Firefox/Safari). This folder will not be remembered after page reload.';
    dom.pathText.style.opacity = '0.7';
  } else {
    dom.pathText.title = '';
    dom.pathText.style.opacity = '1';
  }

  const records = await dbGetAll();
  renderDropdown(records, state.currentRecId);

  await rebuildTree();
  showReadySplash();
}

// Request permission for a stored handle and activate it.
export async function activateRecord(rec, renderDropdown, showReadySplash) {
  try {
    // Skip permission request for temporary (session-only) records
    if (!rec.isTemporary) {
      const perm = await rec.handle.requestPermission({ mode: 'read' });
      if (perm !== 'granted') {
        showError('Permission denied. Please try again.');
        return;
      }
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

// Open directory picker (native or fallback), resolve `_snaps`, persist handle, and load.
export async function openSnaps(renderDropdown, showReadySplash) {
  try {
    const result = await pickDirectory();

    if (!result.root) {
      if (result.errorMsg) {
        showError(result.errorMsg);
      }
      return;
    }

    const { root, isTemporary } = result;

    // For temporary sessions, create an in-memory record without persistence
    if (isTemporary) {
      const inMemoryHandle = root;
      const rec = {
        id: Date.now(), // Temporary ID
        handle: inMemoryHandle,
        label: await promptNickname(''),
        lastOpened: Date.now(),
        isTemporary: true
      };

      // Don't save to DB; just load it
      state.currentRecId = rec.id;
      await loadRoot(inMemoryHandle, rec, renderDropdown, showReadySplash);
      return;
    }

    // For persistent sessions, use existing flow
    const { id, isNew } = await upsertHandle(root);
    const allRecs = await dbGetAll();
    const rec = allRecs.find(r => r.id === id);

    if (isNew) {
      const label = await promptNickname('');
      rec.label = label;
      await dbPut(rec);
    }

    await dbSetMeta('currentId', id);
    state.currentRecId = id;

    await loadRoot(root, rec, renderDropdown, showReadySplash);
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
