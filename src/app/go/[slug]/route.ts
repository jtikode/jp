import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getClientIp } from "@/lib/requestInfo";

// Public promo-link redirect for salesmen: app.jpkop.in/go/<promoSlug>.
// Not org-scoped by URL (this app is effectively single-tenant in
// deployment), so it looks the slug up directly rather than through
// getOrgScopedDb, which requires an orgId the URL doesn't carry.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const salesman = await db.user.findFirst({
    where: { promoSlug: slug, role: "SALESMAN", active: true },
    select: { id: true, orgId: true },
  });

  // A matching or a mistyped/deactivated link both land the retailer on the
  // real login page — a promo link should never dead-end into an error page.
  if (salesman) {
    await db.promoClick.create({
      data: {
        orgId: salesman.orgId,
        userId: salesman.id,
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent"),
      },
    });
  }

  return NextResponse.redirect(new URL("/shop/login", request.url), { status: 307 });
}
