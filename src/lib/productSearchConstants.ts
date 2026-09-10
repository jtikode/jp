// Split out from productSearch.ts (which pulls in Prisma/pg) so client
// components can import this constant without bundling server-only code.
export const PRODUCT_PAGE_SIZE = 40;
