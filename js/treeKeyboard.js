// Keyboard navigation for the tree view (up/down/left/right) with auto-open for files.
// Also supports Enter/Space to toggle folders.

import { dom } from './dom.js';

// Keep track of currently focused tree row for keyboard control.
let focusedRow = null;

// Return rows that are actually visible in the tree (exclude rows inside collapsed folders).
function getVisibleRows() {
  const allRows = Array.from(dom.treeRoot.querySelectorAll('.tree-row'));

  return allRows.filter(row => {
    // If any ancestor .tree-children is collapsed, this row is not navigable.
    let p = row.parentElement;
    while (p && p !== dom.treeRoot) {
      if (p.classList && p.classList.contains('tree-children') && p.classList.contains('collapsed')) {
        return false;
      }
      p = p.parentElement;
    }
    return row.offsetParent !== null;
  });
}

// Ensure a row is visibly marked and receives DOM focus.
function focusRow(row, scroll = true) {
  if (!row) return;

  if (focusedRow) focusedRow.classList.remove('kb-focus');
  focusedRow = row;
  focusedRow.classList.add('kb-focus');

  if (!focusedRow.hasAttribute('tabindex')) focusedRow.setAttribute('tabindex', '-1');
  focusedRow.focus({ preventScroll: true });

  if (scroll) {
    focusedRow.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
}

// If focused row is a file row, auto-open it by triggering existing click behavior.
function autoOpenIfFile(row) {
  if (!row) return;
  const arrow = row.querySelector('.row-arrow');
  const isFile = !!arrow && arrow.classList.contains('leaf');
  if (isFile) row.click();
}

// Find row index among visible rows.
function rowIndex(row) {
  const rows = getVisibleRows();
  return rows.indexOf(row);
}

// Determine if row is a directory by checking for non-leaf arrow.
function isFolderRow(row) {
  const arrow = row.querySelector('.row-arrow');
  return !!arrow && !arrow.classList.contains('leaf');
}

// Return row's arrow element.
function getArrow(row) {
  return row ? row.querySelector('.row-arrow') : null;
}

// Return row's immediate children container (if folder row).
function getChildrenContainer(row) {
  if (!row) return null;
  const node = row.closest('.tree-node');
  if (!node) return null;
  return node.querySelector(':scope > .tree-children');
}

// Expand folder row if collapsed.
function expandRow(row) {
  if (!isFolderRow(row)) return false;
  const arrow = getArrow(row);
  const children = getChildrenContainer(row);
  if (!arrow || !children) return false;
  if (arrow.classList.contains('open')) return false;

  row.click();
  return true;
}

// Collapse folder row if expanded.
function collapseRow(row) {
  if (!isFolderRow(row)) return false;
  const arrow = getArrow(row);
  const children = getChildrenContainer(row);
  if (!arrow || !children) return false;
  if (!arrow.classList.contains('open')) return false;

  row.click();
  return true;
}

// Toggle folder row open/closed.
function toggleFolderRow(row) {
  if (!isFolderRow(row)) return false;
  const arrow = getArrow(row);
  if (!arrow) return false;

  if (arrow.classList.contains('open')) {
    return collapseRow(row);
  }
  return expandRow(row);
}

// If folder is open, return first visible child row.
function firstChildRow(row) {
  if (!isFolderRow(row)) return null;
  const children = getChildrenContainer(row);
  if (!children) return null;
  return children.querySelector('.tree-row');
}

// Return parent folder row in tree, if any.
function parentRow(row) {
  if (!row) return null;
  const currentNode = row.closest('.tree-node');
  if (!currentNode) return null;

  // Walk up from the tree-node to find the .tree-children container.
  // With the grid animation structure, the parent chain is:
  // .tree-node → .tree-children-inner → .tree-children → .tree-node (parent folder)
  let ancestor = currentNode.parentElement;
  while (ancestor && ancestor !== dom.treeRoot) {
    if (ancestor.classList.contains('tree-children')) {
      const parentNode = ancestor.closest('.tree-node');
      if (!parentNode) return null;
      return parentNode.querySelector(':scope > .tree-row');
    }
    ancestor = ancestor.parentElement;
  }
  return null;
}

// Ensure there is a starting focused row.
function ensureInitialFocus() {
  if (focusedRow && document.contains(focusedRow)) return focusedRow;
  const rows = getVisibleRows();
  if (rows.length > 0) {
    focusRow(rows[0], false);
    return rows[0];
  }
  return null;
}

// Handle keyboard events globally (tree-focused usage).
function onKeyDown(e) {
  // Ignore typing in inputs/textareas/contenteditable.
  const t = e.target;
  const tag = t?.tagName?.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || t?.isContentEditable) return;

  const key = e.key;
  if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(key)) return;

  const current = ensureInitialFocus();
  if (!current) return;

  const rows = getVisibleRows();
  const idx = rowIndex(current);

  if (key === 'ArrowUp') {
    e.preventDefault();
    if (idx > 0) {
      const nextRow = rows[idx - 1];
      focusRow(nextRow);
      autoOpenIfFile(nextRow);
    }
    return;
  }

  if (key === 'ArrowDown') {
    e.preventDefault();
    if (idx >= 0 && idx < rows.length - 1) {
      const nextRow = rows[idx + 1];
      focusRow(nextRow);
      autoOpenIfFile(nextRow);
    }
    return;
  }

  if (key === 'ArrowRight') {
    if (!isFolderRow(current)) return;
    e.preventDefault();

    const expandedNow = expandRow(current);
    if (!expandedNow) {
      const child = firstChildRow(current);
      if (child) {
        focusRow(child);
        autoOpenIfFile(child);
      }
    }
    return;
  }

  if (key === 'ArrowLeft') {
    if (isFolderRow(current)) {
      const arrow = getArrow(current);
      if (arrow && arrow.classList.contains('open')) {
        e.preventDefault();
        collapseRow(current);
        return;
      }
    }

    const p = parentRow(current);
    if (p) {
      e.preventDefault();
      focusRow(p);
    }
    return;
  }

  // Enter/Space: toggle folder. For files, open file.
  if (key === 'Enter' || key === ' ') {
    e.preventDefault();
    if (isFolderRow(current)) {
      toggleFolderRow(current);
    } else {
      current.click();
    }
  }
}

// Keep focused row synced when user clicks rows.
function onTreeClick(e) {
  const row = e.target.closest('.tree-row');
  if (!row) return;
  focusRow(row, false);
}

// Public init.
export function initTreeKeyboard() {
  if (!dom.treeRoot.hasAttribute('tabindex')) dom.treeRoot.setAttribute('tabindex', '0');

  dom.treeRoot.addEventListener('click', onTreeClick);
  document.addEventListener('keydown', onKeyDown);

  dom.treeRoot.addEventListener('focus', () => {
    ensureInitialFocus();
  });
}
