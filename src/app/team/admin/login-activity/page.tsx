import { redirect } from "next/navigation";

// Moved: the adoption tables and login activity now live on the dashboard overview.
export default function LoginActivityMovedPage() {
  redirect("/team/admin/dashboard");
}
