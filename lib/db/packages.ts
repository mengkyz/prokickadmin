import { supabase } from "@/lib/supabase";
import type { Package } from "@/lib/types";

// ── DB row type (snake_case columns in Supabase) ──────────
interface PackageTemplateRow {
  id: string;
  name: string;
  category: "Adult" | "Junior";
  price: number;
  sessions: number;
  duration_days: number;
  extra_limit: number;
  extra_price: number;
  description: string | null;
  created_at?: string;
}

function rowToPackage(row: PackageTemplateRow): Package {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: row.price,
    sessions: row.sessions,
    durationDays: row.duration_days,
    extraLimit: row.extra_limit,
    extraPrice: row.extra_price,
    description: row.description ?? undefined,
  };
}

function packageToRow(pkg: Omit<Package, "id">): Omit<PackageTemplateRow, "id" | "created_at"> {
  return {
    name: pkg.name,
    category: pkg.category,
    price: pkg.price,
    sessions: pkg.sessions,
    duration_days: pkg.durationDays,
    extra_limit: pkg.extraLimit,
    extra_price: pkg.extraPrice,
    description: pkg.description ?? null,
  };
}

// ── READ ─────────────────────────────────────────────────
export async function fetchPackages(): Promise<Package[]> {
  const { data, error } = await supabase
    .from("package_templates")
    .select("*")
    .order("category")
    .order("price");

  if (error) throw new Error(error.message);
  return (data as PackageTemplateRow[]).map(rowToPackage);
}

// ── CREATE ───────────────────────────────────────────────
export async function createPackage(pkg: Omit<Package, "id">): Promise<Package> {
  const { data, error } = await supabase
    .from("package_templates")
    .insert(packageToRow(pkg))
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToPackage(data as PackageTemplateRow);
}

// ── UPDATE ───────────────────────────────────────────────
export async function updatePackage(id: string, pkg: Omit<Package, "id">): Promise<Package> {
  const { data, error } = await supabase
    .from("package_templates")
    .update(packageToRow(pkg))
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToPackage(data as PackageTemplateRow);
}

// ── DELETE ───────────────────────────────────────────────
export async function deletePackage(id: string): Promise<void> {
  const { error } = await supabase
    .from("package_templates")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
