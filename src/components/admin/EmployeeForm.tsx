"use client";

import { useActionState } from "react";
import { createEmployee } from "@/actions/employeeActions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

export function EmployeeForm() {
  const [state, formAction, pending] = useActionState(createEmployee, initialState);

  return (
    <form action={formAction} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Input name="name" placeholder="Full name" required />
      <Input name="username" placeholder="Username" required />
      <Input name="password" type="password" placeholder="Password" required />
      <Select name="role" required defaultValue="SALESMAN">
        <option value="SALESMAN">Salesman</option>
        <option value="TELECALLER">Telecaller</option>
        <option value="WAREHOUSE">Warehouse</option>
        <option value="ADMIN">Admin</option>
      </Select>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add employee"}
      </Button>

      {state.error && (
        <p className="col-span-full text-sm font-medium text-red-600">{state.error}</p>
      )}
      {state.ok && (
        <p className="col-span-full text-sm font-medium text-green-700">Employee added.</p>
      )}
    </form>
  );
}
