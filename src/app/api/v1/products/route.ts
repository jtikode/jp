import { apiHandler } from "@/lib/apiHandler";
import { fetchProductsPage } from "@/actions/catalogSearchActions";

export function GET(request: Request) {
  return apiHandler(() => {
    const q = new URL(request.url).searchParams;
    return fetchProductsPage({
      query: q.get("query") ?? undefined,
      company: q.get("company") ?? undefined,
      salt: q.get("salt") ?? undefined,
      hotOnly: q.get("hotOnly") === "1",
      offset: Math.max(0, Number(q.get("offset")) || 0),
      limit: Math.min(100, Math.max(1, Number(q.get("limit")) || 40)),
    });
  });
}
