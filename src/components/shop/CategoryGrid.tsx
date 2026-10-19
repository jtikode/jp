import Link from "next/link";
import {
  Pill, Thermometer, Wind, Stethoscope, Flame, Bandage, Bug, ShieldPlus, Droplets, Sparkles, Smile, Tablets,
  HeartPulse, Flower2, Activity, Eye, Heart, Scissors, Baby, Brain, Ribbon, Droplet, Leaf, Bone, Cigarette,
  House, Package, FlaskConical, type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { CATEGORY_TILES, tileName } from "@/lib/categoryTiles";
import { t, type Lang } from "@/lib/i18n";

const STYLE: Record<string, { icon: LucideIcon; bg: string; fg: string }> = {
  "gut-care": { icon: Pill, bg: "bg-amber-50", fg: "text-amber-600" },
  "fever-pain": { icon: Thermometer, bg: "bg-red-50", fg: "text-red-600" },
  "cough-cold": { icon: Wind, bg: "bg-sky-50", fg: "text-sky-600" },
  devices: { icon: Stethoscope, bg: "bg-blue-50", fg: "text-blue-600" },
  "pain-gels": { icon: Flame, bg: "bg-orange-50", fg: "text-orange-600" },
  surgical: { icon: Bandage, bg: "bg-rose-50", fg: "text-rose-600" },
  antifungal: { icon: Bug, bg: "bg-lime-50", fg: "text-lime-700" },
  antibiotics: { icon: ShieldPlus, bg: "bg-teal-50", fg: "text-teal-600" },
  ors: { icon: Droplets, bg: "bg-cyan-50", fg: "text-cyan-600" },
  "skin-care": { icon: Sparkles, bg: "bg-pink-50", fg: "text-pink-600" },
  "oral-dental": { icon: Smile, bg: "bg-indigo-50", fg: "text-indigo-600" },
  vitamins: { icon: Tablets, bg: "bg-yellow-50", fg: "text-yellow-600" },
  "heart-bp": { icon: HeartPulse, bg: "bg-red-50", fg: "text-red-700" },
  "allergy-asthma": { icon: Flower2, bg: "bg-fuchsia-50", fg: "text-fuchsia-600" },
  diabetes: { icon: Activity, bg: "bg-purple-50", fg: "text-purple-600" },
  "eye-ear": { icon: Eye, bg: "bg-sky-50", fg: "text-sky-700" },
  "sexual-wellness": { icon: Heart, bg: "bg-rose-50", fg: "text-rose-500" },
  hair: { icon: Scissors, bg: "bg-stone-100", fg: "text-stone-600" },
  baby: { icon: Baby, bg: "bg-pink-50", fg: "text-pink-500" },
  "brain-nerve": { icon: Brain, bg: "bg-violet-50", fg: "text-violet-600" },
  womens: { icon: Ribbon, bg: "bg-fuchsia-50", fg: "text-fuchsia-700" },
  urology: { icon: Droplet, bg: "bg-blue-50", fg: "text-blue-700" },
  worms: { icon: FlaskConical, bg: "bg-emerald-50", fg: "text-emerald-600" },
  thyroid: { icon: Activity, bg: "bg-orange-50", fg: "text-orange-700" },
  ayurvedic: { icon: Leaf, bg: "bg-green-50", fg: "text-green-600" },
  supports: { icon: Bone, bg: "bg-slate-100", fg: "text-slate-600" },
  "quit-smoking": { icon: Cigarette, bg: "bg-zinc-100", fg: "text-zinc-600" },
  "home-personal": { icon: House, bg: "bg-amber-50", fg: "text-amber-700" },
  "other-medicines": { icon: Package, bg: "bg-slate-100", fg: "text-slate-600" },
};

// "Shop by category" grid at the end of the home page. A tile with nothing in
// it is left out; each tile opens the catalogue filtered to that category.
export function CategoryGrid({
  lang,
  counts,
}: {
  lang: Lang;
  counts: Map<string, { total: number; inStock: number }>;
}) {
  const tiles = CATEGORY_TILES.filter((c) => (counts.get(c.slug)?.total ?? 0) > 0);
  if (tiles.length === 0) return null;
  return (
    <Card>
      <h2 className="text-base font-bold text-slate-900">{t(lang, "shop_by_category")}</h2>
      <p className="mb-3 text-sm text-slate-500">{t(lang, "shop_by_category_sub")}</p>
      <div className="grid grid-cols-3 gap-x-2 gap-y-4 text-center">
        {tiles.map((c) => {
          const s = STYLE[c.slug] ?? STYLE["other-medicines"];
          const Icon = s.icon;
          return (
            <Link key={c.slug} href={`/shop/products?tile=${c.slug}`} className="group flex flex-col items-center gap-1.5">
              <span className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 group-active:scale-95 ${s.bg}`}>
                <Icon className={s.fg} size={28} strokeWidth={1.75} />
              </span>
              <span className="text-xs font-semibold leading-tight text-slate-700">{tileName(c, lang)}</span>
              <span className="-mt-1 text-[11px] text-slate-400">
                {counts.get(c.slug)!.inStock} {t(lang, "shop_category_items")}
              </span>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
