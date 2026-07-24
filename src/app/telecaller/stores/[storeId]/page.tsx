import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { TelecallerLogForm } from "@/components/forms/TelecallerLogForm";
import { buildTelLink, buildWhatsAppLink } from "@/lib/waLink";

export default async function TelecallerStorePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  const store = await db.store.findUnique({ where: { id: storeId } });

  if (!store) notFound();

  return (
    <div className="mx-auto max-w-md space-y-4">
      <Card>
        <p className="font-semibold text-slate-900">{store.name}</p>
        <p className="text-sm text-slate-500">{store.address}</p>
        {store.phone && (
          <div className="mt-3 flex gap-2">
            <a
              href={buildTelLink(store.phone)}
              className="min-h-11 flex-1 rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800"
            >
              Call
            </a>
            <a
              href={buildWhatsAppLink(store.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-11 flex-1 rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-700"
            >
              WhatsApp
            </a>
          </div>
        )}
      </Card>

      <Card>
        <TelecallerLogForm storeId={store.id} />
      </Card>
    </div>
  );
}
