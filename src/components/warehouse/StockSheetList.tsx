"use client";

import { useState, useTransition } from "react";
import { upsertStockCount } from "@/actions/stockActions";
import { Input } from "@/components/ui/Input";

interface StockItemRow {
  id: string;
  name: string;
  quantity: number | null;
}

export function StockSheetList({ items }: { items: StockItemRow[] }) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(items.map((i) => [i.id, i.quantity != null ? String(i.quantity) : ""])),
  );
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();

  function save(itemId: string) {
    const raw = values[itemId];
    const quantity = Number(raw);
    if (raw === "" || Number.isNaN(quantity)) return;
    startTransition(async () => {
      await upsertStockCount(itemId, quantity);
      setSaved((s) => ({ ...s, [itemId]: true }));
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <p className="min-w-0 flex-1 truncate font-medium text-slate-900">{item.name}</p>
          <Input
            type="number"
            step="1"
            min="0"
            className="w-24 min-h-11 text-sm"
            value={values[item.id] ?? ""}
            onChange={(e) => {
              setValues((v) => ({ ...v, [item.id]: e.target.value }));
              setSaved((s) => ({ ...s, [item.id]: false }));
            }}
            onBlur={() => save(item.id)}
          />
          {saved[item.id] && !pending && <span className="text-xs font-semibold text-green-700">Saved</span>}
        </div>
      ))}
      {items.length === 0 && (
        <p className="py-6 text-center text-slate-400">No stock items set up yet.</p>
      )}
    </div>
  );
}
