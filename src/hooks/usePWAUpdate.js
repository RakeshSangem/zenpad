import { useRef } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/**
 * Service worker registration and the "update available" state, on top of
 * vite-plugin-pwa's own React binding.
 *
 * Whoever renders this owns whether the app is available offline, since
 * registration happens on mount — so it belongs above any gate that waits on
 * app state. App.jsx mounts PWAUpdateBanner outside the storage gate for
 * exactly that reason.
 */
export function usePWAUpdate() {
  const registrationRef = useRef(null);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    // Options are not reactive — this callback only ever sees first-render
    // values, so it must not close over anything that changes.
    onRegisteredSW(_swUrl, registration) {
      if (!registration) return;
      registrationRef.current = registration;
      window.setInterval(() => {
        registration.update();
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  return {
    needRefresh,
    updateServiceWorker: () => {
      // updateServiceWorker() tells a *waiting* worker to skip waiting, then
      // reloads once it takes control. With nothing waiting — a first install,
      // where the worker activates straight away — there is no worker to
      // receive the message and no controllerchange to wait for, so it would
      // resolve having done nothing: a button that visibly does nothing.
      if (!registrationRef.current?.waiting) {
        setNeedRefresh(false);
        window.location.reload();
        return Promise.resolve();
      }

      return updateServiceWorker(true);
    },
    dismissPrompt: () => setNeedRefresh(false),
  };
}
