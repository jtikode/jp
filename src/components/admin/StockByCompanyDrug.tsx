"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { clsx } from "@/lib/clsx";

const LOW_STOCK_THRESHOLD = 3;

export interface StockProduct {
  id: string;
  name: string;
  company: string | null;
  unit: string | null;
  price: number;
  stock: number | null;
  composition: string | null;
}

function StockCell({ stock }: { stock: number | null }) {
  if (stock == null) return <span className="text-slate-400">—</span>;
  if (stock === 0) return <span className="font-semibold text-red-600">Out of stock</span>;
  if (stock < LOW_STOCK_THRESHOLD) return <span className="font-semibold text-amber-600">Low ({stock})</span>;
  return <span className="text-green-700">{stock}</span>;
}

export function StockByCompanyDrug({ products }: { products: StockProduct[] }) {
  const [tab, setTab] = useState<"company" | "drug">("company");
  const [company, setCompany] = useState("");
  const [drugQuery, setDrugQuery] = useState("");

  const companies = useMemo(
    () => [...new Set(products.map((p) => p.company).filter((c): c is string => !!c))].sort(),
    [products],
  );

  const companyProducts = useMemo(() => {
    if (!company) return [];
    return [...products.filter((p) => p.company === company)].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, company]);

  const drugGroups = useMemo(() => {
    const q = drugQuery.trim().toLowerCase();
    if (!q) return [];
    const map = new Map<string, StockProduct[]>();
    for (const p of products) {
      if (!p.composition || !p.composition.toLowerCase().includes(q)) continue;
      const key = p.composition.trim();
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return [...map.entries()]
      .map(([composition, items]) => ({
        composition,
        items: items.sort((a, b) => a.price - b.price),
      }))
      .sort((a, b) => a.composition.localeCompare(b.composition));
  }, [products, drugQuery]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-slate-200">
        {(["company", "drug"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={clsx(
              "border-b-2 px-3 py-2 text-sm font-semibold",
              tab === key ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800",
            )}
          >
            {key === "company" ? "By Company" : "By Drug"}
          </button>
        ))}
      </div>

      {tab === "company" && (
        <div className="space-y-4">
          <Select value={company} onChange={(e) => setCompany(e.target.value)}>
            <option value="">Select a company...</option>
            {companies.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>

          {company && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4">Product</th>
                    <th className="py-2 pr-4">Unit</th>
                    <th className="py-2 pr-4">Rate</th>
                    <th className="py-2 pr-4">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {companyProducts.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4 font-medium text-slate-900">{p.name}</td>
                      <td className="py-2 pr-4 text-slate-600">{p.unit ?? "—"}</td>
                      <td className="py-2 pr-4 text-slate-600">₹{p.price.toLocaleString("en-IN")}</td>
                      <td className="py-2 pr-4">
                        <StockCell stock={p.stock} />
                      </td>
                    </tr>
                  ))}
                  {companyProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400">
                        No active products for this company.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === "drug" && (
        <div className="space-y-4">
          <Input
            placeholder="Search by drug / composition (e.g. Amoxycillin)..."
            value={drugQuery}
            onChange={(e) => setDrugQuery(e.target.value)}
          />

          {!drugQuery.trim() && (
            <p className="py-6 text-center text-slate-400">Type a drug/composition name to see availability across companies.</p>
          )}

          {drugQuery.trim() && drugGroups.length === 0 && (
            <p className="py-6 text-center text-slate-400">No matching composition found.</p>
          )}

          {drugGroups.map((group) => (
            <div key={group.composition} className="rounded-xl border-2 border-slate-200 p-3">
              <p className="mb-2 text-sm font-bold text-slate-700">{group.composition}</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-4">Company</th>
                      <th className="py-2 pr-4">Product</th>
                      <th className="py-2 pr-4">Rate</th>
                      <th className="py-2 pr-4">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((p) => (
                      <tr key={p.id} className="border-b border-slate-100">
                        <td className="py-2 pr-4 text-slate-600">{p.company ?? "—"}</td>
                        <td className="py-2 pr-4 font-medium text-slate-900">{p.name}</td>
                        <td className="py-2 pr-4 text-slate-600">₹{p.price.toLocaleString("en-IN")}</td>
                        <td className="py-2 pr-4">
                          <StockCell stock={p.stock} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
