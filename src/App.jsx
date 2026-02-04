import React, { useRef } from 'react'
import { Analytics } from '@vercel/analytics/react'
import Sidebar from './components/Sidebar'
import Editor from './components/Editor'
import { useAppStore } from './store'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

function App() {
  const editorRef = useRef(null)
  const saveInputRef = useRef(null)
  
  const {
    sidebarVisible,
    saveModalOpen,
    deleteModalOpen,
    shortcutsModalOpen,
    saveStatus,
    getCurrentNote,
    closeAllModals,
    closeSaveModal,
    closeDeleteModal,
    closeShortcutsModal,
    updateNoteTitle,
    deleteNote,
    currentNoteId,
    notes,
    switchToNote,
    toggleSidebar,
  } = useAppStore()
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts()
  
  const currentNote = getCurrentNote()
  
  const handleSaveTitle = (title) => {
    if (title.trim()) {
      updateNoteTitle(title.trim())
    }
    closeSaveModal()
    setTimeout(() => {
      editorRef.current?.focus()
    }, 100)
  }
  
  const confirmDelete = () => {
    deleteNote(currentNoteId)
    closeDeleteModal()
  }
  
  const handleSelectNote = (noteId) => {
    switchToNote(noteId)
  }

  return (
    <div className="h-full w-full flex bg-neutral-50 dark:bg-[#1a1a1a]">
      {/* Sidebar - floating panel */}
      <Sidebar onSelectNote={handleSelectNote} />

      {/* Main Editor Area */}
      <Editor ref={editorRef} />

      {/* Vercel Web Analytics */}
      <Analytics />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeDeleteModal}
        >
          <div 
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white dark:bg-[#1f1f1f] rounded-2xl border border-neutral-200 dark:border-[#2a2a2a] shadow-xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-2">
              Delete Note?
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
              This action cannot be undone. The note will be permanently removed.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors rounded-lg"
                autoFocus
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {shortcutsModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeShortcutsModal}
        >
          <div 
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] max-w-[90vw] bg-white dark:bg-[#1f1f1f] rounded-2xl border border-neutral-200 dark:border-[#2a2a2a] shadow-xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <svg 
                  className="w-5 h-5 text-neutral-700 dark:text-neutral-300" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200">
                  zenpad
                </h3>
              </div>
              <button
                onClick={closeShortcutsModal}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <span className="sr-only">Close</span>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700/50">
                <span className="text-neutral-600 dark:text-neutral-400">New Note</span>
                <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">Cmd/Ctrl + N</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700/50">
                <span className="text-neutral-600 dark:text-neutral-400">Save Note</span>
                <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">Cmd/Ctrl + S</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700/50">
                <span className="text-neutral-600 dark:text-neutral-400">Delete Note</span>
                <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">Cmd/Ctrl + D</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700/50">
                <span className="text-neutral-600 dark:text-neutral-400">Toggle Sidebar</span>
                <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">Cmd/Ctrl + B</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700/50">
                <span className="text-neutral-600 dark:text-neutral-400">Navigate Notes</span>
                <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">Cmd/Ctrl + ↑/↓</kbd>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-neutral-100 dark:border-neutral-700/50">
                <span className="text-neutral-600 dark:text-neutral-400">Blur Editor / Close</span>
                <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">Esc</kbd>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-neutral-600 dark:text-neutral-400">Show Shortcuts</span>
                <kbd className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono text-xs rounded">?</kbd>
              </div>
            </div>
            
            <p className="mt-6 text-xs text-neutral-400 dark:text-neutral-500">
              Press Esc to close this dialog
            </p>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {saveModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={closeSaveModal}
        >
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-white dark:bg-[#1f1f1f] rounded-2xl border border-neutral-200 dark:border-[#2a2a2a] shadow-xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-medium text-neutral-800 dark:text-neutral-200 mb-4">
              Save Note
            </h3>
            <input
              ref={saveInputRef}
              type="text"
              defaultValue={currentNote?.title || ''}
              placeholder="Enter note title..."
              className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors mb-4"
              autoFocus
              onFocus={(e) => e.target.select()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSaveTitle(e.target.value)
                } else if (e.key === 'Escape') {
                  closeSaveModal()
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={closeSaveModal}
                className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveTitle(saveInputRef.current?.value || '')}
                className="px-4 py-2 text-sm bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900 hover:bg-neutral-900 dark:hover:bg-neutral-100 transition-colors rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save status indicator */}
      {!sidebarVisible && !shortcutsModalOpen && saveStatus === 'saving' && (
        <div className="fixed bottom-4 right-4 text-xs text-neutral-400 dark:text-neutral-500">
          <span>Saving...</span>
        </div>
      )}
    </div>
  )
}

export default App
