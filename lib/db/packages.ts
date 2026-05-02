import { getSupabaseClient } from "@/lib/supabase";
import type { Package, PackageCategory } from "@/lib/types";

// ── Actual Supabase table columns ────────────────────────
interface PackageTemplateRow {
  id: number;
  name: string;
  type: "adult" | "junior";
  session_count: number;
  days_valid: number;
  price: number;
  extra_session_enabled: boolean;
  extra_session_limit: number;
  extra_session_price: number;
  is_active: boolean;
}

function rowToPackage(row: PackageTemplateRow): Package {
  const category: PackageCategory =
    row.type === "adult" ? "Adult" : "Junior";
  return {
    id: String(row.id),
    name: row.name,
    category,
    price: row.price,
    sessions: row.session_count,
    durationDays: row.days_valid,
    extraEnabled: row.extra_session_enabled,
    extraLimit: row.extra_session_limit,
    extraPrice: row.extra_session_price,
    isActive: row.is_active,
  };
}

function packageToRow(pkg: Omit<Package, "id" | "isActive">) {
  return {
    name: pkg.name,
    type: pkg.category.toLowerCase() as "adult" | "junior",
    session_count: pkg.sessions,
    days_valid: pkg.durationDays,
    price: pkg.price,
    extra_session_enabled: pkg.extraEnabled,
    extra_session_limit: pkg.extraLimit,
    extra_session_price: pkg.extraPrice,
  };
}

// ── READ ─────────────────────────────────────────────────
export async function fetchPackages(): Promise<Package[]> {
  const { data, error } = await getSupabaseClient()
    .from("package_templates")
    .select("*")
    .order("type")
    .order("price");

  if (error) throw new Error(error.message);
  return (data as PackageTemplateRow[]).map(rowToPackage);
}

// ── CREATE ───────────────────────────────────────────────
export async function createPackage(pkg: Omit<Package, "id" | "isActive">): Promise<Package> {
  const { data, error } = await getSupabaseClient()
    .from("package_templates")
    .insert(packageToRow(pkg))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToPackage(data as PackageTemplateRow);
}

// ── UPDATE ───────────────────────────────────────────────
export async function updatePackage(id: string, pkg: Omit<Package, "id" | "isActive">): Promise<Package> {
  const { data, error } = await getSupabaseClient()
    .from("package_templates")
    .update(packageToRow(pkg))
    .eq("id", Number(id))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToPackage(data as PackageTemplateRow);
}

// ── TOGGLE ACTIVE ─────────────────────────────────────────
export async function togglePackageActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("package_templates")
    .update({ is_active: isActive })
    .eq("id", Number(id));

  if (error) throw new Error(error.message);
}

// ── CHECK DELETABLE ───────────────────────────────────────
// A package template is deletable only if no user_packages reference it
export async function checkPackageTemplateDeletable(id: string): Promise<boolean> {
  const { count, error } = await getSupabaseClient()
    .from("user_packages")
    .select("id", { count: "exact", head: true })
    .eq("template_id", Number(id));

  if (error) throw new Error(error.message);
  return (count ?? 0) === 0;
}

// ── DELETE ────────────────────────────────────────────────
export async function deletePackage(id: string): Promise<void> {
  const deletable = await checkPackageTemplateDeletable(id);
  if (!deletable) {
    throw new Error("ไม่สามารถลบได้: มีผู้ใช้ที่ใช้แพ็กเกจนี้อยู่ ให้ปิดใช้งานแทน");
  }

  const { error } = await getSupabaseClient()
    .from("package_templates")
    .delete()
    .eq("id", Number(id));

  if (error) throw new Error(error.message);
}
