/** A note's display title: the explicit title, else its first non-empty line. */
export function noteTitle(note) {
  if (note?.title && note.title.trim()) return note.title.trim().slice(0, 50);

  const content = note?.content;
  if (!content) return "Untitled";
  const lines = content.split("\n");
  const firstLine = lines[0].trim();
  if (firstLine) return firstLine.slice(0, 50);
  if (lines[1]) return lines[1].trim().slice(0, 50);
  return "Untitled";
}

/** The body text after the title line, flattened to one line. */
export function notePreview(note, length = 60) {
  return (note?.content || "")
    .split("\n")
    .slice(1)
    .join(" ")
    .trim()
    .slice(0, length);
}
