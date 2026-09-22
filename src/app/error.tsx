"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// A stale service-worker cache (or a browser that kept old JS in memory
// across a deploy) throws exactly this shape of error: the page references
// a chunk file that no longer exists on the server because a newer build
// replaced it. `reset()` alone just re-renders the same stale chunk and
// fails again — this needs a real reload to fetch the current page fresh.
function isStaleChunkError(error: Error): boolean {
  return (
    /ChunkLoadError/i.test(error.name) ||
    /loading chunk|failed to fetch dynamically imported module|failed to import/i.test(error.message)
  );
}

const RELOAD_KEY = "jpt_stale_chunk_reload_at";

// One automatic hard reload per occurrence — if a genuinely broken deploy
// keeps throwing this after the reload, we don't want to loop forever.
function shouldAutoReload(error: Error): boolean {
  if (typeof window === "undefined" || !isStaleChunkError(error)) return false;
  const lastReload = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
  return Date.now() - lastReload > 15000;
}

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const autoReloading = shouldAutoReload(error);
  const triggered = useRef(false);

  useEffect(() => {
    if (!autoReloading || triggered.current) return;
    triggered.current = true;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
    window.location.reload();
  }, [autoReloading]);

  function tryAgain() {
    if (isStaleChunkError(error)) {
      window.location.reload();
    } else {
      reset();
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-sm text-center">
        <p className="mb-2 text-lg font-bold text-slate-900">
          {autoReloading ? "Updating..." : "Something went wrong"}
        </p>
        <p className="mb-4 text-sm text-slate-500">
          {autoReloading
            ? "Loading the latest version of the app."
            : "Please try again. If this keeps happening, tell the owner what you were doing."}
        </p>
        {!autoReloading && (
          <Button onClick={tryAgain} className="w-full">
            Try again
          </Button>
        )}
      </Card>
    </div>
  );
}
