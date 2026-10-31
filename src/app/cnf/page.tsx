import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCnfIdentity } from "@/actions/cnfActions";
import { loadCnfCatalog } from "@/lib/cnf/catalog";
import { getCnfBase } from "@/lib/cnf/base";
import { CnfPortal } from "@/components/cnf/CnfPortal";

export const metadata: Metadata = {
  title: "Distributor Orders | J P Traders",
  description: "Order DKT, Morepen Devices, Morepen Burnol and Ambitech directly from J P Traders.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CnfHomePage() {
  const base = await getCnfBase();
  const me = await getCnfIdentity();
  if (!me) redirect(`${base}/login`);
  const products = await loadCnfCatalog(me.orgId, me.percent);
  return <CnfPortal products={products} storeId={me.storeId} storeName={me.name} base={base} />;
}
