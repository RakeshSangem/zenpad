// Two lists of the same kind sitting next to each other is a state the note
// cannot actually represent: getMarkdown() writes them as a single list, and
// reading that markdown back produces one list again. Only the stored JSON
// keeps them apart, where they show up as an unexplained gap mid-list.
//
// So adjacent lists get joined. This repairs notes that were split before the
// Backspace fix landed, and covers any other route that might still split one.

export const LIST_TYPES = ["bulletList", "orderedList", "taskList"];

const sameAttrs = (a, b) => {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => a[key] === b[key]);
};

/**
 * Positions where a list is immediately followed by a list of the same kind,
 * ordered last-to-first so joining at one never shifts the ones still to come.
 *
 * Attributes have to match too: two ordered lists starting at different numbers
 * are genuinely different lists, and joining them would renumber one of them.
 */
export function findAdjacentListJoins(doc, listTypes = LIST_TYPES) {
  const joins = [];

  const walk = (node, contentStart) => {
    node.forEach((child, childOffset, index) => {
      const start = contentStart + childOffset;
      const next = node.maybeChild(index + 1);

      if (
        next &&
        listTypes.includes(child.type.name) &&
        child.type === next.type &&
        sameAttrs(child.attrs, next.attrs)
      ) {
        joins.push(start + child.nodeSize);
      }

      if (child.content.size) walk(child, start + 1);
    });
  };

  walk(doc, 0);

  return joins.sort((a, b) => b - a);
}
