import { getSupabaseClient } from "@/lib/supabase";

// ── Avatar helper ─────────────────────────────────────────
const AVATAR_COLORS = ["#e57373","#81c784","#64b5f6","#ffd54f","#ff8a65","#ce93d8","#4db6ac","#f06292","#a1887f","#78909c"];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
function avatarInitial(name: string) { return (name || "?").slice(0, 2).toUpperCase(); }

// ── DB row shapes ─────────────────────────────────────────
interface VenueRow {
  id: string;
  created_at: string;
  name: string;
  description: string;
  capacity: number;
  is_active: boolean;
}

interface CoachRow {
  id: string;
  created_at: string;
  name: string;
  role: string;
  phone: string;
  is_active: boolean;
}

// ── Public types ──────────────────────────────────────────
export interface AdminVenue {
  id: string;
  name: string;
  description: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export interface AdminCoach {
  id: string;
  name: string;
  role: string;
  phone: string;
  isActive: boolean;
  avatarColor: string;
  avatarInitial: string;
  createdAt: string;
}

export interface VenueInput {
  name: string;
  description?: string;
  capacity?: number;
}

export interface CoachInput {
  name: string;
  role?: string;
  phone?: string;
}

// ── Converters ────────────────────────────────────────────
function rowToVenue(row: VenueRow): AdminVenue {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    capacity: row.capacity,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

function rowToCoach(row: CoachRow): AdminCoach {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    phone: row.phone,
    isActive: row.is_active,
    avatarColor: avatarColor(row.name),
    avatarInitial: avatarInitial(row.name),
    createdAt: row.created_at,
  };
}

// ── VENUES ────────────────────────────────────────────────

/** Fetch all venues. Pass includeInactive=true to also get deactivated ones. */
export async function fetchVenues(includeInactive = false): Promise<AdminVenue[]> {
  let query = getSupabaseClient()
    .from("venues")
    .select("*")
    .order("created_at", { ascending: true });

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as VenueRow[]).map(rowToVenue);
}

export async function createVenue(input: VenueInput): Promise<AdminVenue> {
  const { data, error } = await getSupabaseClient()
    .from("venues")
    .insert({
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      capacity: input.capacity ?? 20,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToVenue(data as VenueRow);
}

export async function updateVenue(id: string, input: VenueInput): Promise<AdminVenue> {
  const { data, error } = await getSupabaseClient()
    .from("venues")
    .update({
      name: input.name.trim(),
      description: input.description?.trim() ?? "",
      capacity: input.capacity ?? 20,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToVenue(data as VenueRow);
}

/** Soft-delete: sets is_active = false (does NOT delete the row — preserves class history) */
export async function toggleVenueActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("venues")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ── COACHES ───────────────────────────────────────────────

/** Fetch all coaches. Pass includeInactive=true to also get deactivated ones. */
export async function fetchCoaches(includeInactive = false): Promise<AdminCoach[]> {
  let query = getSupabaseClient()
    .from("coaches")
    .select("*")
    .order("created_at", { ascending: true });

  if (!includeInactive) query = query.eq("is_active", true);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as CoachRow[]).map(rowToCoach);
}

export async function createCoach(input: CoachInput): Promise<AdminCoach> {
  const { data, error } = await getSupabaseClient()
    .from("coaches")
    .insert({
      name: input.name.trim(),
      role: input.role?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
      is_active: true,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToCoach(data as CoachRow);
}

export async function updateCoach(id: string, input: CoachInput): Promise<AdminCoach> {
  const { data, error } = await getSupabaseClient()
    .from("coaches")
    .update({
      name: input.name.trim(),
      role: input.role?.trim() ?? "",
      phone: input.phone?.trim() ?? "",
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToCoach(data as CoachRow);
}

/** Soft-delete: sets is_active = false (does NOT delete the row — preserves class history) */
export async function toggleCoachActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("coaches")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) throw new Error(error.message);
}
