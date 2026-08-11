import { getLang } from "@/lib/langCookie";
import { ShopCheckout } from "@/components/shop/ShopCheckout";

export default async function ShopCheckoutPage() {
  const lang = await getLang();
  return <ShopCheckout lang={lang} />;
}
