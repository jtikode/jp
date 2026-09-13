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
