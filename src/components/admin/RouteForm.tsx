"use client";

import { useActionState } from "react";
import { createRoute } from "@/actions/routeActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

export function RouteForm() {
  const [state, formAction, pending] = useActionState(createRoute, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Input name="name" placeholder="Route name" required />
      <Input name="description" placeholder="Description (optional)" />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add route"}
      </Button>

      {state.error && (
        <p className="col-span-full text-sm font-medium text-red-600">{state.error}</p>
      )}
    </form>
  );
}
