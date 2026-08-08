import test from "node:test";
import assert from "node:assert/strict";
import { looksLikeMarkdown } from "../src/lib/markdownPaste.js";

test("detects Markdown block structures", () => {
  assert.equal(looksLikeMarkdown("# Heading"), true);
  assert.equal(looksLikeMarkdown("- [ ] Buy butter\n- [x] Buy eggs"), true);
  assert.equal(looksLikeMarkdown("1. First\n2. Second"), true);
  assert.equal(looksLikeMarkdown("```js\nconst ready = true\n```"), true);
  assert.equal(
    looksLikeMarkdown("| Name | Done |\n| --- | --- |\n| Eggs | yes |"),
    true,
  );
});

test("detects intentional inline Markdown", () => {
  assert.equal(looksLikeMarkdown("Read **this carefully**."), true);
  assert.equal(looksLikeMarkdown("Open [Zenpad](https://example.com)."), true);
  assert.equal(looksLikeMarkdown("Use `npm run dev` next."), true);
});

test("leaves ordinary prose and punctuation alone", () => {
  assert.equal(looksLikeMarkdown("We should ship this tomorrow."), false);
  assert.equal(looksLikeMarkdown("The total is 1.5 and # is a symbol."), false);
  assert.equal(looksLikeMarkdown("Email rakesh@example.com"), false);
  assert.equal(looksLikeMarkdown(""), false);
});
