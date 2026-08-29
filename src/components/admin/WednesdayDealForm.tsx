"use client";

import { useActionState } from "react";
import { createWednesdayDeal } from "@/actions/wednesdayDealActions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

export interface DealFormProduct {
  id: string;
  name: string;
  company: string | null;
  price: number;
}

export function WednesdayDealForm({ products }: { products: DealFormProduct[] }) {
  const [state, formAction, pending] = useActionState(createWednesdayDeal, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Product</label>
        <Select name="productId" required defaultValue="">
          <option value="" disabled>
            Choose a product...
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.company ? `(${p.company})` : ""} — ₹{p.price.toLocaleString("en-IN")} normal
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Deal price (₹)</label>
        <Input name="dealPrice" type="number" min="0.01" step="0.01" required placeholder="e.g. 45" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Max quantity per retailer</label>
        <Input name="maxQtyPerStore" type="number" min="1" step="1" required placeholder="e.g. 5" />
      </div>

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Add / Update Wednesday Deal"}
      </Button>
      <p className="text-xs text-slate-500">
        Picking a product that already has a deal updates its price/limit instead of creating a
        duplicate. The deal price and limit only apply on Wednesdays.
      </p>
    </form>
  );
}
