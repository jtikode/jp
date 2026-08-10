import { NextResponse, type NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/session";
import { ROLE_HOME } from "@/lib/permissions";

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "jpt_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

const ROLE_PREFIX: Record<string, string> = {
  "/salesman": "SALESMAN",
  "/telecaller": "TELECALLER",
  "/warehouse": "WAREHOUSE",
  "/admin": "ADMIN",
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role !== ROLE_PREFIX[matchedPrefix]) {
    const homeUrl = new URL(ROLE_HOME[session.role], request.url);
    return NextResponse.redirect(homeUrl);
  }

  return response;
}

export const config = {
  matcher: ["/salesman/:path*", "/telecaller/:path*", "/warehouse/:path*", "/admin/:path*"],
};
