const BLOCK_MARKDOWN_PATTERNS = [
  /^ {0,3}#{1,6}[\t ]+\S/m,
  /^ {0,3}>[\t ]+\S/m,
  /^ {0,3}(?:[-+*])[\t ]+\[[ xX]\][\t ]+\S/m,
  /^ {0,3}(?:[-+*])[\t ]+\S/m,
  /^ {0,3}\d+[.)][\t ]+\S/m,
  /^ {0,3}(?:`{3,}|~{3,})[^\n]*$/m,
  /^ {0,3}([-*_])(?:[\t ]*\1){2,}[\t ]*$/m,
  /^\|?.+\|.+\n\|?[\t ]*:?-{3,}:?[\t ]*\|/m,
];

const INLINE_MARKDOWN_PATTERNS = [
  /!\[[^\]]*\]\([^\s)]+(?:\s+["'][^"']*["'])?\)/,
  /\[[^\]]+\]\([^\s)]+(?:\s+["'][^"']*["'])?\)/,
  /(?:^|\s)(?:\*\*|__)[^\n]+(?:\*\*|__)(?=\s|[.,!?;:]|$)/,
  /(?:^|\s)~~[^\n]+~~(?=\s|[.,!?;:]|$)/,
  /(?:^|\s)`[^`\n]+`(?=\s|[.,!?;:]|$)/,
];

export const looksLikeMarkdown = (value) => {
  if (typeof value !== "string") return false;

  const text = value.trim();
  if (!text) return false;

  return (
    BLOCK_MARKDOWN_PATTERNS.some((pattern) => pattern.test(text)) ||
    INLINE_MARKDOWN_PATTERNS.some((pattern) => pattern.test(text))
  );
};
