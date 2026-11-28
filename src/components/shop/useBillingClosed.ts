"use client";

import { useEffect, useState } from "react";
import { isBillingClosed } from "@/lib/orderCutoff";

// True from 5 PM IST until midnight. Re-checked every 30 seconds so a page
// left open at 4:59 PM shows the notice on its own. Never blocks ordering.
export function useBillingClosed(): boolean {
  // Starts open so the server-rendered HTML and the first client render match;
  // the effect then reads the real time.
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const check = () => setClosed(isBillingClosed());
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);

  return closed;
}
