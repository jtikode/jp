import { cancelScheduledNotification } from "@/actions/bannerActions";

export interface ScheduledNotificationRow {
  id: string;
  title: string;
  body: string;
  scheduledAt: string;
  status: "PENDING" | "SENT" | "FAILED" | "CANCELLED";
  sentCount: number | null;
  storeCount: number | null;
}

const STATUS_STYLE: Record<ScheduledNotificationRow["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800",
  SENT: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export function ScheduledNotificationsList({ notifications }: { notifications: ScheduledNotificationRow[] }) {
  if (notifications.length === 0) {
    return <p className="py-4 text-center text-slate-400">No scheduled notifications.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {notifications.map((n) => (
        <div key={n.id} className="flex items-start gap-3 rounded-xl border-2 border-slate-200 p-3">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-slate-900">{n.title}</p>
            <p className="truncate text-sm text-slate-500">{n.body}</p>
            <p className="mt-1 text-xs text-slate-400">
              {new Date(n.scheduledAt).toLocaleString("en-IN")}
              {n.status === "SENT" && n.sentCount != null && (
                <> · Sent to {n.sentCount} device{n.sentCount === 1 ? "" : "s"} across {n.storeCount} store{n.storeCount === 1 ? "" : "s"}</>
              )}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${STATUS_STYLE[n.status]}`}>
            {n.status}
          </span>
          {n.status === "PENDING" && (
            <form action={cancelScheduledNotification.bind(null, n.id)}>
              <button type="submit" className="text-sm font-semibold text-red-600 hover:underline">
                Cancel
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
