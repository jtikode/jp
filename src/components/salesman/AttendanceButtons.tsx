"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAttendance } from "@/actions/attendanceActions";
import { Button } from "@/components/ui/Button";

export function AttendanceButtons({ currentStatus }: { currentStatus: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [justMarked, setJustMarked] = useState<string | null>(null);

  function handleMark(status: "LEAVE" | "OFFICE_DAY") {
    startTransition(async () => {
      await markAttendance(status);
      setJustMarked(status);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">
        Today&apos;s status:{" "}
        <span className="font-semibold text-slate-900">
          {currentStatus ?? "Not marked (assumed field day)"}
        </span>
      </p>
      <Button variant="danger" disabled={pending} onClick={() => handleMark("LEAVE")}>
        Mark Leave
      </Button>
      <Button variant="secondary" disabled={pending} onClick={() => handleMark("OFFICE_DAY")}>
        Day at Office
      </Button>
      {justMarked && (
        <p className="text-sm font-medium text-green-700">Marked as {justMarked} for today.</p>
      )}
    </div>
  );
}
