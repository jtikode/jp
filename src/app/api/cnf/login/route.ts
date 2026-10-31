import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRetailerSession } from "@/lib/retailerSession";
import { authenticateRetailer } from "@/lib/retailerLogin";
import { CNF_BUSINESS_CODE } from "@/lib/cnf/config";

const loginSchema = z.object({ loginId: z.string().min(1), pin: z.string().min(1) });

// Same credentials as the retailer shop, but only stores an admin has marked as
// distributors may sign in here.
export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Login Id and Password are required." }, { status: 400 });
  }

  const result = await authenticateRetailer(request, { businessCode: CNF_BUSINESS_CODE, ...parsed.data });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const store = await db.store.findUnique({ where: { id: result.store.id }, select: { distributorRatePercent: true } });
  if (!store?.distributorRatePercent || Number(store.distributorRatePercent) <= 0) {
    return NextResponse.json(
      { error: "This account is not set up for distributor ordering. Please contact J P Traders." },
      { status: 403 },
    );
  }

  const session = await getRetailerSession();
  session.storeId = result.store.id;
  session.orgId = result.orgId;
  session.storeName = result.store.name;
  await session.save();

  return NextResponse.json({ ok: true });
}
