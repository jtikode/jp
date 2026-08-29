import Link from "next/link";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { BannerCarousel } from "@/components/shop/BannerCarousel";
import { NotificationOptIn } from "@/components/shop/NotificationOptIn";
import { WednesdayDealsStrip } from "@/components/shop/WednesdayDealsStrip";
import { getActiveWednesdayDeals, getRemainingDealQtyMap, isWednesdayToday } from "@/lib/wednesdayDeals";

const MENU_TILES = [
  { href: "/shop/quick-check", key: "shop_menu_quick_check", icon: "🔍", bg: "bg-cyan-100" },
  { href: "/shop/fast-order", key: "shop_menu_fast_order", icon: "⚡", bg: "bg-amber-100" },
  { href: "/shop/products", key: "shop_menu_order", icon: "📝", bg: "bg-blue-100" },
  { href: "/shop/products?filter=hot", key: "shop_menu_hot_selling", icon: "🔥", bg: "bg-red-100" },
  { href: "/shop/lowest-rate", key: "shop_menu_lowest_rate", icon: "💰", bg: "bg-lime-100" },
  { href: "/shop/clearance", key: "shop_menu_clearance", icon: "⏳", bg: "bg-pink-100" },
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

  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const wednesdayDeals = isWednesdayToday() ? await getActiveWednesdayDeals(session.orgId) : [];
  const remainingByDealId = await getRemainingDealQtyMap(session.orgId, session.storeId, wednesdayDeals);

  const [heroBanners, offerBanners, companies, loyaltyTiers, yearSpendResult] = await Promise.all([
    db.shopBanner.findMany({
      where: { placement: "HERO", active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      orderBy: { sortOrder: "asc" },
    }),
    db.shopBanner.findMany({
      where: { placement: "OFFER", active: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
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
    db.order.aggregate({
      where: { storeId: session.storeId, status: { not: "CANCELLED" }, createdAt: { gte: startOfYear } },
      _sum: { totalAmount: true },
    }),
  ]);

  const yearSpend = Number(yearSpendResult._sum.totalAmount ?? 0);
  const sortedTiers = [...loyaltyTiers].sort(
    (a, b) => Number(a.thresholdAmount) - Number(b.thresholdAmount),
  );
  const achievedTier = [...sortedTiers].reverse().find((tr) => yearSpend >= Number(tr.thresholdAmount));
  const nextTier = sortedTiers.find((tr) => yearSpend < Number(tr.thresholdAmount));
  const progressPercent = nextTier
    ? Math.max(
        0,
        Math.min(
          100,
          ((yearSpend - Number(achievedTier?.thresholdAmount ?? 0)) /
            (Number(nextTier.thresholdAmount) - Number(achievedTier?.thresholdAmount ?? 0))) *
            100,
        ),
      )
    : 100;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <WednesdayDealsStrip
        lang={lang}
        deals={wednesdayDeals
          .filter((d) => (remainingByDealId.get(d.id) ?? 0) > 0)
          .map((d) => ({
            productId: d.productId,
            productName: d.productName,
            dealPrice: d.dealPrice,
            normalPrice: d.normalPrice,
            remainingQty: remainingByDealId.get(d.id)!,
          }))}
      />

      <NotificationOptIn lang={lang} />

      <BannerCarousel
        banners={heroBanners.map((b) => ({
          id: b.id,
          imageUrl: b.imageUrl,
          title: b.title,
          linkUrl: b.linkUrl,
          expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
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
              expiresAt: b.expiresAt ? b.expiresAt.toISOString() : null,
            }))}
          />
        </div>
      )}

      {loyaltyTiers.length > 0 && (
        <Card>
          <h2 className="mb-1 text-base font-bold text-slate-900">{t(lang, "shop_loyalty_heading")}</h2>
          <p className="mb-3 text-sm text-slate-500">
            {t(lang, "shop_loyalty_spend_so_far")}: ₹{yearSpend.toLocaleString("en-IN")}
          </p>

          <div className="mb-1 h-3 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lime-500 to-green-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {nextTier ? (
            <p className="mb-3 text-sm font-medium text-slate-700">
              ₹{(Number(nextTier.thresholdAmount) - yearSpend).toLocaleString("en-IN")}{" "}
              {t(lang, "shop_loyalty_more_to_reach")}:{" "}
              <span className="font-bold text-green-700">{nextTier.rewardText}</span>
            </p>
          ) : achievedTier ? (
            <p className="mb-3 text-sm font-bold text-green-700">
              🎉 {t(lang, "shop_loyalty_unlocked")}: {achievedTier.rewardText}
            </p>
          ) : null}

          <table className="w-full text-left text-sm">
            <tbody>
              {loyaltyTiers.map((tier) => {
                const reached = yearSpend >= Number(tier.thresholdAmount);
                return (
                  <tr key={tier.id} className="border-b border-slate-100 last:border-b-0">
                    <td className={`py-2 pr-4 font-semibold ${reached ? "text-green-700" : "text-slate-900"}`}>
                      {reached ? "✓ " : ""}₹{Number(tier.thresholdAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2 text-slate-600">{tier.rewardText}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
