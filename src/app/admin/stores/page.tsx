import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { StoresTable } from "@/components/admin/StoresTable";
import { StoreSequenceList } from "@/components/admin/StoreSequenceList";
import { AssignStoreToRouteForm } from "@/components/admin/AssignStoreToRouteForm";
import { ExportExcelButton } from "@/components/ui/ExportExcelButton";

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams: Promise<{ routeId?: string }>;
}) {
  const { routeId } = await searchParams;

  const routes = await db.route.findMany({ orderBy: { name: "asc" } });

  if (routeId) {
    const route = routes.find((r) => r.id === routeId);
    const [routeStores, allStores] = await Promise.all([
      db.routeStore.findMany({
        where: { routeId },
        include: { store: true },
        orderBy: [{ visitSequence: { sort: "asc", nulls: "last" } }, { store: { name: "asc" } }],
      }),
      db.store.findMany({ orderBy: { name: "asc" } }),
    ]);
    const onRouteIds = new Set(routeStores.map((rs) => rs.storeId));
    const availableToAdd = allStores.filter((s) => !onRouteIds.has(s.id));

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <form method="get" className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-slate-500">Route</label>
              <Select name="routeId" defaultValue={routeId}>
                <option value="">All stores</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" className="min-h-11 px-6 py-2 text-sm">
              View
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold text-slate-900">Assign store to this route</h2>
          <p className="mb-3 text-sm text-slate-500">
            For a medical that needs visits from more than one salesman — a store can be on
            several routes at once.
          </p>
          <AssignStoreToRouteForm
            routeId={routeId}
            stores={availableToAdd.map((s) => ({
              id: s.id,
              label: s.externalCode ? `${s.externalCode} - ${s.name}` : s.name,
            }))}
          />
        </Card>

        <Card>
          <h1 className="mb-1 text-lg font-bold text-slate-900">
            {route?.name} — Visit Sequence
          </h1>
          <p className="mb-4 text-sm text-slate-500">
            Reorder with the arrows to match the actual visit route.
          </p>
          <StoreSequenceList
            routeId={routeId}
            stores={routeStores.map((rs) => rs.store)}
          />
        </Card>
      </div>
    );
  }

  const stores = await db.store.findMany({
    include: { route: true, routeStores: { include: { route: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <form method="get" className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-500">Route</label>
            <Select name="routeId" defaultValue="">
              <option value="">All stores</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" className="min-h-11 px-6 py-2 text-sm">
            View
          </Button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-slate-900">Medical Stores ({stores.length})</h1>
          <ExportExcelButton
            data={stores.map((s) => ({
              Code: s.externalCode ?? "",
              Name: s.name,
              Address: s.address,
              Phone: s.phone ?? "",
              Routes: [...new Set(s.routeStores.map((rs) => rs.route.name))].join(", "),
            }))}
            filename="medical-stores"
          />
        </div>
        <StoresTable
          stores={stores.map((s) => ({
            id: s.id,
            externalCode: s.externalCode,
            name: s.name,
            address: s.address,
            phone: s.phone,
            routeNames: [...new Set(s.routeStores.map((rs) => rs.route.name))].join(", ") || null,
          }))}
        />
      </Card>
    </div>
  );
}
