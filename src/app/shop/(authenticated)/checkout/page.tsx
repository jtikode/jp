import { getLang } from "@/lib/langCookie";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLastChanceDeals } from "@/lib/lastChanceDeals";
import { ShopCheckout } from "@/components/shop/ShopCheckout";

export default async function ShopCheckoutPage() {
  const session = await requireStoreSession();
  const lang = await getLang();
  // Near-expiry items offered at the end of the order. A failure here must never
  // block checkout, so it quietly falls back to no strip.
  const deals = await getLastChanceDeals(session.orgId).catch(() => []);
  return <ShopCheckout lang={lang} deals={deals} />;
}
