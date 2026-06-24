// File preview rendering (markdown/image), toolbar date badge, and media URL lifecycle.

import { state, EXT_MD, EXT_IMG } from './state.js';
import { dom, $ } from './dom.js';
import { extOf, escHtml, formatDate } from './helpers.js';
import { updateZoomButtons } from './zoom.js';
import { bindMdRenderers, updateMdButtons, applyMdMode } from './mdMode.js';

// Resolve a File object from either source mode.
async function resolveFile(fileRef) {
  if (!fileRef) throw new Error('Missing file reference.');

  if (fileRef.kind === 'fs-file-handle') {
    return await fileRef.handle.getFile();
  }

  if (fileRef.kind === 'fallback-file') {
    return fileRef.file;
  }

  // Backward compatibility (direct handle passed)
  if (typeof fileRef.getFile === 'function') {
    return await fileRef.getFile();
  }

  throw new Error('Unsupported file reference.');
}

// Preview selected file in content area with type-specific rendering.
export async function previewFile(fileRef) {
  dom.breadcrumb.textContent = fileRef?.name || 'File';
  dom.imgToolbar.classList.remove('visible');
  dom.mdToolbar.classList.remove('visible');
  bindMdRenderers(null, null);

  // Reset date badge until file metadata is loaded.
  dom.dateBadge.style.display = 'none';
  dom.dateBadge.textContent   = '';

  // Revoke previous object URL if present.
  if (state.currentMedia?.objectUrl) {
    URL.revokeObjectURL(state.currentMedia.objectUrl);
    state.currentMedia = null;
  }

  dom.contentBody.innerHTML = '<div style="color:var(--text-dim);padding:40px 0;text-align:center;font-size:0.85rem">Loading…</div>';

  const ext = extOf(fileRef?.name || '');

  try {
    const file = await resolveFile(fileRef);

    // Show modification date in header badge.
    dom.dateBadge.textContent   = 'Modified ' + formatDate(file.lastModified);
    dom.dateBadge.style.display = 'block';

    // Markdown/text file preview.
    if (EXT_MD.has(ext)) {
      const text = await file.text();

      const renderVisual = () => {
        const out = document.createElement('div');
        out.id = 'markdown-output';
    
        // Render markdown if parser exists, else fallback to plain text.
        if (window.marked && typeof window.marked.parse === 'function') {
          const rendered = window.marked.parse(text);

          // Sanitize rendered HTML if sanitizer exists; otherwise safe fallback to plain text.
          if (window.DOMPurify && typeof window.DOMPurify.sanitize === 'function') {
            out.innerHTML = window.DOMPurify.sanitize(rendered);
          } else {
            out.textContent = text;
          }
        } else {
          out.textContent = text;
        }
    
        dom.contentBody.innerHTML = '';
        dom.contentBody.appendChild(out);
      };
    
      const renderRaw = () => {
        const out = document.createElement('pre');
        out.id = 'text-output';
        out.className = 'markdown-raw';
        out.textContent = text;
    
        dom.contentBody.innerHTML = '';
        dom.contentBody.appendChild(out);
      };
    
      bindMdRenderers(renderVisual, renderRaw);
      dom.mdToolbar.classList.add('visible');
      updateMdButtons();  // reflect persisted state
      applyMdMode();      // render according to state.currentMdMode (default rendered)

    // Image preview (including SVG object rendering).
    } else if (EXT_IMG.has(ext)) {
      const url = URL.createObjectURL(file);
      state.currentMedia = { objectUrl: url };
      dom.contentBody.innerHTML = '<div id="img-output"><div class="img-stage" id="img-stage"></div></div>';
      dom.imgToolbar.classList.add('visible');
      updateZoomButtons();

      let el;
      if (ext === 'svg') {
        el = document.createElement('object');
        el.type = 'image/svg+xml';
        el.data = url;
      } else {
        el = document.createElement('img');
        el.src = url;
        el.alt = fileRef.name;
      }

    el.className = state.currentZoom;
    $('img-stage').appendChild(el);

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
