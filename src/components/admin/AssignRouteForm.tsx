"use client";

import { useActionState } from "react";
import { assignRoute } from "@/actions/routeActions";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

interface Option {
  id: string;
  label: string;
}

export function AssignRouteForm({ salesmen, routes }: { salesmen: Option[]; routes: Option[] }) {
  const [state, formAction, pending] = useActionState(assignRoute, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Select name="userId" required defaultValue="">
        <option value="" disabled>
          Choose salesman
        </option>
        {salesmen.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </Select>
      <Select name="routeId" required defaultValue="">
        <option value="" disabled>
          Choose route
        </option>
        {routes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.label}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={pending}>
        {pending ? "Assigning..." : "Assign"}
      </Button>

      {state.error && (
        <p className="col-span-full text-sm font-medium text-red-600">{state.error}</p>
      )}
    </form>
  );
}
