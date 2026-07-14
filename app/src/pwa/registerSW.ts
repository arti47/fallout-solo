// Dependency-free service worker registration for the update-toast flow.
// Detects a waiting (newly deployed) service worker and exposes an updater the
// UI calls when the player taps "Update".

interface Callbacks {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
}

let updateSW: (() => void) | null = null;
/** Tell the waiting service worker to activate; the page reloads when it takes control. */
export const applyUpdate = () => updateSW?.();

export function registerServiceWorker(cb: Callbacks): void {
  // Only meaningful for the built app (dev has no generated sw.js).
  if (!import.meta.env.PROD) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;

  const start = async () => {
    const swUrl = `${import.meta.env.BASE_URL}sw.js`;
    try {
      const reg = await navigator.serviceWorker.register(swUrl, { scope: import.meta.env.BASE_URL });

      let userTriggeredUpdate = false;
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Reload only when the user asked to update (not on the very first
        // install, where the SW claims control without a version change).
        if (!userTriggeredUpdate || refreshing) return;
        refreshing = true;
        window.location.reload();
      });

      updateSW = () => {
        userTriggeredUpdate = true;
        reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
      };

      // A new version was already waiting from a previous visit.
      if (reg.waiting && navigator.serviceWorker.controller) cb.onNeedRefresh?.();

      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener('statechange', () => {
          if (installing.state !== 'installed') return;
          if (navigator.serviceWorker.controller) cb.onNeedRefresh?.(); // update available
          else cb.onOfflineReady?.(); // first install → cached for offline
        });
      });

      // Check once, on load, for a newer deploy.
      reg.update().catch(() => {});
    } catch {
      /* registration failed — app still works online */
    }
  };

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}
