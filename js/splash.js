// Welcome/return/ready splash rendering and related CTA wiring.

import { dom, $ } from './dom.js';
import { escHtml, displayName } from './helpers.js';
import { showSnapsHelpTooltip, hideSnapsHelpTooltip, positionSnapsHelpTooltip } from './snapsHelpTooltip.js';

// First-run splash prompting user to open a `_snaps` folder.
// If fallback mode is active, show compatibility note and shorter intro copy.
export function showSplash(onOpenSnaps, renderDropdown, options = {}) {
  resetContentHeader('Open a snapshot folder to get started');

  const { fallbackMode = false } = options;

  const intro = fallbackMode
    ? `Click below to open a <span id="snaps-help-target" class="snaps-help-target">snapshot folder</span>.`
    : `Click below to open a <span id="snaps-help-target" class="snaps-help-target">snapshot folder</span>.
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
      <button id="open-btn">Open snapshot folder</button>
      ${fallbackNote}
    </div>`;

  const target = $('snaps-help-target');
  if (target) {
    target.addEventListener('mouseenter', showSnapsHelpTooltip);
    target.addEventListener('mouseleave', hideSnapsHelpTooltip);
    target.addEventListener('mousemove',  positionSnapsHelpTooltip);
  }

  $('open-btn').addEventListener('click', onOpenSnaps);
  renderDropdown([], null);
}

// Return splash that reopens most recent folder or lets user pick another.
export function showReturnSplash(mostRecent, allRecords, onActivateMostRecent, onOpenSnaps, renderDropdown) {
  resetContentHeader('Open a snapshot folder to get started');

  const display = displayName(mostRecent);
  dom.contentBody.innerHTML = `
    <div class="welcome">
      <div class="big-icon">📁</div>
      <h2>Welcome back</h2>
      <p>Click below to reopen <strong>${escHtml(display)}</strong> snapshots,
         or use the folder menu in the title bar to switch folders.</p>
      <button id="open-btn">Open ${escHtml(display)} snapshots</button>
      <p style="margin-top:10px">
        <a id="pick-new" href="#">Open a different snapshot folder…</a>
      </p>
    </div>`;
  $('open-btn').addEventListener('click', onActivateMostRecent);
  $('pick-new').addEventListener('click', e => { e.preventDefault(); onOpenSnaps(); });
  renderDropdown(allRecords, null);
}

// Post-load splash shown after folder is loaded.
export function showReadySplash() {
  resetContentHeader('Select a file to preview');

  dom.contentBody.innerHTML = `
    <div class="welcome">
      <div class="big-icon">📁</div>
      <h2>Folder loaded</h2>
      <p>Select any file from the tree on the left to preview it here.</p>
    </div>`;
}

// In content header, set breadcrumb text and hide everything else.
function resetContentHeader(message) {
  if (message === 'Open a snapshot folder to get started') {
    dom.breadcrumb.innerHTML = `Open a <span id="breadcrumb-snaps-help-target" class="snaps-help-target">snapshot folder</span> to get started`;

    const target = $('breadcrumb-snaps-help-target');
    if (target) {
      target.addEventListener('mouseenter', showSnapsHelpTooltip);
      target.addEventListener('mouseleave', hideSnapsHelpTooltip);
      target.addEventListener('mousemove',  positionSnapsHelpTooltip);
    }
  } else {
    dom.breadcrumb.textContent = message;
  }

  dom.dateBadge.style.display = 'none';
  dom.dateBadge.textContent   = '';
  dom.imgToolbar.classList.remove('visible');
}
