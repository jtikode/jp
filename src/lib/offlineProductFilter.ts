"use client";

import { cascadingProductSearch } from "@/lib/fuzzySearch";
import type { CatalogProduct } from "@/lib/productCatalog";
import type { SearchProductItem } from "@/lib/productSearch";

export interface OfflineSearchParams {
  query?: string;
  company?: string;
  salt?: string;
  offset: number;
  limit: number;
}

export interface OfflineSearchResult {
  products: SearchProductItem[];
  hasMore: boolean;
  companies: string[];
  salts: string[];
}

const MAX_ALTERNATIVES = 8;

// Same filtering behavior as searchProductCatalog (server-side) minus the
// data that only the server can compute freshly — hot-selling rank,
// Wednesday deal availability, expiry matches. Those are omitted rather
// than shown stale/wrong while offline.
export function filterOfflineCatalog(
  catalog: CatalogProduct[],
  params: OfflineSearchParams,
): OfflineSearchResult {
  const sorted = [...catalog].sort(
    (a, b) => (a.company ?? "").localeCompare(b.company ?? "") || a.name.localeCompare(b.name),
  );

  const companies = [...new Set(sorted.map((p) => p.company).filter((c): c is string => !!c))].sort();
  const salts = [...new Set(sorted.map((p) => p.composition).filter((c): c is string => !!c))].sort();

  const byComposition = new Map<string, typeof sorted>();
  for (const p of sorted) {
    const key = p.composition?.trim().toLowerCase();
    if (!key) continue;
    const group = byComposition.get(key) ?? [];
    group.push(p);
    byComposition.set(key, group);
  }

  let scoped = sorted;
  if (params.company) scoped = scoped.filter((p) => p.company === params.company);
  if (params.salt) scoped = scoped.filter((p) => p.composition === params.salt);

  const exactQuery = (params.query ?? "").trim().toLowerCase();
  const stockVisible = scoped.filter(
    (p) => p.stock == null || p.stock > 0 || (exactQuery.length > 0 && p.name.trim().toLowerCase() === exactQuery),
  );

  const filtered = cascadingProductSearch(stockVisible, params.query ?? "", (p) => p.name, (p) => p.composition);

  const pageItems = filtered.slice(params.offset, params.offset + params.limit);
  const hasMore = filtered.length > params.offset + params.limit;

  const products: SearchProductItem[] = pageItems.map((p) => {
    const compKey = p.composition?.trim().toLowerCase();
    const alternatives = compKey
      ? (byComposition.get(compKey) ?? [])
          .filter((alt) => alt.id !== p.id)
          .slice(0, MAX_ALTERNATIVES)
          .map((alt) => ({ id: alt.id, name: alt.name, company: alt.company, price: alt.price, stock: alt.stock }))
      : [];

    return {
      id: p.id,
      name: p.name,
      company: p.company,
      unit: p.unit,
      price: p.price,
      mrp: p.mrp,
      taxPercent: p.taxPercent,
      scheme: p.scheme,
      composition: p.composition,
      stock: p.stock,
      hot: false,
      deal: null,
      expiryDate: null,
      alternatives,
    };
  });

  return { products, hasMore, companies, salts };
}
