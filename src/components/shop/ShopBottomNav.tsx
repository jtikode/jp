"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/components/shop/CartProvider";
import { clsx } from "@/lib/clsx";
import { t, type Lang } from "@/lib/i18n";

export function ShopBottomNav({ lang }: { lang: Lang }) {
  const pathname = usePathname();
  const { count } = useCart();

  const tabs = [
    { href: "/shop/home", label: t(lang, "shop_home"), icon: "🏠" },
    { href: "/shop/checkout", label: t(lang, "shop_cart"), icon: "🛒", badge: count },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-slate-200 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => {
        const active = pathname.startsWith(tab.href);
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
                "relative flex h-8 w-12 items-center justify-center rounded-full text-xl leading-none",
                active && "bg-blue-100",
              )}
            >
              {tab.icon}
              {tab.badge ? (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] text-white">
                  {tab.badge}
                </span>
              ) : null}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
