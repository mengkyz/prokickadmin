import { getSupabaseClient } from "@/lib/supabase";

// ── Thai locale helpers ───────────────────────────────────
const TH_DAYS = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
const AVATAR_COLORS = ["#e57373", "#81c784", "#64b5f6", "#ffd54f", "#ff8a65", "#ce93d8", "#4db6ac", "#f06292"];

function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function toHHMM(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function toDayLabel(iso: string) {
  const d = new Date(iso);
  const dayName = TH_DAYS[d.getDay()];
  const dateStr = d.toLocaleDateString("th-TH", { day: "2-digit", month: "short" });
  return `${dayName} ${dateStr}`;
}

// ── Database row shapes ───────────────────────────────────
interface ClassRow {
  id: string;
  start_time: string;
  end_time: string;
  max_capacity: number;
  current_bookings: number;
  location: string;
  coach: string | null;
  status: string | null;
  package_filter: string | null;
  notes: string | null;
  created_at: string;
}

interface BookingRow {
  id: string;
  user_id: string;
  child_id: string | null;
  package_id: string;
  class_id: string;
  class_date: string;
  status: string;
  standby_order: number | null;
  attendance_status: string | null;
  created_at: string;
  // joined
  profiles?: { full_name: string; nickname: string | null; phone_number: string | null } | null;
  child_profiles?: { nickname: string } | null;
}

// ── Public types consumed by UI ───────────────────────────
export type ClassStatus = "open" | "full" | "waitlist" | "completed" | "cancelled";
export type PackageFilter = "all" | "adult" | "junior";
export type AttendanceStatus = "confirmed" | "attended" | "no-show" | "cancelled" | "waitlist";

export interface AdminClass {
  id: string;
  date: string;          // "YYYY-MM-DD"
  dayLabel: string;      // "จันทร์ 15 มี.ค."
  timeStart: string;     // "HH:MM"
  timeEnd: string;       // "HH:MM"
  venue: string;
  coach: string;
  packageFilter: PackageFilter;
  capacity: number;
  booked: number;
  waitlist: number;
  status: ClassStatus;
  notes: string;
  startTimeIso: string;  // raw ISO for pre-filling edit form
  endTimeIso: string;
}

export interface AdminBooking {
  id: string;
  userId: string;
  childId: string | null;
  userName: string;
  userPhone: string;
  packageId: string;
  attendanceStatus: AttendanceStatus;
  waitlistPosition: number | null;
  bookedAt: string;
  avatarColor: string;
  avatarInitial: string;
}

// ── Converters ────────────────────────────────────────────
function rowToAdminClass(row: ClassRow, waitlistCount = 0): AdminClass {
  const now = new Date();
  const end = new Date(row.end_time);
  const start = new Date(row.start_time);

  let status = (row.status as ClassStatus) ?? "open";
  // Auto-derive status when column is missing / null (before migration runs)
  if (!row.status) {
    if (end < now) status = "completed";
    else if (row.current_bookings >= row.max_capacity) status = "full";
    else status = "open";
  }

  // Keep "completed" if class time has already passed and wasn't cancelled
  if (end < now && status !== "cancelled") {
    status = "completed";
  }

  return {
    id: row.id,
    date: start.toISOString().split("T")[0],
    dayLabel: toDayLabel(row.start_time),
    timeStart: toHHMM(row.start_time),
    timeEnd: toHHMM(row.end_time),
    venue: row.location,
    coach: row.coach ?? "",
    packageFilter: (row.package_filter as PackageFilter) ?? "all",
    capacity: row.max_capacity,
    booked: row.current_bookings,
    waitlist: waitlistCount,
    status,
    notes: row.notes ?? "",
    startTimeIso: row.start_time,
    endTimeIso: row.end_time,
  };
}

function rowToAdminBooking(row: BookingRow): AdminBooking {
  const name =
    row.child_profiles?.nickname ||
    row.profiles?.full_name ||
    "Unknown";
  const initial = name.slice(0, 2).toUpperCase();
  const color = avatarColor(name);

  let attendance: AttendanceStatus = "confirmed";
  if (row.attendance_status) {
    attendance = row.attendance_status as AttendanceStatus;
  } else if (row.status === "cancelled") {
    attendance = "cancelled";
  } else if (row.standby_order !== null) {
    attendance = "waitlist";
  }

  return {
    id: row.id,
    userId: row.user_id,
    childId: row.child_id,
    userName: name,
    userPhone: row.profiles?.phone_number ?? "",
    packageId: row.package_id,
    attendanceStatus: attendance,
    waitlistPosition: row.standby_order,
    bookedAt: new Date(row.created_at).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
    avatarColor: color,
    avatarInitial: initial,
  };
}

// ── Input types ───────────────────────────────────────────
export interface ClassInput {
  startTime: string;   // ISO datetime string or "YYYY-MM-DDTHH:MM"
  endTime: string;
  venue: string;
  coach: string;
  capacity: number;
  packageFilter: PackageFilter;
  notes?: string;
}

// ── READ ─────────────────────────────────────────────────
export async function fetchClasses(opts?: {
  from?: string;
  to?: string;
}): Promise<AdminClass[]> {
  let query = getSupabaseClient()
    .from("classes")
    .select("*")
    .order("start_time", { ascending: true });

  if (opts?.from) query = query.gte("start_time", opts.from);
  if (opts?.to)   query = query.lte("start_time", opts.to);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as ClassRow[]).map((r) => rowToAdminClass(r));
}

export async function fetchClassBookings(classId: string): Promise<AdminBooking[]> {
  const { data, error } = await getSupabaseClient()
    .from("bookings")
    .select(`
      *,
      profiles(full_name, nickname, phone_number),
      child_profiles(nickname)
    `)
    .eq("class_id", classId)
    .order("created_at");

  if (error) throw new Error(error.message);
  return (data as BookingRow[]).map(rowToAdminBooking);
}

// ── CREATE ───────────────────────────────────────────────
export async function createClass(input: ClassInput): Promise<AdminClass> {
  const { data, error } = await getSupabaseClient()
    .from("classes")
    .insert({
      start_time: input.startTime,
      end_time: input.endTime,
      location: input.venue,
      coach: input.coach || null,
      max_capacity: input.capacity,
      current_bookings: 0,
      package_filter: input.packageFilter,
      notes: input.notes || null,
      status: "open",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToAdminClass(data as ClassRow);
}

// Create multiple classes at once (for recurring)
export async function createClasses(inputs: ClassInput[]): Promise<number> {
  const rows = inputs.map((input) => ({
    start_time: input.startTime,
    end_time: input.endTime,
    location: input.venue,
    coach: input.coach || null,
    max_capacity: input.capacity,
    current_bookings: 0,
    package_filter: input.packageFilter,
    notes: input.notes || null,
    status: "open",
  }));

  const { data, error } = await getSupabaseClient()
    .from("classes")
    .insert(rows)
    .select("id");

  if (error) throw new Error(error.message);
  return (data as { id: string }[]).length;
}

// ── UPDATE ───────────────────────────────────────────────
export async function updateClass(id: string, input: Partial<ClassInput>): Promise<AdminClass> {
  const updates: Partial<ClassRow> = {};
  if (input.startTime !== undefined)    updates.start_time    = input.startTime;
  if (input.endTime !== undefined)      updates.end_time      = input.endTime;
  if (input.venue !== undefined)        updates.location      = input.venue;
  if (input.coach !== undefined)        updates.coach         = input.coach || null;
  if (input.capacity !== undefined)     updates.max_capacity  = input.capacity;
  if (input.packageFilter !== undefined) updates.package_filter = input.packageFilter;
  if (input.notes !== undefined)        updates.notes         = input.notes || null;

  const { data, error } = await getSupabaseClient()
    .from("classes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rowToAdminClass(data as ClassRow);
}

export async function cancelClass(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("classes")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Also cancel all active bookings for this class
  await getSupabaseClient()
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("class_id", id)
    .eq("status", "booked");
}

export async function markClassCompleted(id: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("classes")
    .update({ status: "completed" })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ── BOOKING ATTENDANCE ────────────────────────────────────
export async function updateBookingAttendance(
  bookingId: string,
  attendance: "attended" | "no-show" | "confirmed"
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("bookings")
    .update({ attendance_status: attendance })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("bookings")
    .update({ status: "cancelled", attendance_status: "cancelled" })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
}

// Promote waitlist booking to confirmed (set standby_order = null, status = 'booked')
export async function promoteFromWaitlist(bookingId: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("bookings")
    .update({ standby_order: null, status: "booked", attendance_status: "confirmed" })
    .eq("id", bookingId);

  if (error) throw new Error(error.message);
}

// ── DATE RANGE HELPERS (used by page) ────────────────────
export function todayRange(): { from: string; to: string } {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

export function weekRange(): { from: string; to: string } {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { from: monday.toISOString(), to: sunday.toISOString() };
}
