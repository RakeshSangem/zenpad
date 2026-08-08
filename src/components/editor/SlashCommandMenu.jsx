import React, { useEffect, useRef } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command";
import { Popover, PopoverContent } from "../ui/popover";

function SlashCommandMenu({
  open,
  anchor,
  commands,
  selectedIndex,
  onSelectedIndexChange,
  onSelect,
  onDismiss,
}) {
  const commandItemRefs = useRef([]);

  useEffect(() => {
    if (!open) return;
    commandItemRefs.current[selectedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [open, selectedIndex]);

  return (
    <Popover open={open} onOpenChange={(nextOpen) => !nextOpen && onDismiss()}>
      {open && (
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          initialFocus={false}
          finalFocus={false}
          positionerProps={{
            anchor,
            collisionAvoidance: {
              side: "flip",
              align: "shift",
              fallbackAxisSide: "none",
            },
            collisionPadding: 12,
            positionMethod: "fixed",
          }}
          className="zenpad-slash-menu max-h-(--available-height) w-auto animate-none! gap-0 overflow-hidden rounded-[12px] border border-neutral-200 bg-white p-1.5 shadow-xl shadow-black/10 ring-0 duration-0! dark:border-[#333] dark:bg-[#222] dark:shadow-black/40"
        >
          <Command
            value={commands[selectedIndex]?.label || ""}
            onValueChange={(value) => {
              const index = commands.findIndex(
                (command) => command.label === value,
              );
              if (index >= 0) onSelectedIndexChange(index);
            }}
            shouldFilter={false}
            className="min-h-0 h-auto max-h-[calc(var(--available-height)-12px)] w-72 rounded-[8px]! border-0! bg-transparent! p-0! shadow-none!"
          >
            <CommandList className="slash-command-list min-h-0 max-h-[calc(var(--available-height)-12px)] overflow-x-hidden overflow-y-auto overscroll-contain">
              <CommandEmpty className="py-8 text-xs text-neutral-400">
                No blocks found.
              </CommandEmpty>
              <CommandGroup className="p-0">
                {commands.map((command, index) => {
                  const Icon = command.icon;
                  return (
                    <React.Fragment key={command.label}>
                      {(command.label === "Bulleted list" ||
                        command.label === "Table") && (
                        <CommandSeparator className="my-1 bg-neutral-200 dark:bg-neutral-700" />
                      )}
                      <CommandItem
                        value={command.label}
                        onMouseDown={(event) => event.preventDefault()}
                        onMouseEnter={() => onSelectedIndexChange(index)}
                        onSelect={() => onSelect(command)}
                        className={`h-9 gap-2 rounded-[8px] px-2 py-1.5 text-left font-medium [&>svg:last-child]:hidden ${
                          selectedIndex === index
                            ? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                            : "hover:bg-neutral-50 dark:hover:bg-neutral-800/70"
                        }`}
                      >
                        <span
                          ref={(node) => {
                            commandItemRefs.current[index] = node;
                          }}
                          className="flex w-5 shrink-0 items-center justify-center text-neutral-600 dark:text-neutral-400"
                        >
                          <Icon
                            className="size-4"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="min-w-0 truncate text-sm">
                          {command.label}
                        </span>
                      </CommandItem>
                    </React.Fragment>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  );
}

export default SlashCommandMenu;
