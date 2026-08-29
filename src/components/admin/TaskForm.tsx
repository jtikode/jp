"use client";

import { useState, useActionState } from "react";
import { createTask } from "@/actions/taskActions";
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

const ROLE_LABELS: Record<string, string> = {
  SALESMAN: "All Salesmen",
  TELECALLER: "All Telecallers",
  WAREHOUSE: "All Warehouse Staff",
  ADMIN: "All Admins",
};

export interface TaskFormEmployee {
  id: string;
  name: string;
  role: string;
}

export function TaskForm({ employees }: { employees: TaskFormEmployee[] }) {
  const [state, formAction, pending] = useActionState(createTask, initialState);
  const [recurrence, setRecurrence] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | "ONCE">("DAILY");

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Task title</label>
        <Input name="title" required placeholder="e.g. Open store counters" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Description (optional)</label>
        <Input name="description" placeholder="Any extra detail" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Assign to</label>
        <Select name="assignTo" required defaultValue="">
          <option value="" disabled>
            Choose...
          </option>
          <optgroup label="Whole team">
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <option key={role} value={`role:${role}`}>
                {label}
              </option>
            ))}
          </optgroup>
          <optgroup label="Specific employee">
            {employees.map((e) => (
              <option key={e.id} value={`user:${e.id}`}>
                {e.name} ({e.role})
              </option>
            ))}
          </optgroup>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Repeats</label>
        <Select
          name="recurrence"
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as typeof recurrence)}
        >
          <option value="DAILY">Every day</option>
          <option value="WEEKLY">Every week, on a day</option>
          <option value="MONTHLY">Every month, on a date</option>
          <option value="ONCE">One-time (due today)</option>
        </Select>
      </div>

      {recurrence === "WEEKLY" && (
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
      )}

      {recurrence === "MONTHLY" && (
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

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Time (optional)</label>
        <Input type="time" name="scheduledTime" />
      </div>

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add task"}
      </Button>
    </form>
  );
}
