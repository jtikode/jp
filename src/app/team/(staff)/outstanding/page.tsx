import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { storeLabel } from "@/lib/storeLabel";
import { getAllRouteTotals, searchPartyOutstanding, type RouteTotal } from "@/lib/routeOutstanding";

export const dynamic = "force-dynamic";

function RouteRow({ route }: { route: RouteTotal }) {
  return (
    <Link href={`/team/outstanding/${route.routeId}`}>
      <Card className="mb-3 hover:bg-slate-50">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-900">{route.name}</p>
            <p className="text-sm text-slate-500">
              {route.partiesWithDues} {route.partiesWithDues === 1 ? "party" : "parties"} with dues
            </p>
          </div>
          <p className="shrink-0 text-lg font-bold text-red-700">₹{Math.round(route.total).toLocaleString("en-IN")}</p>
        </div>
      </Card>
    </Link>
  );
}

// Outstanding tab: search any party or route, then the salesman's own routes,
// then every other route. Tapping a route lists its parties; tapping a party
// lists its bills.
export default async function SalesmanOutstandingPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const session = await getSession();
  const orgId = session.orgId as string;
  const lang = await getLang();
  const db = getOrgScopedDb(orgId);

  const [assignments, allRoutes, found] = await Promise.all([
    db.routeAssignment.findMany({ where: { userId: session.userId }, select: { routeId: true } }),
    getAllRouteTotals(orgId),
    searchPartyOutstanding(orgId, query),
  ]);
  const mineIds = new Set(assignments.map((a) => a.routeId));
  const mine = allRoutes.filter((r) => mineIds.has(r.routeId)).sort((a, b) => a.name.localeCompare(b.name));
  const others = allRoutes.filter((r) => !mineIds.has(r.routeId) && r.total > 0).sort((a, b) => a.name.localeCompare(b.name));
  const myTotal = mine.reduce((a, r) => a + r.total, 0);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "nav_outstanding")}</h1>
        <form method="get" className="mt-3 flex gap-2">
          <input
            name="q"
            defaultValue={query}
            placeholder="Search medical or route name"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm"
            autoComplete="off"
          />
          <button type="submit" className="min-h-11 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
            Search
          </button>
        </form>
        {query && (
          <Link href="/team/outstanding" className="mt-2 inline-block text-xs font-semibold text-slate-600">
            Clear search
          </Link>
        )}
        {!query && mine.length > 0 && (
          <>
            <p className="mt-3 text-2xl font-extrabold text-red-700">₹{Math.round(myTotal).toLocaleString("en-IN")}</p>
            <p className="text-xs text-slate-500">Total across your routes</p>
          </>
        )}
      </Card>

      {query ? (
        <div className="space-y-2">
          {query.length < 2 && <p className="py-4 text-center text-slate-400">Type at least 2 letters.</p>}
          {found.map((p) => (
            <Link key={p.storeId} href={`/team/outstanding/party/${p.storeId}`}>
              <Card className="mb-2 hover:bg-slate-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{storeLabel(p.name, p.externalCode)}</p>
                    <p className="text-xs text-slate-500">
                      {p.routeName ?? "No route"} · {p.bills} {p.bills === 1 ? "bill" : "bills"}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-bold text-red-700">₹{Math.round(p.outstanding).toLocaleString("en-IN")}</p>
                </div>
              </Card>
            </Link>
          ))}
          {query.length >= 2 && found.length === 0 && (
            <p className="py-6 text-center text-slate-400">No party with outstanding found for &ldquo;{query}&rdquo;.</p>
          )}
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Your routes</h2>
            {mine.map((r) => (
              <RouteRow key={r.routeId} route={r} />
            ))}
            {mine.length === 0 && <p className="py-4 text-center text-slate-400">No routes assigned to you.</p>}
          </section>
          <section>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">All other routes</h2>
            {others.map((r) => (
              <RouteRow key={r.routeId} route={r} />
            ))}
          </section>
        </>
      )}
    </div>
  );
}
