import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Plus } from "lucide-react";
import TableGripMenu from "./TableGripMenu";
import {
  duplicateColumn,
  duplicateRow,
  findTablePos,
  moveColumn,
  moveRow,
  readTable,
  selectCells,
  selectionRect,
  sortByColumn,
  textOfCells,
} from "../../lib/tableActions";

const COLUMN_GRIP = { width: 28, height: 5 }; // pill centred above the column
const ROW_GRIP = { width: 5, inset: 6 }; // bar down the left of the row
const GAP = 4; // space between a control and the table edge
const LANE = 14; // "add row"/"add column" strip thickness

const LANE_CLASS =
  "pointer-events-auto absolute flex items-center justify-center rounded-[4px] bg-neutral-100 text-neutral-400 transition-colors duration-100 hover:bg-neutral-200 hover:text-neutral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 dark:hover:bg-neutral-700 dark:hover:text-neutral-300";

function tablePosFromDom(editor, tableEl) {
  try {
    const inside = editor.view.posAtDOM(tableEl, 0);
    const $pos = editor.state.doc.resolve(Math.max(0, inside));
    for (let depth = $pos.depth; depth > 0; depth -= 1) {
      if ($pos.node(depth).type.name === "table") return $pos.before(depth);
    }
  } catch {
    return null;
  }
  return null;
}

function measureTable(editor, container, tableEl) {
  const tablePos = tablePosFromDom(editor, tableEl);
  const info = tablePos == null ? null : readTable(editor.state, tablePos);
  if (!info) return null;

  const wrapper = tableEl.closest(".tableWrapper") ?? tableEl.parentElement;
  const base = container.getBoundingClientRect();
  const clip = wrapper.getBoundingClientRect();
  const tableRect = tableEl.getBoundingClientRect();

  const columns = Array.from(tableEl.rows[0]?.cells ?? []).map((cell) => {
    const rect = cell.getBoundingClientRect();
    return {
      left: rect.left - base.left,
      width: rect.width,
      // A table wider than its wrapper scrolls horizontally; a grip for a
      // scrolled-out column would float over unrelated content.
      visible: rect.left >= clip.left - 1 && rect.right <= clip.right + 1,
    };
  });

  const rows = Array.from(tableEl.rows).map((row) => {
    const rect = row.getBoundingClientRect();
    return { top: rect.top - base.top, height: rect.height };
  });

  const box = {
    left: tableRect.left - base.left,
    top: tableRect.top - base.top,
    width: Math.min(tableRect.right, clip.right) - tableRect.left,
    height: tableRect.height,
  };

  // Merged cells break the column/row index mapping the grips rely on, so
  // those tables only get the append strips.
  const grid =
    !info.merged &&
    columns.length === info.columnCount &&
    rows.length === info.rowCount;
  const selection = grid ? selectionRect(editor.state, tablePos) : null;

  return {
    tablePos,
    wrapper,
    box,
    columns,
    rows,
    selection,
    hasHeaderRow: info.hasHeaderRow,
    signature: JSON.stringify([tablePos, box, columns, rows, selection]),
  };
}

function copyToClipboard(text) {
  if (text) navigator.clipboard?.writeText(text).catch(() => {});
}

/**
 * Table controls in the style of Linear/Notion: putting the caret in a cell
 * reveals a grip for that column and that row, each opening a menu of table
 * edits, plus strips to append a column or row. Rendered as an overlay measured
 * from the live table DOM rather than as editor decorations, so the controls
 * can sit outside the table's scroll container without being clipped.
 */
function TableControls({ editor, children }) {
  const containerRef = useRef(null);
  const lockedTableRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const [menu, setMenu] = useState(null);
  const [tick, setTick] = useState(0);

  // The menu takes DOM focus, so while it is open we stay pinned to the table
  // it was opened from instead of following the selection.
  const activeTable = useCallback(() => {
    if (!editor) return null;
    if (menu && lockedTableRef.current?.isConnected) {
      return lockedTableRef.current;
    }

    const tablePos = findTablePos(editor.state);
    if (tablePos == null) return null;
    const dom = editor.view.nodeDOM(tablePos);
    if (!(dom instanceof HTMLElement)) return null;
    return dom instanceof HTMLTableElement ? dom : dom.querySelector("table");
  }, [editor, menu]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const tableEl = activeTable();
    if (!container || !editor?.isEditable || !tableEl?.isConnected) {
      setLayout(null);
      return;
    }
    const next = measureTable(editor, container, tableEl);
    setLayout((previous) =>
      previous && next && previous.signature === next.signature
        ? previous
        : next,
    );
  }, [activeTable, editor, tick]);

  // Re-measure whenever the document, the selection, or the viewport changes.
  useEffect(() => {
    if (!editor) return undefined;
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => setTick((value) => value + 1));
    };

    editor.on("transaction", schedule);
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      editor.off("transaction", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [editor]);

  useEffect(() => {
    const wrapper = layout?.wrapper;
    if (!wrapper) return undefined;
    const onScroll = () => setTick((value) => value + 1);
    wrapper.addEventListener("scroll", onScroll, { passive: true });
    return () => wrapper.removeEventListener("scroll", onScroll);
  }, [layout?.wrapper]);

  const selectTarget = (target) => () => {
    if (layout) selectCells(editor, layout.tablePos, target);
  };

  const openMenu = (target) => (open) => {
    if (open) {
      lockedTableRef.current = activeTable();
      setMenu(target);
      return;
    }
    setMenu((current) => (current?.axis === target.axis ? null : current));
  };

  const runAction = (target) => (action) => {
    if (!editor || !layout) return;
    const { tablePos } = layout;

    if (action === "copy") {
      copyToClipboard(textOfCells(editor.state, tablePos, target));
      return;
    }
    if (!selectCells(editor, tablePos, target)) return;

    const column = target.axis === "column";
    switch (action) {
      case "insertBefore":
        editor.commands[column ? "addColumnBefore" : "addRowBefore"]();
        break;
      case "insertAfter":
        editor.commands[column ? "addColumnAfter" : "addRowAfter"]();
        break;
      case "moveBefore":
        (column ? moveColumn : moveRow)(
          editor,
          tablePos,
          target.index,
          target.index - 1,
        );
        break;
      case "moveAfter":
        (column ? moveColumn : moveRow)(
          editor,
          tablePos,
          target.index,
          target.index + 1,
        );
        break;
      case "duplicate":
        (column ? duplicateColumn : duplicateRow)(
          editor,
          tablePos,
          target.index,
        );
        break;
      case "sortAscending":
        sortByColumn(editor, tablePos, target.index, "asc");
        break;
      case "sortDescending":
        sortByColumn(editor, tablePos, target.index, "desc");
        break;
      case "remove":
        editor.commands[column ? "deleteColumn" : "deleteRow"]();
        break;
      case "removeTable":
        editor.commands.deleteTable();
        break;
      case "bold":
        editor.commands.toggleBold();
        break;
      case "italic":
        editor.commands.toggleItalic();
        break;
      case "underline":
        editor.commands.toggleUnderline();
        break;
      case "strike":
        editor.commands.toggleStrike();
        break;
      default:
        break;
    }

    // The menu held DOM focus while it was open; hand it back to the editor.
    requestAnimationFrame(() => editor.view.focus());
  };

  const append = (axis) => () => {
    if (!editor || !layout) return;
    const index =
      axis === "column" ? layout.columns.length - 1 : layout.rows.length - 1;
    if (!selectCells(editor, layout.tablePos, { axis, index })) return;
    editor.commands[axis === "column" ? "addColumnAfter" : "addRowAfter"]();
    requestAnimationFrame(() => editor.view.focus());
  };

  const selection = layout?.selection;
  const columnTarget = selection && {
    axis: "column",
    index: selection.left,
    end: selection.right - 1,
  };
  const rowTarget = selection && {
    axis: "row",
    index: selection.top,
    end: selection.bottom - 1,
  };

  const columnSpan = columnTarget && {
    from: layout.columns[columnTarget.index],
    to: layout.columns[columnTarget.end],
  };
  const rowSpan = rowTarget && {
    from: layout.rows[rowTarget.index],
    to: layout.rows[rowTarget.end],
  };

  return (
    <div ref={containerRef} className="relative">
      {children}

      {layout && (
        <div
          data-table-controls
          className="pointer-events-none absolute inset-0 z-10"
        >
          {columnSpan?.from && columnSpan.to && columnSpan.from.visible && (
            <TableGripMenu
              axis="column"
              open={menu?.axis === "column"}
              onOpenChange={openMenu(columnTarget)}
              onSelect={selectTarget(columnTarget)}
              onAction={runAction(columnTarget)}
              canMoveBefore={columnTarget.index > 0}
              canMoveAfter={columnTarget.end < layout.columns.length - 1}
              style={{
                left:
                  (columnSpan.from.left + columnSpan.to.left + columnSpan.to.width) /
                    2 -
                  COLUMN_GRIP.width / 2,
                top: layout.box.top - COLUMN_GRIP.height - GAP,
                width: COLUMN_GRIP.width,
                height: COLUMN_GRIP.height,
              }}
            />
          )}

          {rowSpan?.from && rowSpan.to && (
            <TableGripMenu
              axis="row"
              open={menu?.axis === "row"}
              onOpenChange={openMenu(rowTarget)}
              onSelect={selectTarget(rowTarget)}
              onAction={runAction(rowTarget)}
              isHeaderRow={layout.hasHeaderRow && rowTarget.index === 0}
              canMoveBefore={rowTarget.index > (layout.hasHeaderRow ? 1 : 0)}
              canMoveAfter={rowTarget.end < layout.rows.length - 1}
              style={{
                left: layout.box.left - ROW_GRIP.width - GAP,
                top: rowSpan.from.top + ROW_GRIP.inset,
                width: ROW_GRIP.width,
                height: Math.max(
                  rowSpan.to.top + rowSpan.to.height - rowSpan.from.top -
                    ROW_GRIP.inset * 2,
                  8,
                ),
              }}
            />
          )}

          <button
            type="button"
            aria-label="Add column"
            onClick={append("column")}
            className={LANE_CLASS}
            style={{
              left: layout.box.left + layout.box.width + GAP,
              top: layout.box.top,
              width: LANE,
              height: layout.box.height,
            }}
          >
            <Plus className="size-3" strokeWidth={2} aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Add row"
            onClick={append("row")}
            className={LANE_CLASS}
            style={{
              left: layout.box.left,
              top: layout.box.top + layout.box.height + GAP,
              width: layout.box.width,
              height: LANE,
            }}
          >
            <Plus className="size-3" strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export default TableControls;
