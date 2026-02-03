import { useEffect } from 'react'
import { useAppStore } from '../store'

// Custom hook for global keyboard shortcuts
export const useKeyboardShortcuts = () => {
  const {
    sidebarVisible,
    saveModalOpen,
    deleteModalOpen,
    shortcutsModalOpen,
    toggleSidebar,
    openSaveModal,
    openDeleteModal,
    openShortcutsModal,
    closeAllModals,
    closeSidebar,
    createNote,
    deleteNote,
    navigateNotes,
    getCurrentNote,
  } = useAppStore()

  // Check if any modal is open
  const isModalOpen = saveModalOpen || deleteModalOpen || shortcutsModalOpen

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key, metaKey, ctrlKey, altKey } = event
      const isModKey = metaKey || ctrlKey

      // Handle Escape key - close modals or sidebar
      if (key === 'Escape') {
        event.preventDefault()
        if (isModalOpen) {
          closeAllModals()
        } else if (sidebarVisible) {
          closeSidebar()
        }
        return
      }

      // Handle shortcuts help (?) - when not typing in input
      if ((key === '?' || key === '/') && !isModalOpen && !sidebarVisible) {
        const target = event.target
        const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
        if (!isInput) {
          event.preventDefault()
          openShortcutsModal()
          return
        }
      }

      // Only handle mod key shortcuts below
      if (!isModKey) return

      // Block browser shortcuts and handle our shortcuts
      const blockedKeys = ['n', 's', 'd', 'b', 'p']
      if (blockedKeys.includes(key.toLowerCase())) {
        event.preventDefault()
        event.stopPropagation()
      }

      // Handle arrow keys in editor (not in sidebar)
      if (!sidebarVisible && !isModalOpen) {
        if (key === 'ArrowUp') {
          event.preventDefault()
          event.stopPropagation()
          navigateNotes('prev')
          return
        }
        if (key === 'ArrowDown') {
          event.preventDefault()
          event.stopPropagation()
          navigateNotes('next')
          return
        }
      }

      // Handle shortcuts
      switch (key.toLowerCase()) {
        case 'n':
          createNote()
          return
        case 's':
          openSaveModal()
          return
        case 'd':
          if (!isModalOpen) {
            const currentNote = getCurrentNote()
            // Don't allow deleting the last note
            const notes = useAppStore.getState().notes
            if (notes.length > 1) {
              openDeleteModal()
            }
          }
          return
        case 'b':
          if (!isModalOpen) {
            toggleSidebar()
          }
          return
        case 'p':
          // Block print dialog
          return
      }
    }

    // Use normal phase, not capture - let textarea handle typing first
    window.addEventListener('keydown', handleKeyDown, false)
    return () => window.removeEventListener('keydown', handleKeyDown, false)
  }, [
    sidebarVisible,
    isModalOpen,
    toggleSidebar,
    openSaveModal,
    openDeleteModal,
    openShortcutsModal,
    closeAllModals,
    closeSidebar,
    createNote,
    deleteNote,
    navigateNotes,
    getCurrentNote,
  ])
}
