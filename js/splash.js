// Welcome/return/ready splash rendering and related CTA wiring.

import { dom, $ } from './dom.js';
import { escHtml, displayName } from './helpers.js';

// First-run splash prompting user to open a `_snaps` folder.
// If fallback mode is active, show compatibility note and shorter intro copy.
export function showSplash(onOpenSnaps, renderDropdown, options = {}) {
  dom.breadcrumb.textContent  = 'Open a snapshot folder to get started';
  dom.dateBadge.style.display = 'none';
  dom.dateBadge.textContent   = '';

  const { fallbackMode = false } = options;

  const intro = fallbackMode
    ? `Click below to open a <strong>_snaps</strong> folder.`
    : `Click below to open a <strong>_snaps</strong> folder.
       Your folders will be remembered for next time.`;

  const fallbackNote = fallbackMode
    ? `<div style="margin-top:24px;font-size:0.78rem;color:var(--text-dim);max-width:500px;line-height:1.55;">
         <p style="text-align:left; max-width:100%;">
           <strong>Browser compatibility note:</strong>
           Several SnapViewer features are not available in your browser.
           Switch to Chrome or Edge to enable these features:         
         </p>
         <ul style="text-align:left;">
           <li>Point to the _snaps folders for multiple packages and easily toggle between them.</li>
           <li>Remember all previously accessed _snaps folders across browsing sessions.</li>
           <li>Add newly created snapshot files to the directory list without reopening the _snaps folder.</li>
         </ul>
       </div>`
    : '';

  dom.contentBody.innerHTML = `
    <div class="welcome">
      <div class="big-icon">📁</div>
      <h2>Welcome to SnapViewer</h2>
      <p>${intro}</p>
      <button id="open-btn">Open _snaps folder</button>
      ${fallbackNote}
    </div>`;

  $('open-btn').addEventListener('click', onOpenSnaps);
  renderDropdown([], null);
}

// Return splash that reopens most recent folder or lets user pick another.
export function showReturnSplash(mostRecent, allRecords, onActivateMostRecent, onOpenSnaps, renderDropdown) {
  dom.breadcrumb.textContent  = 'Open a snapshot folder to get started';
  dom.dateBadge.style.display = 'none';
  dom.dateBadge.textContent   = '';

  const display = displayName(mostRecent);
  dom.contentBody.innerHTML = `
    <div class="welcome">
      <div class="big-icon">📁</div>
      <h2>Welcome back</h2>
      <p>Click below to reopen <strong>${escHtml(display)}</strong>,
         or use the folder menu in the title bar to switch folders.</p>
      <button id="open-btn">Open ${escHtml(display)}</button>
      <p style="margin-top:10px">
        <a id="pick-new" href="#">Open a different _snaps folder…</a>
      </p>
    </div>`;
  $('open-btn').addEventListener('click', onActivateMostRecent);
  $('pick-new').addEventListener('click', e => { e.preventDefault(); onOpenSnaps(); });
  renderDropdown(allRecords, null);
}

// Post-load splash shown after folder is loaded.
export function showReadySplash() {
  dom.breadcrumb.textContent  = 'Select a file to preview';
  dom.dateBadge.style.display = 'none';
  dom.dateBadge.textContent   = '';

  dom.contentBody.innerHTML = `
    <div class="welcome">
      <div class="big-icon">📁</div>
      <h2>Folder loaded</h2>
      <p>Select any file from the tree on the left to preview it here.</p>
    </div>`;
}
