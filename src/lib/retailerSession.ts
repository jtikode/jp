import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface RetailerSessionData {
  storeId?: string;
  orgId?: string;
  storeName?: string;
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
  },
};

export async function getRetailerSession(): Promise<IronSession<RetailerSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<RetailerSessionData>(cookieStore, retailerSessionOptions);
}
