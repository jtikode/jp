import { requireStoreSession } from "@/lib/retailerPermissions";
import { getLang } from "@/lib/langCookie";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { ShopBottomNav } from "@/components/shop/ShopBottomNav";
import { CartProvider } from "@/components/shop/CartProvider";

export const dynamic = "force-dynamic";

export default async function ShopAuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await requireStoreSession();
  const lang = await getLang();

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-slate-100">
        <ShopHeader storeName={session.storeName} lang={lang} />
        <main className="flex-1 p-4 pb-20 sm:p-6 sm:pb-20">{children}</main>
        <ShopBottomNav lang={lang} />
      </div>
    </CartProvider>
  );
}
