"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { toggleProductActive } from "@/actions/productActions";

interface ProductRow {
  id: string;
  company: string | null;
  name: string;
  composition: string | null;
  unit: string | null;
  price: number;
  mrp: number | null;
  taxPercent: number | null;
  scheme: string | null;
  stock: number | null;
  active: boolean;
}

export function ProductsTable({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? products.filter((p) =>
        `${p.name} ${p.company ?? ""} ${p.composition ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : products;

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search products by name, company, or composition..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <p className="text-xs text-slate-500">
        Showing {filtered.length} of {products.length} products.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Company</th>
              <th className="py-2 pr-4">Product</th>
              <th className="py-2 pr-4">Composition</th>
              <th className="py-2 pr-4">Unit</th>
              <th className="py-2 pr-4">Rate</th>
              <th className="py-2 pr-4">M.R.P</th>
              <th className="py-2 pr-4">Tax %</th>
              <th className="py-2 pr-4">Scheme</th>
              <th className="py-2 pr-4">Stock</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 text-slate-600">{p.company ?? "—"}</td>
                <td className="py-2 pr-4 font-medium text-slate-900">{p.name}</td>
                <td className="py-2 pr-4 text-slate-600">{p.composition ?? "—"}</td>
                <td className="py-2 pr-4 text-slate-600">{p.unit ?? "—"}</td>
                <td className="py-2 pr-4 text-slate-600">₹{p.price.toLocaleString("en-IN")}</td>
                <td className="py-2 pr-4 text-slate-600">
                  {p.mrp != null ? `₹${p.mrp.toLocaleString("en-IN")}` : "—"}
                </td>
                <td className="py-2 pr-4 text-slate-600">
                  {p.taxPercent != null ? `${p.taxPercent}%` : "—"}
                </td>
                <td className="py-2 pr-4 text-slate-600">{p.scheme ?? "—"}</td>
                <td className="py-2 pr-4 text-slate-600">{p.stock ?? "—"}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      p.active
                        ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                        : "rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500"
                    }
                  >
                    {p.active ? "Active" : "Hidden"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <form action={toggleProductActive.bind(null, p.id, !p.active)}>
                    <button type="submit" className="text-sm font-semibold text-blue-700 hover:underline">
                      {p.active ? "Hide" : "Show"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="py-6 text-center text-slate-400">
                  No products match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
