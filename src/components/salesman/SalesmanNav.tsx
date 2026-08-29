"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";
import { t, type Lang } from "@/lib/i18n";

export function SalesmanNav({ lang }: { lang: Lang }) {
  const pathname = usePathname();

  const links = [
    { href: "/team/salesman/dashboard", label: t(lang, "nav_home") },
    { href: "/team/salesman/calendar", label: t(lang, "nav_calendar") },
    { href: "/team/salesman/stores", label: t(lang, "nav_stores") },
    { href: "/team/salesman/tour-plan", label: t(lang, "nav_tour_plan") },
    { href: "/team/salesman/near-expiry", label: t(lang, "nav_near_expiry") },
    { href: "/team/salesman/regular-items", label: t(lang, "nav_regular_items") },
    { href: "/team/board", label: "Task Board" },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 sm:px-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={clsx(
            "whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold",
            pathname.startsWith(link.href)
              ? "border-blue-700 text-blue-700"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
