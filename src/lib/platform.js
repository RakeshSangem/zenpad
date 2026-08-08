const APPLE = /mac|iphone|ipad|ipod/i;

export function isApplePlatform() {
  if (typeof navigator === "undefined") return false;
  return APPLE.test(
    navigator.userAgentData?.platform ?? navigator.platform ?? "",
  );
}

const APPLE_LABELS = {
  Mod: "⌘",
  Alt: "⌥",
  Shift: "⇧",
  Backspace: "⌫",
  Enter: "↩",
};

const OTHER_LABELS = {
  Mod: "Ctrl",
  Alt: "Alt",
  Shift: "Shift",
  Backspace: "Backspace",
  Enter: "Enter",
};

/**
 * Renders a shortcut for the current platform: ["Mod", "K"] reads as "⌘ K" on
 * a Mac and "Ctrl+K" everywhere else, matching how each platform writes them.
 */
export function shortcutLabel(tokens) {
  const apple = isApplePlatform();
  const labels = apple ? APPLE_LABELS : OTHER_LABELS;
  return tokens.map((token) => labels[token] ?? token).join(apple ? " " : "+");
}
