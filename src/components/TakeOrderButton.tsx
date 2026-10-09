import Link from "next/link";
import { ShoppingBag } from "lucide-react";

// Header shortcut for admins and salesmen: opens the party picker used to
// take an order in a retailer's name.
export function TakeOrderButton() {
  return (
    <Link
      href="/team/order"
      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-blue-700 px-4 text-sm font-semibold text-white hover:bg-blue-800"
    >
      <ShoppingBag size={18} />
      Take Order
    </Link>
  );
}
