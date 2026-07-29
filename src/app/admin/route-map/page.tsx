import { format } from "date-fns";
import { db } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { VisitSequenceMapLoader } from "@/components/admin/VisitSequenceMapLoader";
import type { VisitPoint } from "@/components/admin/VisitSequenceMap";

export default async function RouteMapPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; date?: string }>;
}) {
  const { userId, date: dateParam } = await searchParams;
  const salesmen = await db.user.findMany({
    where: { role: "SALESMAN", active: true },
    orderBy: { name: "asc" },
  });

  const selectedUserId = userId ?? salesmen[0]?.id ?? "";
  const selectedDate = dateParam ?? format(new Date(), "yyyy-MM-dd");

  let points: VisitPoint[] = [];
  if (selectedUserId) {
    const dayStart = new Date(`${selectedDate}T00:00:00`);
    const dayEnd = new Date(`${selectedDate}T23:59:59.999`);
    const visits = await db.visit.findMany({
      where: { userId: selectedUserId, visitDate: { gte: dayStart, lte: dayEnd } },
      include: { store: true },
      orderBy: { visitDate: "asc" },
    });

    points = visits
      .filter((v) => v.store.latitude != null && v.store.longitude != null)
      .map((v, i) => ({
        sequence: i + 1,
        storeName: v.store.name,
        time: format(v.visitDate, "h:mm a"),
        lat: v.store.latitude as number,
        lng: v.store.longitude as number,
      }));
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Card>
        <h1 className="mb-4 text-lg font-bold text-slate-900">Visit Sequence Map</h1>
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Salesman</label>
            <Select name="userId" defaultValue={selectedUserId} className="min-h-11 w-56 text-sm">
              {salesmen.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-600">Date</label>
            <Input type="date" name="date" defaultValue={selectedDate} className="min-h-11 w-44 text-sm" />
          </div>
          <Button type="submit" className="min-h-11 py-2 text-sm">
            Go
          </Button>
        </form>
      </Card>

      <Card>
        {points.length === 0 ? (
          <p className="py-10 text-center text-slate-400">
            No located visits for this salesman on this date yet.
          </p>
        ) : (
          <VisitSequenceMapLoader points={points} />
        )}
      </Card>

      {points.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[400px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">#</th>
                <th className="py-2 pr-4">Store</th>
                <th className="py-2 pr-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.sequence} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-semibold text-slate-900">{p.sequence}</td>
                  <td className="py-2 pr-4 text-slate-700">{p.storeName}</td>
                  <td className="py-2 pr-4 text-slate-500">{p.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
