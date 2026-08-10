import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // "prompt", not the plugin's default "autoUpdate": autoUpdate skip-waits
      // and claims, swapping the app out from under whoever is using it. A
      // silent reload mid-sentence is the wrong trade for an editor.
      registerType: "prompt",
      // Registration is ours, via useRegisterSW in usePWAUpdate.
      injectRegister: false,
      // Without this there is no service worker in `npm run dev`, so none of
      // the offline behaviour can be tested without a build and preview.
      devOptions: {
        enabled: true,
        type: "module",
        suppressWarnings: true,
      },
      manifest: {
        name: "Zenpad",
        short_name: "Zenpad",
        description: "A minimal, distraction-free notepad for focused writing",
        theme_color: "#1a1a1a",
        background_color: "#fafafa",
        display: "standalone",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/favicon.ico",
            sizes: "64x64 32x32 24x24 16x16",
            type: "image/x-icon",
          },
        ],
      },
      workbox: {
        // woff2 matters: without it the Inter files miss the precache and the
        // app silently falls back to the system font offline.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff2}"],
        // Take control of the page that installed us, so the app works offline
        // after one visit instead of two. Safe alongside registerType
        // "prompt" — claiming happens on activation, and an updated worker
        // still waits for the user to accept, because skipWaiting stays off.
        clientsClaim: true,
        // Navigations go to the network first, and only fall back to the
        // precached shell when that fails.
        //
        // The default is the other way round: navigations are answered from
        // the precached index.html. That means a deploy can leave an online
        // user holding the previous shell, which then asks for hashed assets
        // the new deploy has retired, gets a 404, and renders nothing — and a
        // reload repeats it, because the reload is served the same stale
        // shell. Preferring the network makes that impossible while online:
        // the document always names assets that currently exist. Offline, the
        // fallback shell and everything it references come from the same
        // precache, so it stays self-consistent.
        //
        // The cost is a round trip for a document of a few hundred bytes,
        // bounded by networkTimeoutSeconds before falling back to the cache.
        navigateFallback: null,
        // Not enough on its own: the precache route resolves "/" to the
        // precached index.html through directoryIndex, and it is registered
        // before any runtimeCaching route, so it would answer navigations
        // from cache no matter what is configured below. Turning it off is
        // what actually lets the network-first route see them.
        directoryIndex: null,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "zenpad-shell",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 1 },
              cacheableResponse: { statuses: [200] },
              // The offline fallback has to be the *precached* shell, not this
              // strategy's own cache: the first navigation happens before the
              // worker is controlling anything, so nothing has seeded it yet.
              // The precache is populated at install, so it is there from the
              // first visit.
              precacheFallback: { fallbackURL: "/index.html" },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
});
