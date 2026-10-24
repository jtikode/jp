import { redirect } from "next/navigation";

// The Outstanding screens are shared by every staff role now.
export default function SalesmanOutstandingRedirect() {
  redirect("/team/outstanding");
}
