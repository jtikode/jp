import { NextResponse } from "next/server";
import { z } from "zod";
import { getRetailerSession } from "@/lib/retailerSession";
import { authenticateRetailer } from "@/lib/retailerLogin";

const loginSchema = z.object({
  businessCode: z.string().min(1),
  loginId: z.string().min(1),
  pin: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Business code, Login Id, and Password are required." },
      { status: 400 }
    );
  }

  const result = await authenticateRetailer(request, parsed.data);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

  const session = await getRetailerSession();
  session.storeId = result.store.id;
  session.orgId = result.orgId;
  session.storeName = result.store.name;
  await session.save();

  return NextResponse.json({ redirectTo: "/shop/home" });
}
