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
