import { create } from "zustand";
import {
  getAllNotes,
  getMetadata,
  putMetadata,
  putNote,
  putSetting,
  removeNote,
} from "../lib/indexedDb";
import { migrateLegacyLocalStorage } from "../lib/legacyMigration";
import {
  signIn,
  signUp,
  signOut,
  getSession,
  resetPassword,
  onAuthStateChange,
} from "../lib/auth";

const safely = (promise) =>
  promise.catch((error) => console.error("[storage]", error));

const sessionToUser = (session) => {
  const user = session?.user;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name || user.email?.split("@")[0] || "Account",
  };
};

const generateId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const random = (Math.random() * 16) | 0;
    const value = c === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
};

const createNewNote = () => {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: "",
    content: "",
    document: null,
    formatVersion: 1,
    createdAt: now,
    updatedAt: now,
  };
};

const initialNote = createNewNote();

/** Nothing has been written into this note yet. */
const isBlank = (note) => !note?.title.trim() && !note?.content.trim();

/**
 * Drop the current draft if it is still untouched.
 *
 * Called when leaving a draft behind. A draft was never written to disk, so
 * this is only a list edit — there is nothing to delete and no tombstone to
 * sync, which is what makes discarding one safe. A note that *became* empty is
 * a different thing entirely and is never touched here.
 */
const withoutUntouchedDraft = (state) => {
  const draft = state.notes.find((note) => note.id === state.draftNoteId);
  if (!draft || !isBlank(draft)) return state.notes;
  return state.notes.filter((note) => note.id !== state.draftNoteId);
};

// Editing fires a store update per keystroke, and a table column-resize drag
// fires one per pointer move. Coalescing those into one write per note keeps
// IndexedDB (and, later, the sync queue) off the hot path. The window is short
// and every exit path flushes, so an edit is never more than a moment from
// being durable.
const WRITE_WINDOW_MS = 400;

const pendingWrites = new Map();
let writeTimer = null;

const flushNoteWrites = () => {
  if (writeTimer) {
    clearTimeout(writeTimer);
    writeTimer = null;
  }
  if (pendingWrites.size === 0) return Promise.resolve();

  const queued = [...pendingWrites.values()];
  pendingWrites.clear();
  return Promise.all(queued.map((note) => safely(putNote(note)))).then(() => {
    if (pendingWrites.size === 0) {
      useAppStore.setState({ saveStatus: "saved" });
    }
  });
};

// The caller marks saveStatus "saving" as part of its own state update; this
// only owns the write itself.
const queueNoteWrite = (note) => {
  if (!note) return;
  pendingWrites.set(note.id, note);
  if (!writeTimer) writeTimer = setTimeout(flushNoteWrites, WRITE_WINDOW_MS);
};

// A draft turns into a real note the moment it holds something, and only then
// does it reach disk. Until that point nothing about it is written, so a blank
// note nobody typed into leaves no trace — not in IndexedDB, not on the server.
const persistEdit = (updated) => {
  if (!updated) return;
  const { draftNoteId } = useAppStore.getState();

  if (updated.id === draftNoteId) {
    if (isBlank(updated)) {
      // Typed and then deleted again: still nothing worth keeping.
      useAppStore.setState({ saveStatus: "saved" });
      return;
    }
    useAppStore.setState({ draftNoteId: null });
  }

  queueNoteWrite(updated);
};

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", flushNoteWrites);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushNoteWrites();
  });
}

export const useAppStore = create((set, get) => ({
  notes: [initialNote],
  pendingDeletes: [],
  currentNoteId: initialNote.id,
  // The one note that has never been written to, tracked here rather than as a
  // field on the note itself: note records go to the server, whose schema is
  // strict, and an unexpected key would reject the whole batch.
  draftNoteId: initialNote.id,
  storageReady: false,
  markdownEnabled: true,
  syncAccountId: null,

  sidebarVisible: false,
  deleteModalOpen: false,
  shortcutsModalOpen: false,
  quickSwitcherOpen: false,
  authModalOpen: false,

  isAuthenticated: false,
  user: null,
  authReady: false,
  saveStatus: "saved",

  hydrateLocal: async () => {
    await migrateLegacyLocalStorage();
    const storedNotes = await getAllNotes();
    const pendingDeletes = storedNotes.filter((note) => note.isDeleted);
    const stored = storedNotes.filter((note) => !note.isDeleted);
    // Opening the app always lands on a blank draft, whatever was open last
    // time. Writing something down should never start with deciding where to
    // put it; everything already written is a Cmd/Ctrl+K away.
    const draft = createNewNote();
    // Markdown is the only editor mode for now. The setting actions remain
    // available for the future settings screen.
    const markdownEnabled = true;
    const syncAccountId = await getMetadata("syncAccountId", null);
    set({
      notes: [draft, ...stored],
      pendingDeletes,
      currentNoteId: draft.id,
      draftNoteId: draft.id,
      markdownEnabled,
      syncAccountId,
      storageReady: true,
    });
  },

  getCurrentNote: () => {
    const { notes, currentNoteId } = get();
    return notes.find((note) => note.id === currentNoteId) || notes[0] || null;
  },
  getNoteIndex: (noteId) => get().notes.findIndex((note) => note.id === noteId),

  createNote: () => {
    const note = createNewNote();
    set((state) => ({
      // Nothing is written here: the note reaches disk on its first character.
      notes: [note, ...withoutUntouchedDraft(state)],
      currentNoteId: note.id,
      draftNoteId: note.id,
      saveStatus: "saved",
    }));
    return note.id;
  },

  updateNoteContent: (content) => {
    const { currentNoteId } = get();
    const updatedAt = new Date().toISOString();
    let updated;
    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id !== currentNoteId) return note;
        updated = {
          ...note,
          content,
          document: null,
          formatVersion: 1,
          updatedAt,
        };
        return updated;
      }),
      saveStatus: "saving",
    }));
    persistEdit(updated);
  },

  updateNoteDocument: ({ document, markdown }) => {
    const { currentNoteId } = get();
    const updatedAt = new Date().toISOString();
    let updated;
    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id !== currentNoteId) return note;
        updated = {
          ...note,
          content: markdown,
          document,
          formatVersion: 1,
          updatedAt,
        };
        return updated;
      }),
      saveStatus: "saving",
    }));
    persistEdit(updated);
  },

  updateNoteTitle: (title) => {
    const { currentNoteId } = get();
    const updatedAt = new Date().toISOString();
    let updated;
    set((state) => ({
      notes: state.notes.map((note) => {
        if (note.id !== currentNoteId) return note;
        updated = { ...note, title, updatedAt };
        return updated;
      }),
      saveStatus: "saving",
    }));
    persistEdit(updated);
  },

  deleteNote: (noteId) => {
    // Land any queued edit before the tombstone, so a late write cannot
    // resurrect the note.
    flushNoteWrites();
    const { currentNoteId, draftNoteId } = get();
    let replacement;
    const deleted = get().notes.find((note) => note.id === noteId);
    // A draft only ever existed in memory, so there is nothing to tombstone and
    // nothing to tell the server about — deleting one is just forgetting it.
    const wasDraft = noteId === draftNoteId;
    const tombstone =
      deleted && !wasDraft
        ? { ...deleted, isDeleted: true, updatedAt: new Date().toISOString() }
        : null;
    set((state) => {
      const remaining = state.notes.filter((note) => note.id !== noteId);
      if (remaining.length === 0) {
        replacement = createNewNote();
        remaining.push(replacement);
      }
      const nextId = noteId === currentNoteId ? remaining[0].id : currentNoteId;
      return {
        notes: remaining,
        pendingDeletes: tombstone
          ? [
              ...state.pendingDeletes.filter((note) => note.id !== noteId),
              tombstone,
            ]
          : state.pendingDeletes,
        currentNoteId: nextId,
        draftNoteId: replacement ? replacement.id : wasDraft ? null : draftNoteId,
      };
    });
    if (tombstone) safely(putNote(tombstone));
    else if (!wasDraft) safely(removeNote(noteId));
  },

  acknowledgeDeletes: (acceptedIds) => {
    const accepted = new Set(acceptedIds);
    const completed = get().pendingDeletes.filter((note) =>
      accepted.has(note.id),
    );
    set((state) => ({
      pendingDeletes: state.pendingDeletes.filter(
        (note) => !accepted.has(note.id),
      ),
    }));
    completed.forEach((note) => safely(removeNote(note.id)));
  },

  switchToNote: (noteId) => {
    flushNoteWrites();
    set((state) => {
      if (noteId === state.draftNoteId) return { currentNoteId: noteId };
      // Leaving an untouched draft behind discards it, so opening the app and
      // then going to read something else does not litter the list. A draft
      // that had anything typed into it stopped being a draft at that point,
      // so this can only ever drop an empty one.
      return {
        notes: withoutUntouchedDraft(state),
        draftNoteId: null,
        currentNoteId: noteId,
      };
    });
  },

  navigateNotes: (direction) => {
    const { notes, currentNoteId } = get();
    const currentIndex = notes.findIndex((note) => note.id === currentNoteId);
    if (currentIndex === -1) return;
    const nextIndex =
      direction === "next"
        ? currentIndex < notes.length - 1
          ? currentIndex + 1
          : 0
        : currentIndex > 0
          ? currentIndex - 1
          : notes.length - 1;
    get().switchToNote(notes[nextIndex].id);
  },

  setMarkdownEnabled: (enabled) => {
    set({ markdownEnabled: enabled });
    safely(putSetting("markdownEnabled", enabled));
  },
  toggleMarkdown: () => get().setMarkdownEnabled(!get().markdownEnabled),

  attachSyncAccount: (userId) => {
    const existing = get().syncAccountId;
    if (existing && existing !== userId) return false;
    if (!existing) {
      set({ syncAccountId: userId });
      safely(putMetadata("syncAccountId", userId));
    }
    return true;
  },

  mergeRemoteNotes: (remoteNotes) => {
    const localById = new Map(get().notes.map((note) => [note.id, note]));
    const pendingDeleteById = new Map(
      get().pendingDeletes.map((note) => [note.id, note]),
    );
    const changed = [];
    const remotelyDeleted = new Set();
    for (const remote of remoteNotes) {
      const existing = localById.get(remote.id);
      if (remote.is_deleted) {
        remotelyDeleted.add(remote.id);
        if (existing) localById.delete(remote.id);
        safely(removeNote(remote.id));
        continue;
      }
      const pendingDelete = pendingDeleteById.get(remote.id);
      if (
        pendingDelete &&
        new Date(pendingDelete.updatedAt) >= new Date(remote.updated_at)
      ) {
        continue;
      }
      if (
        !existing ||
        new Date(remote.updated_at) > new Date(existing.updatedAt)
      ) {
        const note = {
          id: remote.id,
          title: remote.title || "",
          content: remote.content || "",
          document: remote.document || null,
          formatVersion: remote.format_version || 1,
          createdAt: existing?.createdAt || remote.updated_at,
          updatedAt: remote.updated_at,
        };
        localById.set(note.id, note);
        changed.push(note);
      }
    }
    let notes = [...localById.values()];
    if (notes.length === 0) {
      const note = createNewNote();
      notes = [note];
      changed.push(note);
    }
    const currentNoteId = notes.some((note) => note.id === get().currentNoteId)
      ? get().currentNoteId
      : notes[0].id;
    set((state) => ({
      notes,
      currentNoteId,
      pendingDeletes: state.pendingDeletes.filter(
        (note) => !remotelyDeleted.has(note.id),
      ),
    }));
    changed.forEach((note) => safely(putNote(note)));
  },

  toggleSidebar: () =>
    set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  openSidebar: () => set({ sidebarVisible: true }),
  closeSidebar: () => set({ sidebarVisible: false }),
  openDeleteModal: () => set({ deleteModalOpen: true }),
  closeDeleteModal: () => set({ deleteModalOpen: false }),
  openQuickSwitcher: () => set({ quickSwitcherOpen: true }),
  closeQuickSwitcher: () => set({ quickSwitcherOpen: false }),
  openShortcutsModal: () => set({ shortcutsModalOpen: true }),
  closeShortcutsModal: () => set({ shortcutsModalOpen: false }),
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),
  closeAllModals: () =>
    set({
      deleteModalOpen: false,
      shortcutsModalOpen: false,
      authModalOpen: false,
      quickSwitcherOpen: false,
    }),

  login: async (credentials) => {
    const { error } = await signIn(credentials.email, credentials.password);
    if (error) throw new Error(error.message);
  },
  register: async ({ name, email, password }) => {
    const { data, error } = await signUp(email, password, { name });
    if (error) throw new Error(error.message);
    return { needsVerification: !data.session };
  },
  forgotPassword: async ({ email }) => {
    const { error } = await resetPassword(email);
    if (error) throw new Error(error.message);
  },
  logout: async () => {
    await signOut();
    set({ sidebarVisible: false });
  },
  _applySession: (session) =>
    set({
      isAuthenticated: !!session,
      user: sessionToUser(session),
      authReady: true,
      authModalOpen: session ? false : get().authModalOpen,
  }),
}));

useAppStore
  .getState()
  .hydrateLocal()
  .catch((error) => {
    console.error("[storage] hydration failed", error);
    useAppStore.setState({ storageReady: true });
  });

getSession()
  .then(({ data }) => {
    useAppStore.getState()._applySession(data.session);
  })
  .catch(() => useAppStore.setState({ authReady: true }));

onAuthStateChange((session) => useAppStore.getState()._applySession(session));
