// Show/hide/position the splash-screen help tooltip for "snapshot folder".

import { dom } from './dom.js';

let hideTimer = null;

export function showSnapsHelpTooltip(e) {
  if (!dom.snapsHelpTooltip) return;
  clearTimeout(hideTimer);
  positionSnapsHelpTooltip(e);
  dom.snapsHelpTooltip.classList.add('visible');
}

export function hideSnapsHelpTooltip() {
  if (!dom.snapsHelpTooltip) return;
  hideTimer = setTimeout(() => {
    dom.snapsHelpTooltip.classList.remove('visible');
  }, 60);
}

export function positionSnapsHelpTooltip(e) {
  if (!dom.snapsHelpTooltip) return;

  const tip = dom.snapsHelpTooltip;
  const pad = 14;
  const tw = tip.offsetWidth || 360;
  const th = tip.offsetHeight || 160;

  let x = e.clientX + pad;
  let y = e.clientY + pad;

  if (x + tw > window.innerWidth - 8) x = e.clientX - tw - pad;
  if (y + th > window.innerHeight - 8) y = e.clientY - th - pad;

  tip.style.left = `${x}px`;
  tip.style.top = `${y}px`;
}
