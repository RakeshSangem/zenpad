import { Extension } from "@tiptap/core";
import { isApplePlatform } from "../../lib/platform";

/**
 * macOS text-editing conventions the editor would otherwise get wrong.
 *
 * - Cmd+Up / Cmd+Down put the caret at the top or bottom of the note. Browsers
 *   apply that inconsistently inside a contenteditable, so bind it explicitly.
 * - Cmd+Backspace deletes back to the start of the line. Tiptap's core keymap
 *   binds Mod-Backspace to its ordinary backspace handler, which swallows the
 *   native behaviour and deletes a single character instead.
 *
 * Windows and Linux are left alone: there Ctrl+Home / Ctrl+End are the
 * convention for the caret, Ctrl+Backspace deletes the previous word, and both
 * already work. Note navigation lives on the Alt variant (see
 * useKeyboardShortcuts), which none of these bindings match.
 */
export const DocumentEdgeShortcuts = Extension.create({
  name: "documentEdgeShortcuts",

  addKeyboardShortcuts() {
    if (!isApplePlatform()) return {};

    return {
      "Mod-ArrowUp": () => this.editor.commands.focus("start"),
      "Mod-ArrowDown": () => this.editor.commands.focus("end"),
      "Mod-Backspace": () => {
        const { selection } = this.editor.state;
        const { $from, empty } = selection;
        // A selection deletes itself, and at the start of a block the default
        // handler joins with the block above — both are what you want.
        if (!empty) return false;
        const lineStart = $from.start();
        if ($from.pos === lineStart) return false;
        return this.editor.commands.deleteRange({
          from: lineStart,
          to: $from.pos,
        });
      },
    };
  },
});
