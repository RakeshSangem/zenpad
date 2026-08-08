export function resolveCommandMenuKey(event, selectedIndex, itemCount) {
  if (event.isComposing || event.key === "Process") return { type: "ignore" };
  if (event.key === "Escape") return { type: "dismiss" };
  if (itemCount <= 0) return { type: "ignore" };

  switch (event.key) {
    case "ArrowDown":
      return { type: "navigate", index: (selectedIndex + 1) % itemCount };
    case "ArrowUp":
      return {
        type: "navigate",
        index: (selectedIndex - 1 + itemCount) % itemCount,
      };
    case "Tab":
      return {
        type: "navigate",
        index: event.shiftKey
          ? (selectedIndex - 1 + itemCount) % itemCount
          : (selectedIndex + 1) % itemCount,
      };
    case "Home":
      return { type: "navigate", index: 0 };
    case "End":
      return { type: "navigate", index: itemCount - 1 };
    case "Enter":
      return { type: "select", index: selectedIndex };
    default:
      return { type: "ignore" };
  }
}
