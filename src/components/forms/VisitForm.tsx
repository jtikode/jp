"use client";

import { useState } from "react";
import { useActionState } from "react";
import { submitVisit } from "@/actions/visitActions";
import { GeolocationCapture } from "@/components/capture/GeolocationCapture";
import { CameraCapture } from "@/components/capture/CameraCapture";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

const NO_ORDER_REASONS: Array<[string, string]> = [
  ["STORE_CLOSED", "Store closed"],
  ["NO_STOCK_NEEDED", "No stock needed"],
  ["OWNER_NOT_AVAILABLE", "Owner not available"],
  ["PAYMENT_DISPUTE", "Payment dispute"],
  ["COMPETITOR_STOCKED", "Competitor stocked"],
  ["OTHER", "Other"],
];

export function VisitForm({ storeId }: { storeId: string }) {
  const [state, formAction, pending] = useActionState(submitVisit, initialState);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoReady, setPhotoReady] = useState(false);
  const [hasOrder, setHasOrder] = useState(true);

  const canSubmit = Boolean(coords) && photoReady && !pending;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="latitude" value={coords?.lat ?? ""} />
      <input type="hidden" name="longitude" value={coords?.lng ?? ""} />

      <GeolocationCapture onCapture={(lat, lng) => setCoords({ lat, lng })} />
      <CameraCapture onCapture={() => setPhotoReady(true)} />

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Collection Amount</label>
        <Input name="collectionAmount" type="number" step="0.01" min="0" placeholder="0.00" />
      </div>

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
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes (optional)</label>
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-xl border-2 border-slate-300 p-3 text-base focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}

      <Button type="submit" disabled={!canSubmit}>
        {pending ? "Submitting..." : "Submit Visit"}
      </Button>
      {!canSubmit && !pending && (
        <p className="text-center text-sm text-slate-400">
          Verify GPS and take a photo before submitting.
        </p>
      )}
    </form>
  );
}
