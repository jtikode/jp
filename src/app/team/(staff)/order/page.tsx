import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { PartyOrderPicker } from "@/components/team/PartyOrderPicker";
import { getMyOrderAccess } from "@/actions/staffOrderActions";

export const dynamic = "force-dynamic";

export default async function TakeOrderPage() {
  await requireRole(["ADMIN", "SALESMAN"]);
  const access = await getMyOrderAccess();
  if (!access.retail && !access.distributor) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <h1 className="text-xl font-bold text-slate-900">Take an order</h1>
          <p className="mt-1 text-sm text-slate-500">
            Taking orders for parties is switched off for your login. Ask the admin to turn it on.
          </p>
        </Card>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">Take an order</h1>
        <p className="mt-1 text-sm text-slate-500">
          Type the party&apos;s name, pick it, and the shop opens in their name: the same products, offers
          and checkout the retailer sees. Distributors open the distributor portal at their own rates.
          The order shows who booked it.
        </p>
      </Card>
      <PartyOrderPicker />
    </div>
  );
}
