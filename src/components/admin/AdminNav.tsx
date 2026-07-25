"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "@/lib/clsx";

const LINKS = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/routes", label: "Routes" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/imports", label: "Imports" },
  { href: "/admin/warehouse-tasks", label: "Warehouse Tasks" },
  { href: "/admin/outstanding", label: "Outstanding" },
  { href: "/admin/intelligence", label: "Intelligence" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 sm:px-6">
      {LINKS.map((link) => (
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
