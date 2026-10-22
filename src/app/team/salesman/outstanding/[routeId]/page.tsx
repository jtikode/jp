import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { storeLabel } from "@/lib/storeLabel";
import { getRouteOutstanding } from "@/lib/routeOutstanding";

export const dynamic = "force-dynamic";

function daysSince(d: Date): number {
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86_400_000));
}

// Party-wise outstanding for one of the salesman's own routes.
export default async function RouteOutstandingPage({ params }: { params: Promise<{ routeId: string }> }) {
  const { routeId } = await params;
  const session = await getSession();
  const orgId = session.orgId as string;
  const db = getOrgScopedDb(orgId);

  const assigned = await db.routeAssignment.findFirst({
    where: { userId: session.userId, routeId },
    include: { route: true },
  });
  if (!assigned) notFound();

  const { parties, total, partyCount } = await getRouteOutstanding(orgId, routeId);

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Link href="/team/salesman/outstanding" className="inline-block text-sm font-semibold text-slate-600 hover:text-slate-900">
        ← All routes
      </Link>

      <Card>
        <h1 className="text-xl font-bold text-slate-900">{assigned.route.name}</h1>
        <p className="mt-2 text-2xl font-extrabold text-red-700">₹{Math.round(total).toLocaleString("en-IN")}</p>
        <p className="text-xs text-slate-500">
          {parties.length} of {partyCount} parties have dues
        </p>
      </Card>

      <div className="space-y-2">
        {parties.map((p) => (
          <Link key={p.storeId} href={`/team/salesman/stores/${p.storeId}/visit`}>
            <Card className="mb-2 hover:bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{storeLabel(p.name, p.externalCode)}</p>
                  <p className="text-xs text-slate-500">
                    {p.bills} {p.bills === 1 ? "bill" : "bills"}
                    {p.oldestBill ? ` · oldest ${daysSince(p.oldestBill)} days` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-lg font-bold text-red-700">₹{Math.round(p.outstanding).toLocaleString("en-IN")}</p>
              </div>
            </Card>
          </Link>
        ))}
        {parties.length === 0 && <p className="py-6 text-center text-slate-400">No outstanding on this route.</p>}
      </div>
    </div>
  );
}
