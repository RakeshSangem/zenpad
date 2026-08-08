import React, { forwardRef } from "react";
import { Input } from "../ui/input";

const NoteTitleInput = forwardRef(function NoteTitleInput(
  { value, onChange, onCommit, onEnter },
  ref,
) {
  return (
    <Input
      ref={ref}
      type="text"
      value={value}
      maxLength={500}
      onChange={onChange}
      onBlur={onCommit}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onEnter();
        }
      }}
      className="note-title-input mb-7"
      placeholder="Untitled"
      aria-label="Note title"
      autoComplete="off"
      spellCheck={false}
    />
  );
});

NoteTitleInput.displayName = "NoteTitleInput";

export default NoteTitleInput;

