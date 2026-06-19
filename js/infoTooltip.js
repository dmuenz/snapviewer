// Show/hide/position an info tooltip

import { $ } from './dom.js';

// Add mouse event listeners to show/hide/position a tooltip
export function addListenersForTooltipTarget(targetID, tooltipID) {
  const target = $(targetID);
  const tooltip = $(tooltipID);
  if (target) {
    target.addEventListener('mouseenter', e  => { showInfoTooltip(e, tooltip); } );
    target.addEventListener('mouseleave', () => { hideInfoTooltip(tooltip); });
    target.addEventListener('mousemove',  e  => { positionInfoTooltip(e, tooltip); });
  }
}

let hideTimer = null;

function showInfoTooltip(e, tooltip) {
  if (!tooltip) return;
  clearTimeout(hideTimer);
  positionInfoTooltip(e, tooltip);
  tooltip.classList.add('visible');
}

// Hide tooltip with a short delay to prevent flicker.
function hideInfoTooltip(tooltip) {
  if (!tooltip) return;
  hideTimer = setTimeout(() => {
    tooltip.classList.remove('visible');
  }, 60);
}

// Position tooltip with viewport-edge avoidance.
function positionInfoTooltip(e, tooltip) {
  if (!tooltip) return;

  const pad = 14;
  const tw = tooltip.offsetWidth  || 360;
  const th = tooltip.offsetHeight || 160;

  let x = e.clientX + pad;
  let y = e.clientY + pad;

  if (x + tw > window.innerWidth  - 8) x = e.clientX - tw - pad;
  if (y + th > window.innerHeight - 8) y = e.clientY - th - pad;

  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
}
