"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markWarehouseAttendance } from "@/actions/taskActions";
import { Button } from "@/components/ui/Button";

export function WarehouseAttendanceButtons({ present }: { present: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function mark(value: boolean) {
    startTransition(async () => {
      await markWarehouseAttendance(value);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-slate-500">
        Today: <span className="font-semibold text-slate-900">{present ? "Present" : "Absent"}</span>
      </p>
      <div className="flex gap-3">
        <Button disabled={pending} onClick={() => mark(true)} className="flex-1">
          Yes, present
        </Button>
        <Button variant="danger" disabled={pending} onClick={() => mark(false)} className="flex-1">
          No, absent
        </Button>
      </div>
    </div>
  );
}
