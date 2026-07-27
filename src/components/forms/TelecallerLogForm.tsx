"use client";

import { useState, useActionState } from "react";
import { logTelecallerContact } from "@/actions/telecallerActions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

const initialState = { ok: false, error: undefined };

const NO_ORDER_REASONS: Array<[string, string]> = [
  ["STORE_CLOSED", "Store closed"],
  ["NO_STOCK_NEEDED", "No stock needed"],
  ["OWNER_NOT_AVAILABLE", "Owner not available"],
  ["PAYMENT_DISPUTE", "Payment dispute"],
  ["COMPETITOR_STOCKED", "Competitor stocked"],
  ["OTHER", "Other"],
];

export function TelecallerLogForm({ storeId }: { storeId: string }) {
  const [state, formAction, pending] = useActionState(logTelecallerContact, initialState);
  const [hasOrder, setHasOrder] = useState(true);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />

      <div className="flex gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="radio"
            name="hasOrder"
            value="true"
            checked={hasOrder}
            onChange={() => setHasOrder(true)}
          />
          Order placed
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="radio"
            name="hasOrder"
            value="false"
            checked={!hasOrder}
            onChange={() => setHasOrder(false)}
          />
          No order
        </label>
      </div>

      {hasOrder ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Order Amount</label>
          <Input name="orderAmount" type="number" step="0.01" min="0" placeholder="0.00" />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
          <Select name="noOrderReason" required defaultValue="">
            <option value="" disabled>
              Choose a reason
            </option>
            {NO_ORDER_REASONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Payment Promise</label>
        <Input name="paymentPromise" placeholder="e.g. Promised ₹3000 on next visit" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Collection Amount</label>
        <Input name="collectionAmount" type="number" step="0.01" min="0" placeholder="0.00" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">No-payment reason (optional)</label>
        <Input name="noPaymentReason" placeholder="e.g. Owner traveling" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Complaint / Issue notes (visible to owner)
        </label>
        <Textarea name="complaintNotes" rows={3} />
      </div>

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save log"}
      </Button>
    </form>
  );
}
