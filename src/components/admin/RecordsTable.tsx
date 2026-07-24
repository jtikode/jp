import type { UnifiedRecord } from "@/lib/adminRecords";
import { clsx } from "@/lib/clsx";

const TYPE_STYLES: Record<UnifiedRecord["type"], string> = {
  VISIT: "bg-green-100 text-green-700",
  TELECALLER: "bg-blue-100 text-blue-700",
  WAREHOUSE: "bg-purple-100 text-purple-700",
};

function formatMoney(value: number | null): string {
  if (value == null) return "—";
  return `₹${value.toLocaleString("en-IN")}`;
}

export function RecordsTable({ records }: { records: UnifiedRecord[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Employee</th>
            <th className="py-2 pr-4">Role</th>
            <th className="py-2 pr-4">Route</th>
            <th className="py-2 pr-4">Store</th>
            <th className="py-2 pr-4">Collection</th>
            <th className="py-2 pr-4">Order Amount</th>
            <th className="py-2 pr-4">Reason</th>
            <th className="py-2 pr-4">GPS</th>
            <th className="py-2 pr-4">Photo</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-b border-slate-100">
              <td className="py-2 pr-4 whitespace-nowrap text-slate-600">{r.date.toLocaleString()}</td>
              <td className="py-2 pr-4">
                <span className={clsx("rounded-full px-2 py-1 text-xs font-semibold", TYPE_STYLES[r.type])}>
                  {r.type}
                </span>
              </td>
              <td className="py-2 pr-4 font-medium text-slate-900">{r.employeeName}</td>
              <td className="py-2 pr-4 text-slate-600">{r.role}</td>
              <td className="py-2 pr-4 text-slate-600">{r.routeName ?? "—"}</td>
              <td className="py-2 pr-4 text-slate-600">{r.storeName ?? "—"}</td>
              <td className="py-2 pr-4 text-slate-600">{formatMoney(r.collection)}</td>
              <td className="py-2 pr-4 text-slate-600">{formatMoney(r.orderAmount)}</td>
              <td className="py-2 pr-4 text-slate-600">{r.reason ?? "—"}</td>
              <td className="py-2 pr-4">
                {r.gpsLink ? (
                  <a href={r.gpsLink} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:underline">
                    Map
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="py-2 pr-4">
                {r.photoUrl ? (
                  <a href={r.photoUrl} target="_blank" rel="noopener noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={r.photoUrl} alt="Visit proof" className="h-10 w-10 rounded object-cover" />
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
          {records.length === 0 && (
            <tr>
              <td colSpan={11} className="py-6 text-center text-slate-400">
                No records match these filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
