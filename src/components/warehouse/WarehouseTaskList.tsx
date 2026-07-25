"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { completeWarehouseTask } from "@/actions/warehouseTaskActions";
import { Button } from "@/components/ui/Button";

interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  overdue: boolean;
}

export function WarehouseTaskList({ occurrences }: { occurrences: TaskItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function complete(id: string) {
    startTransition(async () => {
      await completeWarehouseTask(id);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {occurrences.map((o) => (
        <div
          key={o.id}
          className="flex items-center gap-3 rounded-xl border-2 border-slate-200 p-3"
        >
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{o.title}</p>
            {o.description && <p className="text-sm text-slate-500">{o.description}</p>}
            {o.overdue && (
              <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                Carried over
              </span>
            )}
          </div>
          <Button
            disabled={pending}
            onClick={() => complete(o.id)}
            className="min-h-11 shrink-0 px-4 py-2 text-sm"
          >
            Done
          </Button>
        </div>
      ))}
      {occurrences.length === 0 && (
        <p className="py-6 text-center text-slate-400">No tasks due today.</p>
      )}
    </div>
  );
}
