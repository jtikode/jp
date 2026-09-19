import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { requireRole } from "@/lib/permissions";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { storeLabel } from "@/lib/storeLabel";
import { setPaymentVerified } from "@/actions/paymentActions";
import { getStartOfIstDayUtc } from "@/lib/istTime";

const IST_DATE_TIME: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Kolkata",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await requireRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);
  const { date } = await searchParams;

  // ?date=YYYY-MM-DD narrows to one IST day; anything else shows the latest.
  let range: { gte: Date; lt: Date } | undefined;
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const start = new Date(`${date}T00:00:00+05:30`);
    if (!Number.isNaN(start.getTime())) {
      range = { gte: start, lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
    }
  }

  const [payments, todays] = await Promise.all([
    db.paymentReport.findMany({
      where: range ? { createdAt: range } : {},
      include: { store: true },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    db.paymentReport.findMany({ where: { createdAt: { gte: getStartOfIstDayUtc() } }, select: { amount: true } }),
  ]);

  const todayTotal = todays.reduce((sum, p) => sum + Number(p.amount), 0);
  const shownTotal = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Card>
        <h1 className="text-lg font-bold text-slate-900">Payments</h1>
        <p className="mt-1 text-sm text-slate-500">
          Payments retailers report from the shop&apos;s Pay Online page. UPI settles straight to your bank, so
          these are <strong>retailer-reported</strong>, tick each one Verified after matching your bank
          statement. A summary is emailed at 11:55 PM IST every day there&apos;s at least one payment.
        </p>
        <p className="mt-3 text-sm font-medium text-slate-700">
          Today: {todays.length} payment{todays.length === 1 ? "" : "s"} · ₹{todayTotal.toLocaleString("en-IN")}
        </p>
        <form method="get" className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
            <input
              type="date"
              name="date"
              defaultValue={date ?? ""}
              className="rounded-lg border-2 border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <Button type="submit" className="min-h-11 px-6 py-2 text-sm">
            View
          </Button>
          {date && (
            <a href="/team/admin/payments" className="pb-2 text-sm font-semibold text-blue-700 hover:underline">
              Clear
            </a>
          )}
        </form>
      </Card>

      <Card className="overflow-x-auto">
        <h2 className="mb-1 text-base font-bold text-slate-900">
          {range ? `Payments on ${date}` : "Latest payments"} ({payments.length})
        </h2>
        <p className="mb-4 text-sm text-slate-500">Total shown: ₹{shownTotal.toLocaleString("en-IN")}</p>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="py-2 pr-4">Date &amp; Time</th>
              <th className="py-2 pr-4">Party</th>
              <th className="py-2 pr-4">Amount</th>
              <th className="py-2 pr-4">Invoice No.</th>
              <th className="py-2 pr-4">UTR / Ref</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-4 whitespace-nowrap text-slate-600">
                  {p.createdAt.toLocaleString("en-IN", IST_DATE_TIME)}
                </td>
                <td className="py-2 pr-4 font-medium text-slate-900">
                  {storeLabel(p.store.name, p.store.externalCode)}
                </td>
                <td className="py-2 pr-4 font-semibold text-slate-900">
                  ₹{Number(p.amount).toLocaleString("en-IN")}
                </td>
                <td className="py-2 pr-4 text-slate-600">{p.invoiceNos.join(", ") || "—"}</td>
                <td className="py-2 pr-4 font-mono text-xs text-slate-600">{p.utr ?? "—"}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      p.verified
                        ? "rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700"
                        : "rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800"
                    }
                  >
                    {p.verified ? "Verified" : "Reported"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <form action={setPaymentVerified.bind(null, p.id, !p.verified)}>
                    <button type="submit" className="text-sm font-semibold text-blue-700 hover:underline">
                      {p.verified ? "Unverify" : "Mark verified"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400">
                  No payments reported {range ? "on this date" : "yet"}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
