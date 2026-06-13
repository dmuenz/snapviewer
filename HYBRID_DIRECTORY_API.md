<!-- HYBRID_DIRECTORY_API.md: Documentation for Directory API + webkitdirectory support -->

# Hybrid Directory API Support

This document describes the hybrid approach to supporting both the native **Directory API** (`showDirectoryPicker`) and the fallback **`webkitdirectory`** input method.

## Overview

SnapViewer now works in **all modern browsers**:

| Browser | API | Persistence | UX |
|---------|-----|-------------|-----|
| **Chrome/Edge** | Directory API | ✅ Persistent (saved in IndexedDB) | Full history dropdown, folder nicknames |
| **Firefox/Safari** | `webkitdirectory` | ❌ Session-only | Works this session; re-select on reload |

## Architecture

### New File: `js/fileapi.js`

A unified abstraction layer that:
- Detects browser capability (`HAS_DIRECTORY_PICKER`)
- Exposes `pickDirectory()` function with consistent interface
- Returns `{ root, isTemporary, errorMsg }`:
  - `root`: Handle-like object supporting async iteration
  - `isTemporary`: `true` if using webkitdirectory (no persistence)
  - `errorMsg`: Error message if picker failed

### Core Changes

#### `js/core.js`
- Replaces direct `window.showDirectoryPicker()` calls with `pickDirectory()`
- Handles **temporary sessions** by creating in-memory records (not saved to IndexedDB)
- Skips `requestPermission()` for temporary records (webkitdirectory doesn't support it)
- Adds visual indicator (dimmed + tooltip) for session-only folders

#### `js/state.js`
- Added `isTemporarySession` flag to track session type

#### `js/dropdown.js`
- Shows "Session-only (not saved)" for temporary records
- Disables rename/delete actions for temporary folders (they don't persist anyway)
- Badge shows "open (session)" for active temporary folders

## User Experience

### Chrome/Edge (Full Experience)
```
✓ Open folder via Directory Picker
✓ Folder saved to history
✓ Persistent folder nickname
✓ Switch between recent folders
✓ Folder available next page load
```

### Firefox/Safari (Fallback Experience)
```
✓ Open folder via file input picker
✓ Browse and preview files normally
✓ Folder shown in dropdown as "Session-only"
✓ Cannot rename (session-only)
✓ Cannot delete from history (no history)
⚠ Folder lost on page reload
```

## Implementation Details

### webkitdirectory Workaround

Since `webkitdirectory` input returns a flat `FileList`, the abstraction reconstructs a directory-tree-like object:

1. **Build a map** from `FileList` entries (via `webkitRelativePath`)
2. **Create handle-like objects** that support:
   - `async for...of handle.values()` iteration (required by `tree.js`)
   - `getDirectoryHandle(name)` lookups (for resolving `_snaps` folder)
   - `getFile()` method on file entries (for previewing)

This allows `tree.js` and `preview.js` to work unchanged with both APIs.

### Persistence Handling

**Directory API (Chrome/Edge):**
- Handle stored in IndexedDB via existing `db.js` flow
- Can be reused next session via `requestPermission()`

**webkitdirectory (Firefox/Safari):**
- No persistent reference possible (browser security model)
- Record created with `isTemporary: true` flag
- Not saved to IndexedDB
- Lost when user navigates away or reloads

## Code Flow

### Opening a Folder

```
user clicks "Open a different _snaps folder"
    ↓
openSnaps() called
    ↓
pickDirectory() → detects browser capability
    ↓
    ├─ Chrome/Edge → showDirectoryPicker() → Directory API handle
    └─ Firefox/Safari → webkitdirectory input → reconstructed handle
    ↓
isTemporary flag returned
    ↓
    ├─ true → create in-memory record, load immediately (no DB save)
    └─ false → use existing upsertHandle() flow (save to IndexedDB)
```

### Switching Folders (Chrome/Edge Only)

```
user clicks folder in dropdown
    ↓
activateRecord(rec)
    ↓
requestPermission() on stored handle
    ↓
update lastOpened timestamp
    ↓
loadRoot()
```

For temporary folders: `requestPermission()` is skipped (line 66 in core.js).

## Browser Support Matrix

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| Directory API | ✅ | ✅ | ❌ | ❌ |
| webkitdirectory | ✅ | ✅ | ✅ | ✅ |
| Persistent handles | ✅ | ✅ | ❌ | ❌ |
| Folder history | ✅ | ✅ | ❌ | ❌ |
| Folder nicknames | ✅ | ✅ | ❌ | ❌ |

## Testing Checklist

### Chrome/Edge
- [ ] Open folder via Directory Picker
- [ ] Folder appears in history with timestamp
- [ ] Can rename folder nickname
- [ ] Can delete from history
- [ ] Folder persists on page reload
- [ ] Folder can be re-accessed from history

### Firefox/Safari
- [ ] Open folder via file input picker
- [ ] Can browse and preview files
- [ ] Folder appears in dropdown as "Session-only (not saved)"
- [ ] Cannot rename (button missing)
- [ ] Cannot delete (button missing)
- [ ] Folder is lost on page reload

### Error Cases
- [ ] Cancelling picker (Chrome/Edge)
- [ ] Cancelling picker (Firefox/Safari)
- [ ] Selected folder without `_snaps` subdirectory
- [ ] Permission denied (Chrome/Edge)

## Future Improvements

1. **Session Storage**: Use `sessionStorage` to preserve Firefox/Safari folder state during same-session navigation
2. **Periodic Re-prompt**: Show gentle reminder on Firefox/Safari to re-open folder after reload
3. **Better UX**: Add browser detection banner for Firefox/Safari suggesting Chrome/Edge for persistent storage
4. **API Polyfill**: Experimental polyfill attempt for older browsers

## References

- [File System Access API (Directory API)](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [webkitdirectory](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#webkitdirectory)
- [Browser Compatibility](https://caniuse.com/filesystem)
