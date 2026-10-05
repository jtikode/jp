import { Clock } from "lucide-react";
import { formatCountdown } from "@/lib/formatCountdown";
import { formatIstDate, msUntil } from "@/lib/offerShare";
import { t, type Lang } from "@/lib/i18n";

// Corner badge on an offer image: "Valid till 15 Oct" while there is time,
// switching to a red "Ends in 1d 4h" countdown for the last two days. Renders
// nothing for an offer with no end date (or one that has already ended).
export function OfferExpiryBadge({ expiresAt, lang }: { expiresAt: string | Date | null | undefined; lang: Lang }) {
  if (!expiresAt) return null;
  const end = new Date(expiresAt);
  const ms = msUntil(end);
  if (ms <= 0) return null;

  const urgent = ms < 48 * 60 * 60 * 1000;
  return (
    <span
      className={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white shadow ${
        urgent ? "bg-red-600" : "bg-slate-800/90"
      }`}
    >
      <Clock size={12} strokeWidth={2} />
      {urgent ? `${t(lang, "shop_ends_in")} ${formatCountdown(end)}` : `${t(lang, "shop_valid_till")} ${formatIstDate(end)}`}
    </span>
  );
}
