import test from "node:test";
import assert from "node:assert/strict";

import { compareCellText, sortRowsByColumn } from "../src/lib/tableActions.js";

const rowsOf = (...values) =>
  values.map((value) => ({ cells: [{ textContent: value }] }));

const textsOf = (rows) => rows.map((row) => row.cells[0].textContent);

test("numbers compare numerically, not lexically", () => {
  assert.ok(compareCellText("9", "10") < 0);
  assert.ok(compareCellText("-2", "1.5") < 0);
  assert.equal(compareCellText("2", "2.0"), 0);
});

test("text compares case-insensitively", () => {
  assert.ok(compareCellText("apple", "Banana") < 0);
  assert.ok(compareCellText("item 2", "item 10") < 0);
});

test("sorting keeps the header row in place", () => {
  const rows = rowsOf("Name", "carol", "alice", "bob");
  assert.deepEqual(textsOf(sortRowsByColumn(rows, 0, "asc", true)), [
    "Name",
    "alice",
    "bob",
    "carol",
  ]);
  assert.deepEqual(textsOf(sortRowsByColumn(rows, 0, "desc", true)), [
    "Name",
    "carol",
    "bob",
    "alice",
  ]);
});

test("sorting without a header row includes every row", () => {
  const rows = rowsOf("3", "1", "2");
  assert.deepEqual(textsOf(sortRowsByColumn(rows, 0, "asc", false)), [
    "1",
    "2",
    "3",
  ]);
});

test("blank cells sink to the bottom in both directions", () => {
  const rows = rowsOf("b", "", "a", "  ");
  assert.deepEqual(textsOf(sortRowsByColumn(rows, 0, "asc", false)), [
    "a",
    "b",
    "",
    "  ",
  ]);
  assert.deepEqual(textsOf(sortRowsByColumn(rows, 0, "desc", false)), [
    "b",
    "a",
    "",
    "  ",
  ]);
});

test("equal values keep their original order", () => {
  const rows = [
    { id: 1, cells: [{ textContent: "a" }] },
    { id: 2, cells: [{ textContent: "a" }] },
    { id: 3, cells: [{ textContent: "A" }] },
  ];
  assert.deepEqual(
    sortRowsByColumn(rows, 0, "asc", false).map((row) => row.id),
    [1, 2, 3],
  );
});
