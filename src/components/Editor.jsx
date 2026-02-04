import React, { forwardRef, useEffect } from "react";
import { useAppStore } from "../store";

const Editor = forwardRef((props, ref) => {
  const { getCurrentNote, updateNoteContent, sidebarVisible, toggleSidebar } =
    useAppStore();
  const note = getCurrentNote();

  useEffect(() => {
    if (ref?.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = ref.current.scrollHeight + "px";
      if (!sidebarVisible) {
        ref.current.focus();
      }
    }
  }, [note?.id, sidebarVisible, ref]);

  const handleChange = (e) => {
    updateNoteContent(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400">
        <p>No note selected</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-50 dark:bg-[#1a1a1a]">
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-10 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200 opacity-40 hover:opacity-100"
        aria-label="Toggle sidebar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={20}
          height={20}
          viewBox="0 0 24 24"
        >
          <path
            fill="currentColor"
            d="M9.367 2.25h5.266c1.092 0 1.958 0 2.655.057c.714.058 1.317.18 1.869.46a4.75 4.75 0 0 1 2.075 2.077c.281.55.403 1.154.461 1.868c.057.697.057 1.563.057 2.655v5.266c0 1.092 0 1.958-.057 2.655c-.058.714-.18 1.317-.46 1.869a4.75 4.75 0 0 1-2.076 2.075c-.552.281-1.155.403-1.869.461c-.697.057-1.563.057-2.655.057H9.367c-1.092 0-1.958 0-2.655-.057c-.714-.058-1.317-.18-1.868-.46a4.75 4.75 0 0 1-2.076-2.076c-.281-.552-.403-1.155-.461-1.869c-.057-.697-.057-1.563-.057-2.655V9.367c0-1.092 0-1.958.057-2.655c.058-.714.18-1.317.46-1.868a4.75 4.75 0 0 1 2.077-2.076c.55-.281 1.154-.403 1.868-.461c.697-.057 1.563-.057 2.655-.057M6.834 3.802c-.62.05-1.005.147-1.31.302a3.25 3.25 0 0 0-1.42 1.42c-.155.305-.251.69-.302 1.31c-.051.63-.052 1.434-.052 2.566v5.2c0 1.133 0 1.937.052 2.566c.05.62.147 1.005.302 1.31a3.25 3.25 0 0 0 1.42 1.42c.305.155.69.251 1.31.302c.392.032.851.044 1.416.05V3.752c-.565.005-1.024.017-1.416.049"
          />
        </svg>
      </button>
      <div className="flex-1 overflow-y-auto sm:pt-0 pt-12">
        <div className="max-w-[700px] mx-auto px-8 py-8 md:px-12 md:py-10">
          <textarea
            ref={ref}
            value={note.content}
            onChange={handleChange}
            className="editor-textarea min-h-[calc(100vh-200px)]"
            placeholder="Start typing..."
            spellCheck={false}
          />
        </div>
      </div>

      <div className="px-8 py-3 flex items-center justify-between text-xs text-neutral-300 dark:text-neutral-700 hover:text-neutral-500 dark:hover:text-neutral-400 transition-colors duration-300 group">
        <div className="max-w-[700px] mx-auto w-full flex items-center justify-between text-neutral-300 dark:text-neutral-700 group-hover:text-neutral-500 dark:group-hover:text-neutral-400 transition-colors duration-300">
          <div className="flex items-center gap-4">
            <span>{note.content.length} characters</span>
            <span>
              {note.content.split(/\s+/).filter((w) => w.length > 0).length}{" "}
              words
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span>
              Last updated: {new Date(note.updatedAt).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

Editor.displayName = "Editor";

export default Editor;
