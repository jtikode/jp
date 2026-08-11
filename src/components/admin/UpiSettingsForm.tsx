"use client";

import { useActionState } from "react";
import { updateUpiSettings } from "@/actions/settingsActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

export function UpiSettingsForm({
  defaults,
}: {
  defaults: { upiVpa: string; upiPayeeName: string };
}) {
  const [state, formAction, pending] = useActionState(updateUpiSettings, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">UPI ID (VPA)</label>
        <Input name="upiVpa" placeholder="jptraders@okhdfcbank" defaultValue={defaults.upiVpa} />
        <p className="mt-1 text-xs text-slate-500">
          Retailers tap &quot;Pay Online&quot; in the shop to pay this UPI ID directly from their
          own bank app — no payment gateway involved.
        </p>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Payee Name</label>
        <Input name="upiPayeeName" placeholder="J.P. Traders" defaultValue={defaults.upiPayeeName} />
      </div>
      <div>
        <Button type="submit" disabled={pending} className="min-h-11 px-6 py-2 text-sm">
          {pending ? "Saving..." : "Save"}
        </Button>
      </div>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-green-700">Saved.</p>}
    </form>
  );
}
