import type { Metadata } from "next";
import { getCnfBase } from "@/lib/cnf/base";
import { CnfLogin } from "@/components/cnf/CnfLogin";

export const metadata: Metadata = { title: "Distributor Sign in | J P Traders", robots: { index: false, follow: false } };

export default async function CnfLoginPage() {
  return <CnfLogin base={await getCnfBase()} />;
}
