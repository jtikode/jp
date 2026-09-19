import { redirect } from "next/navigation";
import { requireStoreSession } from "@/lib/retailerPermissions";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getLang } from "@/lib/langCookie";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopBottomNav } from "@/components/shop/ShopBottomNav";
import { CartProvider } from "@/components/shop/CartProvider";
import { PendingOrdersSync } from "@/components/shop/PendingOrdersSync";
import { OfflineBanner } from "@/components/shop/OfflineBanner";
import { OfflineCatalogSync } from "@/components/shop/OfflineCatalogSync";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ShopAuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStoreSession();
  const lang = await getLang();

  // Asked exactly once, right after the very first login — everything under
  // this layout is gated on it being answered first (see the standalone
  // /shop/who-is-ordering page, which sits outside this layout so it can't
  // trigger this same redirect back onto itself).
  const db = getOrgScopedDb(session.orgId);
  const store = await db.store.findUnique({
    where: { id: session.storeId },
    select: { orderGiverWhatsapp: true },
  });
  if (!store?.orderGiverWhatsapp) {
    redirect("/shop/who-is-ordering");
  }

  return (
    <CartProvider>
      <div className="flex min-h-dvh flex-col bg-slate-100">
        <OfflineBanner lang={lang} />
        <ShopHeader storeName={session.storeName} lang={lang} />
        <main className="flex-1 p-4 pb-20 sm:p-6 sm:pb-20">
          <OfflineCatalogSync />
          <PendingOrdersSync lang={lang} />
          {children}
          <p className="mx-auto mt-6 max-w-2xl text-center text-xs text-slate-400">
            {t(lang, "shop_rates_disclaimer")}
          </p>
        </main>
        <ShopBottomNav lang={lang} />
      </div>
    </CartProvider>
  );
}
