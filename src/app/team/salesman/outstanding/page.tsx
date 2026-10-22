import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { getRouteOutstanding } from "@/lib/routeOutstanding";

export const dynamic = "force-dynamic";

// Outstanding tab: the salesman's own routes with what is due on each;
// tapping a route lists its parties.
export default async function SalesmanOutstandingPage() {
  const session = await getSession();
  const orgId = session.orgId as string;
  const lang = await getLang();
  const db = getOrgScopedDb(orgId);

  const assignments = await db.routeAssignment.findMany({
    where: { userId: session.userId },
    include: { route: true },
  });
  const routes = [...new Map(assignments.map((a) => [a.routeId, a.route])).values()].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const rows = await Promise.all(
    routes.map(async (r) => ({ route: r, ...(await getRouteOutstanding(orgId, r.id)) })),
  );
  const grandTotal = rows.reduce((a, r) => a + r.total, 0);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "nav_outstanding")}</h1>
        <p className="mt-1 text-sm text-slate-500">Tap a route to see party-wise outstanding.</p>
        <p className="mt-3 text-2xl font-extrabold text-red-700">₹{Math.round(grandTotal).toLocaleString("en-IN")}</p>
        <p className="text-xs text-slate-500">Total across your routes</p>
      </Card>

      {rows.map(({ route, total, parties }) => (
        <Link key={route.id} href={`/team/salesman/outstanding/${route.id}`}>
          <Card className="mb-3 hover:bg-slate-50">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{route.name}</p>
                <p className="text-sm text-slate-500">
                  {parties.length} {parties.length === 1 ? "party" : "parties"} with dues
                </p>
              </div>
              <p className="shrink-0 text-lg font-bold text-red-700">₹{Math.round(total).toLocaleString("en-IN")}</p>
            </div>
          </Card>
        </Link>
      ))}
      {rows.length === 0 && <p className="py-6 text-center text-slate-400">No routes assigned to you yet.</p>}
    </div>
  );
}
