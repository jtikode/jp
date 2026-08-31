import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { getRetailerSession } from "@/lib/retailerSession";

const loginSchema = z.object({
  businessCode: z.string().min(1),
  loginId: z.string().min(1),
  pin: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Business code, Login Id, and Password are required." },
      { status: 400 }
    );
  }

  const { businessCode, loginId, pin } = parsed.data;

  const org = await db.organization.findUnique({
    where: { slug: businessCode.trim().toLowerCase() },
  });

  if (!org || !org.active) {
    return NextResponse.json({ error: "Invalid business code." }, { status: 401 });
  }

  // Look up by the 4-digit login code first (the bulk-issued credential
  // every store now has); fall back to phone for any pre-existing account
  // that self-activated before this scheme, so it doesn't get locked out.
  const store = await db.store.findFirst({
    where: { orgId: org.id, OR: [{ loginCode: loginId.trim() }, { phone: loginId.trim() }] },
  });

  if (!store || !store.pinHash) {
    return NextResponse.json(
      { error: "No activated shop account found for that Login Id." },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(pin, store.pinHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid Login Id or Password." }, { status: 401 });
  }

  await db.store.update({ where: { id: store.id }, data: { lastLoginAt: new Date() } });

  const session = await getRetailerSession();
  session.storeId = store.id;
  session.orgId = org.id;
  session.storeName = store.name;
  await session.save();

  return NextResponse.json({ redirectTo: "/shop/home" });
}
