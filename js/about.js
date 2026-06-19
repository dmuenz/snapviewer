// Wire About button and modal open/close behavior.

import { dom } from './dom.js';
import { addListenersForTooltipTarget } from './infoTooltip.js';

export function initAboutModal() {
  if (!dom.aboutBtn || !dom.aboutOverlay || !dom.aboutClose) return;

  dom.aboutBtn.addEventListener('click', openAbout);
  dom.aboutClose.addEventListener('click', closeAbout);

  // Click outside modal closes.
  dom.aboutOverlay.addEventListener('click', e => {
    if (e.target === dom.aboutOverlay) closeAbout();
  });

  // ESC closes.
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && dom.aboutOverlay.classList.contains('open')) {
      closeAbout();
    }
  });

  addListenersForTooltipTarget('kbd-info-target', 'kbd-info-tooltip')
}

function openAbout() {
  if (!dom.aboutOverlay) return;
  dom.aboutOverlay.classList.add('open');
  dom.aboutOverlay.style.display = 'flex';
}

function closeAbout() {
  if (!dom.aboutOverlay) return;
  dom.aboutOverlay.classList.remove('open');
  dom.aboutOverlay.style.display = 'none';
}
