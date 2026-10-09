import { getIronSession, unsealData, sealData, type IronSession } from "iron-session";
import { cookies, headers } from "next/headers";

export interface RetailerSessionData {
  storeId?: string;
  orgId?: string;
  storeName?: string;
  // Set only while an admin or salesman is taking an order on a retailer's
  // behalf from the team area; a real retailer login never carries these.
  bookedBy?: string;
  bookedByRole?: string;
}

const retailerSessionOptions = {
  password: process.env.SESSION_SECRET as string,
  // Distinct cookie from the employee session (jpt_session) so a retailer
  // and an employee can be logged in on the same device without colliding.
  cookieName: "jpt_retailer_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    // Without an explicit maxAge this becomes a browser-session cookie,
    // which mobile browsers/PWAs can drop far more eagerly than desktop
    // (backgrounding the app, low memory, etc.) — retailers were getting
    // logged out unexpectedly. 90 days keeps them signed in like a normal
    // shopping app; logging out is still just a tap away.
    maxAge: 60 * 60 * 24 * 90,
  },
};

const MOBILE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 90;

/** Long-lived signed token the native app stores instead of a browser cookie. */
export async function issueMobileToken(data: Required<Pick<RetailerSessionData, "storeId" | "orgId" | "storeName">>): Promise<string> {
  return sealData(data, { password: process.env.SESSION_SECRET as string, ttl: MOBILE_TOKEN_TTL_SECONDS });
}

export async function getRetailerSession(): Promise<IronSession<RetailerSessionData>> {
  // The native app authenticates with "Authorization: Bearer <token>" instead
  // of the cookie. Everything downstream (server actions, lib functions) reads
  // the session through this one function, so they work unchanged for both.
  const bearer = (await headers()).get("authorization");
  if (bearer?.startsWith("Bearer ")) {
    let data: RetailerSessionData = {};
    try {
      data = await unsealData<RetailerSessionData>(bearer.slice(7), {
        password: process.env.SESSION_SECRET as string,
        ttl: MOBILE_TOKEN_TTL_SECONDS,
      });
    } catch {
      // Invalid or expired token: fall through as an anonymous session.
    }
    const noop = async () => {};
    return Object.assign(data, { save: noop, destroy: noop, updateConfig: () => {} }) as unknown as IronSession<RetailerSessionData>;
  }

  const cookieStore = await cookies();
  return getIronSession<RetailerSessionData>(cookieStore, retailerSessionOptions);
}
