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

export const useAppStore = create((set, get) => ({
  notes: [initialNote],
  pendingDeletes: [],
  currentNoteId: initialNote.id,
  storageReady: false,
  markdownEnabled: true,
  syncAccountId: null,

  sidebarVisible: false,
  deleteModalOpen: false,
  shortcutsModalOpen: false,
  authModalOpen: false,

  isAuthenticated: false,
  user: null,
  authReady: false,
  saveStatus: "saved",

  hydrateLocal: async () => {
    await migrateLegacyLocalStorage();
    const storedNotes = await getAllNotes();
    const pendingDeletes = storedNotes.filter((note) => note.isDeleted);
    let notes = storedNotes.filter((note) => !note.isDeleted);
    if (notes.length === 0) {
      notes = [initialNote];
      await putNote(initialNote);
    }
    const requestedId = await getMetadata("currentNoteId", notes[0].id);
    const currentNoteId = notes.some((note) => note.id === requestedId)
      ? requestedId
      : notes[0].id;
    // Markdown is the only editor mode for now. The setting actions remain
    // available for the future settings screen.
    const markdownEnabled = true;
    const syncAccountId = await getMetadata("syncAccountId", null);
    set({
      notes,
      pendingDeletes,
      currentNoteId,
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
      notes: [note, ...state.notes],
      currentNoteId: note.id,
      saveStatus: "saved",
    }));
    safely(putNote(note));
    safely(putMetadata("currentNoteId", note.id));
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
    if (updated) safely(putNote(updated));
    setTimeout(() => set({ saveStatus: "saved" }), 600);
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
    if (updated) safely(putNote(updated));
    setTimeout(() => set({ saveStatus: "saved" }), 600);
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
    if (updated) safely(putNote(updated));
    setTimeout(() => set({ saveStatus: "saved" }), 600);
  },

  deleteNote: (noteId) => {
    const { currentNoteId } = get();
    let replacement;
    const deleted = get().notes.find((note) => note.id === noteId);
    const tombstone = deleted
      ? { ...deleted, isDeleted: true, updatedAt: new Date().toISOString() }
      : null;
    set((state) => {
      const remaining = state.notes.filter((note) => note.id !== noteId);
      if (remaining.length === 0) {
        replacement = createNewNote();
        remaining.push(replacement);
      }
      const nextId = noteId === currentNoteId ? remaining[0].id : currentNoteId;
      safely(putMetadata("currentNoteId", nextId));
      return {
        notes: remaining,
        pendingDeletes: tombstone
          ? [
              ...state.pendingDeletes.filter((note) => note.id !== noteId),
              tombstone,
            ]
          : state.pendingDeletes,
        currentNoteId: nextId,
      };
    });
    if (tombstone) safely(putNote(tombstone));
    else safely(removeNote(noteId));
    if (replacement) safely(putNote(replacement));
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
    set({ currentNoteId: noteId });
    safely(putMetadata("currentNoteId", noteId));
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
    safely(putMetadata("currentNoteId", currentNoteId));
  },

  toggleSidebar: () =>
    set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  openSidebar: () => set({ sidebarVisible: true }),
  closeSidebar: () => set({ sidebarVisible: false }),
  openDeleteModal: () => set({ deleteModalOpen: true }),
  closeDeleteModal: () => set({ deleteModalOpen: false }),
  openShortcutsModal: () => set({ shortcutsModalOpen: true }),
  closeShortcutsModal: () => set({ shortcutsModalOpen: false }),
  openAuthModal: () => set({ authModalOpen: true }),
  closeAuthModal: () => set({ authModalOpen: false }),
  closeAllModals: () =>
    set({
      deleteModalOpen: false,
      shortcutsModalOpen: false,
      authModalOpen: false,
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
