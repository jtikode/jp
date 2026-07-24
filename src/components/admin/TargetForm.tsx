"use client";

import { useActionState } from "react";
import { setTarget } from "@/actions/targetActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

interface TargetFormProps {
  userId: string;
  periodMonth: number;
  periodYear: number;
  defaults: { monthlyTarget: number; todayTarget: number; perRetailerTarget: number };
}

export function TargetForm({ userId, periodMonth, periodYear, defaults }: TargetFormProps) {
  const [state, formAction, pending] = useActionState(setTarget, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <input type="hidden" name="userId" value={userId} />
      <input type="hidden" name="periodMonth" value={periodMonth} />
      <input type="hidden" name="periodYear" value={periodYear} />

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Monthly Target</label>
        <Input
          name="monthlyTarget"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults.monthlyTarget || ""}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Today Target</label>
        <Input
          name="todayTarget"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults.todayTarget || ""}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Per Retailer Target</label>
        <Input
          name="perRetailerTarget"
          type="number"
          step="0.01"
          min="0"
          defaultValue={defaults.perRetailerTarget || ""}
        />
      </div>

      <div className="flex items-end">
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Saving..." : "Save targets"}
        </Button>
      </div>

      {state.error && <p className="col-span-full text-sm font-medium text-red-600">{state.error}</p>}
      {state.ok && <p className="col-span-full text-sm font-medium text-green-700">Targets saved.</p>}
    </form>
  );
}
