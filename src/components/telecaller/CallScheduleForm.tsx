"use client";

import { useActionState } from "react";
import { assignRouteCallDay } from "@/actions/telecallerActions";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function CallScheduleForm({ routes }: { routes: { id: string; name: string }[] }) {
  const [state, formAction, pending] = useActionState(assignRouteCallDay, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <Select name="routeId" required defaultValue="">
        <option value="" disabled>
          Choose a route
        </option>
        {routes.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </Select>
      <Select name="dayOfWeek" required defaultValue="">
        <option value="" disabled>
          Choose a day
        </option>
        {DAY_NAMES.map((d, i) => (
          <option key={i} value={i}>
            {d}
          </option>
        ))}
      </Select>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Assign"}
      </Button>
    </form>
  );
}
