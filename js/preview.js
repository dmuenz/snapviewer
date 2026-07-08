// File preview rendering (markdown/image), toolbar date badge, and media URL lifecycle.

import { state, EXT_MD, EXT_IMG } from './state.js';
import { dom, $ } from './dom.js';
import { extOf, escHtml, formatDate } from './helpers.js';
import { bindMdRenderers, updateMdButtons, applyMdMode } from './mdMode.js';
import { bindSvgRenderers, updateSvgButtons, applySvgMode } from './svgMode.js';
import { updateZoomButtons } from './zoom.js';

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
  bindSvgRenderers(null, null);

  // Reset date badge until file metadata is loaded.
  dom.dateBadge.classList.remove('visible');
  dom.dateBadge.textContent = '';

  // Revoke previous object URL if present.
  if (state.currentMedia?.objectUrl) {
    URL.revokeObjectURL(state.currentMedia.objectUrl);
    state.currentMedia = null;
  }

  dom.contentBody.innerHTML = '<div class="loading-placeholder">Loading…</div>';

  const ext = extOf(fileRef?.name || '');

  try {
    const file = await resolveFile(fileRef);

    // Show modification date in header badge.
    dom.dateBadge.textContent = 'Modified ' + formatDate(file.lastModified);
    dom.dateBadge.classList.add('visible');

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

    // SVG preview.
    } else if (ext === 'svg') {
      const text = await file.text();

      const renderVisual = () => {
        // Revoke prior URL from previous visual render of this same file mode switch.
        if (state.currentMedia?.objectUrl) {
          URL.revokeObjectURL(state.currentMedia.objectUrl);
          state.currentMedia = null;
        }

        const url = URL.createObjectURL(file);
        state.currentMedia = { objectUrl: url };

        dom.imgToolbar.classList.add('visible');
        dom.svgModeBtns.classList.add('visible');
        dom.imgZoomBtns.classList.add('visible');
        updateZoomButtons();

        dom.contentBody.innerHTML = '<div id="img-output"><div class="img-stage" id="img-stage"></div></div>';

        const img = document.createElement('img');
        img.src = url;
        img.alt = fileRef.name || 'SVG preview';
        img.className = state.currentZoom;
        $('img-stage').appendChild(img);
      };

      const renderRaw = () => {
        dom.imgToolbar.classList.add('visible');
        dom.svgModeBtns.classList.add('visible');
        dom.imgZoomBtns.classList.remove('visible'); // In raw mode, hide zoom toolbar.

        // Revoke visual URL when leaving visual mode.
        if (state.currentMedia?.objectUrl) {
          URL.revokeObjectURL(state.currentMedia.objectUrl);
          state.currentMedia = null;
        }

        const pre = document.createElement('pre');
        pre.id = 'text-output';

        const code = document.createElement('code');
        code.className = 'language-markup';
        code.textContent = text;

        pre.appendChild(code);
        dom.contentBody.innerHTML = '';
        dom.contentBody.appendChild(pre);

        // Optional syntax highlighting if Prism is available.
        if (window.Prism && typeof window.Prism.highlightElement === 'function') {
          window.Prism.highlightElement(code);
        }
      };

      bindSvgRenderers(renderVisual, renderRaw);
      updateSvgButtons();
      applySvgMode();

    // Other image preview.
    } else if (EXT_IMG.has(ext)) {
      const url = URL.createObjectURL(file);
      state.currentMedia = { objectUrl: url };

      dom.imgToolbar.classList.add('visible');
      dom.svgModeBtns.classList.remove('visible');
      dom.imgZoomBtns.classList.add('visible');
      updateZoomButtons();

      dom.contentBody.innerHTML = '<div id="img-output"><div class="img-stage" id="img-stage"></div></div>';

      const img = document.createElement('img');
      img.src = url;
      img.alt = fileRef.name;
      img.className = state.currentZoom;
      $('img-stage').appendChild(img);

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
