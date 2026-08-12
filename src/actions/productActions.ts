"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { parseSpreadsheet, findColumn } from "@/lib/csv";

const PRODUCT_ALIASES = {
  name: ["item", "item name", "product", "product name", "name"],
  company: ["company", "company name", "manufacturer", "brand"],
  unit: ["unit", "uom", "pack", "pack size"],
  price: ["price", "rate", "unit price", "selling price"],
  mrp: ["mrp", "m.r.p", "m.r.p.", "max retail price"],
  taxPercent: ["tax", "tax %", "gst", "gst %", "igst"],
  scheme: ["scheme"],
  composition: ["composition", "salt", "salt composition", "molecule"],
  stock: ["stock", "qty", "quantity", "stock qty"],
};

export async function createProduct(
  _prevState: { ok: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const name = (formData.get("name") as string | null)?.trim();
  const company = (formData.get("company") as string | null)?.trim() || undefined;
  const unit = (formData.get("unit") as string | null)?.trim() || undefined;
  const scheme = (formData.get("scheme") as string | null)?.trim() || undefined;
  const composition = (formData.get("composition") as string | null)?.trim() || undefined;
  const priceRaw = formData.get("price") as string | null;
  const price = priceRaw ? Number(priceRaw) : NaN;
  const mrpRaw = formData.get("mrp") as string | null;
  const mrp = mrpRaw ? Number(mrpRaw) : undefined;
  const taxPercentRaw = formData.get("taxPercent") as string | null;
  const taxPercent = taxPercentRaw ? Number(taxPercentRaw) : undefined;
  const stockRaw = formData.get("stock") as string | null;
  const stock = stockRaw ? Number(stockRaw) : undefined;

  if (!name) return { ok: false, error: "Product name is required." };
  if (!priceRaw || Number.isNaN(price) || price < 0) {
    return { ok: false, error: "A valid rate is required." };
  }

  const existing = await db.product.findFirst({ where: { name } });
  if (existing) return { ok: false, error: "That product already exists." };

  await db.product.create({
    data: { orgId: session.orgId, name, company, unit, price, mrp, taxPercent, scheme, composition, stock },
  });

  revalidatePath("/admin/products");
  revalidatePath("/shop/products");
  return { ok: true };
}

export async function importProducts(
  _prevState: { ok: boolean; error?: string; rowCount?: number } | null,
  formData: FormData,
): Promise<{ ok: boolean; error?: string; rowCount?: number }> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { ok: false, error: "Please choose a file to upload." };
  }

  const buffer = await file.arrayBuffer();
  const rows = parseSpreadsheet(file.name, buffer);

  const parsedRows: Array<{
    name: string;
    company?: string;
    unit?: string;
    price: number;
    mrp?: number;
    taxPercent?: number;
    scheme?: string;
    composition?: string;
    stock?: number;
  }> = [];
  for (const row of rows) {
    const name = findColumn(row, PRODUCT_ALIASES.name);
    const priceRaw = findColumn(row, PRODUCT_ALIASES.price);
    if (!name || priceRaw === undefined) continue;
    const price = Number(priceRaw);
    if (Number.isNaN(price)) continue;

    const company = findColumn(row, PRODUCT_ALIASES.company);
    const unit = findColumn(row, PRODUCT_ALIASES.unit);
    const mrpRaw = findColumn(row, PRODUCT_ALIASES.mrp);
    const taxPercentRaw = findColumn(row, PRODUCT_ALIASES.taxPercent);
    const scheme = findColumn(row, PRODUCT_ALIASES.scheme);
    const composition = findColumn(row, PRODUCT_ALIASES.composition);
    const stockRaw = findColumn(row, PRODUCT_ALIASES.stock);
    parsedRows.push({
      name,
      company,
      unit,
      price,
      mrp: mrpRaw ? Number(mrpRaw) : undefined,
      taxPercent: taxPercentRaw ? Number(taxPercentRaw) : undefined,
      scheme,
      composition,
      stock: stockRaw ? Number(stockRaw) : undefined,
    });
  }

  if (parsedRows.length === 0) {
    return { ok: false, error: "No item/price rows could be read from that file." };
  }

  const batch = await db.importBatch.create({
    data: {
      orgId: session.orgId,
      importType: "PRODUCTS",
      fileName: file.name,
      rowCount: 0,
      uploadedById: session.userId as string,
    },
  });

  let imported = 0;
  for (const row of parsedRows) {
    await db.product.upsert({
      where: { orgId_name: { orgId: session.orgId, name: row.name } },
      update: {
        company: row.company,
        unit: row.unit,
        price: row.price,
        mrp: row.mrp,
        taxPercent: row.taxPercent,
        scheme: row.scheme,
        composition: row.composition,
        stock: row.stock,
        active: true,
      },
      create: {
        orgId: session.orgId,
        name: row.name,
        company: row.company,
        unit: row.unit,
        price: row.price,
        mrp: row.mrp,
        taxPercent: row.taxPercent,
        scheme: row.scheme,
        composition: row.composition,
        stock: row.stock,
      },
    });
    imported += 1;
  }

  await db.importBatch.update({ where: { id: batch.id }, data: { rowCount: imported } });

  revalidatePath("/admin/products");
  revalidatePath("/shop/products");
  return { ok: true, rowCount: imported };
}

export async function toggleProductActive(productId: string, active: boolean): Promise<void> {
  const session = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(session.orgId);

  await db.product.update({ where: { id: productId }, data: { active } });

  revalidatePath("/admin/products");
  revalidatePath("/shop/products");
}
