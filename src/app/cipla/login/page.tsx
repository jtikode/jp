import type { Metadata } from "next";
import { getCiplaBase } from "@/lib/ciplaOtc/base";
import { CiplaLogin } from "@/components/cipla/CiplaLogin";

export const metadata: Metadata = { title: "Cipla OTC Sign in | J P Traders" };

export default async function CiplaLoginPage() {
  return <CiplaLogin base={await getCiplaBase()} />;
}
