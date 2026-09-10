import { NextResponse } from "next/server";
import { getRetailerSession } from "@/lib/retailerSession";
import { getActiveCatalog } from "@/lib/productCatalog";

// Not covered by middleware's SHOP_PUBLIC_PATHS/auth gate (that only matches
// "/shop/:path*", not "/api/shop/:path*"), so the session check happens here
// directly — same as the sibling /api/shop/login and /api/shop/logout routes.
export async function GET() {
  const session = await getRetailerSession();
  if (!session.storeId || !session.orgId) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const products = await getActiveCatalog(session.orgId);
  return NextResponse.json({ products });
}
