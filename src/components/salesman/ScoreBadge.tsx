"use client";

import { useState } from "react";
import type { SalesmanScoreBreakdown } from "@/lib/salesmanScore";
import { t, type Lang } from "@/lib/i18n";

export function ScoreBadge({
  lang,
  score,
}: {
  lang: Lang;
  score: SalesmanScoreBreakdown;
}) {
  const [open, setOpen] = useState(false);

  const color =
    score.total >= 80 ? "bg-green-100 text-green-800" : score.total >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800";

  const rows: Array<[string, number, number]> = [
    [t(lang, "score_sales"), score.sales, score.salesMax],
    [t(lang, "score_receipts"), score.receipts, score.receiptsMax],
    [t(lang, "score_locations"), score.locations, score.locationsMax],
    [t(lang, "score_medicals_done"), score.medicalsDone, score.medicalsDoneMax],
    [t(lang, "score_attendance"), score.attendance, score.attendanceMax],
  ];

  return (
    <div className="relative flex items-center gap-1">
      <span className={`min-h-11 flex items-center rounded-full px-3 text-sm font-bold ${color}`}>
        {t(lang, "score_out_of_100")}: {score.total}/100
      </span>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t(lang, "how_score_calculated")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-slate-300 text-sm font-bold text-slate-500 hover:bg-slate-50"
      >
        ?
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-72 rounded-xl border-2 border-slate-200 bg-white p-4 shadow-lg">
            <p className="mb-2 text-sm font-bold text-slate-900">{t(lang, "score_this_month")}</p>
            <ul className="flex flex-col gap-1.5 text-xs text-slate-600">
              {rows.map(([label, value, max]) => (
                <li key={label} className="flex justify-between gap-3">
                  <span>{label}</span>
                  <span className="shrink-0 font-semibold text-slate-900">
                    {value}/{max}
                  </span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 min-h-9 w-full rounded-lg border-2 border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t(lang, "close")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
