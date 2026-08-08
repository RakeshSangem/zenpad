import { Fragment } from "@tiptap/pm/model";
import {
  CellSelection,
  TableMap,
  isInTable,
  moveTableColumn,
  moveTableRow,
  selectedRect,
} from "@tiptap/pm/tables";

// Every action takes an explicit table position instead of reading the current
// selection: opening a grip menu moves DOM focus out of the editor, so the menu
// has to stay tied to the table it was opened from.

export function findTablePos(state) {
  const { $from } = state.selection;
  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type.name === "table") return $from.before(depth);
  }
  return null;
}

function tableNodeAt(state, tablePos) {
  const node = tablePos == null ? null : state.doc.nodeAt(tablePos);
  return node?.type.name === "table" ? node : null;
}

/**
 * Snapshot of the table's shape. `merged` disables the actions that assume a
 * plain grid (duplicate/sort); pasted HTML is the only way to get spans here.
 */
export function readTable(state, tablePos) {
  const node = tableNodeAt(state, tablePos);
  if (!node) return null;

  const rows = [];
  node.forEach((rowNode) => {
    const cells = [];
    rowNode.forEach((cell) => cells.push(cell));
    rows.push({ node: rowNode, cells });
  });

  const map = TableMap.get(node);
  return {
    node,
    map,
    rows,
    columnCount: map.width,
    rowCount: map.height,
    hasHeaderRow:
      rows.length > 0 &&
      rows[0].cells.every((cell) => cell.type.name === "tableHeader"),
    merged: rows.some((row) =>
      row.cells.some(
        (cell) => (cell.attrs.colspan ?? 1) > 1 || (cell.attrs.rowspan ?? 1) > 1,
      ),
    ),
  };
}

/**
 * Grid indices of the two corner cells a `{ axis, index, end }` target covers.
 * `end` defaults to `index`, so a target is a single column/row unless the
 * caller is mirroring a wider selection.
 */
function cellRange(map, target) {
  const last = target.end ?? target.index;
  return target.axis === "column"
    ? [target.index, (map.height - 1) * map.width + last]
    : [target.index * map.width, last * map.width + map.width - 1];
}

/**
 * Which columns/rows the current selection covers, as half-open index ranges —
 * a caret in a cell gives that single cell, a CellSelection gives its rect.
 */
export function selectionRect(state, tablePos) {
  if (!isInTable(state) || findTablePos(state) !== tablePos) return null;
  const rect = selectedRect(state);
  return {
    top: rect.top,
    bottom: rect.bottom,
    left: rect.left,
    right: rect.right,
  };
}

function cellSelectionFor(doc, tablePos, map, target) {
  const [anchor, head] = cellRange(map, target);
  return new CellSelection(
    doc.resolve(tablePos + 1 + map.map[anchor]),
    doc.resolve(tablePos + 1 + map.map[head]),
  );
}

/** Selects whole columns or rows. `target` is `{ axis, index, end }`. */
export function selectCells(editor, tablePos, target) {
  const info = readTable(editor.state, tablePos);
  if (!info) return false;

  const limit = target.axis === "column" ? info.columnCount : info.rowCount;
  if (target.index >= limit) return false;
  const clamped = {
    ...target,
    end: Math.min(target.end ?? target.index, limit - 1),
  };

  const { state, view } = editor;
  view.dispatch(
    state.tr.setSelection(
      cellSelectionFor(state.doc, tablePos, info.map, clamped),
    ),
  );
  return true;
}

function replaceTable(editor, tablePos, info, rows, target) {
  const { state, view } = editor;
  const nextTable = info.node.type.create(
    info.node.attrs,
    Fragment.fromArray(
      rows.map((row) =>
        row.node.type.create(row.node.attrs, Fragment.fromArray(row.cells)),
      ),
    ),
  );

  const tr = state.tr.replaceWith(
    tablePos,
    tablePos + info.node.nodeSize,
    nextTable,
  );
  tr.setSelection(
    cellSelectionFor(tr.doc, tablePos, TableMap.get(nextTable), target),
  );
  view.dispatch(tr);
  return true;
}

// Run a bare ProseMirror command. Tiptap's `command()` hands the callback a
// no-op dispatch and keeps its own transaction, which would swallow the ones
// prosemirror-tables builds internally.
function runPmCommand(editor, command) {
  return command(editor.state, (tr) => editor.view.dispatch(tr));
}

export function moveColumn(editor, tablePos, from, to) {
  return runPmCommand(
    editor,
    moveTableColumn({ from, to, pos: tablePos + 1 }),
  );
}

export function moveRow(editor, tablePos, from, to) {
  return runPmCommand(editor, moveTableRow({ from, to, pos: tablePos + 1 }));
}

export function duplicateColumn(editor, tablePos, index) {
  const info = readTable(editor.state, tablePos);
  if (!info || info.merged) return false;

  const rows = info.rows.map((row) => {
    const cells = row.cells.slice();
    cells.splice(index + 1, 0, cells[index]);
    return { ...row, cells };
  });
  return replaceTable(editor, tablePos, info, rows, {
    axis: "column",
    index: index + 1,
  });
}

export function duplicateRow(editor, tablePos, index) {
  const info = readTable(editor.state, tablePos);
  if (!info || info.merged) return false;

  const rows = info.rows.slice();
  rows.splice(index + 1, 0, info.rows[index]);
  return replaceTable(editor, tablePos, info, rows, {
    axis: "row",
    index: index + 1,
  });
}

export function sortByColumn(editor, tablePos, index, direction) {
  const info = readTable(editor.state, tablePos);
  if (!info || info.merged) return false;

  const rows = sortRowsByColumn(info.rows, index, direction, info.hasHeaderRow);
  return replaceTable(editor, tablePos, info, rows, { axis: "column", index });
}

/** Tab-separated cells, newline-separated rows — pastes cleanly into a sheet. */
export function textOfCells(state, tablePos, target) {
  const info = readTable(state, tablePos);
  if (!info) return "";

  const last = target.end ?? target.index;
  const rows =
    target.axis === "row"
      ? info.rows.slice(target.index, last + 1)
      : info.rows;
  return rows
    .filter(Boolean)
    .map((row) =>
      (target.axis === "column"
        ? row.cells.slice(target.index, last + 1)
        : row.cells
      )
        .filter(Boolean)
        .map((cell) => cell.textContent.trim())
        .join("\t"),
    )
    .join("\n");
}

// --- pure helpers (unit tested) ---------------------------------------------

/** Numbers compare numerically, blanks always sink to the bottom. */
export function compareCellText(a, b) {
  const left = a.trim();
  const right = b.trim();
  if (!left && !right) return 0;
  if (!left) return 1;
  if (!right) return -1;

  const leftNumber = Number(left);
  const rightNumber = Number(right);
  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    return leftNumber - rightNumber;
  }
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortRowsByColumn(rows, index, direction, hasHeaderRow) {
  const header = hasHeaderRow ? rows.slice(0, 1) : [];
  const body = (hasHeaderRow ? rows.slice(1) : rows).map((row, order) => ({
    row,
    order,
    text: (row.cells[index]?.textContent ?? "").trim(),
  }));

  body.sort((a, b) => {
    const result = compareCellText(a.text, b.text);
    if (result === 0) return a.order - b.order;
    // Blanks stay last in both directions, so only flip real comparisons.
    return direction === "desc" && a.text && b.text ? -result : result;
  });

  return [...header, ...body.map((entry) => entry.row)];
}
