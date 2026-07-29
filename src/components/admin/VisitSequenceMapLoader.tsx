"use client";

import dynamic from "next/dynamic";
import type { VisitPoint } from "@/components/admin/VisitSequenceMap";

const VisitSequenceMap = dynamic(
  () => import("@/components/admin/VisitSequenceMap").then((m) => m.VisitSequenceMap),
  { ssr: false, loading: () => <p className="text-slate-400">Loading map...</p> },
);

export function VisitSequenceMapLoader({ points }: { points: VisitPoint[] }) {
  return <VisitSequenceMap points={points} />;
}
