import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { t } from "@/lib/i18n";
import { Card } from "@/components/ui/Card";
import { LowestRateList, type LowestRateGroup } from "@/components/shop/LowestRateList";
import { getActiveCatalog } from "@/lib/productCatalog";
import { TOP_SELLING_COMBOS, matchTopCombo } from "@/lib/topSellingCombos";

// Only this many cheapest in-stock options are shown per combination.
const ITEMS_PER_COMBO = 2;

export default async function ShopLowestRatePage() {
  const session = await requireStoreSession();
  const lang = await getLang();

  const catalog = await getActiveCatalog(session.orgId);
  // stock: null means the admin hasn't uploaded a quantity for this item
  // yet — treat that as "unknown", not "out of stock", so it isn't hidden
  // here before stock tracking has caught up. Only an explicit 0 excludes.
  const itemsByCombo = new Map<string, LowestRateGroup["items"]>();
  for (const p of catalog) {
    if (!p.composition || (p.stock != null && p.stock <= 0)) continue;
    const combo = matchTopCombo(p.composition);
    if (!combo) continue;
    const list = itemsByCombo.get(combo.label) ?? [];
    list.push({ id: p.id, name: p.name, company: p.company, unit: p.unit, price: p.price, stock: p.stock });
    itemsByCombo.set(combo.label, list);
  }

  // Limited to the top-selling combinations we actually stock, in the same
  // order they're defined in, each showing just its cheapest in-stock options.
  const groups: LowestRateGroup[] = TOP_SELLING_COMBOS.flatMap((combo) => {
    const items = itemsByCombo.get(combo.label);
    if (!items?.length) return [];
    const cheapest = [...items].sort((a, b) => a.price - b.price || a.name.localeCompare(b.name)).slice(0, ITEMS_PER_COMBO);
    return [{ composition: combo.label, items: cheapest }];
  });

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
