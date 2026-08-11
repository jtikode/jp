import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { AddLoyaltyTierForm } from "@/components/admin/AddLoyaltyTierForm";
import { toggleLoyaltyTierActive } from "@/actions/loyaltyTierActions";

export default async function AdminLoyaltyTiersPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const tiers = await db.loyaltyTier.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Add loyalty tier</h2>
        <AddLoyaltyTierForm />
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Loyalty tiers ({tiers.length})</h2>
        <table className="w-full min-w-[500px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Threshold</th>
              <th className="py-2 pr-4">Reward</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {tiers.map((tier) => (
              <tr key={tier.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 font-medium text-slate-900">
                  ₹{Number(tier.thresholdAmount).toLocaleString("en-IN")}
                </td>
                <td className="py-2 pr-4 text-slate-600">{tier.rewardText}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      tier.active
                        ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                        : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500"
                    }
                  >
                    {tier.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <form action={toggleLoyaltyTierActive.bind(null, tier.id, !tier.active)}>
                    <button type="submit" className="text-sm font-semibold text-blue-700 hover:underline">
                      {tier.active ? "Hide" : "Show"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {tiers.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  No loyalty tiers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
