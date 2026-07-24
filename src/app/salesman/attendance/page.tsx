import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Card } from "@/components/ui/Card";
import { AttendanceButtons } from "@/components/salesman/AttendanceButtons";

export default async function AttendancePage() {
  const session = await getSession();
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const attendance = await db.attendance.findUnique({
    where: { userId_date: { userId: session.userId as string, date: startOfToday } },
  });

  return (
    <div className="mx-auto max-w-sm">
      <Card>
        <AttendanceButtons currentStatus={attendance?.status ?? null} />
      </Card>
    </div>
  );
}
