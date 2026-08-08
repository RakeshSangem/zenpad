import React, { useRef } from "react";
import { Analytics } from "@vercel/analytics/react";
import Sidebar from "./components/Sidebar";
import Editor from "./components/Editor";
import PWAUpdateBanner from "./components/PWAUpdateBanner";
import AuthLayout from "./components/auth/AuthLayout";
import Logo from "./components/Logo";
import { useAppStore } from "./store";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useSyncNotes } from "./hooks/useSyncNotes";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";

const shouldLoadAnalytics =
  import.meta.env.PROD &&
  typeof window !== "undefined" &&
  window.location.hostname !== "localhost" &&
  window.location.hostname !== "127.0.0.1";

function AuthenticatedApp() {
  const editorRef = useRef(null);

  const {
    sidebarVisible,
    deleteModalOpen,
    shortcutsModalOpen,
    closeDeleteModal,
    closeShortcutsModal,
    deleteNote,
    currentNoteId,
    switchToNote,
    authModalOpen,
    closeAuthModal,
  } = useAppStore();

  useKeyboardShortcuts();
  useSyncNotes();

  const confirmDelete = () => {
    deleteNote(currentNoteId);
    closeDeleteModal();
  };

  const handleSelectNote = (noteId) => {
    switchToNote(noteId);
  };

  return (
    <div className="h-full w-full flex bg-neutral-50 dark:bg-[#1a1a1a] animate-fade-in">
      <Sidebar onSelectNote={handleSelectNote} />
      <Editor ref={editorRef} />

      {shouldLoadAnalytics && <Analytics />}

      <PWAUpdateBanner />

      <Dialog
        open={authModalOpen}
        onOpenChange={(open) => !open && closeAuthModal()}
      >
        <DialogContent
          showCloseButton={false}
          className="max-w-105 gap-0 overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 p-0 shadow-2xl sm:max-w-105 dark:border-[#2a2a2a] dark:bg-[#1a1a1a]"
        >
          <DialogTitle className="sr-only">Sync your Zenpad notes</DialogTitle>
          <AuthLayout onClose={closeAuthModal} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteModalOpen}
        onOpenChange={(open) => !open && closeDeleteModal()}
      >
        <DialogContent
          showCloseButton={false}
          className="w-80 gap-0 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl sm:max-w-80 dark:border-[#2a2a2a] dark:bg-[#1f1f1f]"
        >
          <DialogHeader className="gap-0">
            <DialogTitle className="mb-2 text-lg font-medium text-neutral-800 dark:text-neutral-200">
              Delete Note?
            </DialogTitle>
            <DialogDescription className="mb-6 text-sm text-neutral-600 dark:text-neutral-400">
              This action cannot be undone. The note will be permanently
              removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="m-0 flex-row justify-end border-0 bg-transparent p-0">
            <Button
              variant="ghost"
              onClick={closeDeleteModal}
              className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors rounded-lg"
              autoFocus
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={shortcutsModalOpen}
        onOpenChange={(open) => !open && closeShortcutsModal()}
      >
        <DialogContent
          showCloseButton={false}
          className="w-[420px] max-w-[90vw] gap-0 rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl sm:max-w-[420px] dark:border-[#2a2a2a] dark:bg-[#1f1f1f]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              <DialogTitle className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
                zenpad
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={closeShortcutsModal}
              className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <span className="sr-only">Close</span>
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700/50">
              <span className="text-neutral-600 dark:text-neutral-400">
                New Note
              </span>
              <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">
                Cmd/Ctrl + N
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700/50">
              <span className="text-neutral-600 dark:text-neutral-400">
                Delete Note
              </span>
              <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">
                Cmd/Ctrl + D
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700/50">
              <span className="text-neutral-600 dark:text-neutral-400">
                Toggle Sidebar (outside editor)
              </span>
              <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">
                Cmd/Ctrl + B
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700/50">
              <span className="text-neutral-600 dark:text-neutral-400">
                Navigate Notes
              </span>
              <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">
                Cmd/Ctrl + ↑/↓
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700/50">
              <span className="text-neutral-600 dark:text-neutral-400">
                Blur Editor / Close
              </span>
              <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">
                Esc
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-600 dark:text-neutral-400">
                Insert block (Markdown mode)
              </span>
              <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">
                /
              </kbd>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-neutral-600 dark:text-neutral-400">
                Show Shortcuts
              </span>
              <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">
                ?
              </kbd>
            </div>
          </div>

          <p className="mt-6 text-xs text-neutral-400 dark:text-neutral-500">
            Press Esc to close this dialog
          </p>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function App() {
  const storageReady = useAppStore((state) => state.storageReady);

  if (!storageReady) {
    return <div className="h-full w-full bg-neutral-50 dark:bg-[#1a1a1a]" />;
  }

  return <AuthenticatedApp />;
}

export default App;
