"use client";

import { useActionState } from "react";
import { addStockItem } from "@/actions/stockActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

export function AddStockItemForm() {
  const [state, formAction, pending] = useActionState(addStockItem, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Input name="name" placeholder="Item name" required className="flex-1" />
      <Button type="submit" disabled={pending} className="min-h-11 px-6 py-2 text-sm">
        {pending ? "Adding..." : "Add"}
      </Button>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
    </form>
  );
}
