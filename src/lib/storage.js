// Tiny IndexedDB wrapper for freeLN persistence — zero dependencies.
//
// DB "sciarch" with two object stores:
//   - "notebook": a single current notebook under the key 'current'
//     (the JSON-serializable workspace, WITHOUT image blobs / object URLs)
//   - "images":   one record per image, key = image id (the relative ref,
//     e.g. "images/img-ab12cd34-gel.png"), value = the raw Blob
//
// Every exported function is async and SAFE: if IndexedDB is unavailable
// (private browsing, sandboxed iframe, storage denied) or any request
// throws, it resolves to null / {} / no-op — it NEVER rejects and NEVER
// throws synchronously. Callers can fire-and-forget without try/catch.

const DB_NAME = "sciarch";
const DB_VERSION = 1;
const NOTEBOOK_STORE = "notebook";
const IMAGES_STORE = "images";
const NOTEBOOK_KEY = "current";

// Open (and lazily create) the database. Resolves to the connection, or
// null when IndexedDB is missing/broken.
function openDb() {
  return new Promise((resolve) => {
    try {
      if (typeof indexedDB === "undefined" || !indexedDB) {
        resolve(null);
        return;
      }
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(NOTEBOOK_STORE)) {
          db.createObjectStore(NOTEBOOK_STORE);
        }
        if (!db.objectStoreNames.contains(IMAGES_STORE)) {
          db.createObjectStore(IMAGES_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// Run a single request inside a transaction on `storeName`; resolve to the
// request's result (or null on any failure). Always closes the connection.
function withStore(storeName, mode, fn) {
  return openDb().then(
    (db) =>
      new Promise((resolve) => {
        if (!db) {
          resolve(null);
          return;
        }
        const finish = (value) => {
          try {
            db.close();
          } catch {
            /* ignore */
          }
          resolve(value);
        };
        try {
          const tx = db.transaction(storeName, mode);
          const req = fn(tx.objectStore(storeName));
          tx.oncomplete = () => finish(req ? req.result ?? null : null);
          tx.onerror = () => finish(null);
          tx.onabort = () => finish(null);
        } catch {
          finish(null);
        }
      })
  );
}

// Persist the current notebook under 'current'. The `images` map (transient
// blob object URLs) is dropped — blobs themselves live in the "images" store.
export async function idbSaveNotebook(workspace) {
  if (!workspace) return null;
  const record = { ...workspace };
  delete record.images;
  return withStore(NOTEBOOK_STORE, "readwrite", (store) => store.put(record, NOTEBOOK_KEY));
}

// -> the saved workspace object, or null when absent/unavailable.
export async function idbLoadNotebook() {
  const saved = await withStore(NOTEBOOK_STORE, "readonly", (store) => store.get(NOTEBOOK_KEY));
  return saved && typeof saved === "object" ? saved : null;
}

export async function idbClearNotebook() {
  return withStore(NOTEBOOK_STORE, "readwrite", (store) => store.delete(NOTEBOOK_KEY));
}

// Store one image Blob under its id (the relative ref used in markdown).
export async function idbPutImage(id, blob) {
  if (!id || !blob) return null;
  return withStore(IMAGES_STORE, "readwrite", (store) => store.put(blob, id));
}

// -> Blob | null
export async function idbGetImage(id) {
  if (!id) return null;
  const value = await withStore(IMAGES_STORE, "readonly", (store) => store.get(id));
  return typeof Blob !== "undefined" && value instanceof Blob ? value : null;
}

// -> { [id]: blobURL } — a fresh object URL per stored image, ready to drop
// into workspace.images. Resolves to {} when unavailable or empty.
export async function idbGetAllImages() {
  const db = await openDb();
  if (!db) return {};
  return new Promise((resolve) => {
    const out = {};
    const finish = () => {
      try {
        db.close();
      } catch {
        /* ignore */
      }
      resolve(out);
    };
    try {
      const tx = db.transaction(IMAGES_STORE, "readonly");
      const cursorReq = tx.objectStore(IMAGES_STORE).openCursor();
      cursorReq.onsuccess = () => {
        const cursor = cursorReq.result;
        if (!cursor) return;
        try {
          if (typeof Blob !== "undefined" && cursor.value instanceof Blob) {
            out[String(cursor.key)] = URL.createObjectURL(cursor.value);
          }
        } catch {
          /* skip this record */
        }
        cursor.continue();
      };
      tx.oncomplete = finish;
      tx.onerror = finish;
      tx.onabort = finish;
    } catch {
      finish();
    }
  });
}
