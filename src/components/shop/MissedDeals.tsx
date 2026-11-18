import Image from "next/image";
import { Check, Clock, Users } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";
import { formatIstDate } from "@/lib/offerShare";
import type { MissedDeal } from "@/lib/missedDeals";

// Recently ended offers, greyed out and stamped ENDED, so a retailer sees what
// other shops grabbed and watches for the next one. Not tappable: the offer is
// over, so there is nothing to add to the cart.
export function MissedDeals({ deals, lang }: { deals: MissedDeal[]; lang: Lang }) {
  if (deals.length === 0) return null;

  return (
    <section className="rounded-2xl border-2 border-red-200 bg-red-50 p-3">
      <h2 className="flex items-center gap-1.5 text-sm font-extrabold text-red-800">
        <Clock size={16} strokeWidth={2} />
        {t(lang, "shop_missed_deals_heading")}
      </h2>
      <p className="mb-3 mt-0.5 text-xs font-medium text-red-700">{t(lang, "shop_missed_deals_sub")}</p>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {deals.map((d) => (
          <div key={d.id} className="w-[58%] shrink-0 overflow-hidden rounded-xl border border-red-200 bg-white sm:w-[40%]">
            <div className="relative">
              <Image
                src={d.imageUrl}
                alt={d.title ?? "Ended offer"}
                width={1080}
                height={1350}
                sizes="60vw"
                className="aspect-[4/5] w-full bg-white object-contain opacity-60 grayscale"
                unoptimized
              />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="-rotate-12 rounded-md border-4 border-red-600 bg-white/80 px-3 py-1 text-2xl font-black tracking-widest text-red-600">
                  {t(lang, "shop_offer_ended")}
                </span>
              </span>
              <span className="absolute left-2 top-2 rounded-full bg-slate-800/90 px-2.5 py-1 text-xs font-bold text-white shadow">
                {t(lang, "shop_ended_on")} {formatIstDate(d.endedAt)}
              </span>
            </div>
            <div className="space-y-1 p-2">
              {d.title && <p className="line-clamp-2 text-xs font-semibold text-slate-700">{d.title}</p>}
              {d.youGotIt ? (
                <p className="flex items-center gap-1 text-xs font-bold text-green-700">
                  <Check size={14} strokeWidth={2.5} />
                  {t(lang, "shop_you_got_it")}
                </p>
              ) : d.grabbedBy > 0 ? (
                <p className="flex items-center gap-1 text-xs font-bold text-red-700">
                  <Users size={14} strokeWidth={2} />
                  {d.grabbedBy} {t(lang, "shop_retailers_grabbed")}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
