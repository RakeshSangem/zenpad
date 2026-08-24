const EXPLICIT_SCHEME = /^[a-z][a-z\d+.-]*:/i;
const MAX_PATH_SEGMENT = 18;
const MAX_DOMAIN_LENGTH = 32;

/**
 * Turn the shorthand people commonly enter in a link prompt into an absolute
 * URL. Tiptap uses the same default for autolink and paste handling, but links
 * created with setLink need to be normalised by the caller.
 */
export function normalizeLinkHref(value) {
  const href = typeof value === "string" ? value.trim() : "";

  if (!href || EXPLICIT_SCHEME.test(href) || href.startsWith("#")) return href;
  if (href.startsWith("//")) return `https:${href}`;
  if (href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
    return href;
  }

  return `https://${href}`;
}

export function formatUrl(raw) {
  const url = new URL(raw);
  const domain = url.hostname.replace(/^www\./, "");
  const segment = url.pathname.split("/").filter(Boolean)[0] ?? "";
  const path = segment
    ? `/${
        segment.length > MAX_PATH_SEGMENT
          ? `${segment.slice(0, MAX_PATH_SEGMENT)}…`
          : segment
      }`
    : "";

  return { domain, path };
}

export function truncateDomainMiddle(domain, maxLength = MAX_DOMAIN_LENGTH) {
  if (domain.length <= maxLength) return domain;

  const labels = domain.split(".");
  const suffix = labels.length > 1 ? labels.slice(-2).join(".") : "";
  if (!suffix || suffix.length >= maxLength - 2) {
    const side = Math.floor((maxLength - 1) / 2);
    return `${domain.slice(0, side)}…${domain.slice(-(maxLength - side - 1))}`;
  }

  const prefixLength = maxLength - suffix.length - 1;
  return `${domain.slice(0, prefixLength).replace(/\.$/, "")}…${suffix}`;
}

export function getLinkDisplay(raw) {
  const value = typeof raw === "string" ? raw.trim() : "";

  if (/^mailto:/i.test(value)) {
    return {
      kind: "mailto",
      domain: value.slice(value.indexOf(":") + 1).split("?")[0],
      path: "",
      valid: Boolean(value.slice(value.indexOf(":") + 1).split("?")[0]),
    };
  }

  if (/^tel:/i.test(value)) {
    return {
      kind: "tel",
      domain: value.slice(value.indexOf(":") + 1).split("?")[0],
      path: "",
      valid: Boolean(value.slice(value.indexOf(":") + 1).split("?")[0]),
    };
  }

  try {
    const formatted = formatUrl(value);
    if (!formatted.domain) throw new Error("URL has no hostname");
    return {
      kind: "url",
      domain: truncateDomainMiddle(formatted.domain),
      faviconDomain: formatted.domain,
      path: formatted.path,
      valid: true,
    };
  } catch {
    return { kind: "invalid", domain: value, path: "", valid: false };
  }
}
