import React, {
  forwardRef,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useAppStore } from "../store";
import { noteTitle, notePreview } from "../lib/noteSummary";
import Logo from "./Logo";
import AccountMenu from "./AccountMenu";
import { Button } from "./ui/button";

// Format date for display
const formatDate = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();
  const diff = now - date;

  // Less than 24 hours ago
  if (diff < 24 * 60 * 60 * 1000) {
    // Less than 1 hour ago
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000));
      if (minutes < 1) return "Just now";
      return `${minutes}m ago`;
    }
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours}h ago`;
  }

  // More than 24 hours ago
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const Sidebar = forwardRef(({ onSelectNote }, ref) => {
  const noteRefs = useRef([]);

  const {
    notes,
    currentNoteId,
    sidebarVisible,
    closeSidebar,
    toggleSidebar,
    openShortcutsModal,
  } = useAppStore();

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [notes]);

  // Focus first note item when sidebar becomes visible
  useEffect(() => {
    if (sidebarVisible) {
      // Small delay to ensure sidebar is rendered
      setTimeout(() => {
        const firstNoteIndex = sortedNotes.findIndex(
          (n) => n.id === currentNoteId,
        );
        const indexToFocus = firstNoteIndex >= 0 ? firstNoteIndex : 0;
        noteRefs.current[indexToFocus]?.focus();
      }, 100);
    }
  }, [sidebarVisible, sortedNotes, currentNoteId]);

  // Track focused note index
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Handle keyboard navigation within sidebar
  const handleKeyDown = useCallback(
    (event) => {
      const { key, metaKey, ctrlKey } = event;
      const isModKey = metaKey || ctrlKey;

      // Get current focused index or find active note
      let currentIndex = focusedIndex;
      if (currentIndex === -1) {
        currentIndex = sortedNotes.findIndex((n) => n.id === currentNoteId);
        if (currentIndex === -1) currentIndex = 0;
      }

      switch (key) {
        case "ArrowDown":
          event.preventDefault();
          if (currentIndex < sortedNotes.length - 1) {
            const newIndex = currentIndex + 1;
            setFocusedIndex(newIndex);
            noteRefs.current[newIndex]?.focus();
            onSelectNote(sortedNotes[newIndex].id);
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            setFocusedIndex(newIndex);
            noteRefs.current[newIndex]?.focus();
            onSelectNote(sortedNotes[newIndex].id);
          }
          break;
        case "Enter":
          event.preventDefault();
          if (currentIndex >= 0 && currentIndex < sortedNotes.length) {
            onSelectNote(sortedNotes[currentIndex].id);
            closeSidebar();
          }
          break;
        case "Escape":
          event.preventDefault();
          closeSidebar();
          break;
        case "b":
        case "B":
          if (isModKey) {
            event.preventDefault();
            event.stopPropagation();
            toggleSidebar();
          }
          break;
      }
    },
    [
      sortedNotes,
      focusedIndex,
      currentNoteId,
      onSelectNote,
      closeSidebar,
      toggleSidebar,
    ],
  );

  // Handle individual note click
  const handleNoteClick = useCallback(
    (noteId, index) => {
      setFocusedIndex(index);
      onSelectNote(noteId);
      closeSidebar();
    },
    [onSelectNote, closeSidebar],
  );

  return (
    <>
      {sidebarVisible && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-30 cursor-default bg-transparent"
          onPointerDown={closeSidebar}
        />
      )}
      <div
        ref={ref}
        tabIndex={-1}
        onKeyDown={sidebarVisible ? handleKeyDown : undefined}
        className={`fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-out ${sidebarVisible ? "translate-x-0" : "-translate-x-full"} sm:left-4 sm:top-4 sm:bottom-4 sm:w-80 sm:rounded-2xl ${sidebarVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        <div className="h-full bg-white dark:bg-[#1f1f1f] sm:rounded-2xl border-r sm:border border-neutral-200 dark:border-[#2a2a2a] shadow-lg sm:shadow-xl flex flex-col overflow-hidden">
          {/* Header with zenpad title */}
          <div className="px-4 py-3 border-b border-neutral-200 dark:border-[#2a2a2a] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
              <span className="font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight">
                Zenpad
              </span>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={closeSidebar}
              className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              aria-label="Close sidebar"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ transform: "scaleX(-1)" }}
              >
                <path d="M9.367 2.25h5.266c1.092 0 1.958 0 2.655.057c.714.058 1.317.18 1.869.46a4.75 4.75 0 0 1 2.075 2.077c.281.55.403 1.154.461 1.868c.057.697.057 1.563.057 2.655v5.266c0 1.092 0 1.958-.057 2.655c-.058.714-.18 1.317-.46 1.869a4.75 4.75 0 0 1-2.076 2.075c-.552.281-1.155.403-1.869.461c-.697.057-1.563.057-2.655.057H9.367c-1.092 0-1.958 0-2.655-.057c-.714-.058-1.317-.18-1.868-.46a4.75 4.75 0 0 1-2.076-2.076c-.281-.552-.403-1.155-.461-1.869c-.057-.697-.057-1.563-.057-2.655V9.367c0-1.092 0-1.958.057-2.655c.058-.714.18-1.317.46-1.868a4.75 4.75 0 0 1 2.077-2.076c.55-.281 1.154-.403 1.868-.461c.697-.057 1.563-.057 2.655-.057M8.25 3.752c-.565.005-1.024.017-1.416.049c-.62.05-1.005.147-1.31.302a3.25 3.25 0 0 0-1.42 1.42c-.155.305-.251.69-.302 1.31c-.051.63-.052 1.434-.052 2.566v5.2c0 1.133 0 1.937.052 2.566c.05.62.147 1.005.302 1.31a3.25 3.25 0 0 0 1.42 1.42c.305.155.69.251 1.31.302c.392.032.851.044 1.416.05V3.752zm5.477 5.248a.75.75 0 0 0-1.06 1.06l1.19 1.19H10.5a.75.75 0 0 0 0 1.5h3.357l-1.19 1.19a.75.75 0 1 0 1.06 1.06l2.47-2.47a.75.75 0 0 0 0-1.06z" />
              </svg>
            </Button>
          </div>

          {/* Notes count */}
          <div className="px-4 py-2 border-b border-neutral-200 dark:border-[#2a2a2a]">
            <p className="text-xs text-neutral-500 dark:text-neutral-500">
              {notes.length} note{notes.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Notes list */}
          <div className="flex-1 overflow-y-auto">
            {sortedNotes.map((note, index) => {
              const isActive = note.id === currentNoteId;
              const title = noteTitle(note);
              const preview = notePreview(note);

              return (
                <div
                  key={note.id}
                  ref={(el) => (noteRefs.current[index] = el)}
                  onClick={() => handleNoteClick(note.id, index)}
                  className={`note-item ${isActive ? "active" : ""}`}
                  tabIndex={-1}
                  role="button"
                  aria-selected={isActive}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <h3
                      className={`text-sm font-medium truncate flex-1 ${isActive ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-800 dark:text-neutral-300"}`}
                    >
                      {title}
                    </h3>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500 shrink-0">
                      {formatDate(note.updatedAt)}
                    </span>
                  </div>
                  {preview && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1 truncate">
                      {preview}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Account menu */}
          <AccountMenu />

          {/* Footer hint */}
          <div className="px-4 py-2 border-t border-neutral-200 dark:border-[#2a2a2a] bg-neutral-50 dark:bg-[#1f1f1f] flex items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                ⌘ \
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={openShortcutsModal}
                className="rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
                aria-label="Show keyboard shortcuts"
              >
                ?
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

Sidebar.displayName = "Sidebar";

export default Sidebar;
