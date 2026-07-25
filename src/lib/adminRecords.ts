import { db } from "@/lib/db";
import { storeLabel } from "@/lib/storeLabel";

export interface RecordFilters {
  from?: string;
  to?: string;
  routeId?: string;
  employeeId?: string;
  attendanceStatus?: string;
}

export interface UnifiedRecord {
  id: string;
  type: "VISIT" | "TELECALLER";
  date: Date;
  employeeName: string;
  role: string;
  routeName: string | null;
  storeName: string | null;
  collection: number | null;
  orderAmount: number | null;
  reason: string | null;
  gpsLink: string | null;
  photoUrl: string | null;
}

function dateRange(filters: RecordFilters) {
  const gte = filters.from ? new Date(filters.from) : undefined;
  const lte = filters.to ? new Date(`${filters.to}T23:59:59.999`) : undefined;
  return { gte, lte };
}

export async function getUnifiedRecords(filters: RecordFilters): Promise<UnifiedRecord[]> {
  const { gte, lte } = dateRange(filters);

  let matchingUserIds: Set<string> | null = null;
  if (filters.attendanceStatus) {
    const attendances = await db.attendance.findMany({
      where: {
        status: filters.attendanceStatus as never,
        ...(gte || lte ? { date: { gte, lte } } : {}),
      },
      select: { userId: true },
    });
    matchingUserIds = new Set(attendances.map((a) => a.userId));
  }

  const [visits, telecallerLogs] = await Promise.all([
    db.visit.findMany({
      where: {
        ...(gte || lte ? { visitDate: { gte, lte } } : {}),
        ...(filters.routeId ? { routeId: filters.routeId } : {}),
        ...(filters.employeeId ? { userId: filters.employeeId } : {}),
      },
      include: { user: true, store: true, route: true },
      orderBy: { visitDate: "desc" },
      take: 200,
    }),
    db.telecallerLog.findMany({
      where: {
        ...(gte || lte ? { contactDate: { gte, lte } } : {}),
        ...(filters.employeeId ? { userId: filters.employeeId } : {}),
      },
      include: { user: true, store: true },
      orderBy: { contactDate: "desc" },
      take: 200,
    }),
  ]);

  const rows: UnifiedRecord[] = [];

  for (const v of visits) {
    if (matchingUserIds && !matchingUserIds.has(v.userId)) continue;
    rows.push({
      id: `visit-${v.id}`,
      type: "VISIT",
      date: v.visitDate,
      employeeName: v.user.name,
      role: v.user.role,
      routeName: v.route?.name ?? null,
      storeName: storeLabel(v.store.name, v.store.externalCode),
      collection: v.collectionAmount != null ? Number(v.collectionAmount) : null,
      orderAmount: v.orderAmount != null ? Number(v.orderAmount) : null,
      reason: v.noOrderReason,
      gpsLink: `https://www.google.com/maps?q=${v.latitude},${v.longitude}`,
      photoUrl: v.photoUrl,
    });
  }

  for (const t of telecallerLogs) {
    if (filters.routeId) continue; // telecaller logs aren't route-scoped
    if (matchingUserIds && !matchingUserIds.has(t.userId)) continue;
    rows.push({
      id: `telecaller-${t.id}`,
      type: "TELECALLER",
      date: t.contactDate,
      employeeName: t.user.name,
      role: t.user.role,
      routeName: null,
      storeName: storeLabel(t.store.name, t.store.externalCode),
      collection: t.collectionAmount != null ? Number(t.collectionAmount) : null,
      orderAmount: t.orderAmount != null ? Number(t.orderAmount) : null,
      reason: t.noOrderReason ?? t.complaintNotes,
      gpsLink: null,
      photoUrl: null,
    });
  }

  return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
}
