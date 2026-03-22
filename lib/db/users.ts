import { getSupabaseClient } from "@/lib/supabase";

// ── Avatar helpers ────────────────────────────────────────
const AVATAR_COLORS = ["#e57373","#81c784","#64b5f6","#ffd54f","#ff8a65","#ce93d8","#4db6ac","#f06292","#a1887f","#78909c"];
function avatarColor(name: string) { return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]; }
function avatarInitial(name: string) { return (name || "?").slice(0, 2).toUpperCase(); }

// ── DB row shapes ─────────────────────────────────────────
interface ProfileRow {
  id: string;
  full_name: string | null;
  nickname: string | null;
  role: string | null;
  phone_number: string | null;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  jersey_size: string | null;
  avatar_url: string | null;
  admin_notes: string | null;
  created_at: string;
}

interface ChildProfileRow {
  id: string;
  parent_id: string;
  nickname: string;
  birth_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  jersey_size: string | null;
  admin_notes: string | null;
  created_at: string;
}

interface UserPackageRow {
  id: string;
  user_id: string;
  child_id: string | null;
  template_id: number;
  remaining_sessions: number;
  extra_sessions_purchased: number;
  start_date: string;
  expiry_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  // joined
  package_templates?: {
    name: string;
    session_count: number;
    type: string;
    extra_session_enabled: boolean;
    extra_session_limit: number;
    extra_session_price: number;
  } | null;
}

interface BookingRow {
  id: string;
  user_id: string;
  child_id: string | null;
  status: string;
  attendance_status: string | null;
  created_at: string;
  classes?: {
    start_time: string;
    end_time: string;
    location: string;
    coach: string | null;
  } | null;
}

interface TransactionRow {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  status: string;
  created_at: string;
  related_package_id: string | null;
}

interface AdminLogRow {
  id: string;
  created_at: string;
  user_id: string | null;
  target_type: string;
  target_id: string;
  action: string;
  delta_sessions: number | null;
  delta_extra: number | null;
  note: string | null;
  performed_by: string;
}

// ── Public types ──────────────────────────────────────────
export interface AdminPackage {
  id: string;
  templateId: number;
  packageName: string;
  packageType: "adult" | "junior";
  startDate: string;
  expiryDate: string;
  remainingSessions: number;
  totalSessions: number;
  extraSessionsPurchased: number;
  extraSessionLimit: number;
  extraSessionPrice: number;
  extraEnabled: boolean;
  status: string;
  notes: string;
}

export type UserStatus = "Active" | "Low" | "Expired" | "No Package";

export interface AdminChild {
  id: string;
  parentId: string;
  parentName: string;
  nickname: string;
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  jerseySize: string | null;
  adminNotes: string | null;
  activePackage: AdminPackage | null; // best display package (active→inactive→null)
  ownPackages: AdminPackage[];        // all non-expired packages, start_date desc
  status: UserStatus;
  expiresAt: string | null;
  createdAt: string;
  avatarColor: string;
  avatarInitial: string;
}

export interface AdminUser {
  id: string;
  fullName: string;
  nickname: string | null;
  phone: string | null;
  role: string;
  types: string[];           // ["Player"] | ["Parent"] | ["Parent","Player"]
  birthDate: string | null;
  heightCm: number | null;
  weightKg: number | null;
  jerseySize: string | null;
  adminNotes: string | null;
  avatarUrl: string | null;
  avatarColor: string;
  avatarInitial: string;
  activePackage: AdminPackage | null; // best display package (active→inactive→null)
  ownPackages: AdminPackage[];        // all non-expired packages, start_date desc
  sessionsUsed: number;
  sessionsTotal: number;
  extraUsed: number;
  extraTotal: number;
  status: UserStatus;
  expiresAt: string | null;
  children: AdminChild[];
  createdAt: string;
}

export interface AdminBooking {
  id: string;
  date: string;
  venue: string;
  time: string;
  attendanceStatus: string;
  status: string;
}

export interface AdminLog {
  id: string;
  createdAt: string;
  action: string;
  detail: string;
  dotColor: string;
}

// ── Converters ────────────────────────────────────────────
function rowToPackage(row: UserPackageRow): AdminPackage {
  const tmpl = row.package_templates;
  const total = tmpl?.session_count ?? 0;
  return {
    id: row.id,
    templateId: row.template_id,
    packageName: tmpl?.name ?? `Package #${row.template_id}`,
    packageType: (tmpl?.type ?? "adult") as "adult" | "junior",
    startDate: row.start_date,
    expiryDate: row.expiry_date,
    remainingSessions: row.remaining_sessions,
    totalSessions: total,
    extraSessionsPurchased: row.extra_sessions_purchased,
    extraSessionLimit: tmpl?.extra_session_limit ?? 2,
    extraSessionPrice: tmpl?.extra_session_price ?? 0,
    extraEnabled: tmpl?.extra_session_enabled ?? false,
    status: row.status,
    notes: row.notes ?? "",
  };
}

// Low threshold: ≤2 sessions remaining OR ≤7 days until expiry
function deriveStatus(pkg: AdminPackage | null): UserStatus {
  if (!pkg || pkg.status === "inactive") return "No Package";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(pkg.expiryDate);
  if (expiry < today || pkg.status === "expired") return "Expired";
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
  if (pkg.remainingSessions <= 2 || daysLeft <= 7) return "Low";
  return "Active";
}

// Helper: pick best display package — most recent active → inactive → expired → null
function pickDisplayPkg(rows: UserPackageRow[]): AdminPackage | null {
  const sorted = [...rows].sort(
    (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
  );
  const active   = sorted.find((p) => p.status === "active");
  const inactive = sorted.find((p) => p.status === "inactive");
  const expired  = sorted.find((p) => p.status === "expired");
  const best = active ?? inactive ?? expired ?? null;
  return best ? rowToPackage(best) : null;
}

function rowToAdminUser(
  row: ProfileRow,
  pkgs: UserPackageRow[],
  children: AdminChild[]
): AdminUser {
  const name = row.full_name ?? "Unknown";

  // Own packages only (user_id matches AND no child_id), sorted start_date desc
  const ownPkgRows = pkgs
    .filter((p) => p.user_id === row.id && p.child_id === null)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  // Status is derived from the most recent ACTIVE package only
  const activePkgRow = ownPkgRows.find((p) => p.status === "active") ?? null;
  const activePkgForStatus = activePkgRow ? rowToPackage(activePkgRow) : null;
  // "Expired" if user has packages but none are active; "No Package" if never bought
  const status: UserStatus = activePkgForStatus
    ? deriveStatus(activePkgForStatus)
    : ownPkgRows.some((p) => p.status === "expired")
      ? "Expired"
      : ownPkgRows.some((p) => p.status === "inactive")
        ? "No Package"
        : "No Package";

  // Display package: most recent active → inactive → null (excludes expired from switcher)
  const displayPkg = pickDisplayPkg(ownPkgRows);
  const ownPackages = ownPkgRows
    .filter((p) => p.status === "active" || p.status === "inactive")
    .map(rowToPackage);

  // Derive types
  const types: string[] = [];
  const hasOwnPkg = ownPkgRows.length > 0;
  const isParent = children.length > 0;
  if (isParent) types.push("Parent");
  if (hasOwnPkg || (!isParent && (row.role === "player" || row.role === "parent_player"))) {
    types.push("Player");
  }
  if (types.length === 0) types.push(row.role === "parent" ? "Parent" : "Player");

  // Sessions: include extra sessions in total
  const totalWithExtra = displayPkg
    ? displayPkg.totalSessions + displayPkg.extraSessionsPurchased
    : 0;

  return {
    id: row.id,
    fullName: name,
    nickname: row.nickname,
    phone: row.phone_number,
    role: row.role ?? "player",
    types,
    birthDate: row.birth_date,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    jerseySize: row.jersey_size,
    adminNotes: row.admin_notes,
    avatarUrl: row.avatar_url,
    avatarColor: avatarColor(name),
    avatarInitial: avatarInitial(name),
    activePackage: displayPkg,
    ownPackages,
    sessionsUsed: displayPkg ? totalWithExtra - displayPkg.remainingSessions : 0,
    sessionsTotal: totalWithExtra,
    extraUsed: 0,
    extraTotal: displayPkg?.extraSessionsPurchased ?? 0,
    status,
    expiresAt: activePkgForStatus?.expiryDate ?? null,
    children,
    createdAt: row.created_at,
  };
}

function rowToAdminChild(
  row: ChildProfileRow,
  parentName: string,
  pkgs: UserPackageRow[]
): AdminChild {
  const childPkgRows = pkgs
    .filter((p) => p.child_id === row.id)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  const displayPkg = pickDisplayPkg(childPkgRows);
  const ownPackages = childPkgRows
    .filter((p) => p.status === "active" || p.status === "inactive")
    .map(rowToPackage);
  // Status from most recent active only; expired packages → "Expired" not "No Package"
  const activePkgRow = childPkgRows.find((p) => p.status === "active") ?? null;
  const activePkgForStatus = activePkgRow ? rowToPackage(activePkgRow) : null;
  const childStatus: UserStatus = activePkgForStatus
    ? deriveStatus(activePkgForStatus)
    : childPkgRows.some((p) => p.status === "expired")
      ? "Expired"
      : "No Package";
  return {
    id: row.id,
    parentId: row.parent_id,
    parentName,
    nickname: row.nickname,
    birthDate: row.birth_date,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    jerseySize: row.jersey_size,
    adminNotes: row.admin_notes,
    activePackage: displayPkg,
    ownPackages,
    status: childStatus,
    expiresAt: activePkgForStatus?.expiryDate ?? null,
    createdAt: row.created_at,
    avatarColor: avatarColor(row.nickname),
    avatarInitial: avatarInitial(row.nickname),
  };
}

// ── READ: User list ───────────────────────────────────────
export async function fetchUsers(): Promise<AdminUser[]> {
  const sb = getSupabaseClient();

  // Fetch all profiles
  const { data: profiles, error: pe } = await sb
    .from("profiles")
    .select("*")
    .order("full_name");
  if (pe) throw new Error(pe.message);

  // Fetch all children
  const { data: children, error: ce } = await sb
    .from("child_profiles")
    .select("*");
  if (ce) throw new Error(ce.message);

  // Fetch all packages (active/inactive/expired) with template info, newest first
  // We need expired ones to correctly distinguish "Expired" status from "No Package"
  const { data: packages, error: pke } = await sb
    .from("user_packages")
    .select("*, package_templates(name, session_count, type, extra_session_enabled, extra_session_limit, extra_session_price)")
    .order("start_date", { ascending: false });
  if (pke) throw new Error(pke.message);

  const profileRows = (profiles ?? []) as ProfileRow[];
  const childRows   = (children ?? []) as ChildProfileRow[];
  const pkgRows     = (packages ?? []) as UserPackageRow[];

  // Build user objects
  return profileRows.map((profile) => {
    const myChildren = childRows
      .filter((c) => c.parent_id === profile.id)
      .map((c) => rowToAdminChild(c, profile.full_name ?? "?", pkgRows));
    return rowToAdminUser(profile, pkgRows, myChildren);
  });
}

// Fetch single user with full package list (including expired)
export async function fetchUserById(userId: string): Promise<AdminUser | null> {
  const sb = getSupabaseClient();

  const { data: profile, error: pe } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (pe) return null;

  const { data: children } = await sb
    .from("child_profiles")
    .select("*")
    .eq("parent_id", userId);

  const { data: packages } = await sb
    .from("user_packages")
    .select("*, package_templates(name, session_count, type, extra_session_enabled, extra_session_limit, extra_session_price)")
    .or(`user_id.eq.${userId},child_id.in.(${(children ?? []).map((c: ChildProfileRow) => c.id).join(",") || "00000000-0000-0000-0000-000000000000"})`);

  const childRows = (children ?? []) as ChildProfileRow[];
  const pkgRows   = (packages ?? []) as UserPackageRow[];

  const myChildren = childRows.map((c) =>
    rowToAdminChild(c, (profile as ProfileRow).full_name ?? "?", pkgRows)
  );
  return rowToAdminUser(profile as ProfileRow, pkgRows, myChildren);
}

// Fetch all packages (including history) for a user/child
export async function fetchUserPackages(userId: string, childId?: string | null): Promise<AdminPackage[]> {
  let query = getSupabaseClient()
    .from("user_packages")
    .select("*, package_templates(name, session_count, type, extra_session_enabled, extra_session_limit, extra_session_price)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (childId) {
    query = query.eq("child_id", childId);
  } else {
    query = query.is("child_id", null);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as UserPackageRow[]).map(rowToPackage);
}

// ── READ: Booking history ─────────────────────────────────
export async function fetchUserBookings(userId: string, childId?: string | null): Promise<AdminBooking[]> {
  let query = getSupabaseClient()
    .from("bookings")
    .select("id, user_id, child_id, status, attendance_status, created_at, classes(start_time, end_time, location, coach)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (childId) {
    query = query.eq("child_id", childId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data as unknown as BookingRow[]).map((b) => {
    const clsRaw = b.classes as unknown;
    const cls = Array.isArray(clsRaw) ? (clsRaw[0] ?? null) : (clsRaw ?? null);
    const start = cls ? new Date((cls as { start_time: string }).start_time) : null;
    const end   = cls ? new Date((cls as { end_time: string }).end_time) : null;
    const timeStr = start && end
      ? `${start.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })}–${end.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", hour12: false })}`
      : "—";
    const dateStr = start
      ? start.toLocaleDateString("th-TH", { day: "2-digit", month: "short" })
      : "—";

    const att = b.attendance_status ?? (b.status === "cancelled" ? "cancelled" : "confirmed");
    return {
      id: b.id,
      date: dateStr,
      venue: (cls as { location?: string } | null)?.location ?? "—",
      time: timeStr,
      attendanceStatus: att,
      status: b.status,
    };
  });
}

// ── READ: Admin logs + transaction history ────────────────
export async function fetchAdminLogs(userId: string): Promise<AdminLog[]> {
  const sb = getSupabaseClient();

  // Get admin logs
  const { data: logs } = await sb
    .from("admin_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  // Get payment transactions
  const { data: txns } = await sb
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const result: AdminLog[] = [];

  for (const log of (logs ?? []) as AdminLogRow[]) {
    let dotColor = "var(--blue)";
    let actionLabel = log.action;
    let detail = log.note ?? "";

    if (log.action === "adjust_sessions") {
      const d = log.delta_sessions ?? 0;
      dotColor = d >= 0 ? "var(--green)" : "var(--red)";
      actionLabel = d >= 0 ? `เพิ่ม Sessions +${d}` : `หัก Sessions ${d}`;
    } else if (log.action === "activate_package") {
      dotColor = "var(--green)";
      actionLabel = "เปิดใช้แพ็กเกจ";
    } else if (log.action === "deactivate_package") {
      dotColor = "var(--orange)";
      actionLabel = "ปิดใช้แพ็กเกจ";
    } else if (log.action === "extend") {
      dotColor = "var(--green)";
      actionLabel = "ต่ออายุแพ็กเกจ";
    } else if (log.action === "profile_update") {
      dotColor = "var(--blue)";
      actionLabel = "แก้ไขข้อมูลผู้ใช้";
    } else if (log.action === "insert_package") {
      dotColor = "var(--green)";
      actionLabel = "เพิ่มแพ็กเกจ";
    } else if (log.action === "delete_package") {
      dotColor = "var(--red)";
      actionLabel = "ลบแพ็กเกจ";
    }

    result.push({
      id: log.id,
      createdAt: log.created_at,
      action: actionLabel,
      detail: `${log.performed_by}${detail ? " · " + detail : ""}`,
      dotColor,
    });
  }

  for (const t of (txns ?? []) as TransactionRow[]) {
    result.push({
      id: t.id,
      createdAt: t.created_at,
      action: t.type === "extra_session" ? "ซื้อ Extra Session" : `ชำระเงิน (${t.type})`,
      detail: `${t.status === "paid" ? "✓" : "⏳"} ${t.amount.toLocaleString()} ฿`,
      dotColor: t.status === "paid" ? "var(--green)" : "var(--orange)",
    });
  }

  // Sort all by date descending
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

// ── UPDATE: Profile ───────────────────────────────────────
export interface ProfileUpdateInput {
  fullName?: string;
  nickname?: string;
  phone?: string;
  birthDate?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  jerseySize?: string;
  adminNotes?: string;
}

export async function updateProfile(userId: string, input: ProfileUpdateInput): Promise<void> {
  const updates: Partial<ProfileRow> = {};
  if (input.fullName   !== undefined) updates.full_name    = input.fullName;
  if (input.nickname   !== undefined) updates.nickname     = input.nickname;
  if (input.phone      !== undefined) updates.phone_number = input.phone;
  if (input.birthDate  !== undefined) updates.birth_date   = input.birthDate;
  if (input.heightCm   !== undefined) updates.height_cm    = input.heightCm;
  if (input.weightKg   !== undefined) updates.weight_kg    = input.weightKg;
  if (input.jerseySize !== undefined) updates.jersey_size  = input.jerseySize;
  if (input.adminNotes !== undefined) updates.admin_notes  = input.adminNotes;

  const { error } = await getSupabaseClient()
    .from("profiles")
    .update(updates)
    .eq("id", userId);
  if (error) throw new Error(error.message);

  // Log
  await writeAdminLog({ userId, targetType: "profile", targetId: userId, action: "profile_update", note: "Profile updated" });
}

export interface ChildUpdateInput {
  nickname?: string;
  birthDate?: string;
  heightCm?: number | null;
  weightKg?: number | null;
  jerseySize?: string;
  adminNotes?: string;
}

export async function updateChildProfile(childId: string, userId: string, input: ChildUpdateInput): Promise<void> {
  const updates: Partial<ChildProfileRow> = {};
  if (input.nickname   !== undefined) updates.nickname   = input.nickname;
  if (input.birthDate  !== undefined) updates.birth_date = input.birthDate;
  if (input.heightCm   !== undefined) updates.height_cm  = input.heightCm;
  if (input.weightKg   !== undefined) updates.weight_kg  = input.weightKg;
  if (input.jerseySize !== undefined) updates.jersey_size = input.jerseySize;
  if (input.adminNotes !== undefined) updates.admin_notes = input.adminNotes;

  const { error } = await getSupabaseClient()
    .from("child_profiles")
    .update(updates)
    .eq("id", childId);
  if (error) throw new Error(error.message);

  await writeAdminLog({ userId, targetType: "child_profile", targetId: childId, action: "profile_update", note: "Child profile updated" });
}

// ── UPDATE: Package ───────────────────────────────────────
export async function adjustPackageSessions(
  packageId: string,
  userId: string,
  newSessions: number,
  newExtra: number,
  note: string
): Promise<void> {
  // Get current values first for delta calculation
  const { data: current, error: fe } = await getSupabaseClient()
    .from("user_packages")
    .select("remaining_sessions, extra_sessions_purchased")
    .eq("id", packageId)
    .single();
  if (fe) throw new Error(fe.message);

  const deltaS = newSessions - (current as UserPackageRow).remaining_sessions;
  const deltaE = newExtra - (current as UserPackageRow).extra_sessions_purchased;

  const { error } = await getSupabaseClient()
    .from("user_packages")
    .update({ remaining_sessions: newSessions, extra_sessions_purchased: newExtra })
    .eq("id", packageId);
  if (error) throw new Error(error.message);

  await writeAdminLog({
    userId,
    targetType: "user_package",
    targetId: packageId,
    action: "adjust_sessions",
    deltaS,
    deltaE,
    note: note || undefined,
  });
}

export async function togglePackageStatus(
  packageId: string,
  userId: string,
  newStatus: "active" | "inactive"
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("user_packages")
    .update({ status: newStatus })
    .eq("id", packageId);
  if (error) throw new Error(error.message);

  const action = newStatus === "active" ? "activate_package" : "deactivate_package";
  await writeAdminLog({
    userId,
    targetType: "user_package",
    targetId: packageId,
    action,
    note: newStatus === "active" ? "เปิดใช้งานแพ็กเกจ" : "ปิดใช้งานแพ็กเกจ",
  });
}

export async function extendPackage(
  packageId: string,
  userId: string,
  newExpiryDate: string,
  note?: string
): Promise<void> {
  // Fetch current package to determine status update
  const { data: current, error: fe } = await getSupabaseClient()
    .from("user_packages")
    .select("expiry_date, status")
    .eq("id", packageId)
    .single();
  if (fe) throw new Error(fe.message);

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const newDate = new Date(newExpiryDate);
  const currentStatus = (current as { status: string }).status;

  let newStatus: string = currentStatus;
  if (newDate < today) {
    newStatus = "expired";
  } else if (currentStatus === "expired" && newDate >= today) {
    newStatus = "active";
  }
  // else keep current status unchanged

  const updatePayload: { expiry_date: string; status?: string } = { expiry_date: newExpiryDate };
  if (newStatus !== currentStatus) updatePayload.status = newStatus;

  const { error } = await getSupabaseClient()
    .from("user_packages")
    .update(updatePayload)
    .eq("id", packageId);
  if (error) throw new Error(error.message);

  await writeAdminLog({
    userId,
    targetType: "user_package",
    targetId: packageId,
    action: "extend",
    note: note || `Extended to ${newExpiryDate}`,
  });
}

// ── Package templates (for admin "add package" form) ─────
export interface PackageTemplateOption {
  id: number;
  name: string;
  type: "adult" | "junior";
  sessionCount: number;
  daysValid: number;
  price: number;
}

export async function fetchPackageTemplatesForAssign(): Promise<PackageTemplateOption[]> {
  const { data, error } = await getSupabaseClient()
    .from("package_templates")
    .select("id, name, type, session_count, days_valid, price")
    .order("type")
    .order("price");
  if (error) throw new Error(error.message);
  return (data as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type as "adult" | "junior",
    sessionCount: r.session_count,
    daysValid: r.days_valid,
    price: r.price,
  }));
}

export interface InsertPackageInput {
  templateId: number;
  startDate: string;
  expiryDate: string;
  notes?: string;
}

export async function insertUserPackage(
  userId: string,
  childId: string | null,
  input: InsertPackageInput,
  sessionCount: number
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from("user_packages")
    .insert({
      user_id: userId,
      child_id: childId ?? null,
      template_id: input.templateId,
      remaining_sessions: sessionCount,
      extra_sessions_purchased: 0,
      start_date: input.startDate,
      expiry_date: input.expiryDate,
      status: "active",
      notes: input.notes ?? null,
    });
  if (error) throw new Error(error.message);

  await writeAdminLog({
    userId,
    targetType: "user_package",
    targetId: userId,
    action: "insert_package",
    note: `เพิ่มแพ็กเกจ template #${input.templateId}${input.notes ? " · " + input.notes : ""}`,
  });
}

export async function deleteUserPackage(packageId: string, userId: string): Promise<void> {
  const sb = getSupabaseClient();

  // Block if any payment_logs reference this package
  const { count: payCount } = await sb
    .from("payment_logs")
    .select("id", { count: "exact", head: true })
    .eq("package_id", packageId);
  if ((payCount ?? 0) > 0) {
    throw new Error("ไม่สามารถลบได้: มีบันทึกการชำระเงินที่เชื่อมกับแพ็กเกจนี้");
  }

  // Block if any transactions reference this package
  const { count: txCount } = await sb
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("related_package_id", packageId);
  if ((txCount ?? 0) > 0) {
    throw new Error("ไม่สามารถลบได้: มีประวัติธุรกรรมที่เชื่อมกับแพ็กเกจนี้");
  }

  const { error } = await sb
    .from("user_packages")
    .delete()
    .eq("id", packageId);
  if (error) throw new Error(error.message);

  await writeAdminLog({
    userId,
    targetType: "user_package",
    targetId: packageId,
    action: "delete_package",
    note: "ลบแพ็กเกจ",
  });
}

// ── Internal: write admin log ─────────────────────────────
async function writeAdminLog(opts: {
  userId: string;
  targetType: string;
  targetId: string;
  action: string;
  deltaS?: number;
  deltaE?: number;
  note?: string;
}) {
  await getSupabaseClient()
    .from("admin_logs")
    .insert({
      user_id:        opts.userId,
      target_type:    opts.targetType,
      target_id:      opts.targetId,
      action:         opts.action,
      delta_sessions: opts.deltaS ?? null,
      delta_extra:    opts.deltaE ?? null,
      note:           opts.note ?? null,
      performed_by:   "admin",
    });
  // ignore write errors for logs (non-critical)
}
