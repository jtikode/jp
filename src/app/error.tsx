"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-sm text-center">
        <p className="mb-2 text-lg font-bold text-slate-900">Something went wrong</p>
        <p className="mb-4 text-sm text-slate-500">
          Please try again. If this keeps happening, tell the owner what you were doing.
        </p>
        <Button onClick={reset} className="w-full">
          Try again
        </Button>
      </Card>
    </div>
  );
}
