import React, { useState } from "react";
import { useAppStore } from "../store";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const AccountMenu = () => {
  const user = useAppStore((state) => state.user);
  const logout = useAppStore((state) => state.logout);
  const openAuthModal = useAppStore((state) => state.openAuthModal);
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <div className="border-t border-neutral-200 p-2 dark:border-[#2a2a2a]">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full flex-col items-start gap-0 rounded-lg px-3 py-2 text-left transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
          onClick={openAuthModal}
        >
          <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Sync across devices
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-500">
            Sign in or create an account
          </p>
        </Button>
      </div>
    );
  }

  const initial = (user.name || user.email || "?").charAt(0).toUpperCase();

  const handleLogout = () => {
    setOpen(false);
    logout();
  };

  return (
    <div className="border-t border-neutral-200 dark:border-[#2a2a2a]">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          type="button"
          className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors
          ${
            open
              ? "bg-neutral-100 dark:bg-neutral-800/60"
              : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-medium text-neutral-700 dark:text-neutral-300 shrink-0">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
              {user.name || "Account"}
            </p>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-500 truncate">
              {user.email}
            </p>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 15.75l7.5-7.5 7.5 7.5"
            />
          </svg>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          side="top"
          align="center"
          sideOffset={8}
          className="w-[calc(var(--anchor-width)-1rem)]"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="px-3 py-2.5 font-normal">
              <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                {user.name || "Account"}
              </p>
              <p className="text-xs text-neutral-500 dark:text-neutral-500 truncate mt-0.5">
                {user.email}
              </p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} variant="destructive">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default AccountMenu;
