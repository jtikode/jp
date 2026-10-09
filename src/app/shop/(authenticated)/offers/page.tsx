import Image from "next/image";
import { Clock } from "lucide-react";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { formatCountdown } from "@/lib/formatCountdown";
import { getOfferBundle } from "@/lib/bannerBundle";
import { OfferBundleTap } from "@/components/shop/OfferBundleTap";

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

  const bundles = await Promise.all(offers.map((o) => getOfferBundle(session.orgId, o)));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_special_offers")}</h1>
      </Card>

      <div className="flex flex-col gap-3">
        {offers.map((o, index) => {
          const countdown = o.expiresAt ? formatCountdown(o.expiresAt) : "";
          const bundle = bundles[index];
          const image = (
            <div className="relative">
              <Image
                src={o.imageUrl}
                alt={o.title ?? "Offer"}
                width={1080}
                height={1350}
                sizes="100vw"
                // Distributor flyers are usually a tall, full-page poster, not a wide
                // banner strip — scale to the image's own aspect ratio instead of
                // cropping to a fixed box, so none of the offer's fine print gets cut off.
                className="aspect-[4/5] w-full object-contain"
                unoptimized
              />
              {countdown && (
                <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white shadow">
                  <Clock size={12} strokeWidth={2} />
                  Ends in {countdown}
                </span>
              )}
            </div>
          );
          return (
            <div key={o.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {bundle ? (
                <OfferBundleTap bundle={bundle} lang={lang}>
                  {image}
                </OfferBundleTap>
              ) : (
                image
              )}
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
