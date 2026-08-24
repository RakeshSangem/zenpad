import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { posToDOMRect } from "@tiptap/core";
import {
  autoUpdate,
  computePosition,
  flip,
  offset,
  shift,
} from "@floating-ui/dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Copy, Globe, Mail, Pencil, Phone, Unlink } from "lucide-react";
import { getLinkDisplay, normalizeLinkHref } from "../../lib/editorLinks";

const POPOVER_ID = "zenpad-link-popover";
// Long enough that skimming a paragraph of links does not flash popovers,
// and skipped entirely once one is already open.
const HOVER_DELAY = 180;
const LEAVE_DELAY = 160;
const EASE_OUT = [0.23, 1, 0.32, 1];
const ENTER = { duration: 0.15, ease: EASE_OUT };
// Exit is quicker than enter: the user has already moved on.
const EXIT = { duration: 0.12, ease: EASE_OUT };
const INSTANT = { duration: 0 };
const EDIT_WIDTH = 320;
// Critically damped, response 0.4 -- Apple's own numbers for a reposition.
// No overshoot: no gesture carried momentum into this, it was a click. Being a
// spring is what lets a fast edit/cancel/edit re-target from the live width
// instead of restarting.
const MORPH = { type: "spring", bounce: 0, duration: 0.4 };

const KIND_ICON = { mailto: Mail, tel: Phone };

// active:scale gives the press somewhere to land, so the button feels heard.
const ACTION_CLASS =
  "link-chip-action flex size-7 shrink-0 items-center justify-center rounded-[6px] text-neutral-600 outline-none transition-[background-color,color,transform] duration-150 ease-out hover:bg-neutral-100 hover:text-neutral-900 focus-visible:bg-neutral-100 focus-visible:text-neutral-900 active:scale-[0.97] dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white dark:focus-visible:bg-neutral-700";

// Same 28px slot before and after, so the swap moves nothing around it.
function IconSwap({ swapKey, reduce, children }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={swapKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.1 }}
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

// domAtPos lands on the parent paragraph when pos sits on a link boundary, so
// probe just inside the selection instead of at its edge.
function linkElementAt(editor, pos) {
  const dom = editor.view.domAtPos(pos).node;
  const node = dom.nodeType === Node.ELEMENT_NODE ? dom : dom.parentElement;
  return node?.closest?.("a.zenpad-link") || null;
}

function rangeFor(editor, element) {
  try {
    return {
      from: editor.view.posAtDOM(element, 0),
      to: editor.view.posAtDOM(element, element.childNodes.length),
    };
  } catch {
    return { from: editor.state.selection.from, to: editor.state.selection.to };
  }
}

const LinkPopover = forwardRef(function LinkPopover({ editor }, forwardedRef) {
  const floatingRef = useRef(null);
  const inputRef = useRef(null);
  const linkRef = useRef(null);
  const rangeRef = useRef(null);
  const hoverTimer = useRef(null);
  const leaveTimer = useRef(null);
  const copyTimer = useRef(null);

  const reduce = useReducedMotion();
  const [mode, setMode] = useState("hidden"); // hidden | view | edit
  const [url, setUrl] = useState("");
  const [draft, setDraft] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [position, setPosition] = useState(null);
  // Deliberate opens (keyboard, or moving between links while one is already
  // up) skip the animation entirely -- waiting on it would feel like lag.
  const [instant, setInstant] = useState(false);

  const modeRef = useRef(mode);
  modeRef.current = mode;
  // A popover the selection is holding open must not be dismissed by the
  // pointer wandering off it.
  const selectionDriven = useRef(false);

  const open = mode !== "hidden";
  const editing = mode === "edit";
  const display = useMemo(() => getLinkDisplay(url), [url]);
  const KindIcon = KIND_ICON[display.kind] || Globe;

  const close = useCallback(() => {
    clearTimeout(hoverTimer.current);
    clearTimeout(leaveTimer.current);
    selectionDriven.current = false;
    linkRef.current?.removeAttribute("aria-describedby");
    linkRef.current = null;
    setMode("hidden");
    setInvalid(false);
    setPosition(null);
  }, []);

  const show = useCallback(
    (element, nextMode, immediate = false) => {
      clearTimeout(leaveTimer.current);
      setInstant(immediate);
      linkRef.current?.removeAttribute("aria-describedby");
      linkRef.current = element;
      rangeRef.current = rangeFor(editor, element);
      element.setAttribute("aria-describedby", POPOVER_ID);
      const href = element.getAttribute("href") || "";
      setUrl(href);
      setDraft(href);
      setInvalid(false);
      setMode(nextMode);
    },
    [editor],
  );

  const cancelHide = useCallback(() => clearTimeout(leaveTimer.current), []);
  const scheduleHide = useCallback(() => {
    clearTimeout(leaveTimer.current);
    // Editing is deliberate, so only drop the popover when it is idle.
    leaveTimer.current = setTimeout(() => {
      if (selectionDriven.current) return;
      if (modeRef.current === "view") close();
    }, LEAVE_DELAY);
  }, [close]);

  useImperativeHandle(
    forwardedRef,
    () => ({
      open() {
        const { from, to } = editor.state.selection;
        rangeRef.current = { from, to };
        const element = linkElementAt(editor, from);
        linkRef.current = element;
        const href =
          element?.getAttribute("href") ||
          editor.getAttributes("link").href ||
          "";
        setUrl(href);
        setDraft(href);
        setInvalid(false);
        setInstant(true);
        setMode("edit");
      },
    }),
    [editor],
  );

  // Hover and click on links in the document.
  useEffect(() => {
    if (!editor) return;
    const root = editor.view.dom;

    const over = (event) => {
      if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
      const link = event.target.closest?.("a.zenpad-link");
      if (!link || link === linkRef.current) return;
      clearTimeout(hoverTimer.current);
      if (modeRef.current !== "hidden") {
        show(link, "view", true);
        return;
      }
      hoverTimer.current = setTimeout(() => show(link, "view"), HOVER_DELAY);
    };
    const out = (event) => {
      const link = event.target.closest?.("a.zenpad-link");
      if (!link || link.contains(event.relatedTarget)) return;
      clearTimeout(hoverTimer.current);
      scheduleHide();
    };
    const click = (event) => {
      const link = event.target.closest?.("a.zenpad-link");
      if (!link) return;
      event.preventDefault();
      clearTimeout(hoverTimer.current);
      if (event.metaKey || event.ctrlKey) {
        event.stopPropagation();
        close();
        window.open(link.href, "_blank", "noopener,noreferrer");
      } else {
        show(link, "view", true);
      }
    };

    root.addEventListener("pointerover", over);
    root.addEventListener("pointerout", out);
    root.addEventListener("click", click, true);
    return () => {
      clearTimeout(hoverTimer.current);
      clearTimeout(leaveTimer.current);
      root.removeEventListener("pointerover", over);
      root.removeEventListener("pointerout", out);
      root.removeEventListener("click", click, true);
    };
  }, [close, editor, scheduleHide, show]);

  // Selecting link text opens the popover too: reaching a link by keyboard
  // should not be worse than reaching it by mouse.
  useEffect(() => {
    if (!editor) return;

    const onSelectionUpdate = () => {
      // Editing owns the popover, and commit() moves the selection itself.
      if (modeRef.current === "edit") return;

      const { from, to, empty } = editor.state.selection;
      // Probe inside the selection, never on its boundary.
      const element = empty
        ? null
        : linkElementAt(editor, Math.min(from + 1, to));
      const range = element ? rangeFor(editor, element) : null;
      // Only when the selection sits within one link. Selecting a paragraph
      // that happens to contain links should not pop anything up.
      const holdsLink = range && from >= range.from && to <= range.to;

      if (!holdsLink) {
        if (selectionDriven.current) close();
        return;
      }

      show(element, "view", true);
      selectionDriven.current = true;
    };

    editor.on("selectionUpdate", onSelectionUpdate);
    return () => editor.off("selectionUpdate", onSelectionUpdate);
  }, [close, editor, show]);

  // Keep the popover anchored to the link (or the selection, for ⌘K).
  useLayoutEffect(() => {
    if (!open || !editor) return;
    const floating = floatingRef.current;
    if (!floating) return;
    const anchor = {
      contextElement: linkRef.current || editor.view.dom,
      getBoundingClientRect: () =>
        linkRef.current?.getClientRects?.()[0] ||
        posToDOMRect(editor.view, rangeRef.current.from, rangeRef.current.to),
    };
    return autoUpdate(anchor.contextElement, floating, () => {
      computePosition(anchor, floating, {
        strategy: "fixed",
        placement: "bottom-start",
        middleware: [offset(2), flip({ padding: 12 }), shift({ padding: 12 })],
      }).then(({ x, y }) => setPosition({ left: x, top: y }));
    });
  }, [editor, open, mode]);

  useEffect(() => {
    if (editing) requestAnimationFrame(() => inputRef.current?.select());
  }, [editing]);

  useEffect(() => () => clearTimeout(copyTimer.current), []);

  const copy = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1400);
    });
  };

  const unlink = () => {
    const range = rangeRef.current;
    close();
    if (range) {
      editor
        .chain()
        .focus()
        .setTextSelection(range)
        .extendMarkRange("link")
        .unsetLink()
        .run();
    }
  };

  const commit = () => {
    const normalized = normalizeLinkHref(draft);
    if (!getLinkDisplay(normalized).valid) {
      setInvalid(true);
      inputRef.current?.focus();
      return;
    }
    const range = rangeRef.current;
    const chain = editor.chain().focus().setTextSelection(range);
    if (range.from === range.to && !linkRef.current) {
      chain
        .insertContent(normalized)
        .setTextSelection({
          from: range.from,
          to: range.from + normalized.length,
        })
        .setLink({ href: normalized })
        .setTextSelection(range.from + normalized.length)
        .run();
    } else {
      chain.extendMarkRange("link").setLink({ href: normalized }).run();
    }
    close();
  };

  // Dismiss on outside pointer, Escape, or an edit elsewhere in the document.
  useEffect(() => {
    if (!open || !editor) return;
    const pointer = (event) => {
      if (floatingRef.current?.contains(event.target)) return;
      if (event.target.closest?.("a.zenpad-link")) return;
      close();
    };
    const key = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
      editor.commands.focus();
    };
    const transaction = ({ transaction: tx }) => {
      if (tx.docChanged) close();
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    editor.on("transaction", transaction);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
      editor.off("transaction", transaction);
    };
  }, [close, editor, open]);

  if (typeof document === "undefined") return null;

  const still = instant || reduce;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          ref={floatingRef}
          onPointerEnter={cancelHide}
          onPointerLeave={scheduleHide}
          // A little padding bridges the gap between the link and the popover
          // so the pointer never leaves the hover area on the way over.
          className="fixed z-50 p-1.5"
          style={{
            left: position?.left ?? 0,
            top: position?.top ?? 0,
            visibility: position ? "visible" : "hidden",
          }}
        >
          <motion.div
            id={POPOVER_ID}
            role={editing ? "dialog" : "tooltip"}
            aria-label={editing ? "Edit link" : undefined}
            // The morph animates real width, not a scale. A scale would stretch
            // the text and drag the buttons; width reflows the children at
            // their true size every frame, so the box genuinely grows.
            initial={still ? false : { opacity: 0 }}
            animate={{ opacity: 1, width: editing ? EDIT_WIDTH : "auto" }}
            exit={{ opacity: 0, transition: still ? INSTANT : EXIT }}
            transition={
              still ? INSTANT : { opacity: ENTER, width: MORPH, default: MORPH }
            }
            className={`link-chip flex items-center gap-1 rounded-[10px] py-1 pl-2.5 pr-1 text-[13px] shadow-lg shadow-black/10 dark:shadow-black/40 ${
              invalid ? "link-chip-invalid" : ""
            } ${editing ? "max-w-[calc(100vw-24px)]" : "max-w-[320px]"}`}
          >
            {/* Only this half changes shape. The exiting half is popped out of
                flow so the two crossfade in place instead of fighting over
                width while the box is still growing. */}
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={editing ? "edit" : "view"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.12 }}
                className={`flex h-7 min-w-0 items-center ${
                  editing ? "flex-1" : "gap-1.5"
                }`}
              >
                {editing ? (
                  <input
                    ref={inputRef}
                    aria-label="Link URL"
                    aria-invalid={invalid}
                    value={draft}
                    placeholder="Paste or type a link"
                    spellCheck={false}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      setInvalid(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        commit();
                      }
                    }}
                    className={`h-7 min-w-0 flex-1 bg-transparent outline-none placeholder:text-neutral-400 ${
                      invalid
                        ? "text-red-600 dark:text-red-400"
                        : "text-neutral-900 dark:text-neutral-100"
                    }`}
                  />
                ) : (
                  <button
                    type="button"
                    disabled={!display.valid}
                    title={url}
                    onClick={() =>
                      window.open(url, "_blank", "noopener,noreferrer")
                    }
                    className={`flex h-7 min-w-0 items-center gap-1.5 rounded-[6px] outline-none focus-visible:underline ${
                      display.valid
                        ? "text-neutral-900 dark:text-neutral-100"
                        : "text-neutral-500"
                    }`}
                  >
                    <KindIcon
                      className="size-3.5 shrink-0 text-neutral-500 dark:text-neutral-400"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 truncate font-medium">
                      {display.domain || url}
                    </span>
                    {display.path && (
                      <span className="shrink-0 font-medium text-neutral-600 dark:text-neutral-300">
                        {display.path}
                      </span>
                    )}
                  </button>
                )}
              </motion.div>
            </AnimatePresence>

            <span className="h-4 w-px shrink-0 bg-black/10 dark:bg-white/15" />

            {/* Identical in both modes -- same three slots, same widths -- so
                the right edge only ever travels with the growing box. */}
            <div className="flex shrink-0 items-center">
              <button
                type="button"
                className={ACTION_CLASS}
                onClick={copy}
                aria-label="Copy link"
              >
                <IconSwap swapKey={copied ? "check" : "copy"} reduce={reduce}>
                  {copied ? (
                    <Check
                      className="size-4 text-emerald-600 dark:text-emerald-400"
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : (
                    <Copy
                      className="size-4"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  )}
                </IconSwap>
              </button>
              <button
                type="button"
                className={ACTION_CLASS}
                onPointerDown={
                  editing ? (event) => event.preventDefault() : undefined
                }
                onClick={
                  editing
                    ? commit
                    : () => {
                        setDraft(url);
                        setMode("edit");
                      }
                }
                aria-label={editing ? "Save link" : "Edit link"}
              >
                <IconSwap swapKey={editing ? "save" : "edit"} reduce={reduce}>
                  {editing ? (
                    <Check
                      className="size-4"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  ) : (
                    <Pencil
                      className="size-4"
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />
                  )}
                </IconSwap>
              </button>
              <button
                type="button"
                className={`${ACTION_CLASS} hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400`}
                onClick={unlink}
                aria-label="Remove link"
              >
                <Unlink
                  className="size-4"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
});

LinkPopover.displayName = "LinkPopover";
export default LinkPopover;
