import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { canJoin } from "@tiptap/pm/transform";
import { isApplePlatform } from "../../lib/platform";
import { findListItemJoinDepth } from "../../lib/listBackspace";
import { findAdjacentListJoins } from "../../lib/listMerge";

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

/**
 * Backspace at the start of a list item merges it into the item above rather
 * than lifting it out of the list. Tiptap's own list keymap lifts regardless of
 * position, which splits a list in two whenever the item is not the first one.
 *
 * See findListItemJoinDepth for which cases are handled here and which fall
 * through to the default.
 */
export const ListItemBackspace = Extension.create({
  name: "listItemBackspace",
  // ListKeymap binds Backspace at the default 100, so outrank it.
  priority: 101,

  addKeyboardShortcuts() {
    const joinIntoItemAbove = () => {
      if (findListItemJoinDepth(this.editor.state) === null) return false;
      return this.editor.commands.joinTextblockBackward();
    };

    return {
      Backspace: joinIntoItemAbove,
      "Mod-Backspace": joinIntoItemAbove,
    };
  },
});

/**
 * Joins lists that end up next to each other, so a note that was split before
 * ListItemBackspace existed repairs itself as soon as it is opened.
 *
 * See findAdjacentListJoins for why adjacent lists are always a mistake here.
 */
export const MergeAdjacentLists = Extension.create({
  name: "mergeAdjacentLists",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("mergeAdjacentLists"),
        appendTransaction: (transactions, _oldState, newState) => {
          if (!transactions.some((transaction) => transaction.docChanged)) {
            return null;
          }

          const joins = findAdjacentListJoins(newState.doc);
          if (!joins.length) return null;

          const tr = newState.tr;
          let joined = false;
          // Descending, so each join leaves the remaining positions untouched.
          for (const pos of joins) {
            if (canJoin(tr.doc, pos)) {
              tr.join(pos);
              joined = true;
            }
          }

          return joined ? tr : null;
        },
      }),
    ];
  },
});
