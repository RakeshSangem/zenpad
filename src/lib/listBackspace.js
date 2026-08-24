// Tiptap's list keymap answers Backspace-at-the-start-of-an-item with
// liftListItem() wherever the item happens to sit. Lifting the *first* item
// outdents it, which is what you want. Doing it to an item in the middle pulls
// that item out from between its siblings, which splits the surrounding list
// into two lists with a stray paragraph wedged between the halves.
//
// A middle item should merge into the item above instead. This decides which
// case we are in; the caller joins or falls through to the default lift.

export const LIST_ITEM_TYPES = ["listItem", "taskItem"];

/**
 * Depth of the list item whose content should merge into the previous item, or
 * null when the default Backspace handling should run instead.
 */
export function findListItemJoinDepth(state, itemTypes = LIST_ITEM_TYPES) {
  const { selection } = state;
  // A non-empty selection deletes itself; that path never splits a list.
  if (!selection.empty) return null;

  const { $from } = selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if (!itemTypes.includes($from.node(depth).type.name)) continue;

    // Only the very start of the item's first block. Deeper into the item — a
    // second paragraph, or a nested list — is ordinary editing.
    if ($from.pos !== $from.start(depth) + 1) return null;

    // The first item of a list has nothing above it to merge into, so leave it
    // to the default lift and keep outdenting working.
    if ($from.index(depth - 1) === 0) return null;

    return depth;
  }

  return null;
}
