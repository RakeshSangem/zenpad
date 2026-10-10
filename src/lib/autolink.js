import { tokenize } from "linkifyjs";

// Tiptap's own autolink only fires when the word before the caret is nothing
// but a link, so a URL that ends a clause or a sentence -- "see example.org,
// then..." -- never becomes one. Everything Tiptap already handles returns
// null here, so the two never both fire on the same word.
const BRACKET_PAIRS = ["()", "[]"];
const PUNCTUATION_ONLY = /^[.,;:!?'"`)\]}>»”’…-]+$/;

export function findPunctuatedLink(word, defaultProtocol = "https") {
  const value = typeof word === "string" ? word : "";
  if (!value) return null;

  const tokens = tokenize(value).map((token) =>
    token.toObject(defaultProtocol),
  );
  // One bare link, or a bracketed one: Tiptap's autolink covers both.
  if (tokens.length === 1) return null;
  if (
    tokens.length === 3 &&
    tokens[1].isLink &&
    BRACKET_PAIRS.includes(tokens[0].value + tokens[2].value)
  ) {
    return null;
  }

  const [link, ...rest] = tokens;
  if (!link.isLink) return null;
  // Only trailing punctuation may follow. "foo.com/a b" or "a@b.com/x" style
  // leftovers mean we did not understand the word, so leave it alone.
  const onlyPunctuationFollows = rest.every(
    (token) => !token.isLink && PUNCTUATION_ONLY.test(token.value),
  );
  if (!onlyPunctuationFollows) return null;

  return { start: link.start, end: link.end, href: link.href };
}
