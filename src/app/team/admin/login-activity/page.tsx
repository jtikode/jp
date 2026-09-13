import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";

interface RouteStat {
  routeName: string;
  totalStores: number;
  storesLoggedIn: number;
  totalLogins: number;
  repeatStores: number;
}

function adoptionBadgeClass(pct: number): string {
  if (pct >= 66) return "bg-green-100 text-green-700";
  if (pct >= 33) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-700";
}

export default async function LoginActivityPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const [events, stores, retailerEvents] = await Promise.all([
    db.loginEvent.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    db.store.findMany({ select: { id: true, route: { select: { name: true } } } }),
    db.loginEvent.findMany({ where: { accountType: "RETAILER" }, select: { storeId: true } }),
  ]);

  const loginCountByStore = new Map<string, number>();
  for (const e of retailerEvents) {
    if (!e.storeId) continue;
    loginCountByStore.set(e.storeId, (loginCountByStore.get(e.storeId) ?? 0) + 1);
  }

  const byRoute = new Map<string, RouteStat>();
  for (const store of stores) {
    const routeName = store.route?.name ?? "No Route Assigned";
    const stat = byRoute.get(routeName) ?? {
      routeName,
      totalStores: 0,
      storesLoggedIn: 0,
      totalLogins: 0,
      repeatStores: 0,
    };
    const count = loginCountByStore.get(store.id) ?? 0;
    stat.totalStores += 1;
    if (count > 0) stat.storesLoggedIn += 1;
    if (count > 1) stat.repeatStores += 1;
    stat.totalLogins += count;
    byRoute.set(routeName, stat);
  }
  const routeStats = [...byRoute.values()].sort((a, b) => a.routeName.localeCompare(b.routeName));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card className="overflow-x-auto">
        <h1 className="mb-1 text-lg font-bold text-slate-900">Shop App Adoption by Route</h1>
        <p className="mb-4 text-sm text-slate-500">
          Which routes are actually using the shop app — use this to follow up where retailers need a
          reminder or a hand holding them through it.
        </p>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Route</th>
              <th className="py-2 pr-4">Stores</th>
              <th className="py-2 pr-4">Ever Logged In</th>
              <th className="py-2 pr-4">Repeat Users</th>
              <th className="py-2 pr-4">Total Logins</th>
            </tr>
          </thead>
          <tbody>
            {routeStats.map((r) => {
              const pct = r.totalStores > 0 ? Math.round((r.storesLoggedIn / r.totalStores) * 100) : 0;
              return (
                <tr key={r.routeName} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-slate-900">{r.routeName}</td>
                  <td className="py-2 pr-4 text-slate-600">{r.totalStores}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${adoptionBadgeClass(pct)}`}>
                      {r.storesLoggedIn}/{r.totalStores} ({pct}%)
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-slate-600">{r.repeatStores}</td>
                  <td className="py-2 pr-4 text-slate-600">{r.totalLogins}</td>
                </tr>
              );
            })}
            {routeStats.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  No stores yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Login Activity</h2>
        <p className="mb-4 text-sm text-slate-500">
          Most recent 200 sign-ins across both staff logins and the retailer shop.
        </p>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Date &amp; Time</th>
              <th className="py-2 pr-4">Account</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 whitespace-nowrap text-slate-600">
                  {e.createdAt.toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Kolkata",
                  })}
                </td>
                <td className="py-2 pr-4 font-medium text-slate-900">{e.displayName}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      e.accountType === "STAFF"
                        ? "rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700"
                        : "rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-700"
                    }
                  >
                    {e.accountType === "STAFF" ? "Staff" : "Retailer"}
                  </span>
                </td>
                <td className="py-2 pr-4 font-mono text-xs text-slate-600">{e.ipAddress ?? "—"}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  No login activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
