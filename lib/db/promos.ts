import { getSupabaseClient } from "@/lib/supabase";
import type { PromoCode, PromoStatus, DiscountType } from "@/lib/types";

// ── Supabase table columns ────────────────────────────────
interface PromoCodeRow {
  id: string;
  code: string;
  discount: number;
  discount_type: "percent" | "fixed";
  used_count: number;
  usage_limit: number;
  expires_at: string;     // ISO date: "YYYY-MM-DD"
  is_active: boolean;
  created_at?: string;
}

function computeStatus(row: PromoCodeRow): PromoStatus {
  if (!row.is_active) return "Inactive";
  const daysLeft = (new Date(row.expires_at).getTime() - Date.now()) / 86_400_000;
  if (daysLeft <= 7) return "Expiring";
  return "Active";
}

function rowToPromo(row: PromoCodeRow): PromoCode {
  return {
    id: row.id,
    code: row.code,
    discount: row.discount,
    discountType: row.discount_type as DiscountType,
    usedCount: row.used_count,
    usageLimit: row.usage_limit,
    expiresAt: row.expires_at,   // kept as ISO for input[type=date]
    status: computeStatus(row),
  };
}

function promoToRow(p: Omit<PromoCode, "id" | "usedCount" | "status"> & { isActive: boolean }) {
  return {
    code: p.code.toUpperCase(),
    discount: p.discount,
    discount_type: p.discountType,
    usage_limit: p.usageLimit,
    expires_at: p.expiresAt,
    is_active: p.isActive,
  };
}

// ── READ ─────────────────────────────────────────────────
export async function fetchPromos(): Promise<PromoCode[]> {
  const { data, error } = await getSupabaseClient()
    .from("promo_codes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as PromoCodeRow[]).map(rowToPromo);
}

// ── CREATE ───────────────────────────────────────────────
export async function createPromo(
  p: Omit<PromoCode, "id" | "usedCount" | "status"> & { isActive: boolean }
): Promise<PromoCode> {
  const { data, error } = await getSupabaseClient()
    .from("promo_codes")
    .insert(promoToRow(p))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToPromo(data as PromoCodeRow);
}

// ── UPDATE ───────────────────────────────────────────────
export async function updatePromo(
  id: string,
  p: Omit<PromoCode, "id" | "usedCount" | "status"> & { isActive: boolean }
): Promise<PromoCode> {
  const { data, error } = await getSupabaseClient()
    .from("promo_codes")
    .update(promoToRow(p))
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToPromo(data as PromoCodeRow);
}

// ── TOGGLE ACTIVE ─────────────────────────────────────────
export async function togglePromoActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("promo_codes")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ── DELETABILITY CHECK ────────────────────────────────────
/** Batch-check which promo codes have never been used (used_count = 0 → safe to delete) */
export async function checkPromosDeletable(ids: string[]): Promise<Record<string, boolean>> {
  if (ids.length === 0) return {};
  const { data } = await getSupabaseClient()
    .from("promo_codes")
    .select("id, used_count")
    .in("id", ids);
  const result: Record<string, boolean> = {};
  for (const row of (data ?? []) as { id: string; used_count: number }[]) {
    result[row.id] = row.used_count === 0;
  }
  return result;
}

// ── DELETE ───────────────────────────────────────────────
/** Hard-delete a promo code — only allowed if it has never been used */
export async function deletePromo(id: string): Promise<void> {
  const { data } = await getSupabaseClient()
    .from("promo_codes")
    .select("used_count")
    .eq("id", id)
    .single();
  if ((data as { used_count: number } | null)?.used_count ?? 0 > 0) {
    throw new Error("ไม่สามารถลบได้: โค้ดนี้ถูกใช้งานแล้ว");
  }

  const { error } = await getSupabaseClient()
    .from("promo_codes")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
