// Render/manage folder-history dropdown (switch, rename, delete, open new).

import { dom } from './dom.js';
import { state } from './state.js';
import { dbGetAll, dbPut, dbDelete } from './db.js';
import { formatDate, displayName, isValidNickname } from './helpers.js';
import { showReturnSplash } from './splash.js';

// Render entire dropdown list for folder history and bottom action.
export function renderDropdown(records, activeId, actions = {}) {
  const {
    onOpenSnaps = () => {},
    onActivateRecord = async () => {},
    onEmptyHistory = () => {}
  } = actions;

  dom.pathDropdown.innerHTML = '';

  if (records.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dd-empty-message';
    empty.textContent = 'No folders in history yet.';
    dom.pathDropdown.appendChild(empty);
  } else {
    const sectionLabel = document.createElement('div');
    sectionLabel.className = 'dd-section-label';
    sectionLabel.textContent = 'Recent Folders';
    dom.pathDropdown.appendChild(sectionLabel);

    for (const rec of records) {
      dom.pathDropdown.appendChild(makeDropdownItem(rec, activeId, { onActivateRecord, onEmptyHistory, onOpenSnaps }));
    }
  }

  const divider = document.createElement('div');
  divider.className = 'dd-divider';
  dom.pathDropdown.appendChild(divider);

  const action = document.createElement('div');
  action.className = 'dd-action';
  action.innerHTML = '<span>📁</span> Open a different snapshot folder…';
  action.addEventListener('click', () => {
    dom.pathDropdown.classList.remove('open');
    dom.pathBtn.classList.remove('open');
    onOpenSnaps();
  });
  dom.pathDropdown.appendChild(action);
}

// Build one dropdown row with label/meta + actions (rename/delete/switch).
function makeDropdownItem(rec, activeId, actions) {
  const { onActivateRecord, onEmptyHistory, onOpenSnaps } = actions;
  const isCurrent = rec.id === activeId;
  const item = document.createElement('div');
  item.className = 'dd-item' + (isCurrent ? ' current' : '');

  const body = document.createElement('div');
  body.className = 'dd-item-body';

  const labelRow = document.createElement('div');
  labelRow.className = 'dd-item-label';

  const labelText = document.createElement('span');
  labelText.textContent = displayName(rec);

  if (isCurrent) {
    const badge = document.createElement('span');
    badge.className = 'dd-current-badge';
    badge.textContent = 'open';
    labelRow.appendChild(labelText);
    labelRow.appendChild(badge);
  } else {
    labelRow.appendChild(labelText);
  }

  const metaRow = document.createElement('div');
  metaRow.className = 'dd-item-meta';
  metaRow.textContent = (rec.label && rec.label.trim())
    ? `Last viewed: ${formatDate(rec.lastOpened)}`
    : formatDate(rec.lastOpened);

  body.appendChild(labelRow);
  body.appendChild(metaRow);

  body.addEventListener('click', async () => {
    if (isCurrent) { dom.pathDropdown.classList.remove('open'); dom.pathBtn.classList.remove('open'); return; }
    dom.pathDropdown.classList.remove('open');
    dom.pathBtn.classList.remove('open');
    await onActivateRecord(rec);
  });

  const actionsEl = document.createElement('div');
  actionsEl.className = 'dd-item-actions';

  const renameBtn = document.createElement('button');
  renameBtn.className = 'dd-icon-btn';
  renameBtn.title = 'Rename';
  renameBtn.innerHTML = '✎';

  renameBtn.addEventListener('click', async e => {
    e.stopPropagation();
    const input = document.createElement('input');
    input.className = 'dd-label-input';
    input.value = rec.label || '';
    input.placeholder = rec.label || rec.handle.name;
    input.maxLength = 48;

    // prevent row activation when interacting with rename input
    input.addEventListener('click', e => e.stopPropagation());
    input.addEventListener('mousedown', e => e.stopPropagation());

    labelRow.replaceWith(input);
    input.focus();
    input.select();

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'dd-icon-btn confirm';
    confirmBtn.title = 'Save';
    confirmBtn.innerHTML = '✓';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'dd-icon-btn';
    cancelBtn.title = 'Cancel';
    cancelBtn.innerHTML = '✕';

    actionsEl.innerHTML = '';
    actionsEl.appendChild(confirmBtn);
    actionsEl.appendChild(cancelBtn);

    const commit = async () => {
      const candidate = input.value.trim();
    
      // Empty submission = cancel (restore existing nickname).
      if (candidate === '') {
        cancel();
        return;
      }

      // Validate allowed characters.
      if (!isValidNickname(candidate)) {
        showNicknameValidationError(input, 'Only letters, numbers, dots, spaces, hyphens, and underscores are allowed.');
        return;
      }

      // Pull latest records before validating.
      const all = await dbGetAll();
    
      // Enforce unique non-empty nickname (case-insensitive).
      if (nicknameExists(candidate, all, rec.id)) {
        showNicknameValidationError(input, 'That nickname already exists.');
        return;
      }
    
      input.classList.remove('invalid');
      input.setCustomValidity('');
    
      rec.label = candidate;
      await dbPut(rec);
    
      if (rec.id === state.currentRecId) {
        dom.pathText.textContent = displayName(rec);
      }
    
      const updated = await dbGetAll();
      renderDropdown(updated, state.currentRecId, actions);
    };
    
    const cancel = async () => {
      const updated = await dbGetAll();
      renderDropdown(updated, state.currentRecId, actions);
    };

    confirmBtn.addEventListener('click', e => { e.stopPropagation(); commit(); });
    cancelBtn.addEventListener('click', e => { e.stopPropagation(); cancel(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter')  { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    });
    input.addEventListener('input', () => {
      const val = input.value.trim();
      if (val === '' || isValidNickname(val)) {
        input.classList.remove('invalid');
        input.setCustomValidity('');
      }
    });
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'dd-icon-btn danger';
  deleteBtn.title = 'Remove from history';
  deleteBtn.innerHTML = '✕';

  deleteBtn.addEventListener('click', async e => {
    e.stopPropagation();
    await dbDelete(rec.id);
  
    const deletedCurrent = rec.id === state.currentRecId;
  
    if (deletedCurrent) {
      state.currentRecId = null;
      state.rootHandle = null;
      state.sourceMode = 'fs-handle'; // neutral/default for return flow
      dom.pathText.textContent = 'No folder open';
      dom.pathText.classList.remove('has-path');
      dom.treeRoot.innerHTML = '';
    }
  
    const updated = await dbGetAll();
    renderDropdown(updated, state.currentRecId, actions);
  
    if (updated.length === 0) {
      dom.pathDropdown.classList.remove('open');
      dom.pathBtn.classList.remove('open');
      onEmptyHistory();
      return;
    }
  
    // if user deleted the currently loaded folder but other history exists,
    // show return splash for the most recent remaining folder.
    if (deletedCurrent) {
      dom.pathDropdown.classList.remove('open');
      dom.pathBtn.classList.remove('open');
  
      const mostRecent = updated[0];
      showReturnSplash(
        mostRecent,
        updated,
        () => onActivateRecord(mostRecent),
        onOpenSnaps,
        (records, activeId) => renderDropdown(records, activeId, actions)
      );
    }
  });

  actionsEl.appendChild(renameBtn);
  actionsEl.appendChild(deleteBtn);

  item.appendChild(body);
  item.appendChild(actionsEl);
  return item;
}

function normalizeNickname(s) {
  return (s || '').trim().toLowerCase();
}

function nicknameExists(candidate, records, excludeId = null) {
  const c = normalizeNickname(candidate);
  if (!c) return false;
  return records.some(r => r.id !== excludeId && normalizeNickname(r.label) === c);
}

function showNicknameValidationError(input, errMsg) {
  input.classList.add('invalid');
  input.setCustomValidity(errMsg);
  input.reportValidity();
  input.focus();
  input.select();
}
