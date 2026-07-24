import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { VisitForm } from "@/components/forms/VisitForm";

export default async function StoreVisitPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await db.store.findUnique({ where: { id: storeId } });

  if (!store) notFound();

  return (
    <div className="mx-auto max-w-md">
      <Card className="mb-4">
        <p className="font-semibold text-slate-900">{store.name}</p>
        <p className="text-sm text-slate-500">{store.address}</p>
      </Card>

      <VisitForm storeId={store.id} />
    </div>
  );
}
