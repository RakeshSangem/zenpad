import React, { forwardRef, useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useAppStore } from '../store'

// Format date for display
const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date
  
  // Less than 24 hours ago
  if (diff < 24 * 60 * 60 * 1000) {
    // Less than 1 hour ago
    if (diff < 60 * 60 * 1000) {
      const minutes = Math.floor(diff / (60 * 1000))
      if (minutes < 1) return 'Just now'
      return `${minutes}m ago`
    }
    const hours = Math.floor(diff / (60 * 60 * 1000))
    return `${hours}h ago`
  }
  
  // More than 24 hours ago
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// Extract title from note - use custom title if set, otherwise extract from content
const extractTitle = (note) => {
  // Use custom title if it exists and is not empty
  if (note.title && note.title.trim()) {
    return note.title.trim().slice(0, 50)
  }
  
  // Fall back to extracting from content
  const content = note.content
  if (!content) return 'Untitled'
  const lines = content.split('\n')
  const firstLine = lines[0].trim()
  if (firstLine) return firstLine.slice(0, 50)
  // If first line is empty, try second line
  if (lines[1]) return lines[1].trim().slice(0, 50)
  return 'Untitled'
}

const Sidebar = forwardRef(({ onSelectNote }, ref) => {
  const internalRef = useRef(null)
  const noteRefs = useRef([])
  
  const {
    notes,
    currentNoteId,
    sidebarVisible,
    closeSidebar,
    openShortcutsModal,
  } = useAppStore()
  
  // Combine refs
  useEffect(() => {
    if (typeof ref === 'function') {
      ref(internalRef.current)
    } else if (ref) {
      ref.current = internalRef.current
    }
  }, [ref])

  const sortedNotes = useMemo(() => {
    return [...notes].sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt)
    })
  }, [notes])

  // Focus first note item when sidebar becomes visible
  useEffect(() => {
    if (sidebarVisible) {
      // Small delay to ensure sidebar is rendered
      setTimeout(() => {
        const firstNoteIndex = sortedNotes.findIndex(n => n.id === currentNoteId)
        const indexToFocus = firstNoteIndex >= 0 ? firstNoteIndex : 0
        noteRefs.current[indexToFocus]?.focus()
      }, 100)
    }
  }, [sidebarVisible, sortedNotes, currentNoteId])

  // Track focused note index
  const [focusedIndex, setFocusedIndex] = useState(-1)

  // Handle keyboard navigation within sidebar
  const handleKeyDown = useCallback((event) => {
    const { key, metaKey, ctrlKey } = event
    const isModKey = metaKey || ctrlKey

    // Get current focused index or find active note
    let currentIndex = focusedIndex
    if (currentIndex === -1) {
      currentIndex = sortedNotes.findIndex(n => n.id === currentNoteId)
      if (currentIndex === -1) currentIndex = 0
    }

    switch (key) {
      case 'ArrowDown':
        event.preventDefault()
        if (currentIndex < sortedNotes.length - 1) {
          const newIndex = currentIndex + 1
          setFocusedIndex(newIndex)
          noteRefs.current[newIndex]?.focus()
          onSelectNote(sortedNotes[newIndex].id)
        }
        break
      case 'ArrowUp':
        event.preventDefault()
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1
          setFocusedIndex(newIndex)
          noteRefs.current[newIndex]?.focus()
          onSelectNote(sortedNotes[newIndex].id)
        }
        break
      case 'Enter':
        event.preventDefault()
        if (currentIndex >= 0 && currentIndex < sortedNotes.length) {
          onSelectNote(sortedNotes[currentIndex].id)
          closeSidebar()
        }
        break
      case 'Escape':
        event.preventDefault()
        closeSidebar()
        break
      case 'b':
      case 'B':
        if (isModKey) {
          event.preventDefault()
          closeSidebar()
        }
        break
    }
  }, [sortedNotes, focusedIndex, currentNoteId, onSelectNote, closeSidebar])

  // Handle individual note click
  const handleNoteClick = useCallback((noteId, index) => {
    setFocusedIndex(index)
    onSelectNote(noteId)
    closeSidebar()
  }, [onSelectNote, closeSidebar])

  return (
    <div 
      ref={internalRef}
      className={`fixed left-4 top-4 bottom-4 w-80 z-40 transition-all duration-200 ease-out ${sidebarVisible ? 'translate-x-0 opacity-100' : '-translate-x-[calc(100%+24px)] opacity-0 pointer-events-none'}`}
      tabIndex={-1}
      onKeyDown={sidebarVisible ? handleKeyDown : undefined}
    >
      <div className="h-full bg-white dark:bg-[#1f1f1f] rounded-2xl border border-neutral-200 dark:border-[#2a2a2a] shadow-lg flex flex-col overflow-hidden">
        {/* Header with zenpad title */}
        <div className="px-4 py-3 border-b border-neutral-200 dark:border-[#2a2a2a] flex items-center justify-between">
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
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 tracking-tight">zenpad</span>
          </div>
          
          <button
            onClick={openShortcutsModal}
            className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            ?
          </button>
        </div>
        
        {/* Notes count */}
        <div className="px-4 py-2 border-b border-neutral-200 dark:border-[#2a2a2a]">
          <p className="text-xs text-neutral-500 dark:text-neutral-500">
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Notes list */}
        <div className="flex-1 overflow-y-auto">
          {sortedNotes.map((note, index) => {
            const isActive = note.id === currentNoteId
            const title = extractTitle(note)
            const preview = note.content.split('\n').slice(1).join(' ').trim().slice(0, 60)
            
            return (
              <div
                key={note.id}
                ref={el => noteRefs.current[index] = el}
                onClick={() => handleNoteClick(note.id, index)}
                className={`note-item ${isActive ? 'active' : ''}`}
                tabIndex={-1}
                role="button"
                aria-selected={isActive}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className={`text-sm font-medium truncate flex-1 ${isActive ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-800 dark:text-neutral-300'}`}>
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
            )
          })}
        </div>
        
        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-neutral-200 dark:border-[#2a2a2a] bg-neutral-50 dark:bg-[#1f1f1f]">
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            Cmd/Ctrl + B to hide
          </p>
        </div>
      </div>
    </div>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
