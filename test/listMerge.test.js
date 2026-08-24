import test from "node:test";
import assert from "node:assert/strict";
import { Schema } from "@tiptap/pm/model";

import { findAdjacentListJoins } from "../src/lib/listMerge.js";

const schema = new Schema({
  nodes: {
    doc: { content: "block+" },
    paragraph: { content: "inline*", group: "block" },
    bulletList: { content: "listItem+", group: "block" },
    orderedList: {
      content: "listItem+",
      group: "block",
      attrs: { start: { default: 1 } },
    },
    taskList: { content: "listItem+", group: "block" },
    listItem: { content: "paragraph block*" },
    text: { group: "inline" },
  },
});

const { paragraph, bulletList, orderedList, taskList, listItem, doc } =
  schema.nodes;

const para = (text) => paragraph.create(null, schema.text(text));
const item = (...blocks) => listItem.create(null, blocks);
const bullets = (...texts) =>
  bulletList.create(null, texts.map((t) => item(para(t))));

test("two adjacent bullet lists report one join", () => {
  const docNode = doc.create(null, [bullets("one", "two"), bullets("three")]);
  const joins = findAdjacentListJoins(docNode);
  assert.equal(joins.length, 1);
  // the boundary sits at the end of the first list
  assert.equal(joins[0], docNode.child(0).nodeSize);
});

test("a single list reports nothing", () => {
  const docNode = doc.create(null, [bullets("one", "two", "three")]);
  assert.deepEqual(findAdjacentListJoins(docNode), []);
});

test("lists separated by a paragraph are left alone", () => {
  const docNode = doc.create(null, [
    bullets("one"),
    para("a note between them"),
    bullets("two"),
  ]);
  assert.deepEqual(findAdjacentListJoins(docNode), []);
});

test("lists of different kinds are left alone", () => {
  const docNode = doc.create(null, [
    bullets("one"),
    orderedList.create(null, [item(para("two"))]),
    taskList.create(null, [item(para("three"))]),
  ]);
  assert.deepEqual(findAdjacentListJoins(docNode), []);
});

test("ordered lists starting at different numbers are left alone", () => {
  const docNode = doc.create(null, [
    orderedList.create({ start: 1 }, [item(para("one"))]),
    orderedList.create({ start: 7 }, [item(para("seven"))]),
  ]);
  assert.deepEqual(findAdjacentListJoins(docNode), []);
});

test("ordered lists with matching attributes do join", () => {
  const docNode = doc.create(null, [
    orderedList.create({ start: 1 }, [item(para("one"))]),
    orderedList.create({ start: 1 }, [item(para("two"))]),
  ]);
  assert.equal(findAdjacentListJoins(docNode).length, 1);
});

test("three adjacent lists report both joins, last boundary first", () => {
  const docNode = doc.create(null, [
    bullets("one"),
    bullets("two"),
    bullets("three"),
  ]);
  const joins = findAdjacentListJoins(docNode);
  assert.equal(joins.length, 2);
  assert.ok(joins[0] > joins[1], "positions must descend so joins stay valid");
});

test("nested adjacent lists are found too", () => {
  const nested = bulletList.create(null, [
    item(
      para("outer"),
      bulletList.create(null, [item(para("a"))]),
      bulletList.create(null, [item(para("b"))]),
    ),
  ]);
  const docNode = doc.create(null, [nested]);
  assert.equal(findAdjacentListJoins(docNode).length, 1);
});

test("reported positions are the boundary between the two lists", () => {
  const first = bullets("one", "two");
  const second = bullets("three");
  const docNode = doc.create(null, [first, second]);
  const [pos] = findAdjacentListJoins(docNode);
  // resolving there lands between the two lists at depth 0
  const $pos = docNode.resolve(pos);
  assert.equal($pos.depth, 0);
  assert.equal($pos.nodeBefore.type.name, "bulletList");
  assert.equal($pos.nodeAfter.type.name, "bulletList");
});
