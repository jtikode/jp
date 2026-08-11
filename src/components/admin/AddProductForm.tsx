"use client";

import { useActionState } from "react";
import { createProduct } from "@/actions/productActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

export function AddProductForm() {
  const [state, formAction, pending] = useActionState(createProduct, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
      <Input name="name" placeholder="Product name" required className="flex-1 min-w-[160px]" />
      <Input name="company" placeholder="Company (optional)" className="flex-1 min-w-[140px]" />
      <Input name="unit" placeholder="Unit (optional)" className="w-32" />
      <Input
        name="price"
        type="number"
        min="0"
        step="0.01"
        placeholder="Price"
        required
        className="w-28"
      />
      <Input name="mrp" type="number" min="0" step="0.01" placeholder="M.R.P (optional)" className="w-32" />
      <Input
        name="taxPercent"
        type="number"
        min="0"
        step="0.01"
        placeholder="Tax % (optional)"
        className="w-28"
      />
      <Input name="scheme" placeholder="Scheme (optional)" className="w-36" />
      <Button type="submit" disabled={pending} className="min-h-11 px-6 py-2 text-sm">
        {pending ? "Adding..." : "Add"}
      </Button>
      {state.error && <p className="w-full text-sm font-medium text-red-600">{state.error}</p>}
    </form>
  );
}
