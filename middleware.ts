import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";
import type { RetailerSessionData } from "@/lib/retailerSession";
import { ROLE_HOME } from "@/lib/permissions";

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "jpt_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 90,
  },
};

// Separate cookie from the employee session so a retailer and an employee
// can be logged in on the same device without colliding.
const retailerSessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "jpt_retailer_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 90,
  },
};

const ROLE_PREFIX: Record<string, string> = {
  "/team/salesman": "SALESMAN",
  "/team/telecaller": "TELECALLER",
  "/team/warehouse": "WAREHOUSE",
  "/team/admin": "ADMIN",
};

// Team pages that don't require a staff session to reach.
const TEAM_PUBLIC_PATHS = ["/team/login", "/team/signup"];

// Public shop pages — no retailer session required to reach these.
const SHOP_PUBLIC_PATHS = ["/shop/login", "/shop/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/shop")) {
    if (SHOP_PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next();
    }

    const response = NextResponse.next();
    const retailerSession = await getIronSession<RetailerSessionData>(
      request,
      response,
      retailerSessionOptions,
    );

    if (!retailerSession.storeId || !retailerSession.orgId) {
      const loginUrl = new URL("/shop/login", request.url);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  if (TEAM_PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const matchedPrefix = Object.keys(ROLE_PREFIX).find((prefix) =>
    pathname.startsWith(prefix),
  );
  if (!matchedPrefix) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions,
  );

  if (!session.userId || !session.orgId || !session.role) {
    const loginUrl = new URL("/team/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role !== ROLE_PREFIX[matchedPrefix]) {
    const homeUrl = new URL(ROLE_HOME[session.role], request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/team/:path*",
    "/shop/:path*",
  ],
};
