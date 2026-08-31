"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { generateShopLoginCredentials } from "@/actions/storeActions";

type State = { ok: boolean; generatedCount?: number };

export function GenerateShopLoginsButton({ pendingCount }: { pendingCount: number }) {
  const [state, formAction, pending] = useActionState<State, FormData>(
    async () => generateShopLoginCredentials(),
    { ok: false },
  );

  if (pendingCount === 0 && state.generatedCount === undefined) {
    return <p className="text-sm font-medium text-green-700">Every store already has login credentials.</p>;
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-3">
      <Button type="submit" disabled={pending || pendingCount === 0}>
        {pending
          ? "Generating..."
          : pendingCount > 0
            ? `Generate Login Credentials (${pendingCount} pending)`
            : "All stores have logins"}
      </Button>
      {state.generatedCount !== undefined && (
        <p className="text-sm font-medium text-green-700">
          Issued {state.generatedCount} new login{state.generatedCount === 1 ? "" : "s"}.
        </p>
      )}
    </form>
  );
}
