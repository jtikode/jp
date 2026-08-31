import Image from "next/image";
import { Clock } from "lucide-react";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { formatCountdown } from "@/lib/formatCountdown";

export default async function ShopOffersPage() {
  const session = await requireStoreSession();
  const db = getOrgScopedDb(session.orgId);
  const lang = await getLang();

  const offers = await db.shopBanner.findMany({
    where: {
      placement: "OFFER",
      active: true,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_special_offers")}</h1>
      </Card>

      <div className="flex flex-col gap-3">
        {offers.map((o) => {
          const countdown = o.expiresAt ? formatCountdown(o.expiresAt) : "";
          return (
            <div key={o.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="relative">
                <Image
                  src={o.imageUrl}
                  alt={o.title ?? "Offer"}
                  width={640}
                  height={280}
                  className="w-full object-cover"
                  unoptimized
                />
                {countdown && (
                  <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                    <Clock size={12} strokeWidth={2} />
                    Ends in {countdown}
                  </span>
                )}
              </div>
              {o.title && <p className="p-3 font-semibold text-slate-900">{o.title}</p>}
            </div>
          );
        })}
        {offers.length === 0 && (
          <Card>
            <p className="py-6 text-center text-slate-400">{t(lang, "shop_no_offers")}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
