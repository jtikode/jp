import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { ROLE_HOME } from "@/lib/permissions";

const loginSchema = z.object({
  businessCode: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Business code, username, and password are required." },
      { status: 400 }
    );
  }

  const { businessCode, username, password } = parsed.data;

  const org = await db.organization.findUnique({
    where: { slug: businessCode.trim().toLowerCase() },
  });

  if (!org || !org.active) {
    return NextResponse.json({ error: "Invalid business code." }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { orgId_username: { orgId: org.id, username } },
  });

  if (!user || !user.active) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.orgId = org.id;
  session.role = user.role;
  session.name = user.name;
  await session.save();

  return NextResponse.json({ redirectTo: ROLE_HOME[user.role] });
}
