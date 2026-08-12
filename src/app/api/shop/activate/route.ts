import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getRetailerSession } from "@/lib/retailerSession";

const activateSchema = z.object({
  businessCode: z.string().min(1),
  phone: z.string().min(1),
  pin: z.string().min(4, "PIN must be at least 4 digits."),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = activateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid activation details." },
      { status: 400 }
    );
  }

  const { businessCode, phone, pin } = parsed.data;

  const org = await db.organization.findUnique({
    where: { slug: businessCode.trim().toLowerCase() },
  });

  if (!org || !org.active) {
    return NextResponse.json({ error: "Invalid business code." }, { status: 401 });
  }

  const store = await db.store.findFirst({
    where: { orgId: org.id, phone: phone.trim() },
  });

  if (!store) {
    return NextResponse.json(
      { error: "No store found with that phone number for this business. Check with your distributor." },
      { status: 404 }
    );
  }

  if (store.pinHash) {
    return NextResponse.json(
      { error: "This shop account is already activated. Please sign in instead." },
      { status: 409 }
    );
  }

  const pinHash = await hashPassword(pin);
  await db.store.update({ where: { id: store.id }, data: { pinHash, lastLoginAt: new Date() } });

  const session = await getRetailerSession();
  session.storeId = store.id;
  session.orgId = org.id;
  session.storeName = store.name;
  await session.save();

  return NextResponse.json({ redirectTo: "/shop/home" });
}
