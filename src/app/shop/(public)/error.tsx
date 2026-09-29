"use client";

import { useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

// Same purpose as (authenticated)/error.tsx, for the public/unauthenticated
// shop pages (login, register, the public product page) — see that file for
// why a full reload is offered as the primary fix.
export default function ShopPublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Shop public error boundary:", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-sm text-center">
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
