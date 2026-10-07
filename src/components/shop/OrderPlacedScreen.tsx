"use client";

import { Check, X } from "lucide-react";
import { t, type Lang } from "@/lib/i18n";

// Full-screen "Order Placed!" confirmation shown right after an order goes
// through: green backdrop, a check badge with a little confetti, and a
// button into the order. Motion is limited to a short fade/pop and a gentle
// float, and switches off entirely for people who prefer reduced motion.
const STYLES = `
@media (prefers-reduced-motion: no-preference) {
  .op-screen { animation: op-fade .35s ease-out both; }
  .op-badge { animation: op-pop .55s cubic-bezier(.2,1.3,.4,1) .1s both; }
  .op-ring { animation: op-ring 2.4s ease-out .7s infinite; }
  .op-bit { animation: op-pop .5s ease-out both, op-float 3.2s ease-in-out .8s infinite; }
  .op-rise { animation: op-rise .5s ease-out both; }
}
@keyframes op-fade { from { opacity: 0 } to { opacity: 1 } }
@keyframes op-pop { 0% { transform: scale(.4); opacity: 0 } 70% { transform: scale(1.08); opacity: 1 } 100% { transform: scale(1); opacity: 1 } }
@keyframes op-float { 0%, 100% { translate: 0 0 } 50% { translate: 0 -6px } }
@keyframes op-rise { from { transform: translateY(14px); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes op-ring { 0% { transform: scale(.9); opacity: .45 } 100% { transform: scale(1.4); opacity: 0 } }
`;

const ORANGE = "#f97316";
const YELLOW = "#fbbf24";

function Star({ className, color, size }: { className: string; color: string; size: number }) {
  return (
    <svg className={`op-bit absolute ${className}`} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4 Z" fill={color} />
    </svg>
  );
}

function Dot({ className, color, size }: { className: string; color: string; size: number }) {
  return (
    <span
      className={`op-bit absolute rounded-full ${className}`}
      style={{ width: size, height: size, backgroundColor: color }}
      aria-hidden="true"
    />
  );
}

function Squiggle({ className, color, d }: { className: string; color: string; d: string }) {
  return (
    <svg className={`op-bit absolute ${className}`} width="40" height="28" viewBox="0 0 40 28" aria-hidden="true">
      <path d={d} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function OrderPlacedScreen({
  lang,
  onClose,
  onViewOrder,
}: {
  lang: Lang;
  onClose: () => void;
  onViewOrder: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-placed-title"
      className="op-screen fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-[#1f9b64] to-[#0d7f49] px-6 text-white"
    >
      <style>{STYLES}</style>

      <button
        type="button"
        onClick={onClose}
        aria-label={t(lang, "shop_close")}
        className="absolute left-4 top-[max(1rem,env(safe-area-inset-top))] flex h-10 w-10 items-center justify-center rounded-full border border-white/70 text-white hover:bg-white/10"
      >
        <X size={20} strokeWidth={2} />
      </button>

      <div className="relative h-60 w-72 max-w-full">
        <Squiggle className="left-[14%] top-[6%]" color={YELLOW} d="M4 20 C8 4, 24 4, 22 14 C20 22, 10 18, 14 10 C18 2, 34 6, 36 14" />
        <Squiggle className="right-[10%] top-[18%]" color={YELLOW} d="M4 6 C12 2, 14 12, 22 10 C30 8, 30 22, 38 20" />
        <Squiggle className="left-[2%] top-[48%]" color={ORANGE} d="M2 18 C8 6, 14 22, 22 12 C28 5, 34 12, 38 8" />
        <Dot className="left-[56%] top-[8%]" color="#fff" size={16} />
        <Dot className="left-[20%] top-[33%]" color="#fff" size={9} />
        <Dot className="right-[10%] top-[56%]" color={YELLOW} size={20} />
        <Dot className="right-[19%] top-[44%]" color={ORANGE} size={9} />
        <Star className="right-[22%] top-[10%]" color={ORANGE} size={22} />
        <Star className="left-[10%] bottom-[8%]" color={YELLOW} size={28} />
        <svg className="op-bit absolute bottom-[14%] right-[12%]" width="30" height="20" viewBox="0 0 30 20" aria-hidden="true">
          <path d="M4 14 C10 4, 22 2, 28 8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </svg>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex h-36 w-36 items-center justify-center">
            <span className="op-ring absolute inset-0 rounded-full bg-white/25" />
            <span className="absolute inset-0 rounded-full bg-white/15" />
            <span className="absolute inset-4 rounded-full bg-white/20" />
            <span className="op-badge relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg">
              <Check size={42} strokeWidth={3.5} className="text-[#2f9a6b]" />
            </span>
          </div>
        </div>
      </div>

      <h1 id="order-placed-title" className="op-rise mt-2 text-3xl font-bold" style={{ animationDelay: ".25s" }}>
        {t(lang, "shop_order_placed")}
      </h1>
      <p className="op-rise mt-3 max-w-xs text-center text-sm leading-relaxed text-white/80" style={{ animationDelay: ".35s" }}>
        {t(lang, "shop_order_placed_thanks")}
        <br />
        {t(lang, "shop_order_placed_note")}
      </p>
      <button
        type="button"
        onClick={onViewOrder}
        className="op-rise mt-7 rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white hover:bg-white/25 active:bg-white/30"
        style={{ animationDelay: ".45s" }}
      >
        {t(lang, "shop_view_order_details")}
        {" >"}
      </button>
    </div>
  );
}
