import { NextResponse } from "next/server";

// Wraps a mobile-API handler: an auth failure becomes 401, anything else 500,
// so the app always gets JSON it can act on instead of an HTML error page.
export async function apiHandler(fn: () => Promise<unknown>): Promise<NextResponse> {
  try {
    return NextResponse.json(await fn());
  } catch (err) {
    if (err instanceof Error && err.message === "Not authorized.") {
      return NextResponse.json({ error: "Not authorized." }, { status: 401 });
    }
    console.error("api/v1 error:", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
