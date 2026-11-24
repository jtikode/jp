import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { getStartOfIstDayUtc } from "@/lib/istTime";
import { storeLabel } from "@/lib/storeLabel";
import type { LedgerRow, PartyInfo, ProductInfo, ReportCtx, SaleLine } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

// The uploaded statement gives every bill a due date equal to its invoice date,
// so it carries no real credit terms. Until it does, a bill counts as due this
// many days after its invoice date. Change it here to move every overdue figure.
export const DEFAULT_CREDIT_DAYS = 30;

const num = (d: unknown): number => (d == null ? 0 : Number(d));

// Loads each data set once per request, on first use, so a report that only
// needs the outstanding list never reads the product table.
export function createReportCtx(orgId: string): ReportCtx {
  const db = getOrgScopedDb(orgId);
  const today = getStartOfIstDayUtc();
  const memo = new Map<string, Promise<unknown>>();
  const once = <T>(key: string, load: () => Promise<T>): Promise<T> => {
    if (!memo.has(key)) memo.set(key, load());
    return memo.get(key) as Promise<T>;
  };

  const daysBetween = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / DAY_MS);

  const allParties = () =>
    once("allParties", async (): Promise<PartyInfo[]> => {
      const stores = await db.store.findMany({
        select: { id: true, name: true, externalCode: true, phone: true, address: true, route: { select: { name: true } } },
      });
      return stores.map((s) => ({
        id: s.id,
        name: s.name,
        code: s.externalCode ?? "",
        label: storeLabel(s.name, s.externalCode),
        route: s.route?.name ?? "",
        phone: s.phone ?? "",
        address: s.address ?? "",
      }));
    });

  const products = () =>
    once("products", async (): Promise<ProductInfo[]> => {
      const rows = await db.product.findMany({
        select: { id: true, name: true, company: true, price: true, purchaseRate: true, mrp: true, stock: true, nearestExpiry: true, active: true },
      });
      return rows.map((p) => ({
        id: p.id,
        name: p.name,
        company: p.company ?? "(no company)",
        price: num(p.price),
        purchaseRate: p.purchaseRate == null ? null : num(p.purchaseRate),
        mrp: p.mrp == null ? null : num(p.mrp),
        stock: p.stock,
        nearestExpiry: p.nearestExpiry,
        active: p.active,
      }));
    });

  return {
    db,
    orgId,
    today,
    allParties,
    products,
    parties: () => once("parties", async () => new Map((await allParties()).map((p) => [p.id, p]))),
    ledger: () =>
      once("ledger", async (): Promise<LedgerRow[]> => {
        const rows = await db.ledgerEntry.findMany({
          select: { storeId: true, invoiceNo: true, invoiceDate: true, dueDate: true, amount: true, outstandingAmount: true },
        });
        return rows.map((r) => {
          // A due date that equals the invoice date means "no terms given".
          const hasTerms = r.dueDate != null && r.invoiceDate != null && r.dueDate.getTime() !== r.invoiceDate.getTime();
          const dueDate = hasTerms
            ? r.dueDate
            : r.invoiceDate
              ? new Date(r.invoiceDate.getTime() + DEFAULT_CREDIT_DAYS * DAY_MS)
              : r.dueDate;
          return {
            storeId: r.storeId,
            invoiceNo: r.invoiceNo ?? "",
            invoiceDate: r.invoiceDate,
            dueDate,
            amount: num(r.amount),
            outstanding: num(r.outstandingAmount),
            ageDays: r.invoiceDate ? daysBetween(r.invoiceDate, today) : null,
            overdueDays: dueDate ? daysBetween(dueDate, today) : null,
          };
        });
      }),
    sales: () =>
      once("sales", async (): Promise<SaleLine[]> => {
        const [lines, prods] = await Promise.all([
          db.orderItem.findMany({
            where: { order: { status: { not: "CANCELLED" } } },
            select: {
              productId: true,
              productName: true,
              quantity: true,
              lineTotal: true,
              order: { select: { storeId: true, createdAt: true } },
            },
          }),
          products(),
        ]);
        const company = new Map(prods.map((p) => [p.id, p.company]));
        return lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          company: company.get(l.productId) ?? "(no company)",
          storeId: l.order.storeId,
          quantity: l.quantity,
          value: num(l.lineTotal),
          orderedAt: l.order.createdAt,
        }));
      }),
  };
}
