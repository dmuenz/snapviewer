// File preview rendering (text/markdown/image), toolbar date badge, and media URL lifecycle.

import { state, EXT_MD, EXT_IMG } from './state.js';
import { dom, $ } from './dom.js';
import { extOf, escHtml, formatDate } from './helpers.js';
import { updateZoomButtons } from './zoom.js';

// Preview selected file in content area with type-specific rendering.
export async function previewFile(fileHandle) {
  dom.breadcrumb.textContent = fileHandle.name;
  dom.imgToolbar.classList.remove('visible');

  // Reset date badge until file metadata is loaded.
  const dateBadge = $('file-date-badge');
  dateBadge.style.display = 'none';
  dateBadge.textContent   = '';

  // Revoke previous object URL if present.
  if (state.currentMedia?.objectUrl) {
    URL.revokeObjectURL(state.currentMedia.objectUrl);
    state.currentMedia = null;
  }

  dom.contentBody.innerHTML = '<div style="color:var(--text-dim);padding:40px 0;text-align:center;font-size:0.85rem">Loading…</div>';
  const ext = extOf(fileHandle.name);

  try {
    const file = await fileHandle.getFile();

    // Show modification date in header badge.
    dateBadge.textContent   = 'Modified ' + formatDate(file.lastModified);
    dateBadge.style.display = 'block';

    // Markdown/text file preview.
    if (EXT_MD.has(ext)) {
      const pre = document.createElement('div');
      pre.id = 'text-output';
      pre.textContent = await file.text();
      dom.contentBody.innerHTML = '';
      dom.contentBody.appendChild(pre);

    // Image preview (including SVG object rendering).
    } else if (EXT_IMG.has(ext)) {
      const url = URL.createObjectURL(file);
      state.currentMedia = { objectUrl: url };
      dom.contentBody.innerHTML = '<div id="img-output"></div>';
      dom.imgToolbar.classList.add('visible');
      updateZoomButtons();

      if (ext === 'svg') {
        const obj = document.createElement('object');
        obj.type = 'image/svg+xml';
        obj.data = url;
        obj.className = state.currentZoom;
        $('img-output').appendChild(obj);
      } else {
        const img = document.createElement('img');
        img.src = url;
        img.alt = fileHandle.name;
        img.className = state.currentZoom;
        $('img-output').appendChild(img);
      }

    // Fallback: display as plain text.
    } else {
      const pre = document.createElement('div');
      pre.id = 'text-output';
      pre.textContent = await file.text();
      dom.contentBody.innerHTML = '';
      dom.contentBody.appendChild(pre);
    }
  } catch (e) {
    dom.contentBody.innerHTML = `<div class="err-msg">Error loading file: ${escHtml(e.message)}</div>`;
  }
}
