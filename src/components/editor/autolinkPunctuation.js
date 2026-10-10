import {
  combineTransactionSteps,
  Extension,
  findChildrenInRange,
  getChangedRanges,
} from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { findPunctuatedLink } from "../../lib/autolink";

const ENDS_IN_WHITESPACE = /\s$/;
const TRAILING_WHITESPACE = /\s+$/;
const LAST_WORD = /\S+$/;

/**
 * Links a URL that punctuation follows -- "see example.org, then" -- which
 * Tiptap's own autolink skips, because it only acts on a word that is nothing
 * but a link. The two never both fire: findPunctuatedLink returns nothing for
 * the shapes autolink already covers.
 *
 * Deliberately shaped like Tiptap's autolink plugin, down to the changed-range
 * walk, so a word is considered at the same moment theirs is: when the
 * whitespace ending it is typed, or when the line it sits on is left behind.
 */
export const AutolinkPunctuation = Extension.create({
  name: "autolinkPunctuation",

  addOptions() {
    return { defaultProtocol: "https" };
  },

  addProseMirrorPlugins() {
    const { defaultProtocol } = this.options;

    return [
      new Plugin({
        key: new PluginKey("autolinkPunctuation"),
        appendTransaction: (transactions, oldState, newState) => {
          const linkType = newState.schema.marks.link;
          const docChanged =
            transactions.some((transaction) => transaction.docChanged) &&
            !oldState.doc.eq(newState.doc);
          const prevented = transactions.some((transaction) =>
            transaction.getMeta("preventAutolink"),
          );
          if (!linkType || !docChanged || prevented) return null;

          const { tr } = newState;
          const transform = combineTransactionSteps(oldState.doc, [
            ...transactions,
          ]);

          getChangedRanges(transform).forEach(({ newRange }) => {
            const blocks = findChildrenInRange(
              newState.doc,
              newRange,
              (node) => node.isTextblock,
            );
            if (!blocks.length) return;

            const [block] = blocks;
            // More than one block in the range means a line was left behind --
            // Enter, or a paste -- so the first one is finished either way.
            // Otherwise the word only counts once its whitespace is typed.
            let text;
            if (blocks.length > 1) {
              text = newState.doc.textBetween(
                block.pos,
                block.pos + block.node.nodeSize,
                undefined,
                " ",
              );
            } else {
              const typed = newState.doc.textBetween(
                newRange.from,
                newRange.to,
                " ",
                " ",
              );
              if (!ENDS_IN_WHITESPACE.test(typed)) return;
              text = newState.doc.textBetween(
                block.pos,
                newRange.to,
                undefined,
                " ",
              );
            }

            const trimmed = text.replace(TRAILING_WHITESPACE, "");
            const wordStart = trimmed.search(LAST_WORD);
            if (wordStart < 0) return;

            const found = findPunctuatedLink(
              trimmed.slice(wordStart),
              defaultProtocol,
            );
            if (!found) return;

            // textBetween starts at the block's own position, one before its
            // first character.
            const from = block.pos + wordStart + found.start + 1;
            const to = block.pos + wordStart + found.end + 1;
            if (newState.doc.rangeHasMark(from, to, linkType)) return;
            if (
              newState.schema.marks.code &&
              newState.doc.rangeHasMark(from, to, newState.schema.marks.code)
            ) {
              return;
            }

            tr.addMark(from, to, linkType.create({ href: found.href }));
          });

          return tr.steps.length ? tr : null;
        },
      }),
    ];
  },
});
