"use client";

import { useActionState } from "react";
import { BellRing } from "lucide-react";
import { setOrderReminder, disableOrderReminder, type SetOrderReminderState } from "@/actions/orderReminderActions";
import { Button } from "@/components/ui/Button";
import { t, type Lang } from "@/lib/i18n";

const DAY_KEYS = [
  "shop_day_sun",
  "shop_day_mon",
  "shop_day_tue",
  "shop_day_wed",
  "shop_day_thu",
  "shop_day_fri",
  "shop_day_sat",
] as const;

const initialState: SetOrderReminderState = { ok: false };

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

export function OrderReminderForm({
  lang,
  initial,
}: {
  lang: Lang;
  initial: { dayOfWeek: number; hour: number; minute: number; active: boolean } | null;
}) {
  const [state, formAction, pending] = useActionState(setOrderReminder, initialState);

  const defaultDay = initial?.dayOfWeek ?? 1;
  const defaultTime = initial ? `${pad(initial.hour)}:${pad(initial.minute)}` : "09:00";

  return (
    <div className="flex flex-col gap-5">
      {initial?.active && (
        <div className="flex items-start gap-2.5 rounded-xl border-2 border-blue-100 bg-blue-50 p-3">
          <BellRing size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-blue-700" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800">
              {t(lang, "shop_reminder_summary_prefix")}: {t(lang, DAY_KEYS[initial.dayOfWeek])}, {pad(initial.hour)}:{pad(initial.minute)}
            </p>
            <form action={disableOrderReminder} className="mt-1.5">
              <button type="submit" className="text-xs font-semibold text-blue-700 underline hover:text-blue-900">
                {t(lang, "shop_reminder_turn_off")}
              </button>
            </form>
          </div>
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{t(lang, "shop_reminder_day")}</label>
          <select
            name="dayOfWeek"
            defaultValue={defaultDay}
            className="min-h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-lg text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {DAY_KEYS.map((key, index) => (
              <option key={key} value={index}>
                {t(lang, key)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">{t(lang, "shop_reminder_time")}</label>
          <input
            type="time"
            name="time"
            defaultValue={defaultTime}
            required
            className="min-h-14 w-full rounded-xl border-2 border-slate-300 px-4 text-lg text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {state.error && <p className="text-sm font-medium text-red-600">{state.error}</p>}
        {state.ok && <p className="text-sm font-medium text-green-700">{t(lang, "shop_reminder_saved")}</p>}

        <Button type="submit" disabled={pending}>
          {pending ? t(lang, "shop_reminder_saving") : t(lang, "shop_reminder_save")}
        </Button>
      </form>
    </div>
  );
}
