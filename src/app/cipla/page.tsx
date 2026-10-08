import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCiplaIdentity } from "@/actions/ciplaOtcActions";
import { currentOtcSheet } from "@/lib/ciplaOtc";
import { getCiplaBase } from "@/lib/ciplaOtc/base";
import { CiplaPortal } from "@/components/cipla/CiplaPortal";

export const metadata: Metadata = {
  title: "Cipla OTC Booking | J P Traders",
  description: "Monthly Cipla OTC rates, schemes and quantity incentives, with booking for retailers and salesmen.",
};

export default async function CiplaOtcPage() {
  const base = await getCiplaBase();
  const me = await getCiplaIdentity();
  if (!me) redirect(`${base}/login`);
  return <CiplaPortal sheet={currentOtcSheet()} identity={{ kind: me.kind, name: me.name }} base={base} />;
}
