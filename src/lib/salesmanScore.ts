import { startOfMonth, endOfMonth } from "date-fns";
import { db } from "@/lib/db";

export interface SalesmanScoreBreakdown {
  total: number;
  sales: number;
  salesMax: number;
  receipts: number;
  receiptsMax: number;
  locations: number;
  locationsMax: number;
  medicalsDone: number;
  medicalsDoneMax: number;
  attendance: number;
  attendanceMax: number;
}

const WEIGHTS = {
  sales: 30,
  receipts: 25,
  locations: 15,
  medicalsDone: 20,
  attendance: 10,
} as const;

/**
 * A salesman's score out of 100 this month:
 * - Sales (30): this month's order amount vs monthly target.
 * - Receipts (25): this month's collection amount vs monthly target (no
 *   separate receipts target exists, so the same monthly target is reused
 *   as the baseline).
 * - Locations (15): % of their assigned stores that have a GPS location
 *   captured yet (from any salesman's visit, not just theirs).
 * - Medicals Done (20): % of their assigned stores visited at least once
 *   this month.
 * - Attendance (10): 10 minus 2 for every Leave/Absent day this month
 *   (Half Leave counts as half), floored at 0.
 */
export async function computeSalesmanScore(userId: string): Promise<SalesmanScoreBreakdown> {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const [target, monthAgg, assignments, attendances] = await Promise.all([
    db.target.findUnique({
      where: {
        userId_periodMonth_periodYear: {
          userId,
          periodMonth: today.getMonth() + 1,
          periodYear: today.getFullYear(),
        },
      },
    }),
    db.visit.aggregate({
      where: { userId, visitDate: { gte: monthStart, lte: monthEnd } },
      _sum: { orderAmount: true, collectionAmount: true },
    }),
    db.routeAssignment.findMany({ where: { userId }, select: { routeId: true } }),
    db.attendance.findMany({
      where: { userId, date: { gte: monthStart, lte: monthEnd } },
      select: { status: true },
    }),
  ]);

  const routeIds = assignments.map((a) => a.routeId);
  const assignedStores =
    routeIds.length > 0
      ? await db.routeStore.findMany({
          where: { routeId: { in: routeIds } },
          select: { storeId: true, store: { select: { latitude: true, longitude: true } } },
        })
      : [];
  const uniqueStoreIds = new Set(assignedStores.map((rs) => rs.storeId));
  const totalAssignedStores = uniqueStoreIds.size;

  const locatedCount = new Set(
    assignedStores.filter((rs) => rs.store.latitude != null && rs.store.longitude != null).map((rs) => rs.storeId),
  ).size;

  const visitedThisMonth = await db.visit.findMany({
    where: { userId, visitDate: { gte: monthStart, lte: monthEnd } },
    select: { storeId: true },
    distinct: ["storeId"],
  });
  const visitedCount = new Set(
    visitedThisMonth.map((v) => v.storeId).filter((id) => uniqueStoreIds.has(id)),
  ).size;

  const monthlyTarget = Number(target?.monthlyTarget ?? 0);
  const monthOrderAmount = Number(monthAgg._sum.orderAmount ?? 0);
  const monthCollectionAmount = Number(monthAgg._sum.collectionAmount ?? 0);

  const sales = monthlyTarget > 0 ? Math.min(1, monthOrderAmount / monthlyTarget) * WEIGHTS.sales : 0;
  const receipts =
    monthlyTarget > 0 ? Math.min(1, monthCollectionAmount / monthlyTarget) * WEIGHTS.receipts : 0;
  const locations = totalAssignedStores > 0 ? (locatedCount / totalAssignedStores) * WEIGHTS.locations : 0;
  const medicalsDone =
    totalAssignedStores > 0 ? (visitedCount / totalAssignedStores) * WEIGHTS.medicalsDone : 0;

  let leavePenaltyUnits = 0;
  for (const a of attendances) {
    if (a.status === "LEAVE" || a.status === "ABSENT") leavePenaltyUnits += 1;
    else if (a.status === "HALF_LEAVE") leavePenaltyUnits += 0.5;
  }
  const attendance = Math.max(0, WEIGHTS.attendance - leavePenaltyUnits * 2);

  const total = Math.round(sales + receipts + locations + medicalsDone + attendance);

  return {
    total: Math.min(100, Math.max(0, total)),
    sales: Math.round(sales),
    salesMax: WEIGHTS.sales,
    receipts: Math.round(receipts),
    receiptsMax: WEIGHTS.receipts,
    locations: Math.round(locations),
    locationsMax: WEIGHTS.locations,
    medicalsDone: Math.round(medicalsDone),
    medicalsDoneMax: WEIGHTS.medicalsDone,
    attendance: Math.round(attendance),
    attendanceMax: WEIGHTS.attendance,
  };
}
