import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

/**
 * Checkbox whose tick draws itself on and springs into place.
 *
 * The box (size, border, colours) is `.zenpad-checkbox` in index.css so this
 * and the plain `Checkbox` look identical at rest; everything that moves is
 * driven here by motion.
 *
 * `keepMounted` holds the tick in the DOM while unchecked so unticking
 * animates out instead of vanishing.
 */
function AnimatedCheckbox({ className, onCheckedChange, ...props }) {
  // motion does not honour the OS setting on its own — it has to be asked.
  const reduceMotion = useReducedMotion();
  const [isChecked, setIsChecked] = React.useState(
    props.checked ?? props.defaultChecked ?? false,
  );

  React.useEffect(() => {
    if (props.checked !== undefined) setIsChecked(props.checked);
  }, [props.checked]);

  const handleCheckedChange = React.useCallback(
    (checked, eventDetails) => {
      setIsChecked(checked);
      onCheckedChange?.(checked, eventDetails);
    },
    [onCheckedChange],
  );

  return (
    <CheckboxPrimitive.Root
      {...props}
      onCheckedChange={handleCheckedChange}
      render={
        <motion.span
          data-slot="checkbox"
          className={cn("zenpad-checkbox", className)}
          // No hover scale. The control is 15px, so 5% is under a pixel of
          // growth — too little to read as growing, and enough to re-rasterize
          // the tick onto a different pixel grid, which reads as a twitch.
          // Hover feedback is the border instead (index.css). A press is brief
          // and deliberate enough to carry the scale.
          whileTap={reduceMotion ? undefined : { scale: 0.92 }}
        />
      }
    >
      <CheckboxPrimitive.Indicator
        keepMounted
        render={
          <motion.svg
            data-slot="checkbox-indicator"
            xmlns="http://www.w3.org/2000/svg"
            // Optically centred, not geometrically. The path's bounding box is
            // dead centre, but a tick's ink sits low and right of it — the long
            // arm carries about twice the weight of the short one, putting the
            // centroid near (12.4, 13.0) in a box whose centre is (12, 12).
            // Offsetting the viewBox moves the drawing rather than the element,
            // so it cannot fight motion's transforms.
            viewBox="0.4 1 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            aria-hidden="true"
            // `initial={false}` so a note that opens with items already ticked
            // shows them settled instead of drawing every tick on load.
            initial={false}
            animate={isChecked ? "checked" : "unchecked"}
            variants={{
              // Ticking is an achievement, so it springs.
              checked: {
                scale: 1,
                transition: reduceMotion
                  ? { duration: 0 }
                  : { type: "spring", stiffness: 500, damping: 22 },
              },
              // Unticking is a correction, so it gets out of the way: short,
              // linear-ish, no spring. A spring on the way out reads as the
              // control being pleased about it.
              unchecked: {
                scale: 0.8,
                transition: reduceMotion
                  ? { duration: 0 }
                  : { duration: 0.12, ease: [0.4, 0, 1, 1] },
              },
            }}
          />
        }
      >
        <motion.path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 12.75l6 6 9-13.5"
          variants={{
            checked: {
              pathLength: 1,
              opacity: 1,
              transition: reduceMotion
                ? { duration: 0 }
                : {
                    // Draws itself on, after the circle has filled.
                    pathLength: { duration: 0.2, delay: 0.06, ease: "easeOut" },
                    opacity: { duration: 0 },
                  },
            },
            unchecked: {
              pathLength: 0,
              opacity: 0,
              transition: reduceMotion
                ? { duration: 0 }
                : {
                    // The tick fades as a whole tick. Reversing the draw would
                    // un-write it from the tail, which nothing in the physical
                    // world does and which the eye reads as a glitch.
                    opacity: { duration: 0.1, ease: [0.4, 0, 1, 1] },
                    // Rewind the stroke only once it is invisible, so the next
                    // tick has a full length to draw.
                    pathLength: { duration: 0, delay: 0.1 },
                  },
            },
          }}
        />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { AnimatedCheckbox };
