import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { currentTimeMs } from "@/lib/istTime";
import { Card } from "@/components/ui/Card";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";

interface AdoptionStat {
  label: string;
  salesmen?: string;
  totalStores: number;
  loggedIn: number;
  active7d: number;
  ordered: number;
  orders: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function adoptionBadgeClass(pct: number): string {
  if (pct >= 66) return "bg-green-100 text-green-700";
  if (pct >= 33) return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-700";
}

function Ratio({ n, total }: { n: number; total: number }) {
  const pct = total > 0 ? Math.round((n / total) * 100) : 0;
  return (
    <span className={`rounded-full px-2 py-1 text-xs font-semibold whitespace-nowrap ${adoptionBadgeClass(pct)}`}>
      {n}/{total} ({pct}%)
    </span>
  );
}

function emptyStat(label: string, salesmen?: string): AdoptionStat {
  return { label, salesmen, totalStores: 0, loggedIn: 0, active7d: 0, ordered: 0, orders: 0 };
}

function AdoptionTable({
  rows,
  firstColumn,
  showSalesmen = false,
}: {
  rows: AdoptionStat[];
  firstColumn: string;
  showSalesmen?: boolean;
}) {
  return (
    <table className="w-full min-w-[720px] text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-slate-500">
          <th className="py-2 pr-4">{firstColumn}</th>
          {showSalesmen && <th className="py-2 pr-4">Salesman</th>}
          <th className="py-2 pr-4">Stores</th>
          <th className="py-2 pr-4">Ever Logged In</th>
          <th className="py-2 pr-4">Last 7 Days</th>
          <th className="py-2 pr-4">Have Ordered</th>
          <th className="py-2 pr-4">Orders</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.label} className="border-b border-slate-100">
            <td className="py-2 pr-4 font-medium text-slate-900">{r.label}</td>
            {showSalesmen && <td className="py-2 pr-4 text-slate-600">{r.salesmen ?? "—"}</td>}
            <td className="py-2 pr-4 text-slate-600 tabular-nums">{r.totalStores}</td>
            <td className="py-2 pr-4">
              <Ratio n={r.loggedIn} total={r.totalStores} />
            </td>
            <td className="py-2 pr-4 text-slate-600 tabular-nums">{r.active7d}</td>
            <td className="py-2 pr-4">
              <Ratio n={r.ordered} total={r.totalStores} />
            </td>
            <td className="py-2 pr-4 text-slate-600 tabular-nums">{r.orders}</td>
          </tr>
        ))}
        {rows.length === 0 && (
          <tr>
            <td colSpan={showSalesmen ? 7 : 6} className="py-4 text-center text-slate-400">
              No stores yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// Everything that used to live on the Login Activity page, now rendered at the
// bottom of the admin dashboard overview.
export async function LoginActivitySections({ orgId }: { orgId: string }) {
  const db = getOrgScopedDb(orgId);
  const weekAgo = new Date(currentTimeMs() - 7 * DAY_MS);

  const [events, stores, retailerEvents, orderCounts, assignments] = await Promise.all([
    db.loginEvent.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    db.store.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        orderGiverWhatsapp: true,
        lastLoginAt: true,
        routeId: true,
        route: { select: { name: true } },
      },
    }),
    db.loginEvent.findMany({
      where: { accountType: "RETAILER" },
      select: { storeId: true, createdAt: true },
    }),
    db.order.groupBy({ by: ["storeId"], _count: { _all: true }, _max: { createdAt: true } }),
    db.routeAssignment.findMany({
      select: { routeId: true, user: { select: { name: true, role: true } } },
    }),
  ]);

  const everLoggedIn = new Set<string>();
  const active7dStores = new Set<string>();
  const lastLoginByStore = new Map<string, Date>();
  for (const e of retailerEvents) {
    if (!e.storeId) continue;
    everLoggedIn.add(e.storeId);
    if (e.createdAt >= weekAgo) active7dStores.add(e.storeId);
    const prev = lastLoginByStore.get(e.storeId);
    if (!prev || e.createdAt > prev) lastLoginByStore.set(e.storeId, e.createdAt);
  }
  const lastOrderByStore = new Map(orderCounts.map((o) => [o.storeId, o._max.createdAt]));
  const orderCountByStore = new Map(orderCounts.map((o) => [o.storeId, o._count._all]));

  const salesmenByRoute = new Map<string, string[]>();
  for (const a of assignments) {
    if (a.user.role !== "SALESMAN") continue;
    const list = salesmenByRoute.get(a.routeId) ?? [];
    list.push(a.user.name);
    salesmenByRoute.set(a.routeId, list);
  }

  function addStore(stat: AdoptionStat, storeId: string) {
    const orders = orderCountByStore.get(storeId) ?? 0;
    stat.totalStores += 1;
    if (everLoggedIn.has(storeId)) stat.loggedIn += 1;
    if (active7dStores.has(storeId)) stat.active7d += 1;
    if (orders > 0) stat.ordered += 1;
    stat.orders += orders;
  }

  const byRoute = new Map<string, AdoptionStat>();
  const bySalesman = new Map<string, AdoptionStat>();
  const overall = emptyStat("All stores");
  for (const store of stores) {
    const routeName = store.route?.name ?? "No Route Assigned";
    const names = (store.routeId && salesmenByRoute.get(store.routeId)) || [];
    const routeStat = byRoute.get(routeName) ?? emptyStat(routeName, names.join(", ") || undefined);
    addStore(routeStat, store.id);
    byRoute.set(routeName, routeStat);

    // A route shared by two salesmen counts fully toward each of them.
    for (const name of names.length > 0 ? names : ["No salesman assigned"]) {
      const salesmanStat = bySalesman.get(name) ?? emptyStat(name);
      addStore(salesmanStat, store.id);
      bySalesman.set(name, salesmanStat);
    }
    addStore(overall, store.id);
  }
  // Routes with the most retailers logged in come first; ties fall back to the
  // bigger route, then name.
  const routeStats = [...byRoute.values()].sort(
    (a, b) => b.loggedIn - a.loggedIn || b.totalStores - a.totalStores || a.label.localeCompare(b.label),
  );
  const salesmanStats = [...bySalesman.values()].sort((a, b) => b.loggedIn - a.loggedIn);

  // Parties that have logged in to the shop app at some point but have not
  // signed in for 30 days (the same cut-off the store lists call "Inactive").
  const lapsedCutoff = new Date(currentTimeMs() - 30 * DAY_MS);
  const fmtDate = (d: Date | null | undefined) =>
    d ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";
  const lapsedRows = stores
    .filter((s) => everLoggedIn.has(s.id) && (lastLoginByStore.get(s.id) ?? s.lastLoginAt ?? new Date(0)) < lapsedCutoff)
    .map((s) => {
      const last = lastLoginByStore.get(s.id) ?? s.lastLoginAt;
      const lastOrder = lastOrderByStore.get(s.id);
      return {
        Party: s.name,
        "WhatsApp Number": s.orderGiverWhatsapp ?? "",
        "Shop Phone": s.phone ?? "",
        Route: s.route?.name ?? "No Route Assigned",
        Salesman: ((s.routeId && salesmenByRoute.get(s.routeId)) || []).join(", "),
        "Last App Login": fmtDate(last),
        "Days Since Login": last ? Math.floor((currentTimeMs() - last.getTime()) / DAY_MS) : "",
        "App Orders": orderCountByStore.get(s.id) ?? 0,
        "Last App Order": fmtDate(lastOrder),
      };
    })
    .sort((a, b) => Number(b["Days Since Login"] || 0) - Number(a["Days Since Login"] || 0));

  const tiles = [
    { label: "Stores", value: overall.totalStores },
    { label: "Ever logged in", value: overall.loggedIn },
    { label: "Logged in last 7 days", value: overall.active7d },
    { label: "Stores that ordered", value: overall.ordered },
    { label: "App orders", value: overall.orders },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {tiles.map((tile) => (
          <Card key={tile.label}>
            <p className="text-xs font-medium text-slate-500">{tile.label}</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{tile.value}</p>
          </Card>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <h2 className="mb-1 text-lg font-bold text-slate-900">Shop App Adoption by Salesman</h2>
        <p className="mb-4 text-sm text-slate-500">
          Counts every store on the salesman&apos;s routes. Where two salesmen share a route, its stores
          count for both.
        </p>
        <AdoptionTable rows={salesmanStats} firstColumn="Salesman" />
      </Card>

      <Card className="overflow-x-auto">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">Shop App Adoption by Route</h2>
          <ExportExcelButton
            data={lapsedRows}
            filename="parties-logged-in-but-not-using-app"
            label={`Export parties not using app (${lapsedRows.length})`}
          />
        </div>
        <p className="mb-4 text-sm text-slate-500">
          Routes with the most retailers logged in are listed first. The export lists every party that
          has logged in before but not in the last 30 days, with WhatsApp numbers, to follow up.
        </p>
        <AdoptionTable rows={routeStats} firstColumn="Route" showSalesmen />
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
