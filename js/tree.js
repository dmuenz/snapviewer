// Build/rebuild file tree UI, handle expand/collapse/filter/sort, and file selection.

import { state, EXT_IMG, EXT_MD } from './state.js';
import { dom } from './dom.js';
import { fileIcon } from './helpers.js';
import { previewFile } from './preview.js';
import { showTooltip, hideTooltip } from './tooltip.js';

// Rebuild tree from current root handle and current app state.
export async function rebuildTree() {
  if (!state.rootHandle) return;
  const gen = ++state.treeGeneration;
  dom.treeRoot.innerHTML = '';
  await buildTree(state.rootHandle, dom.treeRoot, 0, gen, '', state.openPaths);
}

// Recursively build directory/file nodes with sorting/filtering and persisted expansion.
async function buildTree(dirHandle, container, depth, gen, pathPrefix, openPaths) {
  const entries = [];
  for await (const entry of dirHandle.values()) entries.push(entry);

  if (state.sortMode === 'alpha') {
    entries.sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  } else {
    const withTime = await Promise.all(entries.map(async e => {
      let t = 0;
      if (e.kind === 'file') { try { t = (await e.getFile()).lastModified; } catch {} }
      return { entry: e, t };
    }));
    withTime.sort((a, b) => {
      if (a.entry.kind !== b.entry.kind) return a.entry.kind === 'directory' ? -1 : 1;
      return b.t - a.t;
    });
    entries.length = 0;
    withTime.forEach(w => entries.push(w.entry));
  }

  for (const entry of entries) {
    const node   = document.createElement('div');
    node.className = 'tree-node';
    const row    = document.createElement('div');
    row.className = 'tree-row';
    row.style.paddingLeft = (depth * 16 + 10) + 'px';
    const entryPath = pathPrefix ? pathPrefix + '/' + entry.name : entry.name;
    row.dataset.path = entryPath;
    const arrow  = document.createElement('span');
    arrow.className = 'row-arrow';
    arrow.innerHTML = '▶';
    const icon   = document.createElement('span');
    icon.className = 'row-icon';
    const nameEl = document.createElement('span');
    nameEl.className = 'row-name';
    nameEl.textContent = entry.name;
    row.appendChild(arrow); row.appendChild(icon); row.appendChild(nameEl);

    if (entry.kind === 'directory') {
      icon.innerHTML = '📁';
      icon.style.color = 'var(--folder)';
      if (state.filterText) {
        if (!(await folderHasMatch(entry))) continue;
        if (!entry.name.toLowerCase().includes(state.filterText)) row.classList.add('dim-folder');
      }
      const children = document.createElement('div');
      const shouldBeOpen = openPaths && openPaths.has(entryPath);
      children.className = 'tree-children' + (shouldBeOpen ? '' : ' collapsed');
      children.style.maxHeight = shouldBeOpen ? 'none' : '0px';
      let loaded = false;

      if (shouldBeOpen) {
        arrow.classList.add('open');
        await buildTree(entry, children, depth + 1, gen, entryPath, openPaths);
        loaded = true;
        if (gen !== state.treeGeneration) return;
      }

      row.addEventListener('click', async () => {
        const isOpen = arrow.classList.contains('open');
        if (!loaded) { await buildTree(entry, children, depth + 1, gen, entryPath, openPaths); loaded = true; }
        if (isOpen) {
          openPaths.delete(entryPath);
          arrow.classList.remove('open');
          children.style.maxHeight = children.scrollHeight + 'px';
          requestAnimationFrame(() => requestAnimationFrame(() => {
            children.classList.add('collapsed');
            children.style.maxHeight = '0px';
          }));
        } else {
          openPaths.add(entryPath);
          children.classList.remove('collapsed');
          children.style.maxHeight = children.scrollHeight + 'px';
          arrow.classList.add('open');
          children.addEventListener('transitionend', () => {
            if (arrow.classList.contains('open')) children.style.maxHeight = 'none';
          }, { once: true });
        }
      });

      node.appendChild(row);
      node.appendChild(children);
    } else {
      arrow.classList.add('leaf');
      const fi = fileIcon(entry.name, EXT_MD, EXT_IMG);
      icon.innerHTML = fi.icon;
      icon.style.color = fi.color;
      if (state.filterText && !entry.name.toLowerCase().includes(state.filterText)) continue;
      row.addEventListener('click',      () => { setActiveRow(row); previewFile(entry); });
      row.addEventListener('mouseenter', e  => showTooltip(e, entry));
      row.addEventListener('mouseleave', () => hideTooltip());
      node.appendChild(row);
    }

    if (gen !== state.treeGeneration) return;
    container.appendChild(node);
  }
}

// Recursively check whether a folder subtree contains any file matching filter text.
async function folderHasMatch(dirHandle) {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') { if (entry.name.toLowerCase().includes(state.filterText)) return true; }
    else { if (await folderHasMatch(entry)) return true; }
  }
  return false;
}

// Mark one row as active and clear previous active row.
function setActiveRow(row) {
  if (state.activeRow) state.activeRow.classList.remove('active');
  state.activeRow = row;
  row.classList.add('active');
}
