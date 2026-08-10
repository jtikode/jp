import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import type { Role } from "@/generated/prisma/client";

export interface SessionData {
  userId?: string;
  orgId?: string;
  role?: Role;
  name?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "jpt_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
