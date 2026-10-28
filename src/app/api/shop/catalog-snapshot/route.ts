import { NextResponse } from "next/server";
import { getRetailerSession } from "@/lib/retailerSession";
import { getActiveCatalog } from "@/lib/productCatalog";
import { applyStoreRates, storeHasOwnRates } from "@/lib/storeRates";

// Not covered by middleware's SHOP_PUBLIC_PATHS/auth gate (that only matches
// "/shop/:path*", not "/api/shop/:path*"), so the session check happens here
// directly — same as the sibling /api/shop/login and /api/shop/logout routes.
export async function GET() {
  const session = await getRetailerSession();
  if (!session.storeId || !session.orgId) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  // Every device downloads the whole catalog once per refresh window, so a
  // wave of new retailers arrives as a burst of identical multi-hundred-KB
  // responses. Serialize once per org per half minute instead of per request.
  // A shop on its own rates (special rate or markup) gets its own copy, built per request (it never goes in
  // the shared cache), so nobody receives another shop's rates.
  if (await storeHasOwnRates(session.orgId, session.storeId)) {
    const own = await applyStoreRates(session.orgId, session.storeId, await getActiveCatalog(session.orgId));
    return new NextResponse(JSON.stringify({ products: own }), {
      headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=300" },
    });
  }

  const cached = snapshotCache.get(session.orgId);
  let body: string;
  if (cached && Date.now() - cached.at < 30_000) {
    body = cached.body;
  } else {
    body = JSON.stringify({ products: await getActiveCatalog(session.orgId) });
    snapshotCache.set(session.orgId, { at: Date.now(), body });
  }

  return new NextResponse(body, {
    headers: { "Content-Type": "application/json", "Cache-Control": "private, max-age=300" },
  });
}

const snapshotCache = new Map<string, { at: number; body: string }>();
