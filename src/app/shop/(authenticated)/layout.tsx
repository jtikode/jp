import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopBottomNav } from "@/components/shop/ShopBottomNav";
import { CartProvider } from "@/components/shop/CartProvider";
import { PendingOrdersSync } from "@/components/shop/PendingOrdersSync";
import { OfflineBanner } from "@/components/shop/OfflineBanner";

export const dynamic = "force-dynamic";

export default async function ShopAuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStoreSession();
  const lang = await getLang();

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-slate-100">
        <OfflineBanner lang={lang} />
        <ShopHeader storeName={session.storeName} lang={lang} />
        <main className="flex-1 p-4 pb-20 sm:p-6 sm:pb-20">
          <PendingOrdersSync lang={lang} />
          {children}
        </main>
        <ShopBottomNav lang={lang} />
      </div>
    </CartProvider>
  );
}
