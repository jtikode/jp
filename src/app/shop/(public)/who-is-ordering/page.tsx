"use client";

import { useActionState } from "react";
import { saveOrderGiverWhatsapp, type OrderGiverState } from "@/actions/shopAccountActions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const initialState: OrderGiverState = { ok: false };

export default function WhoIsOrderingPage() {
  const [state, formAction, pending] = useActionState(saveOrderGiverWhatsapp, initialState);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">Who&apos;s Ordering?</h1>
        <p className="mb-6 text-slate-500">
          Before you start, please share the WhatsApp number of whoever will be placing orders on
          this account — this helps us know who we&apos;re speaking with.
        </p>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="orderGiverWhatsapp" className="mb-1 block text-sm font-medium text-slate-700">
              WhatsApp Number
            </label>
            <Input
              id="orderGiverWhatsapp"
              name="orderGiverWhatsapp"
              type="tel"
              autoComplete="tel"
              required
            />
          </div>

          {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}

          <Button type="submit" disabled={pending} className="mt-2 w-full">
            {pending ? "Saving..." : "Continue"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
