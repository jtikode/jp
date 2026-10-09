"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { stopOrderingForParty } from "@/actions/staffOrderActions";

// Shown across the shop while an admin or salesman is taking an order for a
// party, so it is never unclear whose account the cart belongs to.
export function StaffBookingBanner({ partyName, staffName }: { partyName: string; staffName: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function finish() {
    setBusy(true);
    try {
      // The cart is kept per device, so clear it before the next party's order.
      try {
        localStorage.removeItem("jpt_shop_cart");
      } catch {
        // Storage can be blocked; the next booking then starts with whatever is there.
      }
      const { redirectTo } = await stopOrderingForParty();
      router.push(redirectTo);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between gap-3 bg-amber-400 px-3 py-2 text-slate-900">
      <p className="min-w-0 text-xs font-semibold leading-snug sm:text-sm">
        Taking order for <span className="font-bold">{partyName}</span>
        <span className="hidden sm:inline"> as {staffName}</span>
      </p>
      <button
        type="button"
        onClick={finish}
        disabled={busy}
        className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 sm:text-sm"
      >
        {busy ? "Closing..." : "Done / Exit"}
      </button>
    </div>
  );
}
