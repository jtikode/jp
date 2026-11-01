import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCnfIdentity } from "@/actions/cnfActions";
import { loadCnfCatalog } from "@/lib/cnf/catalog";
import { CNF_GROUPS } from "@/lib/cnf/config";
import { getCnfBase } from "@/lib/cnf/base";
import { CnfPortal } from "@/components/cnf/CnfPortal";

export const metadata: Metadata = {
  title: "Distributor Products | J P Traders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function CnfProductsPage({ searchParams }: { searchParams: Promise<{ group?: string; q?: string }> }) {
  const { group, q } = await searchParams;
  const base = await getCnfBase();
  const me = await getCnfIdentity();
  if (!me) redirect(`${base}/login`);
  const products = await loadCnfCatalog(me.orgId, me.percent);
  const initialGroup = CNF_GROUPS.some((g) => g.slug === group) ? (group as string) : "all";
  const initialQuery = (q ?? "").slice(0, 80);
  return (
    <CnfPortal
      key={`${initialGroup}|${initialQuery}`}
      products={products}
      storeId={me.storeId}
      storeName={me.name}
      base={base}
      initialGroup={initialGroup}
      initialQuery={initialQuery}
    />
  );
}
