import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { BannerCarousel } from "@/components/shop/BannerCarousel";
import { NotificationOptIn } from "@/components/shop/NotificationOptIn";

const MENU_TILES = [
  { href: "/shop/fast-order", key: "shop_menu_fast_order", icon: "⚡", bg: "bg-amber-100" },
  { href: "/shop/products", key: "shop_menu_order", icon: "📝", bg: "bg-blue-100" },
  { href: "/shop/orders", key: "shop_menu_order_history", icon: "🧾", bg: "bg-purple-100" },
  { href: "/shop/pending-bills", key: "shop_menu_pending_bills", icon: "💳", bg: "bg-rose-100" },
  { href: "/shop/offers", key: "shop_menu_offers", icon: "🏷️", bg: "bg-orange-100" },
  { href: "/shop/request-product", key: "shop_menu_request_product", icon: "📋", bg: "bg-teal-100" },
  { href: "/shop/pay-online", key: "shop_menu_pay_online", icon: "📱", bg: "bg-green-100" },
] as const;

export default async function ShopHomePage() {
  const session = await requireStoreSession();
  const db = getOrgScopedDb(session.orgId);
  const lang = await getLang();

  const [heroBanners, offerBanners, companies, loyaltyTiers] = await Promise.all([
    db.shopBanner.findMany({
      where: { placement: "HERO", active: true },
      orderBy: { sortOrder: "asc" },
    }),
    db.shopBanner.findMany({
      where: { placement: "OFFER", active: true },
      orderBy: { sortOrder: "asc" },
      take: 4,
    }),
    db.product.findMany({
      where: { active: true, company: { not: null } },
      select: { company: true },
      distinct: ["company"],
      orderBy: { company: "asc" },
    }),
    db.loyaltyTier.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <NotificationOptIn lang={lang} />

      <BannerCarousel
        banners={heroBanners.map((b) => ({
          id: b.id,
          imageUrl: b.imageUrl,
          title: b.title,
          linkUrl: b.linkUrl,
        }))}
      />

      {companies.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">{t(lang, "shop_company")}</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {companies.map((c) => (
              <Link
                key={c.company}
                href={`/shop/products?company=${encodeURIComponent(c.company!)}`}
                className="flex shrink-0 flex-col items-center gap-1"
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-lg font-bold text-white">
                  MP
                </span>
                <span className="max-w-16 truncate text-center text-xs text-slate-600">
                  {c.company}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-500">{t(lang, "shop_menu")}</h2>
        <div className="grid grid-cols-2 gap-3">
          {MENU_TILES.map((tile) => (
            <Link key={tile.href} href={tile.href}>
              <Card className="flex items-center gap-3 hover:bg-slate-50">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl ${tile.bg}`}>
                  {tile.icon}
                </span>
                <span className="font-semibold text-slate-900">{t(lang, tile.key)}</span>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {offerBanners.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-slate-500">{t(lang, "shop_special_offers")}</h2>
          <BannerCarousel
            banners={offerBanners.map((b) => ({
              id: b.id,
              imageUrl: b.imageUrl,
              title: b.title,
              linkUrl: b.linkUrl,
            }))}
          />
        </div>
      )}

      {loyaltyTiers.length > 0 && (
        <Card>
          <h2 className="mb-3 text-base font-bold text-slate-900">{t(lang, "shop_loyalty_heading")}</h2>
          <table className="w-full text-left text-sm">
            <tbody>
              {loyaltyTiers.map((tier) => (
                <tr key={tier.id} className="border-b border-slate-100 last:border-b-0">
                  <td className="py-2 pr-4 font-semibold text-slate-900">
                    ₹{Number(tier.thresholdAmount).toLocaleString("en-IN")}
                  </td>
                  <td className="py-2 text-slate-600">{tier.rewardText}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
