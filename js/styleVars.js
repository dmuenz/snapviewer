// CSS variables helper for moving tooltips without inline styles.
// Assumes same-origin stylesheet defines:
// :root { --tt-x: 0px; --tt-y: 0px; }
// .info-tooltip { transform: translate(var(--tt-x), var(--tt-y)); }

// Update tooltip position variables on :root using the CSSOM.
export function setTooltipVars(x, y) {
  const rr = findRootRule();
  if (!rr) return; // If :root rule not found, silently no-op
  rr.style.setProperty('--tt-x', `${x}px`);
  rr.style.setProperty('--tt-y', `${y}px`);
}

let rootRule = null;

function findRootRule() {
  if (rootRule) return rootRule;

  // Only inspect same-origin stylesheets; cross-origin sheets may throw on cssRules.
  const sheets = Array.from(document.styleSheets).filter(s => {
    try { return !s.href || new URL(s.href, location.href).origin === location.origin; }
    catch { return false; }
  });

  for (const sheet of sheets) {
    let rules;
    try { rules = sheet.cssRules; }
    catch { continue; } // inaccessible (e.g., CORS); skip

    for (const rule of Array.from(rules || [])) {
      if (rule.selectorText === ':root') {
        rootRule = rule;
        return rootRule;
      }
    }
  }
  return null;
}
