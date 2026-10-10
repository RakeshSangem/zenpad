import test from "node:test";
import assert from "node:assert/strict";
import { findPunctuatedLink } from "../src/lib/autolink.js";

test("links a URL that a clause's punctuation follows", () => {
  assert.deepEqual(findPunctuatedLink("example.org,"), {
    start: 0,
    end: 11,
    href: "https://example.org",
  });
  assert.deepEqual(findPunctuatedLink("www.foo.com."), {
    start: 0,
    end: 11,
    href: "https://www.foo.com",
  });
  assert.deepEqual(findPunctuatedLink("https://a.com/b)"), {
    start: 0,
    end: 15,
    href: "https://a.com/b",
  });
});

test("leaves the cases Tiptap's own autolink already covers", () => {
  assert.equal(findPunctuatedLink("example.com"), null);
  assert.equal(findPunctuatedLink("(example.com)"), null);
  assert.equal(findPunctuatedLink("[example.com]"), null);
});

test("ignores words that are not a link with punctuation after it", () => {
  assert.equal(findPunctuatedLink("hello"), null);
  assert.equal(findPunctuatedLink("foo.com/a,b"), null);
  assert.equal(findPunctuatedLink(""), null);
  assert.equal(findPunctuatedLink(null), null);
});

test("honours the configured default protocol", () => {
  assert.equal(
    findPunctuatedLink("example.org,", "http").href,
    "http://example.org",
  );
});
