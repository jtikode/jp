"use client";

import { useRouter } from "next/navigation";
import { CartProvider, useCart } from "@/components/shop/CartProvider";
import { QuantityStepper } from "@/components/shop/QuantityStepper";
import { t, type Lang } from "@/lib/i18n";

// Add-to-cart control for the public, unauthenticated product page. It writes
// to the same localStorage cart (jpt_shop_cart) the authenticated shop uses,
// so a quantity picked here before signing in is still in the cart once the
// retailer logs in and lands in the real catalog — nothing is lost, it's
// just gated: the moment a tap actually *increases* the quantity (real
// purchase intent, not someone undoing an accidental tap), we send them
// straight to login instead of letting them keep adding anonymously.
function AddToCartInner({
  productId,
  name,
  unitPrice,
  lang,
}: {
  productId: string;
  name: string;
  unitPrice: number;
  lang: Lang;
}) {
  const router = useRouter();
  const { items, setQuantity } = useCart();
  const quantity = items.find((i) => i.productId === productId)?.quantity ?? 0;

  function handleChange(next: number) {
    setQuantity({ productId, name, unitPrice }, next);
    if (next > quantity) {
      router.push(`/shop/login?redirect=${encodeURIComponent("/shop/products?focus=search")}`);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper quantity={quantity} onChange={handleChange} />
      <span className="text-sm font-medium text-slate-500">{t(lang, "shop_public_add_note")}</span>
    </div>
  );
}

export function PublicAddToCart(props: { productId: string; name: string; unitPrice: number; lang: Lang }) {
  return (
    <CartProvider>
      <AddToCartInner {...props} />
    </CartProvider>
  );
}
