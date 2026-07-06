// Show/hide/position an info tooltip

import { $ } from './dom.js';
import { setTooltipVars } from './styleVars.js';

// Add mouse event listeners to show/hide/position a tooltip
export function addListenersForTooltipTarget(targetID, tooltipID) {
  const target = $(targetID);
  const tooltip = $(tooltipID);
  if (!target || !tooltip) return;

  target.addEventListener('mouseenter', e  => { showInfoTooltip(e, tooltip); } );
  target.addEventListener('mouseleave', () => { hideInfoTooltip(tooltip); });
  target.addEventListener('mousemove',  e  => { positionInfoTooltip(e, tooltip); });
}

// Track hide-timer per tooltip element (instead of one global timer).
const hideTimers = new WeakMap();

// Track currently visible tooltip so only one can be visible at a time.
let activeTooltip = null;

// Cancel any pending delayed-hide timeout for a specific tooltip.
function clearHideTimer(tooltip) {
  const t = hideTimers.get(tooltip);
  if (t) {
    clearTimeout(t);
    hideTimers.delete(tooltip);
  }
}

// Immediately hide a tooltip and clear its timer/active state.
function hideNow(tooltip) {
  if (!tooltip) return;
  clearHideTimer(tooltip);
  tooltip.classList.remove('visible');
  if (activeTooltip === tooltip) activeTooltip = null;
}

// Show a tooltip at cursor position, ensuring no other tooltip remains visible.
function showInfoTooltip(e, tooltip) {
  if (!tooltip) return;

  // Cancel pending hide for this tooltip.
  clearHideTimer(tooltip);

  // Immediately hide previously active tooltip.
  if (activeTooltip && activeTooltip !== tooltip) {
    hideNow(activeTooltip);
  }
  
  positionInfoTooltip(e, tooltip);
  tooltip.classList.add('visible');
  activeTooltip = tooltip;
}

// Hide tooltip with a short delay to prevent flicker.
function hideInfoTooltip(tooltip) {
  if (!tooltip) return;

  clearHideTimer(tooltip);

  const t = setTimeout(() => {
    tooltip.classList.remove('visible');
    hideTimers.delete(tooltip);
    if (activeTooltip === tooltip) activeTooltip = null;
  }, 60);

  hideTimers.set(tooltip, t);
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

  // tooltip.style.left = x + 'px';
  // tooltip.style.top  = y + 'px';
  setTooltipVars(x, y);
}
