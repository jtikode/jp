"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// 18+ admin pages, grouped into 4 top-level tabs by what they're actually
// for — each group's own row of sub-tabs appears underneath once you're
// inside it. The group tab itself links straight to its first/default item.
const GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/team/admin/dashboard", label: "Dashboard" },
      { href: "/team/admin/calendar", label: "Calendar" },
      { href: "/team/admin/intelligence", label: "Intelligence" },
      { href: "/team/admin/outstanding", label: "Outstanding" },
      { href: "/team/admin/settings", label: "Settings" },
    ],
  },
  {
    label: "People & Territory",
    items: [
      { href: "/team/admin/employees", label: "Employees" },
      { href: "/team/admin/routes", label: "Routes" },
      { href: "/team/admin/stores", label: "Stores" },
      { href: "/team/admin/route-map", label: "Route Map" },
    ],
  },
  {
    label: "Catalog & Shop",
    items: [
      { href: "/team/admin/products", label: "Products" },
      { href: "/team/admin/stock", label: "Stock" },
      { href: "/team/admin/wednesday-deals", label: "Wednesday Deals" },
      { href: "/team/admin/imports", label: "Imports" },
      { href: "/team/admin/orders", label: "Orders" },
      { href: "/team/admin/banners", label: "Banners" },
      { href: "/team/admin/loyalty-tiers", label: "Loyalty Tiers" },
      { href: "/team/admin/requested-products", label: "Requested Products" },
    ],
  },
  {
    label: "Tasks & Warehouse",
    items: [
      { href: "/team/admin/tasks", label: "Tasks" },
      { href: "/team/board", label: "Board" },
      { href: "/team/admin/warehouse-tasks", label: "Stock Sheet" },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();

  const activeGroup =
    GROUPS.find((g) => g.items.some((item) => pathname.startsWith(item.href))) ?? GROUPS[0];

  return (
    <div className="border-b border-slate-200 bg-white">
      <nav className="flex gap-1 overflow-x-auto px-4 sm:px-6">
        {GROUPS.map((group) => {
          const isActive = group === activeGroup;
          return (
            <Link
              key={group.label}
              href={group.items[0].href}
              className={clsx(
                "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-bold",
                isActive
                  ? "border-blue-700 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-800",
              )}
            >
              {group.label}
            </Link>
          );
        })}
      </nav>
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 bg-slate-50 px-4 sm:px-6">
        {activeGroup.items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "whitespace-nowrap border-b-2 px-3 py-2 text-xs font-semibold",
              pathname.startsWith(item.href)
                ? "border-blue-700 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
