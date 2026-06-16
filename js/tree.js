// Build/rebuild file tree UI for both fs-handle and fallback, handle expand/collapse/filter/sort,
// and file selection.

import { state, EXT_IMG, EXT_MD } from './state.js';
import { dom } from './dom.js';
import { fileIcon } from './helpers.js';
import { previewFile } from './preview.js';
import { showTooltip, hideTooltip } from './tooltip.js';

// Rebuild tree from current source and current app state.
export async function rebuildTree() {
  const gen = ++state.treeGeneration;
  dom.treeRoot.innerHTML = '';

  if (state.sourceMode === 'fs-handle') {
    if (!state.rootHandle) return;
    await buildTreeFromHandle(state.rootHandle, dom.treeRoot, 0, gen, '', state.openPaths);
  } else {
    const root = state.fallback.rootNode;
    if (!root) return;
    await buildTreeFromVirtual(root, dom.treeRoot, 0, gen, '', state.openPaths);
  }
}

// Collapse all expanded folders and rebuild tree.
export async function collapseAllFolders() {
  state.openPaths = new Set();
  await rebuildTree();
}

// Build tree from File System Access directory handles.
async function buildTreeFromHandle(dirHandle, container, depth, gen, pathPrefix, openPaths) {
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
    const node = document.createElement('div');
    node.className = 'tree-node';

    const row = document.createElement('div');
    row.className = 'tree-row';
    row.style.paddingLeft = (depth * 16 + 10) + 'px';

    const entryPath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;
    row.dataset.path = entryPath;

    const arrow = document.createElement('span');
    arrow.className = 'row-arrow';
    arrow.innerHTML = '▶';

    const icon = document.createElement('span');
    icon.className = 'row-icon';

    const nameEl = document.createElement('span');
    nameEl.className = 'row-name';
    nameEl.textContent = entry.name;

    row.appendChild(arrow);
    row.appendChild(icon);
    row.appendChild(nameEl);

    if (entry.kind === 'directory') {
      icon.innerHTML = '📁';
      icon.style.color = 'var(--folder)';

      if (state.filterText) {
        if (!(await folderHasMatchHandle(entry))) continue;
        if (!entry.name.toLowerCase().includes(state.filterText)) row.classList.add('dim-folder');
      }

      const children = document.createElement('div');
      const shouldBeOpen = openPaths && openPaths.has(entryPath);
      children.className = 'tree-children' + (shouldBeOpen ? '' : ' collapsed');
      children.style.maxHeight = shouldBeOpen ? 'none' : '0px';
      let loaded = false;

      if (shouldBeOpen) {
        arrow.classList.add('open');
        await buildTreeFromHandle(entry, children, depth + 1, gen, entryPath, openPaths);
        loaded = true;
        if (gen !== state.treeGeneration) return;
      }

      row.addEventListener('click', async () => {
        const isOpen = arrow.classList.contains('open');
        if (!loaded) {
          await buildTreeFromHandle(entry, children, depth + 1, gen, entryPath, openPaths);
          loaded = true;
        }
        toggleChildren(arrow, children, isOpen, entryPath);
      });

      node.appendChild(row);
      node.appendChild(children);
    } else {
      arrow.classList.add('leaf');
      const fi = fileIcon(entry.name, EXT_MD, EXT_IMG);
      icon.innerHTML = fi.icon;
      icon.style.color = fi.color;

      if (state.filterText && !entry.name.toLowerCase().includes(state.filterText)) continue;

      const fileRef = { kind: 'fs-file-handle', name: entry.name, handle: entry };
      row.addEventListener('click', () => { setActiveRow(row); previewFile(fileRef); });
      row.addEventListener('mouseenter', e => showTooltip(e, fileRef));
      row.addEventListener('mouseleave', () => hideTooltip());

      node.appendChild(row);
    }

    if (gen !== state.treeGeneration) return;
    container.appendChild(node);
  }
}

// Build tree from virtual fallback nodes.
async function buildTreeFromVirtual(vDir, container, depth, gen, pathPrefix, openPaths) {
  let children = vDir.children || [];

  if (state.sortMode === 'alpha') {
    children = [...children].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });
  } else {
    children = [...children].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1;
      const ta = a.kind === 'file' ? (a.file?.lastModified || 0) : 0;
      const tb = b.kind === 'file' ? (b.file?.lastModified || 0) : 0;
      return tb - ta;
    });
  }

  for (const entry of children) {
    const node = document.createElement('div');
    node.className = 'tree-node';

    const row = document.createElement('div');
    row.className = 'tree-row';
    row.style.paddingLeft = (depth * 16 + 10) + 'px';

    const entryPath = pathPrefix ? `${pathPrefix}/${entry.name}` : entry.name;
    row.dataset.path = entryPath;

    const arrow = document.createElement('span');
    arrow.className = 'row-arrow';
    arrow.innerHTML = '▶';

    const icon = document.createElement('span');
    icon.className = 'row-icon';

    const nameEl = document.createElement('span');
    nameEl.className = 'row-name';
    nameEl.textContent = entry.name;

    row.appendChild(arrow);
    row.appendChild(icon);
    row.appendChild(nameEl);

    if (entry.kind === 'directory') {
      icon.innerHTML = '📁';
      icon.style.color = 'var(--folder)';

      if (state.filterText) {
        if (!folderHasMatchVirtual(entry)) continue;
        if (!entry.name.toLowerCase().includes(state.filterText)) row.classList.add('dim-folder');
      }

      const childrenEl = document.createElement('div');
      const shouldBeOpen = openPaths && openPaths.has(entryPath);
      childrenEl.className = 'tree-children' + (shouldBeOpen ? '' : ' collapsed');
      childrenEl.style.maxHeight = shouldBeOpen ? 'none' : '0px';
      let loaded = false;

      if (shouldBeOpen) {
        arrow.classList.add('open');
        await buildTreeFromVirtual(entry, childrenEl, depth + 1, gen, entryPath, openPaths);
        loaded = true;
        if (gen !== state.treeGeneration) return;
      }

      row.addEventListener('click', async () => {
        const isOpen = arrow.classList.contains('open');
        if (!loaded) {
          await buildTreeFromVirtual(entry, childrenEl, depth + 1, gen, entryPath, openPaths);
          loaded = true;
        }
        toggleChildren(arrow, childrenEl, isOpen, entryPath);
      });

      node.appendChild(row);
      node.appendChild(childrenEl);
    } else {
      arrow.classList.add('leaf');
      const fi = fileIcon(entry.name, EXT_MD, EXT_IMG);
      icon.innerHTML = fi.icon;
      icon.style.color = fi.color;

      if (state.filterText && !entry.name.toLowerCase().includes(state.filterText)) continue;

      const fileRef = {
        kind: 'fallback-file',
        name: entry.name,
        path: entry.path,
        file: entry.file
      };

      row.addEventListener('click', () => { setActiveRow(row); previewFile(fileRef); });
      row.addEventListener('mouseenter', e => showTooltip(e, fileRef));
      row.addEventListener('mouseleave', () => hideTooltip());

      node.appendChild(row);
    }

    if (gen !== state.treeGeneration) return;
    container.appendChild(node);
  }
}

// Toggle folder open/close with animation and persisted state.
function toggleChildren(arrow, children, isOpen, entryPath) {
  if (isOpen) {
    state.openPaths.delete(entryPath);
    arrow.classList.remove('open');
    children.style.maxHeight = children.scrollHeight + 'px';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      children.classList.add('collapsed');
      children.style.maxHeight = '0px';
    }));
  } else {
    state.openPaths.add(entryPath);
    children.classList.remove('collapsed');
    children.style.maxHeight = children.scrollHeight + 'px';
    arrow.classList.add('open');
    children.addEventListener('transitionend', () => {
      if (arrow.classList.contains('open')) children.style.maxHeight = 'none';
    }, { once: true });
  }
}

// FS-handle mode filter matcher.
async function folderHasMatchHandle(dirHandle) {
  for await (const entry of dirHandle.values()) {
    if (entry.kind === 'file') {
      if (entry.name.toLowerCase().includes(state.filterText)) return true;
    } else {
      if (await folderHasMatchHandle(entry)) return true;
    }
  }
  return false;
}

// Virtual-tree mode filter matcher.
function folderHasMatchVirtual(vDir) {
  for (const entry of (vDir.children || [])) {
    if (entry.kind === 'file') {
      if (entry.name.toLowerCase().includes(state.filterText)) return true;
    } else {
      if (folderHasMatchVirtual(entry)) return true;
    }
  }
  return false;
}

// Mark one row as active and clear previous active row.
function setActiveRow(row) {
  if (state.activeRow) state.activeRow.classList.remove('active');
  state.activeRow = row;
  row.classList.add('active');
}
