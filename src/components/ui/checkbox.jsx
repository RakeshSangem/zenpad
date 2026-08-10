import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";

import { cn } from "@/lib/utils";

/**
 * Plain checkbox: the tick is simply there or not.
 *
 * For the version whose tick draws itself on, see `animated-checkbox.jsx`.
 * Box styling for both lives in `.zenpad-checkbox` (index.css).
 */
function Checkbox({ className, ...props }) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn("zenpad-checkbox", className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator data-slot="checkbox-indicator">
        {/* Offset viewBox: optical centring, see animated-checkbox.jsx. */}
        <svg viewBox="0.4 1 24 24" fill="none" aria-hidden="true">
          <path
            d="M4.5 12.75l6 6 9-13.5"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
