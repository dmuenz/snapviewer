// Pure utility helpers for formatting, escaping, naming, and file metadata.

// Format a timestamp as localized date + time.
export function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric'
  }) + ' ' + new Date(ts).toLocaleTimeString(undefined, {
    hour: '2-digit', minute: '2-digit'
  });
}

// Return lowercase file extension (without dot), or empty string.
export function extOf(name) {
  const i = name.lastIndexOf('.');
  return i >= 0 ? name.slice(i + 1).toLowerCase() : '';
}

// Return icon and color class metadata for a filename.
export function fileIcon(name, EXT_MD, EXT_IMG) {
  const e = extOf(name);
  if (EXT_MD.has(e))  return { icon: '📄', colorClass: 'row-icon-md' };
  if (EXT_IMG.has(e)) return { icon: '🖼️', colorClass: 'row-icon-img' };
  return { icon: '📋', colorClass: 'row-icon-other' };
}

// Escape HTML-special characters for safe inline rendering.
export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Format bytes into human-readable units.
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
}

// Compute folder display name (user label if set, else filesystem name).
export function displayName(rec) {
  return (rec.label && rec.label.trim()) ? rec.label.trim() : rec.handle.name;
}

// Validate a nickname: only alphanumeric, spaces, dots, _, and - allowed.
// Returns true if the string is valid (or empty — emptiness is handled separately).
export function isValidNickname(str) {
  return /^[\p{L}\p{N} ._-]*$/u.test(str);
}
