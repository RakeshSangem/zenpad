const DB_NAME = "zenpad";
const DB_VERSION = 1;

const STORES = {
  notes: "notes",
  settings: "settings",
  metadata: "metadata",
  syncQueue: "syncQueue",
};

let databasePromise;

const openDatabase = () => {
  if (databasePromise) return databasePromise;
  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORES.notes)) {
        database.createObjectStore(STORES.notes, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(STORES.settings)) {
        database.createObjectStore(STORES.settings, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(STORES.metadata)) {
        database.createObjectStore(STORES.metadata, { keyPath: "key" });
      }
      if (!database.objectStoreNames.contains(STORES.syncQueue)) {
        const queue = database.createObjectStore(STORES.syncQueue, {
          keyPath: "operationId",
        });
        queue.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return databasePromise;
};

const run = async (storeName, mode, operation) => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const request = operation(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getAllNotes = () =>
  run(STORES.notes, "readonly", (store) => store.getAll());
export const putNote = (note) =>
  run(STORES.notes, "readwrite", (store) => store.put(note));
export const removeNote = (id) =>
  run(STORES.notes, "readwrite", (store) => store.delete(id));

export const getSetting = async (key, fallback = null) => {
  const row = await run(STORES.settings, "readonly", (store) => store.get(key));
  return row?.value ?? fallback;
};
export const putSetting = (key, value) =>
  run(STORES.settings, "readwrite", (store) => store.put({ key, value }));

export const getMetadata = async (key, fallback = null) => {
  const row = await run(STORES.metadata, "readonly", (store) => store.get(key));
  return row?.value ?? fallback;
};
export const putMetadata = (key, value) =>
  run(STORES.metadata, "readwrite", (store) => store.put({ key, value }));

export const enqueueSyncOperation = (operation) =>
  run(STORES.syncQueue, "readwrite", (store) => store.put(operation));
export const getSyncQueue = () =>
  run(STORES.syncQueue, "readonly", (store) => store.getAll());
export const removeSyncOperation = (operationId) =>
  run(STORES.syncQueue, "readwrite", (store) => store.delete(operationId));

// One-time preservation of notes created before IndexedDB was introduced.
export async function migrateLegacyLocalStorage() {
  const raw = localStorage.getItem("zenpad-storage");
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    const legacy = parsed?.state ?? parsed;
    const existing = await getAllNotes();
    if (existing.length === 0 && Array.isArray(legacy?.notes)) {
      await Promise.all(
        legacy.notes.map((note) =>
          putNote({
            ...note,
            document: note.document ?? null,
            formatVersion: note.formatVersion ?? 1,
          }),
        ),
      );
      if (legacy.currentNoteId)
        await putMetadata("currentNoteId", legacy.currentNoteId);
    }
    localStorage.removeItem("zenpad-storage");
  } catch (error) {
    console.error("[storage] localStorage migration failed", error);
  }
}
