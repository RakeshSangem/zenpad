import {
  getAllNotes,
  getMetadata,
  putMetadata,
  putNote,
} from "./indexedDb";

const LEGACY_STORAGE_KEY = "zenpad-storage";
const LEGACY_BACKUP_KEY = "zenpad-storage-backup-v1";
const LEGACY_MIGRATION_MARKER = "legacyLocalStorageMigration";

// Import notes created before IndexedDB was introduced. The backup and marker
// make this safe to retry if a write fails halfway through the migration.
export async function migrateLegacyLocalStorage() {
  const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    const legacy = parsed?.state ?? parsed;
    if (!Array.isArray(legacy?.notes)) return;

    // Keep a recoverable copy until the migration has fully completed.
    localStorage.setItem(LEGACY_BACKUP_KEY, raw);

    const existing = await getAllNotes();
    const existingById = new Map(existing.map((note) => [note.id, note]));
    const notesToImport = legacy.notes
      .map((note) => ({
        ...note,
        document: note.document ?? null,
        formatVersion: note.formatVersion ?? 1,
        isDeleted: note.isDeleted ?? false,
      }))
      .filter((note) => {
        const current = existingById.get(note.id);
        if (!current) return true;
        const legacyUpdatedAt = new Date(note.updatedAt).getTime();
        const currentUpdatedAt = new Date(current.updatedAt).getTime();
        return (
          !Number.isFinite(currentUpdatedAt) ||
          (Number.isFinite(legacyUpdatedAt) &&
            legacyUpdatedAt > currentUpdatedAt)
        );
      });

    await Promise.all(notesToImport.map((note) => putNote(note)));

    const currentNoteId = await getMetadata("currentNoteId", null);
    if (!currentNoteId && legacy.currentNoteId) {
      await putMetadata("currentNoteId", legacy.currentNoteId);
    }

    await putMetadata(LEGACY_MIGRATION_MARKER, {
      version: 1,
      migratedAt: new Date().toISOString(),
      importedNotes: notesToImport.length,
    });
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.error("[storage] localStorage migration failed", error);
  }
}
