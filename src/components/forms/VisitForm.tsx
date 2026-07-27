"use client";

import { useState } from "react";
import { useActionState } from "react";
import { submitVisit } from "@/actions/visitActions";
import { GeolocationCapture } from "@/components/capture/GeolocationCapture";
import { CameraCapture } from "@/components/capture/CameraCapture";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { t, type Lang } from "@/lib/i18n";

const initialState = { ok: false, error: undefined };

const NO_ORDER_REASONS: Array<
  [string, "reason_store_closed" | "reason_no_stock_needed" | "reason_owner_not_available" | "reason_payment_dispute" | "reason_competitor_stocked" | "reason_other"]
> = [
  ["STORE_CLOSED", "reason_store_closed"],
  ["NO_STOCK_NEEDED", "reason_no_stock_needed"],
  ["OWNER_NOT_AVAILABLE", "reason_owner_not_available"],
  ["PAYMENT_DISPUTE", "reason_payment_dispute"],
  ["COMPETITOR_STOCKED", "reason_competitor_stocked"],
  ["OTHER", "reason_other"],
];

export function VisitForm({ storeId, lang }: { storeId: string; lang: Lang }) {
  const [state, formAction, pending] = useActionState(submitVisit, initialState);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [photoReady, setPhotoReady] = useState(false);
  const [hasOrder, setHasOrder] = useState(true);
  const [hasDiscount, setHasDiscount] = useState(false);

  const canSubmit = Boolean(coords) && photoReady && !pending;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="storeId" value={storeId} />
      <input type="hidden" name="latitude" value={coords?.lat ?? ""} />
      <input type="hidden" name="longitude" value={coords?.lng ?? ""} />

      <GeolocationCapture lang={lang} onCapture={(lat, lng) => setCoords({ lat, lng })} />
      <CameraCapture lang={lang} onCapture={() => setPhotoReady(true)} />

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t(lang, "collection_amount")}
        </label>
        <Input name="collectionAmount" type="number" step="0.01" min="0" placeholder="0.00" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t(lang, "discount_given")}
        </label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="radio"
              name="hasDiscount"
              value="true"
              checked={hasDiscount}
              onChange={() => setHasDiscount(true)}
            />
            {t(lang, "yes")}
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="radio"
              name="hasDiscount"
              value="false"
              checked={!hasDiscount}
              onChange={() => setHasDiscount(false)}
            />
            {t(lang, "no")}
          </label>
        </div>
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
          {t(lang, "order_placed")}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="radio"
            name="hasOrder"
            value="false"
            checked={!hasOrder}
            onChange={() => setHasOrder(false)}
          />
          {t(lang, "no_order")}
        </label>
      </div>

      {hasOrder ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            {t(lang, "order_amount")}
          </label>
          <Input name="orderAmount" type="number" step="0.01" min="0" placeholder="0.00" />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{t(lang, "reason")}</label>
          <Select name="noOrderReason" required defaultValue="">
            <option value="" disabled>
              {t(lang, "choose_a_reason")}
            </option>
            {NO_ORDER_REASONS.map(([value, key]) => (
              <option key={value} value={value}>
                {t(lang, key)}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          {t(lang, "notes_optional")}
        </label>
        <Textarea name="notes" rows={3} />
      </div>

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}

      <Button type="submit" disabled={!canSubmit}>
        {pending ? t(lang, "submitting") : t(lang, "submit_visit")}
      </Button>
      {!canSubmit && !pending && (
        <p className="text-center text-sm text-slate-400">{t(lang, "verify_gps_photo")}</p>
      )}
    </form>
  );
}
