import { useEffect, useCallback, useState } from 'react'
import { useAppStore } from '../store'

// Custom hook for sidebar keyboard navigation
export const useSidebarKeyboard = (noteRefs, sidebarRef) => {
  const {
    sidebarVisible,
    closeSidebar,
    switchToNote,
    currentNoteId,
    notes,
  } = useAppStore()

  const [focusedIndex, setFocusedIndex] = useState(-1)

  // Reset focused index when sidebar opens
  useEffect(() => {
    if (sidebarVisible) {
      const currentIndex = notes.findIndex(n => n.id === currentNoteId)
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0)
    }
  }, [sidebarVisible, notes, currentNoteId])

  const handleKeyDown = useCallback((event) => {
    const { key, metaKey, ctrlKey } = event
    const isModKey = metaKey || ctrlKey

    // Get current index
    let currentIndex = focusedIndex
    if (currentIndex === -1) {
      currentIndex = notes.findIndex(n => n.id === currentNoteId)
      if (currentIndex === -1) currentIndex = 0
    }

    switch (key) {
      case 'ArrowDown':
        event.preventDefault()
        if (currentIndex < notes.length - 1) {
          const newIndex = currentIndex + 1
          setFocusedIndex(newIndex)
          switchToNote(notes[newIndex].id)
        }
        break

      case 'ArrowUp':
        event.preventDefault()
        if (currentIndex > 0) {
          const newIndex = currentIndex - 1
          setFocusedIndex(newIndex)
          switchToNote(notes[newIndex].id)
        }
        break

      case 'Enter':
        event.preventDefault()
        if (currentIndex >= 0 && currentIndex < notes.length) {
          switchToNote(notes[currentIndex].id)
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
  }, [focusedIndex, notes, currentNoteId, switchToNote, closeSidebar])

  useEffect(() => {
    if (sidebarVisible && sidebarRef.current) {
      sidebarRef.current.focus()
    }
  }, [sidebarVisible, sidebarRef])

  return { handleKeyDown, focusedIndex, setFocusedIndex }
}
