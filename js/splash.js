// Welcome/return/ready splash rendering and related CTA wiring.

import { dom, $ } from './dom.js';
import { escHtml, displayName } from './helpers.js';
import { addListenersForTooltipTarget } from './infoTooltip.js';

// First-run splash prompting user to open a `_snaps` folder.
// If fallback mode is active, show compatibility note and shorter intro copy.
export function showSplash(onOpenSnaps, renderDropdown, options = {}) {
  resetContentHeader('Open a snapshot folder to get started');

  const { fallbackMode = false } = options;

  const intro = fallbackMode
    ? `Click below to open a snapshot folder.`
    : `Click below to open a snapshot folder.
       Your folders will be remembered for next time.`;

  const fallbackNote = fallbackMode
    ? `<div id="fallback-target" class="tooltip-target">
         <i class="bi bi-exclamation-circle"></i> Browser compatibility note
       </div>`    
    : '';

  dom.contentBody.innerHTML = `
    <div class="welcome">
      <div class="big-icon">📁</div>
      <h2>Welcome to SnapViewer</h2>
      <p>${intro}</p>
      <button id="open-btn">Open snapshot folder</button>
      <div id="snaps-help-target" class="tooltip-target">
        <i class="bi bi-info-circle"></i> What is a snapshot folder?
      </div>
      ${fallbackNote}
    </div>`;

  $('open-btn').addEventListener('click', onOpenSnaps);
  addListenersForTooltipTarget('snaps-help-target', 'snaps-help-tooltip');
  addListenersForTooltipTarget('fallback-target',   'fallback-tooltip');
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
      <div id="snaps-help-target" class="tooltip-target">
        <i class="bi bi-info-circle"></i> What is a snapshot folder?
      </div>
   </div>`;
  $('open-btn').addEventListener('click', onActivateMostRecent);
  $('pick-new').addEventListener('click', e => { e.preventDefault(); onOpenSnaps(); });
  addListenersForTooltipTarget('snaps-help-target', 'snaps-help-tooltip');
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
  dom.breadcrumb.textContent  = message;
  dom.dateBadge.style.display = 'none';
  dom.dateBadge.textContent   = '';
  dom.imgToolbar.classList.remove('visible');
  dom.mdToolbar.classList.remove('visible');
}
