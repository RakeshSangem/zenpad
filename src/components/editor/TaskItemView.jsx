import React from "react";
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react";
import { AnimatedCheckbox } from "../ui/animated-checkbox";

/**
 * Renders a task list item with the app's AnimatedCheckbox instead of the bare
 * `<input type="checkbox">` Tiptap ships. The markup keeps Tiptap's shape
 * (`li[data-checked] > label + div`) so the task list styles and the Markdown
 * serializer, which reads the node attribute rather than the DOM, are unchanged.
 */
function TaskItemView({ node, updateAttributes, editor }) {
  return (
    <NodeViewWrapper as="li" data-type="taskItem" data-checked={node.attrs.checked}>
      {/* The checkbox is chrome, not content: leaving it editable would let the
          caret land inside it and let a selection delete it. */}
      <label contentEditable={false}>
        <AnimatedCheckbox
          checked={node.attrs.checked}
          disabled={!editor.isEditable}
          onCheckedChange={(checked) => updateAttributes({ checked })}
          aria-label={node.attrs.checked ? "Mark as not done" : "Mark as done"}
        />
      </label>
      <NodeViewContent as="div" />
    </NodeViewWrapper>
  );
}

export default TaskItemView;
