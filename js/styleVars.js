// Utilities to update CSS variables on :root via CSSOM.

export function setRootVar(name, value) {
  const rr = findRootRule();
  if (!rr) return; // If :root rule not found, silently no-op
  rr.style.setProperty(name, value);
}

export function getRootVar(name) {
  const rr = findRootRule();
  if (!rr) return '';
  return rr.style.getPropertyValue(name) || '';
}

// Update tooltip position variables.
export function setTooltipVars(x, y) {
  setRootVar('--tt-x', `${x}px`);
  setRootVar('--tt-y', `${y}px`);
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
