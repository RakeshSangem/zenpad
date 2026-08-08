import React from "react";
import {
  ArrowDown,
  ArrowDownToLine,
  ArrowDownWideNarrow,
  ArrowLeft,
  ArrowLeftToLine,
  ArrowRight,
  ArrowRightToLine,
  ArrowUp,
  ArrowUpNarrowWide,
  ArrowUpToLine,
  Bold,
  ClipboardCopy,
  Copy,
  Italic,
  Strikethrough,
  Trash2,
  Type,
  Underline,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const AXIS = {
  column: {
    grip: "Column options",
    insertBefore: { label: "Insert left", icon: ArrowLeftToLine },
    insertAfter: { label: "Insert right", icon: ArrowRightToLine },
    moveBefore: { label: "Move left", icon: ArrowLeft },
    moveAfter: { label: "Move right", icon: ArrowRight },
    duplicate: "Duplicate column",
    remove: "Delete column",
  },
  row: {
    grip: "Row options",
    insertBefore: { label: "Insert above", icon: ArrowUpToLine },
    insertAfter: { label: "Insert below", icon: ArrowDownToLine },
    moveBefore: { label: "Move up", icon: ArrowUp },
    moveAfter: { label: "Move down", icon: ArrowDown },
    duplicate: "Duplicate row",
    remove: "Delete row",
  },
};

// The pill itself is only a few pixels thick, so ::before widens the hit area.
const GRIP_CLASS =
  "pointer-events-auto absolute rounded-full bg-neutral-300 transition-colors duration-100 before:absolute before:-inset-2 before:content-[''] hover:bg-neutral-400 focus-visible:outline-none focus-visible:bg-neutral-400 data-[popup-open]:bg-neutral-500 dark:bg-neutral-600 dark:hover:bg-neutral-500 dark:data-[popup-open]:bg-neutral-400";

function FormatSubmenu({ onAction }) {
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Type />
        Format
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => onAction("bold")}>
          <Bold />
          Bold
          <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("italic")}>
          <Italic />
          Italic
          <DropdownMenuShortcut>⌘I</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("underline")}>
          <Underline />
          Underline
          <DropdownMenuShortcut>⌘U</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onAction("strike")}>
          <Strikethrough />
          Strikethrough
          <DropdownMenuShortcut>⌘⇧X</DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/**
 * A single grip button plus the menu it opens. `axis` is "column" | "row";
 * the header row gets a reduced menu because Markdown tables need it to stay
 * put — the whole table is removed from the corner grip instead.
 */
function TableGripMenu({
  axis,
  open,
  onOpenChange,
  onSelect,
  onAction,
  style,
  canMoveBefore,
  canMoveAfter,
  isHeaderRow = false,
}) {
  const copy = AXIS[axis];
  const InsertBefore = copy.insertBefore.icon;
  const InsertAfter = copy.insertAfter.icon;
  const MoveBefore = copy.moveBefore.icon;
  const MoveAfter = copy.moveAfter.icon;

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        aria-label={copy.grip}
        className={GRIP_CLASS}
        style={style}
        // Select before the popup mounts: selecting pulls DOM focus back into
        // the editor, which would read as a focus-out and close a menu that is
        // already open.
        onPointerDown={onSelect}
      />
      <DropdownMenuContent
        align={axis === "row" ? "start" : "center"}
        side={axis === "row" ? "right" : "bottom"}
        sideOffset={6}
        className="w-56"
      >
        {!isHeaderRow && (
          <DropdownMenuItem onClick={() => onAction("insertBefore")}>
            <InsertBefore />
            {copy.insertBefore.label}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => onAction("insertAfter")}>
          <InsertAfter />
          {copy.insertAfter.label}
        </DropdownMenuItem>

        {!isHeaderRow && (
          <>
            <DropdownMenuItem
              disabled={!canMoveBefore}
              onClick={() => onAction("moveBefore")}
            >
              <MoveBefore />
              {copy.moveBefore.label}
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!canMoveAfter}
              onClick={() => onAction("moveAfter")}
            >
              <MoveAfter />
              {copy.moveAfter.label}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("duplicate")}>
              <Copy />
              {copy.duplicate}
            </DropdownMenuItem>
          </>
        )}

        {axis === "column" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onAction("sortAscending")}>
              <ArrowUpNarrowWide />
              Sort ascending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("sortDescending")}>
              <ArrowDownWideNarrow />
              Sort descending
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />
        <FormatSubmenu onAction={onAction} />
        <DropdownMenuItem onClick={() => onAction("copy")}>
          <ClipboardCopy />
          Copy text
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        {!isHeaderRow && (
          <DropdownMenuItem
            variant="destructive"
            onClick={() => onAction("remove")}
          >
            <Trash2 />
            {copy.remove}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          variant="destructive"
          onClick={() => onAction("removeTable")}
        >
          <Trash2 />
          Delete table
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default TableGripMenu;
