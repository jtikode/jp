import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRetailer } from "@/lib/retailerLogin";
import { issueMobileToken } from "@/lib/retailerSession";
import { db } from "@/lib/db";

const schema = z.object({ loginId: z.string().min(1), pin: z.string().min(1) });

// The app is single-distributor for now, same fixed business code as the web login.
const BUSINESS_CODE = "jptraders";

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Login Id and Password are required." }, { status: 400 });
  }

  const result = await authenticateRetailer(request, { businessCode: BUSINESS_CODE, ...parsed.data });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const store = await db.store.findUniqueOrThrow({ where: { id: result.store.id } });
  const token = await issueMobileToken({ storeId: store.id, orgId: result.orgId, storeName: store.name });

  return NextResponse.json({
    token,
    store: { id: store.id, name: store.name, needsWhatsapp: !store.orderGiverWhatsapp },
  });
}
