"use server";

import { revalidatePath } from "next/cache";
import { getOrgScopedDb } from "@/lib/orgScopedDb";
import { assertRole } from "@/lib/permissions";
import { normalizeName } from "@/lib/normalizeName";
import { clearStoreRateCache } from "@/lib/storeRates";

const ALLOWED_PERCENTS = [10, 15];

export interface SpecialShop {
  id: string;
  name: string;
  code: string | null;
  address: string;
  percent: number;
}

export interface MatchCandidate {
  id: string;
  name: string;
  code: string | null;
  address: string;
}

export interface LineMatch {
  line: string;
  status: "matched" | "ambiguous" | "none";
  matches: MatchCandidate[];
}

const digits = (s: string) => s.replace(/\D/g, "");

/** Every shop currently on a special rate. */
export async function listSpecialShops(): Promise<SpecialShop[]> {
  const me = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(me.orgId);
  const stores = await db.store.findMany({
    where: { specialRatePercent: { not: null } },
    select: { id: true, name: true, externalCode: true, address: true, specialRatePercent: true },
    orderBy: { name: "asc" },
  });
  return stores.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.externalCode,
    address: s.address,
    percent: Number(s.specialRatePercent),
  }));
}

/** Works out which shop each pasted line means: by party code, phone number or name. */
export async function previewSpecialShops(rawList: string): Promise<LineMatch[]> {
  const me = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(me.orgId);
  const lines = [...new Set(rawList.split(/\r?\n/).map((l) => l.trim()).filter(Boolean))].slice(0, 500);
  if (lines.length === 0) return [];

  const stores = await db.store.findMany({
    select: { id: true, name: true, externalCode: true, address: true, phone: true },
  });
  const byName = stores.map((s) => ({ s, key: normalizeName(s.name) }));

  const cand = (s: (typeof stores)[number]): MatchCandidate => ({ id: s.id, name: s.name, code: s.externalCode, address: s.address });

  return lines.map((line): LineMatch => {
    const d = digits(line);
    // 1. party code, exactly
    const byCode = stores.filter((s) => s.externalCode && s.externalCode.trim().toLowerCase() === line.toLowerCase());
    if (byCode.length === 1) return { line, status: "matched", matches: [cand(byCode[0])] };
    // 2. a phone number (last 10 digits)
    if (d.length >= 10) {
      const last10 = d.slice(-10);
      const byPhone = stores.filter((s) => s.phone && digits(s.phone).slice(-10) === last10);
      if (byPhone.length === 1) return { line, status: "matched", matches: [cand(byPhone[0])] };
      if (byPhone.length > 1) return { line, status: "ambiguous", matches: byPhone.slice(0, 6).map(cand) };
    }
    // 3. the name: same name first, then names that contain it
    const key = normalizeName(line);
    if (!key) return { line, status: "none", matches: [] };
    const exact = byName.filter((x) => x.key === key);
    if (exact.length === 1) return { line, status: "matched", matches: [cand(exact[0].s)] };
    if (exact.length > 1) return { line, status: "ambiguous", matches: exact.slice(0, 6).map((x) => cand(x.s)) };
    const partial = byName.filter((x) => x.key.includes(key) || key.includes(x.key));
    if (partial.length === 1) return { line, status: "matched", matches: [cand(partial[0].s)] };
    if (partial.length > 1) return { line, status: "ambiguous", matches: partial.slice(0, 6).map((x) => cand(x.s)) };
    return { line, status: "none", matches: [] };
  });
}

/** Puts the chosen shops on purchase rate + percent (10 or 15). */
export async function applySpecialRate(storeIds: string[], percent: number): Promise<{ ok: boolean; error?: string; updated?: number }> {
  const me = await assertRole(["ADMIN"]);
  if (!ALLOWED_PERCENTS.includes(percent)) return { ok: false, error: "Choose 10% or 15%." };
  const ids = [...new Set(storeIds)].slice(0, 1000);
  if (ids.length === 0) return { ok: false, error: "Pick at least one shop." };
  const db = getOrgScopedDb(me.orgId);
  const res = await db.store.updateMany({ where: { id: { in: ids } }, data: { specialRatePercent: percent } });
  clearStoreRateCache();
  revalidatePath("/team/admin/special-rates");
  revalidatePath("/shop");
  return { ok: true, updated: res.count };
}

/** Takes a shop back to the normal rate list. */
export async function removeSpecialRate(storeId: string): Promise<{ ok: boolean }> {
  const me = await assertRole(["ADMIN"]);
  const db = getOrgScopedDb(me.orgId);
  await db.store.updateMany({ where: { id: storeId }, data: { specialRatePercent: null } });
  clearStoreRateCache();
  revalidatePath("/team/admin/special-rates");
  revalidatePath("/shop");
  return { ok: true };
}
