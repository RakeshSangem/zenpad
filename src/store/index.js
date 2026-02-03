import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const STORAGE_KEY = 'zenpad-storage'

// Generate unique ID for notes
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Create initial note
const createNewNote = () => {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    title: '',
    content: '',
    createdAt: now,
    updatedAt: now,
  }
}

export const useAppStore = create(
  persist(
    (set, get) => ({
      // Notes state
      notes: [createNewNote()],
      currentNoteId: null,
      
      // UI state
      sidebarVisible: false,
      saveModalOpen: false,
      deleteModalOpen: false,
      shortcutsModalOpen: false,
      
      // Status
      saveStatus: 'saved',
      
      // Computed
      getCurrentNote: () => {
        const { notes, currentNoteId } = get()
        return notes.find(note => note.id === currentNoteId) || notes[0] || null
      },
      
      getNoteIndex: (noteId) => {
        const { notes } = get()
        return notes.findIndex(note => note.id === noteId)
      },
      
      // Notes actions
      createNote: () => {
        const newNote = createNewNote()
        set(state => ({
          notes: [newNote, ...state.notes],
          currentNoteId: newNote.id,
          saveStatus: 'saved'
        }))
        return newNote.id
      },
      
      updateNoteContent: (content) => {
        const { currentNoteId } = get()
        set(state => ({
          notes: state.notes.map(note =>
            note.id === currentNoteId
              ? { ...note, content, updatedAt: new Date().toISOString() }
              : note
          ),
          saveStatus: 'saving'
        }))
        
        // Debounce save status
        setTimeout(() => {
          set({ saveStatus: 'saved' })
        }, 1000)
      },
      
      updateNoteTitle: (title) => {
        const { currentNoteId } = get()
        set(state => ({
          notes: state.notes.map(note =>
            note.id === currentNoteId
              ? { ...note, title, updatedAt: new Date().toISOString() }
              : note
          ),
          saveStatus: 'saving'
        }))
        
        setTimeout(() => {
          set({ saveStatus: 'saved' })
        }, 1000)
      },
      
      deleteNote: (noteId) => {
        const { currentNoteId } = get()
        set(state => {
          const filtered = state.notes.filter(note => note.id !== noteId)
          
          // If deleting current note, switch to another note
          if (noteId === currentNoteId) {
            if (filtered.length > 0) {
              return { notes: filtered, currentNoteId: filtered[0].id }
            } else {
              // Create a new note if all were deleted
              const newNote = createNewNote()
              return { notes: [newNote], currentNoteId: newNote.id }
            }
          }
          
          return { notes: filtered }
        })
      },
      
      switchToNote: (noteId) => {
        set({ currentNoteId: noteId })
      },
      
      navigateNotes: (direction) => {
        const { notes, currentNoteId, getNoteIndex } = get()
        const currentIndex = getNoteIndex(currentNoteId)
        
        if (currentIndex === -1) return
        
        let newIndex
        if (direction === 'next') {
          newIndex = currentIndex < notes.length - 1 ? currentIndex + 1 : 0
        } else {
          newIndex = currentIndex > 0 ? currentIndex - 1 : notes.length - 1
        }
        
        set({ currentNoteId: notes[newIndex].id })
      },
      
      // UI actions
      toggleSidebar: () => {
        set(state => ({ sidebarVisible: !state.sidebarVisible }))
      },
      
      openSidebar: () => {
        set({ sidebarVisible: true })
      },
      
      closeSidebar: () => {
        set({ sidebarVisible: false })
      },
      
      openSaveModal: () => {
        set({ saveModalOpen: true })
      },
      
      closeSaveModal: () => {
        set({ saveModalOpen: false })
      },
      
      openDeleteModal: () => {
        set({ deleteModalOpen: true })
      },
      
      closeDeleteModal: () => {
        set({ deleteModalOpen: false })
      },
      
      openShortcutsModal: () => {
        set({ shortcutsModalOpen: true })
      },
      
      closeShortcutsModal: () => {
        set({ shortcutsModalOpen: false })
      },
      
      closeAllModals: () => {
        set({
          saveModalOpen: false,
          deleteModalOpen: false,
          shortcutsModalOpen: false
        })
      }
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ 
        notes: state.notes, 
        currentNoteId: state.currentNoteId 
      })
    }
  )
)
