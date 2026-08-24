import test from "node:test";
import assert from "node:assert/strict";
import { Schema } from "@tiptap/pm/model";
import { EditorState, TextSelection } from "@tiptap/pm/state";

import { findListItemJoinDepth } from "../src/lib/listBackspace.js";

// Just enough of the editor's schema to build list documents.
const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    heading: { content: "inline*", group: "block" },
    bulletList: { content: "listItem+", group: "block" },
    taskList: { content: "taskItem+", group: "block" },
    listItem: { content: "paragraph block*" },
    taskItem: { content: "paragraph block*" },
    text: { group: "inline" },
  },
});

const { paragraph, bulletList, taskList, listItem, taskItem, heading, doc } =
  schema.nodes;

const para = (text) => paragraph.create(null, text ? schema.text(text) : null);
const item = (...blocks) => listItem.create(null, blocks);
const list = (...texts) => bulletList.create(null, texts.map((t) => item(para(t))));

// Position of the first character of the nth (0-indexed) top-level list item.
const startOfItem = (state, index) => {
  const positions = [];
  state.doc.descendants((node, pos) => {
    if (node.type.name === "paragraph") positions.push(pos + 1);
  });
  return positions[index];
};

const stateAt = (docNode, pos) => {
  const state = EditorState.create({ schema, doc: docNode });
  return state.apply(
    state.tr.setSelection(TextSelection.create(state.doc, pos)),
  );
};

test("a middle item joins into the item above", () => {
  const base = EditorState.create({
    schema,
    doc: doc.create(null, [list("one", "two", "three")]),
  });
  const state = stateAt(base.doc, startOfItem(base, 2));
  assert.equal(findListItemJoinDepth(state), 2);
});

test("the last item joins too", () => {
  const base = EditorState.create({
    schema,
    doc: doc.create(null, [list("one", "two", "three")]),
  });
  const state = stateAt(base.doc, startOfItem(base, 2));
  assert.notEqual(findListItemJoinDepth(state), null);
});

test("the first item is left to the default lift, so outdent still works", () => {
  const base = EditorState.create({
    schema,
    doc: doc.create(null, [list("one", "two", "three")]),
  });
  const state = stateAt(base.doc, startOfItem(base, 0));
  assert.equal(findListItemJoinDepth(state), null);
});

test("a caret inside the text is ordinary editing", () => {
  const base = EditorState.create({
    schema,
    doc: doc.create(null, [list("one", "two", "three")]),
  });
  const state = stateAt(base.doc, startOfItem(base, 2) + 2);
  assert.equal(findListItemJoinDepth(state), null);
});

test("a non-empty selection is left alone", () => {
  const base = EditorState.create({
    schema,
    doc: doc.create(null, [list("one", "two", "three")]),
  });
  const start = startOfItem(base, 2);
  const state = base.apply(
    base.tr.setSelection(TextSelection.create(base.doc, start, start + 3)),
  );
  assert.equal(findListItemJoinDepth(state), null);
});

test("a second paragraph inside an item is ordinary editing", () => {
  const docNode = doc.create(null, [
    bulletList.create(null, [
      item(para("one")),
      item(para("two"), para("also two")),
    ]),
  ]);
  const base = EditorState.create({ schema, doc: docNode });
  // third paragraph in document order is the item's second block
  const state = stateAt(docNode, startOfItem(base, 2));
  assert.equal(findListItemJoinDepth(state), null);
});

test("a nested item resolves to the inner list item, not the outer one", () => {
  const docNode = doc.create(null, [
    bulletList.create(null, [
      item(
        para("outer"),
        bulletList.create(null, [item(para("first")), item(para("second"))]),
      ),
    ]),
  ]);
  const base = EditorState.create({ schema, doc: docNode });
  // "second" is the third paragraph in document order
  const state = stateAt(docNode, startOfItem(base, 2));
  assert.equal(findListItemJoinDepth(state), 4);
});

test("the first item of a nested list still outdents", () => {
  const docNode = doc.create(null, [
    bulletList.create(null, [
      item(
        para("outer"),
        bulletList.create(null, [item(para("first")), item(para("second"))]),
      ),
    ]),
  ]);
  const base = EditorState.create({ schema, doc: docNode });
  const state = stateAt(docNode, startOfItem(base, 1));
  assert.equal(findListItemJoinDepth(state), null);
});

test("task items are handled the same way", () => {
  const docNode = doc.create(null, [
    taskList.create(null, [
      taskItem.create(null, para("one")),
      taskItem.create(null, para("two")),
    ]),
  ]);
  const base = EditorState.create({ schema, doc: docNode });
  const state = stateAt(docNode, startOfItem(base, 1));
  assert.equal(findListItemJoinDepth(state), 2);
});

test("a paragraph outside any list is untouched", () => {
  const docNode = doc.create(null, [heading.create(null, schema.text("Title"))]);
  const state = stateAt(docNode, 1);
  assert.equal(findListItemJoinDepth(state), null);
});
