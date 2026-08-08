import test from "node:test";
import assert from "node:assert/strict";

import { resolveCommandMenuKey } from "../src/lib/commandKeyboard.js";

test("ArrowDown and ArrowUp wrap through commands", () => {
  assert.deepEqual(resolveCommandMenuKey({ key: "ArrowDown" }, 2, 3), {
    type: "navigate",
    index: 0,
  });
  assert.deepEqual(resolveCommandMenuKey({ key: "ArrowUp" }, 0, 3), {
    type: "navigate",
    index: 2,
  });
});

test("Tab and Shift+Tab navigate without leaving the editor", () => {
  assert.deepEqual(
    resolveCommandMenuKey({ key: "Tab", shiftKey: false }, 0, 3),
    { type: "navigate", index: 1 },
  );
  assert.deepEqual(
    resolveCommandMenuKey({ key: "Tab", shiftKey: true }, 0, 3),
    { type: "navigate", index: 2 },
  );
});

test("Home, End, Enter, and Escape resolve deterministic actions", () => {
  assert.deepEqual(resolveCommandMenuKey({ key: "Home" }, 2, 4), {
    type: "navigate",
    index: 0,
  });
  assert.deepEqual(resolveCommandMenuKey({ key: "End" }, 0, 4), {
    type: "navigate",
    index: 3,
  });
  assert.deepEqual(resolveCommandMenuKey({ key: "Enter" }, 2, 4), {
    type: "select",
    index: 2,
  });
  assert.deepEqual(resolveCommandMenuKey({ key: "Escape" }, 0, 0), {
    type: "dismiss",
  });
});

test("unrelated keys and empty menus are not intercepted", () => {
  assert.deepEqual(resolveCommandMenuKey({ key: "a" }, 0, 4), {
    type: "ignore",
  });
  assert.deepEqual(resolveCommandMenuKey({ key: "ArrowDown" }, 0, 0), {
    type: "ignore",
  });
  assert.deepEqual(
    resolveCommandMenuKey({ key: "ArrowDown", isComposing: true }, 0, 4),
    { type: "ignore" },
  );
});
