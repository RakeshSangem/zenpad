import React, { useMemo, useState } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { useAppStore } from "../store";
import { noteTitle, notePreview } from "../lib/noteSummary";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "./ui/command";

/**
 * Cmd/Ctrl+K note search. Stepping through notes with the arrow shortcuts stops
 * scaling after a handful, so this is the way to reach one by name.
 */
function QuickSwitcher({ onSelectNote }) {
  const {
    notes,
    currentNoteId,
    quickSwitcherOpen,
    closeQuickSwitcher,
    createNote,
    updateNoteTitle,
    openDeleteModal,
  } = useAppStore();
  const [query, setQuery] = useState("");

  const recentFirst = useMemo(
    () =>
      [...notes]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .map((note) => ({
          note,
          title: noteTitle(note),
          preview: notePreview(note),
        })),
    [notes],
  );

  const close = () => {
    setQuery("");
    closeQuickSwitcher();
  };

  const select = (noteId) => {
    close();
    onSelectNote(noteId);
  };

  return (
    <CommandDialog
      open={quickSwitcherOpen}
      onOpenChange={(open) => !open && close()}
      title="Search notes"
      description="Search your notes by title or contents"
      // Sits high on the screen rather than centred, so it lands in the same
      // place on a laptop and on a large display.
      className="top-[10vh] max-w-lg translate-y-0 sm:max-w-lg"
    >
      {/* CommandDialog only renders the dialog shell — cmdk's input and list
          need the Command root as an ancestor. */}
      <Command loop>
        <CommandInput
          placeholder="Search notes..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>No notes found.</CommandEmpty>
          <CommandGroup heading="Notes">
            {recentFirst.map(({ note, title, preview }) => (
              <CommandItem
                key={note.id}
                // cmdk matches against this, so searching covers the preview too.
                value={`${title} ${preview} ${note.id}`}
                onSelect={() => select(note.id)}
                className="gap-2.5 py-2"
              >
                <FileText className="shrink-0" strokeWidth={1.75} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{title}</span>
                  {preview && (
                    <span className="block truncate text-xs text-neutral-400 dark:text-neutral-500">
                      {preview}
                    </span>
                  )}
                </span>
                {note.id === currentNoteId && (
                  <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                    Current
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup forceMount heading="Actions">
            <CommandItem
              // Stays visible while filtering, so a search that finds nothing
              // turns into "create this note".
              forceMount
              value="new note create"
              onSelect={() => {
                const title = query.trim();
                close();
                createNote();
                // createNote switches to the new note, so this titles that one.
                if (title) updateNoteTitle(title);
              }}
              className="gap-2.5 py-2"
            >
              <Plus className="shrink-0" strokeWidth={1.75} />
              <span className="text-sm">
                {query ? `New note “${query}”` : "New note"}
              </span>
            </CommandItem>
            {notes.length > 1 && (
              <CommandItem
                // Mod+Backspace yields to text editing, so this is how you
                // delete the note you are in the middle of writing.
                forceMount
                value="delete note remove"
                onSelect={() => {
                  close();
                  openDeleteModal();
                }}
                className="gap-2.5 py-2 text-red-600 [&_svg]:text-red-600 dark:text-red-400 dark:[&_svg]:text-red-400"
              >
                <Trash2 className="shrink-0" strokeWidth={1.75} />
                <span className="text-sm">Delete this note</span>
              </CommandItem>
            )}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

export default QuickSwitcher;
