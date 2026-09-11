import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";

export default async function LoginActivityPage() {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const events = await db.loginEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="overflow-x-auto">
        <h1 className="mb-1 text-lg font-bold text-slate-900">Login Activity</h1>
        <p className="mb-4 text-sm text-slate-500">
          Most recent 200 sign-ins across both staff logins and the retailer shop.
        </p>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Date &amp; Time</th>
              <th className="py-2 pr-4">Account</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-b border-slate-100">
                <td className="py-2 pr-4 whitespace-nowrap text-slate-600">
                  {e.createdAt.toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "Asia/Kolkata",
                  })}
                </td>
                <td className="py-2 pr-4 font-medium text-slate-900">{e.displayName}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      e.accountType === "STAFF"
                        ? "rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700"
                        : "rounded-full bg-teal-100 px-2 py-1 text-xs font-semibold text-teal-700"
                    }
                  >
                    {e.accountType === "STAFF" ? "Staff" : "Retailer"}
                  </span>
                </td>
                <td className="py-2 pr-4 font-mono text-xs text-slate-600">{e.ipAddress ?? "—"}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  No login activity recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
