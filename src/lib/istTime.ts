// The app is India-only, but the server's own clock (Hostinger) runs in UTC
// — every "what day/time is it right now, for scheduling purposes" check
// needs to go through IST explicitly, or it silently drifts by 5.5 hours
// (see the Login Activity timestamp bug this same mismatch caused).
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export interface IstNow {
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  hour: number; // 0-23
  minute: number; // 0-59
  dateKey: string; // "YYYY-MM-DD" in IST, for same-day dedupe checks
}

const WEEKDAY_INDEX: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function getIstNow(at: Date = new Date()): IstNow {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  return {
    dayOfWeek: WEEKDAY_INDEX[get("weekday")] ?? 0,
    // hour12:false can render midnight as "24" in some environments — normalize.
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/** The UTC instant corresponding to 00:00 IST "today" — used as the dedupe
 * threshold for anything that should fire at most once per IST calendar day. */
export function getStartOfIstDayUtc(at: Date = new Date()): Date {
  const shifted = new Date(at.getTime() + IST_OFFSET_MS);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

/** The last instant (23:59:59.999 IST) of "today" — pairs with
 * getStartOfIstDayUtc for an inclusive same-day range. */
export function getEndOfIstDayUtc(at: Date = new Date()): Date {
  const nextDayStart = new Date(getStartOfIstDayUtc(at).getTime() + 24 * 60 * 60 * 1000);
  return new Date(nextDayStart.getTime() - 1);
}

/** Monday-start week boundary, computed in IST — same "shift, truncate,
 * shift back" trick as getStartOfIstDayUtc, so it stays correct regardless
 * of the server process's own local timezone. */
export function getStartOfIstWeekUtc(at: Date = new Date()): Date {
  const shifted = new Date(at.getTime() + IST_OFFSET_MS);
  const dayOfWeek = shifted.getUTCDay(); // 0=Sun..6=Sat
  const diffFromMonday = (dayOfWeek + 6) % 7;
  shifted.setUTCDate(shifted.getUTCDate() - diffFromMonday);
  shifted.setUTCHours(0, 0, 0, 0);
  return new Date(shifted.getTime() - IST_OFFSET_MS);
}

/** Jan 1st of the IST calendar year containing `at`, at 00:00 IST. */
export function getStartOfIstYearUtc(at: Date = new Date()): Date {
  const shifted = new Date(at.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(shifted.getUTCFullYear(), 0, 1) - IST_OFFSET_MS);
}

/** The 1st of the IST calendar month containing `at`, at 00:00 IST. */
export function getStartOfIstMonthUtc(at: Date = new Date()): Date {
  const shifted = new Date(at.getTime() + IST_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  return new Date(Date.UTC(y, m, 1) - IST_OFFSET_MS);
}

/** The last instant of the IST calendar month containing `at`. */
export function getEndOfIstMonthUtc(at: Date = new Date()): Date {
  const shifted = new Date(at.getTime() + IST_OFFSET_MS);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth();
  const nextMonthStart = new Date(Date.UTC(y, m + 1, 1) - IST_OFFSET_MS);
  return new Date(nextMonthStart.getTime() - 1);
}

/** IST calendar-date parts (month is 0-indexed, matching Date#getMonth) —
 * for anything that needs the raw year/month/day rather than a boundary
 * instant (e.g. "this month's target record"). */
export function getIstDateParts(at: Date = new Date()): { year: number; month: number; day: number } {
  const shifted = new Date(at.getTime() + IST_OFFSET_MS);
  return { year: shifted.getUTCFullYear(), month: shifted.getUTCMonth(), day: shifted.getUTCDate() };
}

/** True if both instants fall on the same IST calendar day — an IST-safe
 * replacement for date-fns's isSameDay, which compares using the server
 * process's own (possibly non-IST) local timezone. */
export function isSameIstDay(a: Date, b: Date): boolean {
  return getStartOfIstDayUtc(a).getTime() === getStartOfIstDayUtc(b).getTime();
}

/** Builds the UTC instant for 00:00 IST on a specific IST calendar date —
 * the inverse of getIstDateParts, for constructing a day cell (e.g. a
 * calendar grid) that's safe to compare with isSameIstDay/getStartOfIstDayUtc. */
export function makeIstDateUtc(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - IST_OFFSET_MS);
}

/** `at`, shifted by `delta` calendar months in IST, keeping the same
 * day-of-month (month/day overflow normalizes the same way Date#setMonth
 * does). An IST-safe replacement for `date.setMonth(date.getMonth() + delta)`. */
export function addIstMonths(at: Date, delta: number): Date {
  const { year, month, day } = getIstDateParts(at);
  return new Date(Date.UTC(year, month + delta, day) - IST_OFFSET_MS);
}

/** "YYYY-MM" for the IST calendar month containing `at` — a stable bucket
 * key for month-by-month history tables (an IST-safe replacement for
 * date-fns `format(d, "yyyy-MM")`). */
export function getIstMonthKey(at: Date): string {
  const { year, month } = getIstDateParts(at);
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}
