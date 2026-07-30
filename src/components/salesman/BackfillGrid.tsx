"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { t, type Lang } from "@/lib/i18n";
import { saveBackfillEntries, type BackfillDayEntry } from "@/actions/backfillActions";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayInfo {
  date: string;
  dayOfWeek: number;
  existing?: { orderAmount: number | null; collectionAmount: number | null };
}

export function BackfillGrid({
  lang,
  storeId,
  days,
}: {
  lang: Lang;
  storeId: string;
  days: DayInfo[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [rows, setRows] = useState<Record<string, { orderAmount: string; collectionAmount: string }>>(
    () =>
      Object.fromEntries(
        days.map((d) => [
          d.date,
          {
            orderAmount: d.existing?.orderAmount != null ? String(d.existing.orderAmount) : "",
            collectionAmount: d.existing?.collectionAmount != null ? String(d.existing.collectionAmount) : "",
          },
        ]),
      ),
  );

  function updateRow(date: string, patch: Partial<{ orderAmount: string; collectionAmount: string }>) {
    setRows((prev) => ({ ...prev, [date]: { ...prev[date], ...patch } }));
    setSaved(false);
  }

  function handleSave() {
    const entries: BackfillDayEntry[] = days.map((d) => ({
      date: d.date,
      orderAmount: rows[d.date].orderAmount ? Number(rows[d.date].orderAmount) : undefined,
      collectionAmount: rows[d.date].collectionAmount ? Number(rows[d.date].collectionAmount) : undefined,
    }));

    startTransition(async () => {
      await saveBackfillEntries(storeId, entries);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[420px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">{t(lang, "day")}</th>
              <th className="py-2 pr-4">{t(lang, "order_amt")}</th>
              <th className="py-2 pr-4">{t(lang, "collected")}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date} className="border-b border-slate-100">
                <td className="py-2 pr-4 whitespace-nowrap font-medium text-slate-900">
                  {d.date.slice(8, 10)} {WEEKDAY_NAMES[d.dayOfWeek]}
                </td>
                <td className="py-2 pr-4">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="min-h-11 w-28 text-sm"
                    value={rows[d.date].orderAmount}
                    onChange={(e) => updateRow(d.date, { orderAmount: e.target.value })}
                  />
                </td>
                <td className="py-2 pr-4">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="min-h-11 w-28 text-sm"
                    value={rows[d.date].collectionAmount}
                    onChange={(e) => updateRow(d.date, { collectionAmount: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Button disabled={pending} onClick={handleSave} className="w-full">
        {pending ? t(lang, "saving") : t(lang, "save_all")}
      </Button>
      {saved && <p className="text-center text-sm font-medium text-green-700">{t(lang, "entries_saved")}</p>}
    </>
  );
}
