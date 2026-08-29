"use client";

import { useActionState } from "react";
import { updateStoreContact } from "@/actions/telecallerActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

export function StoreContactForm({
  storeId,
  phone,
  contactPersonName,
}: {
  storeId: string;
  phone: string | null;
  contactPersonName: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateStoreContact, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="storeId" value={storeId} />
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Contact person</label>
        <Input name="contactPersonName" defaultValue={contactPersonName ?? ""} placeholder="e.g. Ramesh (Owner)" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone number</label>
        <Input name="phone" defaultValue={phone ?? ""} placeholder="10-digit mobile number" />
      </div>
      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.ok && <p className="text-sm font-medium text-green-700">Saved.</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : phone ? "Update contact" : "Add mobile number"}
      </Button>
    </form>
  );
}
