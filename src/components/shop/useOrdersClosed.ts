"use client";

import { useEffect, useState } from "react";
import { isOrderingClosed } from "@/lib/orderCutoff";

// True from 5 PM IST until midnight. Re-checked every 30 seconds so a cart
// left open at 4:59 PM flips to "closed" on its own. The server refuses the
// order regardless (placeOrder), so this only decides what the retailer sees.
export function useOrdersClosed(): boolean {
  // Starts open so the server-rendered HTML and the first client render match;
  // the effect then reads the real time.
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const check = () => setClosed(isOrderingClosed());
    check();
    const id = setInterval(check, 30_000);
    return () => clearInterval(id);
  }, []);

  return closed;
}
