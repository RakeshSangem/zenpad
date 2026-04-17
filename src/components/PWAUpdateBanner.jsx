import React from "react";
import { usePWAUpdate } from "../hooks/usePWAUpdate";

function PWAUpdateBanner() {
  const { needRefresh, offlineReady, updateServiceWorker, dismissPrompt } =
    usePWAUpdate();

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[min(380px,calc(100vw-2rem))] rounded-xl border border-neutral-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-[#2a2a2a] dark:bg-[#1f1f1f]/95">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100">
            {needRefresh ? "Update available" : "Offline mode ready"}
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
            {needRefresh
              ? "A newer version is ready. Reload to apply it."
              : "Zenpad is cached and can reopen without a network connection."}
          </p>
        </div>
        <button
          type="button"
          onClick={dismissPrompt}
            className="rounded-md p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
          aria-label="Dismiss update banner"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        {needRefresh && (
          <button
            type="button"
            onClick={() => updateServiceWorker()}
            className="rounded-md bg-neutral-900 px-2.5 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
          >
            Reload now
          </button>
        )}
          <button
            type="button"
            onClick={dismissPrompt}
            className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-[11px] font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900 dark:border-[#2a2a2a] dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
          >
            Dismiss
          </button>
      </div>
    </div>
  );
}

export default PWAUpdateBanner;
