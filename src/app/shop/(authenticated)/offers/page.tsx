import Image from "next/image";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";

export default async function ShopOffersPage() {
  const session = await requireStoreSession();
  const db = getOrgScopedDb(session.orgId);
  const lang = await getLang();

  const offers = await db.shopBanner.findMany({
    where: { placement: "OFFER", active: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_special_offers")}</h1>
      </Card>

      <div className="flex flex-col gap-3">
        {offers.map((o) => (
          <div key={o.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Image
              src={o.imageUrl}
              alt={o.title ?? "Offer"}
              width={640}
              height={280}
              className="w-full object-cover"
              unoptimized
            />
            {o.title && <p className="p-3 font-semibold text-slate-900">{o.title}</p>}
          </div>
        ))}
        {offers.length === 0 && (
          <Card>
            <p className="py-6 text-center text-slate-400">{t(lang, "shop_no_offers")}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
