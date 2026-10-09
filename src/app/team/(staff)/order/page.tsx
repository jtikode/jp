import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { PartyOrderPicker } from "@/components/team/PartyOrderPicker";

export const dynamic = "force-dynamic";

export default async function TakeOrderPage() {
  await requireRole(["ADMIN", "SALESMAN"]);
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Take an order</h1>
        <p className="mt-1 text-sm text-slate-500">
          Type the party&apos;s name, pick it, and the shop opens in their name: the same products, offers
          and checkout the retailer sees. The order shows who booked it.
        </p>
      </Card>
      <PartyOrderPicker />
    </div>
  );
}
