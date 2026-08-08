import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";

import { cn } from "@/lib/utils";
import { ChevronRightIcon, CheckIcon } from "lucide-react";

const SURFACE =
  "rounded-[12px] border border-neutral-200 bg-white p-1.5 text-neutral-800 shadow-xl shadow-black/10 dark:border-[#333] dark:bg-[#222] dark:text-neutral-100 dark:shadow-black/40";

const ITEM =
  "relative flex h-8 cursor-default items-center gap-2 rounded-[8px] px-2 text-sm text-neutral-700 outline-hidden select-none data-inset:pl-7 focus:bg-neutral-100 focus:text-neutral-900 data-highlighted:bg-neutral-100 data-highlighted:text-neutral-900 data-disabled:pointer-events-none data-disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:text-neutral-500 [&_svg:not([class*='size-'])]:size-4 dark:text-neutral-300 dark:focus:bg-neutral-800 dark:focus:text-neutral-100 dark:data-highlighted:bg-neutral-800 dark:data-highlighted:text-neutral-100 dark:[&_svg]:text-neutral-400";

const DESTRUCTIVE =
  "data-[variant=destructive]:text-red-600 data-[variant=destructive]:focus:bg-red-50 data-[variant=destructive]:data-highlighted:bg-red-50 data-[variant=destructive]:[&_svg]:text-red-600 dark:data-[variant=destructive]:text-red-400 dark:data-[variant=destructive]:focus:bg-red-500/10 dark:data-[variant=destructive]:data-highlighted:bg-red-500/10 dark:data-[variant=destructive]:[&_svg]:text-red-400";

const MOTION =
  "duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95";

function DropdownMenu({ ...props }) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({ ...props }) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

function DropdownMenuTrigger({ ...props }) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

function DropdownMenuContent({
  align = "start",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  className,
  ...props
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        className="isolate z-50 outline-none"
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
      >
        <MenuPrimitive.Popup
          data-slot="dropdown-menu-content"
          className={cn(
            "z-50 max-h-(--available-height) w-(--anchor-width) min-w-32 origin-(--transform-origin) overflow-x-hidden overflow-y-auto outline-none",
            SURFACE,
            MOTION,
            className,
          )}
          {...props}
        />
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({ ...props }) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

function DropdownMenuLabel({ className, inset, ...props }) {
  return (
    <MenuPrimitive.GroupLabel
      data-slot="dropdown-menu-label"
      data-inset={inset}
      className={cn(
        "px-2 py-1 text-xs font-medium text-neutral-500 data-inset:pl-7 dark:text-neutral-400",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuItem({ className, inset, variant = "default", ...props }) {
  return (
    <MenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      className={cn(
        "group/dropdown-menu-item",
        ITEM,
        DESTRUCTIVE,
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuSub({ ...props }) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({ className, inset, children, ...props }) {
  return (
    <MenuPrimitive.SubmenuTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      className={cn(
        ITEM,
        "data-popup-open:bg-neutral-100 data-popup-open:text-neutral-900 dark:data-popup-open:bg-neutral-800 dark:data-popup-open:text-neutral-100",
        className,
      )}
      {...props}
    >
      {children}
      <ChevronRightIcon className="ml-auto size-3.5" />
    </MenuPrimitive.SubmenuTrigger>
  );
}

function DropdownMenuSubContent({
  align = "start",
  alignOffset = -7,
  side = "right",
  sideOffset = 4,
  className,
  ...props
}) {
  return (
    <DropdownMenuContent
      data-slot="dropdown-menu-sub-content"
      className={cn("w-48", className)}
      align={align}
      alignOffset={alignOffset}
      side={side}
      sideOffset={sideOffset}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  inset,
  ...props
}) {
  return (
    <MenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      data-inset={inset}
      className={cn(ITEM, "pr-8", className)}
      checked={checked}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-checkbox-item-indicator"
      >
        <MenuPrimitive.CheckboxItemIndicator>
          <CheckIcon />
        </MenuPrimitive.CheckboxItemIndicator>
      </span>
      {children}
    </MenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({ ...props }) {
  return (
    <MenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({ className, children, inset, ...props }) {
  return (
    <MenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      data-inset={inset}
      className={cn(ITEM, "pr-8", className)}
      {...props}
    >
      <span
        className="pointer-events-none absolute right-2 flex items-center justify-center"
        data-slot="dropdown-menu-radio-item-indicator"
      >
        <MenuPrimitive.RadioItemIndicator>
          <CheckIcon />
        </MenuPrimitive.RadioItemIndicator>
      </span>
      {children}
    </MenuPrimitive.RadioItem>
  );
}

function DropdownMenuSeparator({ className, ...props }) {
  return (
    <MenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn(
        "-mx-1.5 my-1 h-px bg-neutral-200 dark:bg-neutral-700",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn(
        "ml-auto text-xs tracking-widest text-neutral-400 dark:text-neutral-500",
        className,
      )}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};
