import { useEffect } from "react";
import { useAppStore } from "../store";

const isEditingTarget = (target) =>
  target?.tagName === "INPUT" ||
  target?.tagName === "TEXTAREA" ||
  target?.isContentEditable ||
  Boolean(target?.closest?.('[contenteditable="true"]'));

// Custom hook for global keyboard shortcuts
export const useKeyboardShortcuts = () => {
  const {
    sidebarVisible,
    deleteModalOpen,
    shortcutsModalOpen,
    quickSwitcherOpen,
    toggleSidebar,
    openDeleteModal,
    openShortcutsModal,
    openQuickSwitcher,
    closeAllModals,
    closeSidebar,
    createNote,
    navigateNotes,
  } = useAppStore();

  // Check if any modal is open
  const isModalOpen = deleteModalOpen || shortcutsModalOpen || quickSwitcherOpen;

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, metaKey, ctrlKey, altKey } = event;
      const isModKey = metaKey || ctrlKey;

      // Handle Escape key - close modals or sidebar
      if (key === "Escape") {
        if (isModalOpen) {
          event.preventDefault();
          closeAllModals();
        } else if (sidebarVisible) {
          event.preventDefault();
          closeSidebar();
        }
        return;
      }

      // Help is also on `?`, which only works outside a text field; Cmd+/ below
      // covers the case where you are mid-sentence.
      if (key === "?" && !isModalOpen && !sidebarVisible) {
        if (!isEditingTarget(event.target)) {
          event.preventDefault();
          openShortcutsModal();
        }
        return;
      }

      // Only handle mod key shortcuts below
      if (!isModKey) return;

      // Cmd/Ctrl+Arrow belongs to the caret — on macOS it jumps to the start or
      // end of what you are editing. Note navigation takes the Alt variant so
      // both work while typing.
      if (altKey && !sidebarVisible && !isModalOpen) {
        if (key === "ArrowUp") {
          event.preventDefault();
          event.stopPropagation();
          navigateNotes("prev");
          return;
        }
        if (key === "ArrowDown") {
          event.preventDefault();
          event.stopPropagation();
          navigateNotes("next");
          return;
        }
      }

      // Delete the current note. Cmd+Backspace reads as "delete" and, unlike
      // Cmd+D, is not the browser's bookmark shortcut.
      if (key === "Backspace" && !isModalOpen) {
        event.preventDefault();
        if (useAppStore.getState().notes.length > 1) openDeleteModal();
        return;
      }

      // Holding Option on macOS rewrites event.key (Option+N is a dead key for
      // the tilde), so fall back to the physical key when Alt is down.
      const physicalKey = { KeyN: "n", KeyK: "k", KeyS: "s", KeyP: "p" }[
        event.code
      ];
      switch (altKey && physicalKey ? physicalKey : key.toLowerCase()) {
        case "k":
          // Search notes by name — the only shortcut that scales past a
          // handful of notes.
          event.preventDefault();
          event.stopPropagation();
          if (!isModalOpen) openQuickSwitcher();
          return;
        case "\\":
          // Sidebar lives here rather than on Cmd+B, which the editor needs
          // for bold while you are typing.
          event.preventDefault();
          event.stopPropagation();
          if (!isModalOpen) toggleSidebar();
          return;
        case "/":
          event.preventDefault();
          event.stopPropagation();
          if (!isModalOpen) openShortcutsModal();
          return;
        case "n":
          // Cmd+Alt+N is the documented one: browsers reserve plain Cmd+N for a
          // new window and a page cannot always take it back. Plain Cmd+N is
          // still handled, and does work in the installed app.
          event.preventDefault();
          event.stopPropagation();
          if (!isModalOpen) createNote();
          return;
        case "s":
          // Notes are persisted continuously; only suppress the browser dialog.
          event.preventDefault();
          event.stopPropagation();
          return;
        case "p":
          // Block print dialog
          event.preventDefault();
          event.stopPropagation();
          return;
      }
    };

    // Use normal phase, not capture - let textarea handle typing first
    window.addEventListener("keydown", handleKeyDown, false);
    return () => window.removeEventListener("keydown", handleKeyDown, false);
  }, [
    sidebarVisible,
    isModalOpen,
    toggleSidebar,
    openDeleteModal,
    openShortcutsModal,
    openQuickSwitcher,
    closeAllModals,
    closeSidebar,
    createNote,
    navigateNotes,
  ]);
};
