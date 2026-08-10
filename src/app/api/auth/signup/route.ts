import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { getSession } from "@/lib/session";
import { signupSchema } from "@/lib/validators";
import { ROLE_HOME } from "@/lib/permissions";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid signup details." },
      { status: 400 }
    );
  }

  const { businessName, businessCode, adminName, adminUsername, adminPassword } = parsed.data;
  const slug = businessCode.trim().toLowerCase();

  const existingOrg = await db.organization.findUnique({ where: { slug } });
  if (existingOrg) {
    return NextResponse.json(
      { error: "That business code is already taken. Please choose another." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(adminPassword);

  let org, user;
  try {
    ({ org, user } = await db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: businessName, slug },
      });
      const user = await tx.user.create({
        data: {
          orgId: org.id,
          username: adminUsername,
          passwordHash,
          name: adminName,
          role: "ADMIN",
        },
      });
      return { org, user };
    }));
  } catch {
    return NextResponse.json(
      { error: "That business code is already taken. Please choose another." },
      { status: 409 }
    );
  }

  const session = await getSession();
  session.userId = user.id;
  session.orgId = org.id;
  session.role = user.role;
  session.name = user.name;
  await session.save();

  return NextResponse.json({ redirectTo: ROLE_HOME[user.role] });
}
