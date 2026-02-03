import React, { forwardRef, useEffect } from 'react'
import { useAppStore } from '../store'

const Editor = forwardRef((props, ref) => {
  const { getCurrentNote, updateNoteContent, sidebarVisible } = useAppStore()
  const note = getCurrentNote()

  // Auto-resize textarea height
  useEffect(() => {
    if (ref?.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = ref.current.scrollHeight + 'px'
    }
  }, [note?.content, ref])

  // Focus on mount and when note changes
  useEffect(() => {
    if (ref?.current && !sidebarVisible) {
      ref.current.focus()
    }
  }, [note?.id, sidebarVisible, ref])

  const handleChange = (e) => {
    updateNoteContent(e.target.value)
    
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400">
        <p>No note selected</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-neutral-50 dark:bg-[#1a1a1a]">
      <div className="flex-1 overflow-y-auto">
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
            <span>
              {note.content.length} characters
            </span>
            <span>
              {note.content.split(/\s+/).filter(w => w.length > 0).length} words
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
  )
})

Editor.displayName = 'Editor'

export default Editor
