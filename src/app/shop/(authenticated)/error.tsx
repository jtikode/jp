"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Catches anything that throws while rendering a page or running a server
// action under the authenticated shop (e.g. Pay Online's "I have paid").
// Sits inside (authenticated)/layout.tsx, so the header/bottom nav/cart stay
// mounted and usable — only the broken page content is replaced by this,
// giving the retailer a way out instead of Next's raw crash screen.
//
// The single most common real cause here is a stale deploy: the retailer's
// browser already has an older JS bundle cached (service worker or otherwise)
// from before the last release, and it calls a server action that no longer
// exists on the now-redeployed server. `reset()` alone won't fix that — it
// just re-renders with the same stale bundle — so a full reload (which also
// lets the service worker swap in the current build) is the real fix and is
// offered as the primary action.
export default function ShopAuthenticatedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Shop error boundary:", error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
      <Card className="w-full">
        <h1 className="text-lg font-bold text-slate-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500">
          That didn&apos;t go through. This is usually fixed by reloading the page — please try
          again, and if it keeps happening, let us know.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={() => window.location.reload()} className="w-full">
            Reload page
          </Button>
          <Button onClick={reset} variant="outline" className="w-full">
            Try again without reloading
          </Button>
        </div>
      </Card>
    </div>
  );
}
