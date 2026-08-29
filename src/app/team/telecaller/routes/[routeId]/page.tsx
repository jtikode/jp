import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { StoreCard } from "@/components/telecaller/StoreCard";

export default async function TelecallerRouteDetailPage({
  params,
}: {
  params: Promise<{ routeId: string }>;
}) {
  const session = await getSession();
  const db = getOrgScopedDb(session.orgId as string);
  const { routeId } = await params;

  const route = await db.route.findUnique({ where: { id: routeId } });
  if (!route) notFound();

  const [stores, outstandingGroups] = await Promise.all([
    db.store.findMany({ where: { routeId }, orderBy: { name: "asc" } }),
    db.ledgerEntry.groupBy({
      by: ["storeId"],
      where: { store: { routeId } },
      _sum: { outstandingAmount: true },
    }),
  ]);
  const outstandingByStore = new Map(
    outstandingGroups.map((g) => [g.storeId, Number(g._sum.outstandingAmount ?? 0)]),
  );

  return (
    <div className="mx-auto max-w-md space-y-3">
      <Link
        href="/team/telecaller/routes"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-slate-900"
      >
        ← All Routes
      </Link>

      <Card>
        <h1 className="text-lg font-bold text-slate-900">{route.name}</h1>
        <p className="text-sm text-slate-500">{stores.length} retailers on this route</p>
      </Card>

      {stores.map((store) => (
        <StoreCard
          key={store.id}
          id={store.id}
          name={store.name}
          externalCode={store.externalCode}
          address={store.address}
          phone={store.phone}
          outstanding={outstandingByStore.get(store.id)}
        />
      ))}
      {stores.length === 0 && (
        <p className="py-6 text-center text-slate-400">No retailers assigned to this route yet.</p>
      )}
    </div>
  );
}
