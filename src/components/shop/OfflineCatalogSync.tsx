"use client";

import { useEffect } from "react";
import { saveCatalogSnapshot, getCatalogSnapshotSavedAt } from "@/lib/offlineCatalog";

const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000;

// Silently keeps a full local copy of the catalog up to date whenever the
// device has a connection, so search/browse/alternatives still work with
// zero signal — not just whichever single page happened to be cached.
// Renders nothing; this is pure background maintenance.
export function OfflineCatalogSync() {
  useEffect(() => {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;

    let cancelled = false;
    (async () => {
      try {
        const savedAt = await getCatalogSnapshotSavedAt();
        if (savedAt && Date.now() - savedAt < REFRESH_INTERVAL_MS) return;

        const res = await fetch("/api/shop/catalog-snapshot");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.products)) {
          await saveCatalogSnapshot(data.products);
        }
      } catch {
        // Best-effort — the app just keeps using whatever snapshot (or
        // none) it already had.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
