// IndexedDB persistence for folder handles/history and simple metadata.

const DB_NAME    = 'snap-viewer-testthat';
const DB_HANDLES = 'handles';
const DB_META    = 'meta';

// Open (and lazily initialize/upgrade) IndexedDB stores.
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = e => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_HANDLES))
        db.createObjectStore(DB_HANDLES, { keyPath: 'id', autoIncrement: true });
      if (!db.objectStoreNames.contains(DB_META))
        db.createObjectStore(DB_META);
    };
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

// Read all saved folder-handle records, newest first.
export async function dbGetAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_HANDLES, 'readonly')
      .objectStore(DB_HANDLES).getAll();
    req.onsuccess = e => {
      const rows = (e.target.result || []);
      rows.sort((a, b) => b.lastOpened - a.lastOpened);
      resolve(rows);
    };
    req.onerror = e => reject(e.target.error);
  });
}

// Insert or update one folder-handle record.
export async function dbPut(rec) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_HANDLES, 'readwrite')
      .objectStore(DB_HANDLES).put(rec);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  });
}

// Delete a folder-handle record by id.
export async function dbDelete(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_HANDLES, 'readwrite')
      .objectStore(DB_HANDLES).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

// Read one metadata value from DB_META.
export async function dbGetMeta(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_META, 'readonly')
      .objectStore(DB_META).get(key);
    req.onsuccess = e => resolve(e.target.result ?? null);
    req.onerror   = e => reject(e.target.error);
  });
}

// Write one metadata value into DB_META.
export async function dbSetMeta(key, val) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(DB_META, 'readwrite')
      .objectStore(DB_META).put(val, key);
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  });
}

// Upsert a filesystem handle by matching existing entries; returns id + new/existing flag.
export async function upsertHandle(handle, label) {
  const records = await dbGetAll();
  for (const rec of records) {
    let same = false;
    try { same = await rec.handle.isSameEntry(handle); } catch {}
    if (same) {
      rec.lastOpened = Date.now();
      if (label !== undefined) rec.label = label;
      await dbPut(rec);
      return { id: rec.id, isNew: false };
    }
  }
  const id = await dbPut({ handle, label: label ?? '', lastOpened: Date.now() });
  return { id, isNew: true };
}
