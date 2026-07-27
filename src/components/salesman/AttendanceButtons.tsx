"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAttendance } from "@/actions/attendanceActions";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { t, type Lang } from "@/lib/i18n";

interface RouteOption {
  id: string;
  name: string;
}

export function AttendanceButtons({
  lang,
  currentStatus,
  currentRouteId,
  routes,
}: {
  lang: Lang;
  currentStatus: string | null;
  currentRouteId?: string | null;
  routes: RouteOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [justMarked, setJustMarked] = useState<string | null>(null);
  const [pickingRoute, setPickingRoute] = useState(false);
  const [routeId, setRouteId] = useState(currentRouteId ?? "");

  function handleMark(status: "LEAVE" | "OFFICE_DAY" | "ON_ROUTE", forRouteId?: string) {
    startTransition(async () => {
      await markAttendance(status, forRouteId);
      setJustMarked(status);
      setPickingRoute(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">
        {t(lang, "todays_status")}{" "}
        <span className="font-semibold text-slate-900">
          {currentStatus ?? t(lang, "status_not_marked")}
        </span>
      </p>
      <Button variant="danger" disabled={pending} onClick={() => handleMark("LEAVE")}>
        {t(lang, "mark_leave")}
      </Button>
      <Button variant="secondary" disabled={pending} onClick={() => handleMark("OFFICE_DAY")}>
        {t(lang, "day_at_office")}
      </Button>

      {!pickingRoute ? (
        <Button disabled={pending} onClick={() => setPickingRoute(true)}>
          {t(lang, "select_route")}
        </Button>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border-2 border-slate-200 p-3">
          <Select value={routeId} onChange={(e) => setRouteId(e.target.value)}>
            <option value="" disabled>
              {t(lang, "choose_todays_route")}
            </option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </Select>
          <Button
            disabled={pending || !routeId}
            onClick={() => handleMark("ON_ROUTE", routeId)}
            className="min-h-11 py-2 text-sm"
          >
            {t(lang, "confirm_route_for_today")}
          </Button>
        </div>
      )}

      {justMarked && (
        <p className="text-sm font-medium text-green-700">
          {t(lang, "marked_as_for_today")} {justMarked} {t(lang, "for_today")}
        </p>
      )}
    </div>
  );
}
