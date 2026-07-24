import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { StoresTable } from "@/components/admin/StoresTable";

export default async function AdminStoresPage() {
  const stores = await db.store.findMany({
    include: { route: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-5xl">
      <Card>
        <h1 className="mb-4 text-lg font-bold text-slate-900">
          Medical Stores ({stores.length})
        </h1>
        <StoresTable
          stores={stores.map((s) => ({
            id: s.id,
            externalCode: s.externalCode,
            name: s.name,
            address: s.address,
            phone: s.phone,
            routeName: s.route?.name ?? null,
          }))}
        />
      </Card>
    </div>
  );
}
