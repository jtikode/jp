import { NextResponse } from "next/server";
import { z } from "zod";
import { getRetailerSession } from "@/lib/retailerSession";
import { authenticateRetailer } from "@/lib/retailerLogin";

const loginSchema = z.object({
  businessCode: z.string().min(1),
  loginId: z.string().min(1),
  pin: z.string().min(1),
  // Where to send the retailer after signing in — e.g. back to the product
  // they were viewing on the public, unauthenticated product page. Must be a
  // same-site path under /shop/ so this can't be turned into an open redirect.
  redirectTo: z.string().optional(),
});

function safeRedirect(path: string | undefined): string {
  if (path && path.startsWith("/shop/")) return path;
  return "/shop/home";
}

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

  return NextResponse.json({ redirectTo: safeRedirect(parsed.data.redirectTo) });
}
