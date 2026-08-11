"use client";

import { useActionState } from "react";
import { createLoyaltyTier } from "@/actions/loyaltyTierActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

export function AddLoyaltyTierForm() {
  const [state, formAction, pending] = useActionState(createLoyaltyTier, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
      <div className="w-40">
        <label className="mb-1 block text-sm font-medium text-slate-700">Spend threshold (₹)</label>
        <Input name="thresholdAmount" type="number" min="0" step="1" required />
      </div>
      <div className="flex-1 min-w-[200px]">
        <label className="mb-1 block text-sm font-medium text-slate-700">Reward</label>
        <Input name="rewardText" placeholder="e.g. Trolley bag or 3-burner cooktop" required />
      </div>
      <div className="w-24">
        <label className="mb-1 block text-sm font-medium text-slate-700">Sort order</label>
        <Input name="sortOrder" type="number" defaultValue={0} />
      </div>
      <Button type="submit" disabled={pending} className="min-h-11 px-6 py-2 text-sm">
        {pending ? "Adding..." : "Add"}
      </Button>
      {state.error && <p className="w-full text-sm font-medium text-red-600">{state.error}</p>}
    </form>
  );
}
