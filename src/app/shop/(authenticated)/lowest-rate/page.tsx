import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { LowestRateList, type LowestRateGroup } from "@/components/shop/LowestRateList";
import { getActiveCatalog } from "@/lib/productCatalog";

export default async function ShopLowestRatePage() {
  const session = await requireStoreSession();
  const lang = await getLang();

  const catalog = await getActiveCatalog(session.orgId);
  // stock: null means the admin hasn't uploaded a quantity for this item
  // yet — treat that as "unknown", not "out of stock", so it isn't hidden
  // here before stock tracking has caught up. Only an explicit 0 excludes.
  const products = catalog
    .filter((p) => p.composition && (p.stock == null || p.stock > 0))
    .sort((a, b) => a.price - b.price);

  const groupsByComposition = new Map<string, LowestRateGroup>();
  for (const p of products) {
    const key = p.composition!.trim();
    if (!key) continue;
    const normalized = key.toLowerCase();
    const group = groupsByComposition.get(normalized);
    const item = {
      id: p.id,
      name: p.name,
      company: p.company,
      unit: p.unit,
      price: p.price,
      stock: p.stock,
    };
    if (group) {
      group.items.push(item);
    } else {
      groupsByComposition.set(normalized, { composition: key, items: [item] });
    }
  }

  // Only compositions with a real choice — a single-item group has nothing
  // to compare a "lowest rate" against.
  const groups = [...groupsByComposition.values()]
    .filter((g) => g.items.length >= 2)
    .sort((a, b) => a.composition.localeCompare(b.composition));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card>
        <h1 className="text-xl font-bold text-slate-900">{t(lang, "shop_lowest_rate_heading")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t(lang, "shop_lowest_rate_subtitle")}</p>
      </Card>

      <LowestRateList groups={groups} lang={lang} />
    </div>
  );
}
