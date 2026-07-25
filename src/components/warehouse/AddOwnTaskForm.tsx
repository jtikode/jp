"use client";

import { useActionState } from "react";
import { createAdHocWarehouseTask } from "@/actions/warehouseTaskActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

export function AddOwnTaskForm() {
  const [state, formAction, pending] = useActionState(createAdHocWarehouseTask, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Input name="title" placeholder="Task title" required />
      <Input name="description" placeholder="Details (optional)" />
      <Button type="submit" disabled={pending} className="min-h-11 px-6 py-2 text-sm">
        {pending ? "Adding..." : "Add for today"}
      </Button>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
    </form>
  );
}
