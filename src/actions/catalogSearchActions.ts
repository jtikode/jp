"use server";

import { assertStoreSession } from "@/lib/retailerPermissions";
import { searchProductCatalog, type ProductSearchResult } from "@/lib/productSearch";

export async function fetchProductsPage(params: {
  query?: string;
  company?: string;
  salt?: string;
  hotOnly?: boolean;
  offset: number;
  limit: number;
}): Promise<ProductSearchResult> {
  const session = await assertStoreSession();
  return searchProductCatalog(session.orgId, session.storeId, params);
}
