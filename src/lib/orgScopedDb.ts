import { db } from "@/lib/db";

// Every model that carries an orgId column — join tables included, so a
// query's `where` clause never has to reason about more than one business's
// data through a relation chain. Kept in sync with prisma/schema.prisma.
const TENANT_MODELS = new Set([
  "user",
  "route",
  "routeAssignment",
  "store",
  "routeStore",
  "visit",
  "attendance",
  "telecallerLog",
  "warehouseTask",
  "warehouseTaskOccurrence",
  "stockItem",
  "stockCount",
  "ledgerEntry",
  "purchaseHistoryItem",
  "incentiveItem",
  "expiryItem",
  "target",
  "telecallerParty",
  "importBatch",
  "product",
  "order",
  "orderItem",
  "shopBanner",
  "loyaltyTier",
  "requestedProduct",
]);

const WHERE_SCOPED_OPERATIONS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
  "count",
  "aggregate",
  "groupBy",
]);

// Wraps the shared Prisma client so every query against a tenant-owned model
// is automatically scoped to one business — a missed `where: { orgId }` on
// any of the ~150 call sites across the app becomes impossible by
// construction instead of relying on each site to remember it by hand.
export function getOrgScopedDb(orgId: string) {
  return db.$extends({
    name: "orgScoped",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const call = query as (args: unknown) => Promise<unknown>;
          if (!model) return call(args);
          const key = model[0].toLowerCase() + model.slice(1);
          if (!TENANT_MODELS.has(key)) return call(args);

          const a = args as Record<string, unknown>;

          if (operation === "create") {
            a.data = { ...(a.data as object), orgId };
          } else if (operation === "createMany" || operation === "createManyAndReturn") {
            const data = a.data;
            a.data = Array.isArray(data)
              ? data.map((row) => ({ ...row, orgId }))
              : { ...(data as object), orgId };
          } else if (operation === "upsert") {
            a.where = { ...(a.where as object), orgId };
            a.create = { ...(a.create as object), orgId };
          } else if (WHERE_SCOPED_OPERATIONS.has(operation)) {
            a.where = { ...((a.where as object) ?? {}), orgId };
          }

          return call(a);
        },
      },
    },
  });
}

export type OrgScopedDb = ReturnType<typeof getOrgScopedDb>;
