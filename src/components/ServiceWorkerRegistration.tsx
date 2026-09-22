"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // sw.js calls self.skipWaiting() on install, so a new deploy's worker
    // takes over an already-open tab almost immediately — but the tab's
    // already-loaded JS still references the previous build's hashed chunk
    // files, which no longer exist on the server, and throws ChunkLoadError
    // the moment it needs one it hasn't loaded yet. Reloading once the new
    // worker takes control gets the tab back onto the current build instead
    // of leaving it stuck showing the error screen.
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });

    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);

  return null;
}
