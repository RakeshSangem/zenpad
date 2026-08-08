import { Extension } from "@tiptap/core";

/**
 * macOS convention: Cmd/Ctrl+Up puts the caret at the top of the note and
 * Cmd/Ctrl+Down at the bottom. Browsers apply that inconsistently inside a
 * contenteditable, so bind it explicitly. Note navigation lives on the Alt
 * variant (see useKeyboardShortcuts), which these bindings do not match.
 */
export const DocumentEdgeShortcuts = Extension.create({
  name: "documentEdgeShortcuts",

  addKeyboardShortcuts() {
    return {
      "Mod-ArrowUp": () => this.editor.commands.focus("start"),
      "Mod-ArrowDown": () => this.editor.commands.focus("end"),
    };
  },
});
