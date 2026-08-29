"use client";

import { useActionState } from "react";
import { createBanner } from "@/actions/bannerActions";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const initialState = { ok: false, error: undefined };

export function AddBannerForm() {
  const [state, formAction, pending] = useActionState(createBanner, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Shows on</label>
        <Select name="placement" defaultValue="HERO">
          <option value="HERO">Home top carousel</option>
          <option value="OFFER">Special Offers carousel</option>
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Image</label>
        <input
          type="file"
          name="image"
          accept="image/*"
          required
          className="min-h-14 w-full rounded-xl border-2 border-dashed border-slate-300 px-4 py-3 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Title (optional)</label>
        <Input name="title" placeholder="e.g. Orthopedics range available" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Link (optional)</label>
        <Input name="linkUrl" placeholder="https://..." />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Sort order</label>
        <Input name="sortOrder" type="number" defaultValue={0} />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Flash deal — ends at (optional)
        </label>
        <Input name="expiresAt" type="datetime-local" />
        <p className="mt-1 text-xs text-slate-500">
          Set this to make it a time-boxed flash deal — every retailer with notifications enabled
          gets a push the moment you add it, and the banner disappears once this time passes.
        </p>
      </div>

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading..." : "Add banner"}
      </Button>
    </form>
  );
}
