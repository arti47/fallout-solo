import { useEffect, useState } from 'react';
import { Download, X, Check } from 'lucide-react';
import { registerServiceWorker, applyUpdate } from '../pwa/registerSW';

// Pip-Boy themed toasts driven by the service worker lifecycle:
//  - "New version available" → tap Update to apply it (the page reloads).
//  - "Ready to play offline"  → shown once after the app is first cached.
// Works in the browser tab and in the installed (Add to Home Screen) app.
export default function UpdateToast() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);

  useEffect(() => {
    registerServiceWorker({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
    });
  }, []);

  // The offline-ready confirmation is informational — auto-dismiss it.
  useEffect(() => {
    if (!offlineReady) return;
    const t = setTimeout(() => setOfflineReady(false), 6000);
    return () => clearTimeout(t);
  }, [offlineReady]);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4 pointer-events-none">
      {needRefresh ? (
        <div className="pointer-events-auto w-full max-w-sm bg-black border-2 border-[#14FF00] shadow-[0_0_15px_#14FF00] p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Download size={22} className="shrink-0 text-[#14FF00]" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold uppercase tracking-wider text-[#14FF00]">New version available</div>
            <div className="text-xs opacity-70 normal-case">A fresh build is ready to install.</div>
          </div>
          <button
            onClick={applyUpdate}
            className="shrink-0 border-2 border-[#14FF00] px-3 py-1.5 text-sm font-bold uppercase text-[#14FF00] hover:bg-[#14FF00] hover:text-black transition-colors"
          >
            Update
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            aria-label="Dismiss"
            className="shrink-0 text-[#14FF00]/60 hover:text-[#14FF00]"
          >
            <X size={20} />
          </button>
        </div>
      ) : (
        <div className="pointer-events-auto w-full max-w-sm bg-black border-2 border-amber-400 shadow-[0_0_15px_#fbbf24] p-3 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Check size={22} className="shrink-0 text-amber-400" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold uppercase tracking-wider text-amber-400">Ready to play offline</div>
            <div className="text-xs opacity-70 normal-case">The wasteland is cached on this device.</div>
          </div>
          <button
            onClick={() => setOfflineReady(false)}
            aria-label="Dismiss"
            className="shrink-0 text-amber-400/60 hover:text-amber-400"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
