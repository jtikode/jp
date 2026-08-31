import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { ShopLoginCredentialsTable } from "@/components/admin/ShopLoginCredentialsTable";
import { GenerateShopLoginsButton } from "@/components/admin/GenerateShopLoginsButton";
import { shopLoginPassword } from "@/lib/shopLoginCode";

export default async function ShopLoginsPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const [issued, pendingCount] = await Promise.all([
    db.store.findMany({
      where: { loginCode: { not: null } },
      select: { id: true, name: true, loginCode: true, phone: true, lastLoginAt: true },
      orderBy: { name: "asc" },
    }),
    db.store.count({ where: { loginCode: null } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Card>
        <h1 className="mb-1 text-lg font-bold text-slate-900">Shop Login Credentials</h1>
        <p className="mb-4 text-sm text-slate-500">
          Every medical gets a 4-digit Login Code; its password is always that code reversed. These
          credentials use the same store record as Routes/Orders/Outstanding, so anything a retailer
          orders through the shop links straight into their existing history.
        </p>
        <GenerateShopLoginsButton pendingCount={pendingCount} />
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-slate-900">Issued ({issued.length})</h2>
        <ShopLoginCredentialsTable
          stores={issued.map((s) => ({
            id: s.id,
            name: s.name,
            loginCode: s.loginCode as string,
            password: shopLoginPassword(s.loginCode as string),
            phone: s.phone,
            lastLoginAt: s.lastLoginAt ? s.lastLoginAt.toISOString() : null,
          }))}
        />
      </Card>
    </div>
  );
}
