"use client";

import { useState, useActionState } from "react";
import { logWarehouseAction } from "@/actions/warehouseActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

type TaskType = "INWARD" | "SHELVING" | "FULFILLMENT";

const REFERENCE_LABEL: Record<TaskType, string> = {
  INWARD: "Supplier invoice #",
  SHELVING: "Reference # (optional)",
  FULFILLMENT: "Order invoice #",
};

export function WarehouseActionForm({ taskType }: { taskType: TaskType }) {
  const [state, formAction, pending] = useActionState(logWarehouseAction, initialState);
  const [hasDiscrepancy, setHasDiscrepancy] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="taskType" value={taskType} />

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {REFERENCE_LABEL[taskType]}
        </label>
        <Input name="referenceNo" placeholder="e.g. INV-1042" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Item description</label>
        <Input name="itemDescription" placeholder="e.g. Paracetamol 500mg (10x10)" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Quantity</label>
        <Input name="quantity" type="number" min="0" step="1" placeholder="0" />
      </div>

      {taskType === "SHELVING" && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Rack location</label>
          <Input name="rackLocation" placeholder="e.g. Rack B3" />
        </div>
      )}

      <div className="flex gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="radio"
            name="hasDiscrepancy"
            value="false"
            checked={!hasDiscrepancy}
            onChange={() => setHasDiscrepancy(false)}
          />
          No discrepancy
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="radio"
            name="hasDiscrepancy"
            value="true"
            checked={hasDiscrepancy}
            onChange={() => setHasDiscrepancy(true)}
          />
          Flag discrepancy
        </label>
      </div>

      {hasDiscrepancy && (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Discrepancy notes</label>
          <textarea
            name="discrepancyNotes"
            required
            rows={3}
            className="w-full rounded-xl border-2 border-slate-300 p-3 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      )}

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-green-700">Logged.</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Log action"}
      </Button>
    </form>
  );
}
