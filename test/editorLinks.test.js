import test from "node:test";
import assert from "node:assert/strict";
import {
  formatUrl,
  getLinkDisplay,
  normalizeLinkHref,
  truncateDomainMiddle,
} from "../src/lib/editorLinks.js";

test("adds HTTPS to shorthand web addresses", () => {
  assert.equal(normalizeLinkHref("example.com/docs"), "https://example.com/docs");
  assert.equal(normalizeLinkHref("  www.example.com  "), "https://www.example.com");
  assert.equal(normalizeLinkHref("//example.com"), "https://example.com");
});

test("preserves explicit protocols and local links", () => {
  assert.equal(normalizeLinkHref("http://example.com"), "http://example.com");
  assert.equal(normalizeLinkHref("mailto:hello@example.com"), "mailto:hello@example.com");
  assert.equal(normalizeLinkHref("#links"), "#links");
  assert.equal(normalizeLinkHref("../notes/today"), "../notes/today");
});

test("uses an empty value to remove a link", () => {
  assert.equal(normalizeLinkHref("   "), "");
  assert.equal(normalizeLinkHref(null), "");
});

test("formats a URL as a domain and its first path segment", () => {
  assert.deepEqual(
    formatUrl("https://www.apps.apple.com/notchnest/details?mt=12#more"),
    { domain: "apps.apple.com", path: "/notchnest" },
  );
  assert.deepEqual(formatUrl("https://example.com/"), {
    domain: "example.com",
    path: "",
  });
  assert.deepEqual(formatUrl("https://example.com/abcdefghijklmnopqrs/next"), {
    domain: "example.com",
    path: "/abcdefghijklmnopqr…",
  });
});

test("truncates long domains from the middle while preserving the site", () => {
  assert.equal(
    truncateDomainMiddle("verylongsubdomain.withmore.example.com", 29),
    "verylongsubdomain…example.com",
  );
});

test("formats mail, telephone, and invalid destinations without a favicon URL", () => {
  assert.deepEqual(getLinkDisplay("mailto:hello@example.com?subject=Hi"), {
    kind: "mailto",
    domain: "hello@example.com",
    path: "",
    valid: true,
  });
  assert.deepEqual(getLinkDisplay("tel:+1-555-0100"), {
    kind: "tel",
    domain: "+1-555-0100",
    path: "",
    valid: true,
  });
  assert.deepEqual(getLinkDisplay("not a url"), {
    kind: "invalid",
    domain: "not a url",
    path: "",
    valid: false,
  });
});
