"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Package, ShoppingCart, Search, type LucideIcon } from "lucide-react";
import { useCart } from "@/components/shop/CartProvider";
import { clsx } from "@/lib/clsx";
import { t, type Lang } from "@/lib/i18n";

interface NavTab {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export function ShopBottomNav({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const { count } = useCart();

  const sideTabs: NavTab[] = [
    { href: "/shop/home", label: t(lang, "shop_home"), icon: Home },
    { href: "/shop/products", label: t(lang, "shop_browse_nav"), icon: LayoutGrid },
  ];
  const rightTabs: NavTab[] = [
    { href: "/shop/orders", label: t(lang, "shop_orders_nav"), icon: Package },
    { href: "/shop/checkout", label: t(lang, "shop_cart"), icon: ShoppingCart, badge: count },
  ];

  function renderTab(tab: NavTab) {
    const active = pathname.startsWith(tab.href);
    const Icon = tab.icon;
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={clsx(
          "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-semibold",
          active ? "text-blue-700" : "text-slate-500",
        )}
      >
        <span
          className={clsx(
            "relative flex h-8 w-12 items-center justify-center rounded-full",
            active && "bg-blue-100",
          )}
        >
          <Icon size={20} strokeWidth={1.75} />
          {tab.badge ? (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
              {tab.badge}
            </span>
          ) : null}
        </span>
        {tab.label}
      </Link>
    );
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex items-end border-t border-slate-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
      {sideTabs.map(renderTab)}

      <Link
        href="/shop/products?focus=search"
        className="flex flex-1 flex-col items-center gap-0.5 pb-1.5 text-xs font-semibold text-blue-700"
      >
        <span className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-blue-700 text-white shadow-lg">
          <Search size={24} strokeWidth={2} />
        </span>
        {t(lang, "shop_search_nav")}
      </Link>

      {rightTabs.map(renderTab)}
    </nav>
  );
}
