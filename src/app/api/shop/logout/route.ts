import { NextResponse } from "next/server";
import { getRetailerSession } from "@/lib/retailerSession";

export async function POST() {
  const session = await getRetailerSession();
  session.destroy();
  return NextResponse.json({ ok: true });
}
