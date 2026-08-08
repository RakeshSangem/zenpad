import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  CodeXmlIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ListChecksIcon,
  ListIcon,
  ListOrderedIcon,
  MinusIcon,
  PilcrowIcon,
  Table2Icon,
  TextQuoteIcon,
} from "lucide-react";

export const slashFeedbackKey = new PluginKey("slash-command-feedback");

export const SlashCommandFeedback = Extension.create({
  name: "slashCommandFeedback",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: slashFeedbackKey,
        state: {
          init: () => ({ dismissedAt: null }),
          apply(transaction, previous) {
            const meta = transaction.getMeta(slashFeedbackKey);
            if (meta?.dismiss) {
              return { dismissedAt: transaction.selection.from };
            }
            if (transaction.docChanged || transaction.selectionSet) {
              return { dismissedAt: null };
            }
            return previous;
          },
        },
        props: {
          decorations(state) {
            const { selection } = state;
            if (!selection.empty) return null;

            const feedback = slashFeedbackKey.getState(state);
            if (feedback?.dismissedAt === selection.from) return null;

            const { $from } = selection;
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
              return null;
            }

            const query = textBefore.slice(slashIndex + 1);
            if (/\s{2}|\n/.test(query)) return null;

            const from = $from.start() + slashIndex;
            return DecorationSet.create(state.doc, [
              Decoration.inline(from, selection.from, {
                class: "slash-command-token",
              }),
            ]);
          },
        },
      }),
    ];
  },
});

export const SLASH_COMMANDS = [
  {
    label: "Text",
    icon: PilcrowIcon,
    keywords: "paragraph text",
    run: (chain) => chain.setParagraph(),
  },
  {
    label: "Heading 1",
    icon: Heading1Icon,
    keywords: "h1 title",
    run: (chain) => chain.toggleHeading({ level: 1 }),
  },
  {
    label: "Heading 2",
    icon: Heading2Icon,
    keywords: "h2 subtitle",
    run: (chain) => chain.toggleHeading({ level: 2 }),
  },
  {
    label: "Heading 3",
    icon: Heading3Icon,
    keywords: "h3",
    run: (chain) => chain.toggleHeading({ level: 3 }),
  },
  {
    label: "Bulleted list",
    icon: ListIcon,
    keywords: "unordered bullet",
    run: (chain) => chain.toggleBulletList(),
  },
  {
    label: "Numbered list",
    icon: ListOrderedIcon,
    keywords: "ordered number",
    run: (chain) => chain.toggleOrderedList(),
  },
  {
    label: "Checklist",
    icon: ListChecksIcon,
    keywords: "task todo check",
    run: (chain) => chain.toggleTaskList(),
  },
  {
    label: "Table",
    icon: Table2Icon,
    keywords: "grid rows columns",
    run: (chain) =>
      chain.insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
  },
  {
    label: "Code block",
    icon: CodeXmlIcon,
    keywords: "code pre",
    run: (chain) => chain.toggleCodeBlock(),
  },
  {
    label: "Blockquote",
    icon: TextQuoteIcon,
    keywords: "quote",
    run: (chain) => chain.toggleBlockquote(),
  },
  {
    label: "Divider",
    icon: MinusIcon,
    keywords: "rule line separator",
    run: (chain) => chain.setHorizontalRule(),
  },
];

