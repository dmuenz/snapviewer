// // Purpose: Welcome/return/ready splash rendering.

import { dom, $ } from './dom.js';
import { escHtml, displayName } from './helpers.js';

// First-run splash prompting user to open a `_snaps` folder.
export function showSplash(onOpenSnaps, renderDropdown) {
  dom.contentBody.innerHTML = `
    <div class="welcome">
      <div class="big-icon">📁</div>
      <h2>Welcome to SnapViewer</h2>
      <p>Click below to open a <strong>_snaps</strong> folder.
         Your folders will be remembered for next time.</p>
      <button id="open-btn">Open _snaps folder</button>
    </div>`;
  $('open-btn').addEventListener('click', onOpenSnaps);
  renderDropdown([], null);
}

// Return splash that reopens most recent folder or lets user pick another.
export function showReturnSplash(mostRecent, allRecords, onActivateMostRecent, onOpenSnaps, renderDropdown) {
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
  dom.contentBody.innerHTML = `
    <div class="welcome">
      <div class="big-icon">📁</div>
      <h2>Folder loaded</h2>
      <p>Select any file from the tree on the left to preview it here.</p>
    </div>`;
}
