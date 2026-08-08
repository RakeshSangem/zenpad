import React, { forwardRef, useLayoutEffect, useRef } from "react";

// A textarea rather than an input so long titles wrap instead of scrolling
// sideways. It still behaves like a single-field title: Enter moves on to the
// body and pasted line breaks collapse to spaces.
const NoteTitleInput = forwardRef(function NoteTitleInput(
  { value, onChange, onCommit, onEnter },
  ref,
) {
  const innerRef = useRef(null);

  const attachRef = (node) => {
    innerRef.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };

  useLayoutEffect(() => {
    const element = innerRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);

  const handleChange = (event) => {
    const collapsed = event.target.value.replace(/[\r\n]+/g, " ");
    if (collapsed !== event.target.value) event.target.value = collapsed;
    onChange(event);
  };

  return (
    <textarea
      ref={attachRef}
      rows={1}
      value={value}
      maxLength={500}
      onChange={handleChange}
      onBlur={onCommit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onEnter();
        }
      }}
      className="note-title-input mb-7 w-full"
      placeholder="Untitled"
      aria-label="Note title"
      autoComplete="off"
      spellCheck={false}
    />
  );
});

NoteTitleInput.displayName = "NoteTitleInput";

export default NoteTitleInput;
