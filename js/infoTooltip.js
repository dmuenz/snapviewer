// Show/hide/position an info tooltip

import { $ } from './dom.js';

// Add mouse event listeners to show/hide/position a tooltip
export function addListenersForTooltipTarget(targetID, tooltipID) {
  const target = $(targetID);
  const tooltip = $(tooltipID);
  if (target) {
    target.addEventListener('mouseenter', e => { showSplashInfoTooltip(e, tooltip); } );
    target.addEventListener('mouseleave', () => { hideSplashInfoTooltip(tooltip); });
    target.addEventListener('mousemove',  e => { positionSplashInfoTooltip(e, tooltip); });
  }
}

let hideTimer = null;

function showSplashInfoTooltip(e, domEl) {
  if (!domEl) return;
  clearTimeout(hideTimer);
  positionSplashInfoTooltip(e, domEl);
  domEl.classList.add('visible');
}

function hideSplashInfoTooltip(domEl) {
  if (!domEl) return;
  hideTimer = setTimeout(() => {
    domEl.classList.remove('visible');
  }, 60);
}

function positionSplashInfoTooltip(e, domEl) {
  if (!domEl) return;

  const pad = 14;
  const tw = domEl.offsetWidth || 360;
  const th = domEl.offsetHeight || 160;

  let x = e.clientX + pad;
  let y = e.clientY + pad;

  if (x + tw > window.innerWidth - 8) x = e.clientX - tw - pad;
  if (y + th > window.innerHeight - 8) y = e.clientY - th - pad;

  domEl.style.left = `${x}px`;
  domEl.style.top = `${y}px`;
}
