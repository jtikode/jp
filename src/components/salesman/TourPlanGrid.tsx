"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { t, type Lang } from "@/lib/i18n";
import { saveTourPlan, type TourPlanEntry } from "@/actions/tourPlanActions";
import { clsx } from "@/lib/clsx";

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface DayInfo {
  date: string;
  dayOfWeek: number;
  existing?: { routeId: string; workingWithUserId: string; note: string };
}

export function TourPlanGrid({
  lang,
  monthValue,
  days,
  routes,
  colleagues,
}: {
  lang: Lang;
  monthValue: string;
  days: DayInfo[];
  routes: { id: string; name: string }[];
  colleagues: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [rows, setRows] = useState<Record<string, TourPlanEntry>>(() =>
    Object.fromEntries(
      days.map((d) => [
        d.date,
        {
          date: d.date,
          routeId: d.existing?.routeId ?? "",
          workingWithUserId: d.existing?.workingWithUserId ?? "",
          remark: d.existing?.note ?? "",
        },
      ]),
    ),
  );

  function updateRow(date: string, patch: Partial<TourPlanEntry>) {
    setRows((prev) => ({ ...prev, [date]: { ...prev[date], ...patch } }));
    setSaved(false);
  }

  function handleMonthChange(value: string) {
    router.push(`/team/salesman/tour-plan?month=${value}`);
  }

  function handleSubmit() {
    startTransition(async () => {
      await saveTourPlan(Object.values(rows));
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <>
      <Card>
        <label className="mb-1 block text-sm font-medium text-slate-600">{t(lang, "month")}</label>
        <div className="flex gap-2">
          <input
            type="month"
            value={monthValue}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="min-h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-lg text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">{t(lang, "day")}</th>
              <th className="py-2 pr-4">{t(lang, "working_with")}</th>
              <th className="py-2 pr-4">{t(lang, "route_col")}</th>
              <th className="py-2 pr-4">{t(lang, "remarks")}</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const isSunday = d.dayOfWeek === 0;
              const row = rows[d.date];
              return (
                <tr
                  key={d.date}
                  className={clsx(
                    "border-b border-slate-100",
                    isSunday && "bg-pink-50",
                  )}
                >
                  <td className="py-2 pr-4 whitespace-nowrap font-medium text-slate-900">
                    {d.date.slice(8, 10)} {WEEKDAY_NAMES[d.dayOfWeek]}
                  </td>
                  <td className="py-2 pr-4">
                    <Select
                      className="min-h-11 text-sm"
                      value={row.workingWithUserId}
                      onChange={(e) => updateRow(d.date, { workingWithUserId: e.target.value })}
                    >
                      <option value="">{t(lang, "none")}</option>
                      {colleagues.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-2 pr-4">
                    <Select
                      className="min-h-11 text-sm"
                      value={row.routeId}
                      onChange={(e) => updateRow(d.date, { routeId: e.target.value })}
                    >
                      <option value="">{t(lang, "none")}</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="py-2 pr-4">
                    <Input
                      className="min-h-11 text-sm"
                      value={row.remark}
                      onChange={(e) => updateRow(d.date, { remark: e.target.value })}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Button disabled={pending} onClick={handleSubmit} className="w-full">
        {pending ? t(lang, "saving") : t(lang, "save_tour_plan")}
      </Button>
      {saved && (
        <p className="text-center text-sm font-medium text-green-700">{t(lang, "tour_plan_saved")}</p>
      )}
    </>
  );
}
