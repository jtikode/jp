"use client";

import { useState, useActionState } from "react";
import { createWarehouseTask } from "@/actions/warehouseTaskActions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

const WEEKDAYS: Array<[number, string]> = [
  [1, "Monday"],
  [2, "Tuesday"],
  [3, "Wednesday"],
  [4, "Thursday"],
  [5, "Friday"],
  [6, "Saturday"],
  [0, "Sunday"],
];

export function WarehouseTaskForm() {
  const [state, formAction, pending] = useActionState(createWarehouseTask, initialState);
  const [recurrence, setRecurrence] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Task title</label>
        <Input name="title" required placeholder="e.g. Sweep loading bay" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description (optional)</label>
        <Input name="description" placeholder="Any extra detail" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Repeats</label>
        <Select
          name="recurrence"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as "WEEKLY" | "MONTHLY")}
        >
          <option value="WEEKLY">Every week, on a day</option>
          <option value="MONTHLY">Every month, on a date</option>
        </Select>
      </div>

      {recurrence === "WEEKLY" ? (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Day of week</label>
          <Select name="dayOfWeek" required defaultValue="">
            <option value="" disabled>
              Choose a day
            </option>
            {WEEKDAYS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Day of month</label>
          <Select name="dayOfMonth" required defaultValue="">
            <option value="" disabled>
              Choose a date
            </option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </div>
      )}

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add task"}
      </Button>
    </form>
  );
}
