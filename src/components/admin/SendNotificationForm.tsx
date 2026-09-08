"use client";

import { useActionState } from "react";
import { sendAnnouncementNotification, type SendNotificationState } from "@/actions/bannerActions";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initialState: SendNotificationState = { ok: false };

export function SendNotificationForm() {
  const [state, formAction, pending] = useActionState(sendAnnouncementNotification, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Title</label>
        <Input name="title" placeholder="e.g. New stock arrived" required />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Message</label>
        <Input name="body" placeholder="e.g. Fresh batch of antibiotics now in stock — order today." required />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Opens to (optional)</label>
        <Input name="url" placeholder="/shop/products" />
        <p className="mt-1 text-xs text-slate-500">
          Where tapping the notification takes the retailer. Defaults to the shop home screen.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Send at (optional)</label>
        <Input name="sendAt" type="datetime-local" />
        <p className="mt-1 text-xs text-slate-500">
          Leave blank to send immediately, or pick a future date/time to schedule it.
        </p>
      </div>

      {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
      {state.ok && !state.scheduled && (
        <p className="text-sm font-medium text-green-700">
          Sent to {state.sentCount} device{state.sentCount === 1 ? "" : "s"} across {state.storeCount} store
          {state.storeCount === 1 ? "" : "s"}.
        </p>
      )}
      {state.ok && state.scheduled && state.scheduledAt && (
        <p className="text-sm font-medium text-green-700">
          Scheduled for {new Date(state.scheduledAt).toLocaleString("en-IN")}.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Sending..." : "Send or Schedule"}
      </Button>
    </form>
  );
}
