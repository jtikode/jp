import { NextResponse } from "next/server";
import { z } from "zod";
import { resend, FROM_EMAIL } from "@/lib/resend";

// Job applications from the careers page on jpkop.in. The page is a separate
// static site, so this endpoint allows that origin and nothing else, checks the
// form, and emails it to the company inbox. No applicant data is stored.

const ALLOWED_ORIGINS = ["https://www.jpkop.in", "https://jpkop.in"];
const CAREERS_EMAIL = process.env.CAREERS_NOTIFICATION_EMAIL ?? "jptraderskop@gmail.com";

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  city: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(80),
  experience: z.string().trim().max(60).optional(),
  link: z.string().trim().max(300).optional(),
  message: z.string().trim().max(2000).optional(),
  // Hidden field: real people leave it empty, form-filling bots do not.
  website: z.string().max(200).optional(),
});

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

// Five applications an hour per address is plenty for a real person.
const hits = new Map<string, number[]>();
function tooMany(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 5;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(request.headers.get("origin")) });
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const headers = corsHeaders(origin);
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
    return NextResponse.json({ error: "Not allowed." }, { status: 403, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please fill in the form again." }, { status: 400, headers });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check your name, phone number and city, then try again." }, { status: 400, headers });
  }
  const d = parsed.data;
  // A filled hidden field means a bot: answer as if it worked, send nothing.
  if (d.website) return NextResponse.json({ ok: true }, { headers });

  const ip = (request.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  if (tooMany(ip)) {
    return NextResponse.json({ error: "Too many applications from this connection. Please try again later, or message us on WhatsApp." }, { status: 429, headers });
  }

  if (!resend) {
    return NextResponse.json({ error: "We could not send your application right now. Please message us on WhatsApp." }, { status: 503, headers });
  }

  const rows: [string, string][] = [
    ["Name", d.name],
    ["Phone / WhatsApp", d.phone],
    ["Email", d.email || "(not given)"],
    ["City", d.city],
    ["Applying for", d.role],
    ["Experience", d.experience || "(not given)"],
    ["Sample work link", d.link || "(none)"],
    ["Message", d.message || "(none)"],
  ];
  const html = `<div style="font-family:Arial,sans-serif;max-width:520px">
    <h2 style="margin:0 0 8px">New job application: ${esc(d.role)}</h2>
    <p style="color:#64748b;margin:0 0 12px">Sent from the careers page on jpkop.in</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows
      .map(([k, v]) => `<tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;color:#475569;width:150px;vertical-align:top"><b>${esc(k)}</b></td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;white-space:pre-wrap">${esc(v)}</td></tr>`)
      .join("")}</table></div>`;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: CAREERS_EMAIL,
    replyTo: d.email || undefined,
    subject: `Job application: ${d.role} - ${d.name} (${d.city})`,
    html,
  });
  if (error) {
    console.error("careers email failed", error);
    return NextResponse.json({ error: "We could not send your application right now. Please message us on WhatsApp." }, { status: 502, headers });
  }
  return NextResponse.json({ ok: true }, { headers });
}
