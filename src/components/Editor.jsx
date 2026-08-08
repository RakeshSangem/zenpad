import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { Placeholder } from "@tiptap/extension-placeholder";
import { TableKit } from "@tiptap/extension-table";
import Underline from "@tiptap/extension-underline";
import { useAppStore } from "../store";
import { resolveCommandMenuKey } from "../lib/commandKeyboard";
import { looksLikeMarkdown } from "../lib/markdownPaste";
import { PanelLeft } from "lucide-react";
import { Button } from "./ui/button";
import NoteTitleInput from "./editor/NoteTitleInput";
import SlashCommandMenu from "./editor/SlashCommandMenu";
import TableControls from "./editor/TableControls";
import {
  SLASH_COMMANDS,
  SlashCommandFeedback,
  slashFeedbackKey,
} from "./editor/slashCommands";

const Editor = forwardRef((props, forwardedRef) => {
  const titleRef = useRef(null);
  const textareaRef = useRef(null);
  const loadingNoteRef = useRef(false);
  const appliedDocumentRef = useRef(null);
  const slashKeyHandlerRef = useRef(null);
  const pasteHandlerRef = useRef(null);
  const [slashMenu, setSlashMenu] = useState(null);
  const [selectedCommand, setSelectedCommand] = useState(0);
  const {
    getCurrentNote,
    updateNoteTitle,
    updateNoteContent,
    updateNoteDocument,
    sidebarVisible,
    toggleSidebar,
    markdownEnabled,
  } = useAppStore();
  const note = getCurrentNote();

  const updateSlashMenu = (instance) => {
    if (!markdownEnabled || !instance.state.selection.empty) {
      setSlashMenu(null);
      return;
    }
    const { $from } = instance.state.selection;
    const textBefore = $from.parent.textBetween(
      0,
      $from.parentOffset,
      undefined,
      "\ufffc",
    );
    const slashIndex = textBefore.lastIndexOf("/");
    if (
      slashIndex < 0 ||
      (slashIndex > 0 && !/\s/.test(textBefore[slashIndex - 1]))
    ) {
      setSlashMenu(null);
      return;
    }
    const query = textBefore.slice(slashIndex + 1);
    if (/\s{2}|\n/.test(query)) {
      setSlashMenu(null);
      return;
    }
    setSlashMenu({
      query: query.toLowerCase(),
      from: $from.start() + slashIndex,
      to: $from.pos,
      anchor: {
        getBoundingClientRect: () => {
          const position = instance.view.coordsAtPos(
            instance.state.selection.from,
          );
          return DOMRect.fromRect({
            x: position.left,
            y: position.top,
            width: Math.max(1, position.right - position.left),
            height: Math.max(1, position.bottom - position.top),
          });
        },
      },
    });
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({ nested: true }),
      TableKit.configure({
        table: {
          resizable: true,
          // Matches the cell min-width in index.css so a drag cannot shrink a
          // column past what the styles will render.
          cellMinWidth: 56,
          handleWidth: 6,
          renderWrapper: true,
        },
      }),
      Underline,
      Placeholder.configure({
        placeholder: "Capture a thought...",
      }),
      Markdown,
      SlashCommandFeedback,
    ],
    content: "",
    onUpdate: ({ editor: instance }) => {
      if (loadingNoteRef.current) return;
      const nextDocument = instance.getJSON();
      // Remember the exact object handed to the store; identity is how the
      // loader below tells our own edits from a note swap or a sync pull.
      appliedDocumentRef.current = nextDocument;
      updateNoteDocument({
        document: nextDocument,
        markdown: instance.getMarkdown(),
      });
      updateSlashMenu(instance);
    },
    onSelectionUpdate: ({ editor: instance }) => updateSlashMenu(instance),
    editorProps: {
      handleKeyDown: (_view, event) =>
        slashKeyHandlerRef.current?.(event) || false,
      handlePaste: (_view, event) => pasteHandlerRef.current?.(event) || false,
    },
  });

  const visibleCommands = slashMenu
    ? SLASH_COMMANDS.filter((command) =>
        `${command.label} ${command.keywords}`
          .toLowerCase()
          .includes(slashMenu.query),
      )
    : [];

  useEffect(() => setSelectedCommand(0), [slashMenu?.query]);

  const runSlashCommand = (command) => {
    if (!editor || !slashMenu || !command) return;
    const chain = editor
      .chain()
      .focus()
      .deleteRange({ from: slashMenu.from, to: slashMenu.to });
    command.run(chain).run();
    setSlashMenu(null);
  };

  const handleEditorKeyDown = (event) => {
    if (!slashMenu) return;
    const action = resolveCommandMenuKey(
      event,
      selectedCommand,
      visibleCommands.length,
    );
    if (action.type === "ignore") return false;

    event.preventDefault();
    event.stopPropagation();

    if (action.type === "dismiss") {
      editor?.view.dispatch(
        editor.state.tr.setMeta(slashFeedbackKey, { dismiss: true }),
      );
      setSlashMenu(null);
    } else if (action.type === "navigate") {
      setSelectedCommand(action.index);
    } else if (action.type === "select") {
      runSlashCommand(visibleCommands[action.index]);
    }

    return true;
  };

  slashKeyHandlerRef.current = handleEditorKeyDown;

  pasteHandlerRef.current = (event) => {
    if (!markdownEnabled || !editor) return false;

    const text = event.clipboardData?.getData("text/plain");
    if (!looksLikeMarkdown(text)) return false;

    event.preventDefault();
    return editor.commands.insertContent(text, { contentType: "markdown" });
  };

  useImperativeHandle(
    forwardedRef,
    () => ({
      focus: () => {
        if (markdownEnabled) editor?.commands.focus();
        else textareaRef.current?.focus();
      },
    }),
    [editor, markdownEnabled],
  );

  useEffect(() => {
    if (!note || !editor || !markdownEnabled) return;
    // Reloading is decided by document identity, not by comparing Markdown:
    // Markdown cannot express everything the document holds (table column
    // widths, for one), so a remote change that only touches those would look
    // identical and never reach the editor. Notes stored before documents were
    // persisted still fall back to the Markdown comparison.
    const documentChanged = note.document
      ? note.document !== appliedDocumentRef.current
      : editor.getMarkdown() !== (note.content || "");

    if (documentChanged) {
      loadingNoteRef.current = true;
      if (note.document) {
        editor.commands.setContent(note.document, { emitUpdate: false });
      } else {
        editor.commands.setContent(note.content || "", {
          contentType: "markdown",
          emitUpdate: false,
        });
      }
      appliedDocumentRef.current = note.document ?? null;
      loadingNoteRef.current = false;
      setSlashMenu(null);
    }
    if (!sidebarVisible) {
      if (!note.title.trim() && !note.content.trim()) titleRef.current?.focus();
    }
  }, [
    note?.id,
    note?.document,
    note?.content,
    editor,
    markdownEnabled,
    sidebarVisible,
  ]);

  useEffect(() => {
    if (markdownEnabled || !textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    if (!sidebarVisible) {
      if (!note.title.trim() && !note.content.trim()) titleRef.current?.focus();
    }
  }, [note?.id, markdownEnabled, sidebarVisible]);

  const handlePlainTextChange = (event) => {
    updateNoteContent(event.target.value);
    event.target.style.height = "auto";
    event.target.style.height = `${event.target.scrollHeight}px`;
  };

  if (!note) {
    return (
      <div className="flex flex-1 items-center justify-center text-neutral-400">
        No note selected
      </div>
    );
  }

  return (
    <div className="zenpad-editor flex h-full flex-1 flex-col overflow-hidden bg-neutral-50 dark:bg-[#1a1a1a]">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-20 rounded-[6px] p-1 text-neutral-400 opacity-40 transition-[color,background-color,opacity] duration-150 hover:bg-neutral-100 hover:text-neutral-600 hover:opacity-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
        aria-label="Toggle sidebar"
      >
        <PanelLeft className="size-4" strokeWidth={1.75} aria-hidden="true" />
      </Button>

      <div className="flex-1 overflow-y-auto pt-12 sm:pt-0">
        <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:pb-8 sm:pt-16 lg:pl-10 lg:pr-0">
          <NoteTitleInput
            ref={titleRef}
            value={note.title}
            onChange={(event) => updateNoteTitle(event.target.value)}
            onCommit={(event) => {
              const title = event.target.value.trim();
              if (title !== note.title) updateNoteTitle(title);
            }}
            onEnter={() => {
              if (markdownEnabled) editor?.commands.focus("start");
              else textareaRef.current?.focus();
            }}
          />
          {markdownEnabled ? (
            <TableControls editor={editor}>
              <EditorContent editor={editor} className="tiptap-editor" />
            </TableControls>
          ) : (
            <textarea
              ref={textareaRef}
              value={note.content}
              onChange={handlePlainTextChange}
              className="editor-textarea min-h-[calc(100vh-200px)]"
              placeholder="Capture a thought..."
              spellCheck={false}
            />
          )}
        </div>
      </div>

      <SlashCommandMenu
        open={Boolean(slashMenu)}
        anchor={slashMenu?.anchor}
        commands={visibleCommands}
        selectedIndex={selectedCommand}
        onSelectedIndexChange={setSelectedCommand}
        onSelect={runSlashCommand}
        onDismiss={() => setSlashMenu(null)}
      />

      <div className="group px-5 py-3 text-xs text-neutral-300 transition-colors duration-150 hover:text-neutral-500 sm:px-8 lg:px-0 dark:text-neutral-700 dark:hover:text-neutral-400">
        <div className="mx-auto flex w-full max-w-210 items-center justify-between">
          <div className="flex items-center gap-4">
            <span>{note.content.length} characters</span>
            <span>
              {note.content.split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <span>
            {markdownEnabled ? "Markdown" : "Plain text"} ·{" "}
            {new Date(note.updatedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>
    </div>
  );
});

Editor.displayName = "Editor";
export default Editor;
