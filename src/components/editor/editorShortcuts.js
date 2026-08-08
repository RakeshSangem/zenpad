import { Extension } from "@tiptap/core";
import { isApplePlatform } from "../../lib/platform";

/**
 * macOS convention: Cmd+Up puts the caret at the top of the note and Cmd+Down
 * at the bottom. Browsers apply that inconsistently inside a contenteditable,
 * so bind it explicitly.
 *
 * Windows and Linux are left alone on purpose — there Ctrl+Home and Ctrl+End
 * are the convention and already work, while Ctrl+Up/Down means move by
 * paragraph. Note navigation lives on the Alt variant either way (see
 * useKeyboardShortcuts), which these bindings do not match.
 */
export const DocumentEdgeShortcuts = Extension.create({
  name: "documentEdgeShortcuts",

  addKeyboardShortcuts() {
    if (!isApplePlatform()) return {};
    return {
      "Mod-ArrowUp": () => this.editor.commands.focus("start"),
      "Mod-ArrowDown": () => this.editor.commands.focus("end"),
    };
  },
});
