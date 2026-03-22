import { getSupabaseClient } from "@/lib/supabase";

// ── Bank code → name map (SlipOK API Guide v1.13) ────────────────────────────
export const BANK_MAP: Record<string, { short: string; full: string; color: string }> = {
  "002": { short: "BBL",   full: "กรุงเทพ",              color: "#1A3A5C" },
  "004": { short: "KBANK", full: "กสิกรไทย",            color: "#009B3A" },
  "006": { short: "KTB",   full: "กรุงไทย",             color: "#0072BC" },
  "011": { short: "TTB",   full: "ทหารไทยธนชาต",        color: "#F58220" },
  "014": { short: "SCB",   full: "ไทยพาณิชย์",          color: "#4A2583" },
  "025": { short: "BAY",   full: "กรุงศรีอยุธยา",       color: "#CC0000" },
  "069": { short: "KKP",   full: "เกียรตินาคิน",        color: "#C8A85D" },
  "022": { short: "CIMBT", full: "ซีไอเอ็มบีไทย",      color: "#D91F26" },
  "067": { short: "TISCO", full: "ทิสโก้",              color: "#005B8E" },
  "024": { short: "UOBT",  full: "ยูโอบี",              color: "#003087" },
  "071": { short: "TCD",   full: "ไทยเครดิต",           color: "#E4002B" },
  "073": { short: "LHFG",  full: "แลนด์ แอนด์ เฮ้าส์", color: "#B0976B" },
  "070": { short: "ICBCT", full: "ไอซีบีซี (ไทย)",     color: "#CC0000" },
  "098": { short: "SME",   full: "พัฒนาวิสาหกิจ",       color: "#4A7A3D" },
  "034": { short: "BAAC",  full: "ธ.ก.ส.",              color: "#0E8A5F" },
  "035": { short: "EXIM",  full: "เพื่อการส่งออก",       color: "#003F87" },
  "030": { short: "GSB",   full: "ออมสิน",              color: "#E60013" },
  "033": { short: "GHB",   full: "อาคารสงเคราะห์",      color: "#F57F20" },
};

export function bankInfo(code: string | null) {
  if (!code) return { short: "—", full: "ไม่ทราบธนาคาร", color: "#888" };
  return BANK_MAP[code] ?? { short: code, full: "ธนาคาร", color: "#888" };
}

// ── Avatar helpers ────────────────────────────────────────────────────────────
const AVATAR_COLORS = ["#e57373","#81c784","#64b5f6","#ffd54f","#ff8a65","#ce93d8","#4db6ac","#f06292"];
function avatarColor(name: string) { return AVATAR_COLORS[(name || "?").charCodeAt(0) % AVATAR_COLORS.length]; }
function avatarInitial(name: string) { return (name || "?").slice(0, 2).toUpperCase(); }

// ── Date helpers ──────────────────────────────────────────────────────────────
/** Format SlipOK transDate (yyyyMMdd) + transTime (HH:mm:ss) → Thai readable */
export function formatSlipDateTime(transDate: string | null, transTime: string | null): string {
  if (!transDate || transDate.length !== 8) {
    return transDate ?? "—";
  }
  const y = transDate.slice(0, 4);
  const m = transDate.slice(4, 6);
  const d = transDate.slice(6, 8);
  try {
    const dateStr = new Date(`${y}-${m}-${d}`).toLocaleDateString("th-TH", {
      day: "2-digit", month: "short", year: "2-digit",
    });
    return transTime ? `${dateStr} · ${transTime}` : dateStr;
  } catch {
    return `${d}/${m}/${y}${transTime ? ` ${transTime}` : ""}`;
  }
}

/** Format created_at ISO timestamp → Thai readable */
export function formatCreatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("th-TH", {
      day: "2-digit", month: "short", year: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── DB row shape ──────────────────────────────────────────────────────────────
interface PaymentRow {
  id: string;
  created_at: string;
  user_id: string | null;
  child_id: string | null;
  package_id: string | null;
  // Legacy columns (older records)
  success?: boolean | null;
  api_response?: Record<string, unknown> | null;
  actual_amount?: number | null;
  failure_reason?: string | null;
  // New SlipOK columns (post-migration)
  slipok_success?: boolean | null;
  slipok_message: string | null;
  trans_ref: string | null;
  trans_date: string | null;
  trans_time: string | null;
  trans_timestamp: string | null;
  sending_bank: string | null;
  receiving_bank: string | null;
  sender_name: string | null;
  sender_account: string | null;
  receiver_name: string | null;
  receiver_account: string | null;
  amount: number | null;
  ref1: string | null;
  ref2: string | null;
  ref3: string | null;
  error_code: number | null;
  error_message: string | null;
  note: string | null;
  raw_response: Record<string, unknown> | null;
  // Legacy extra columns
  payment_type?: string | null;
  expected_amount?: number | null;
  // joined
  profiles?: { full_name: string; phone_number: string | null } | null;
  child_profiles?: { nickname: string } | null;
  user_packages?: {
    remaining_sessions: number;
    package_templates: { name: string; type: string; session_count: number; extra_session_price: number } | null;
  } | null;
}

// ── Public type ───────────────────────────────────────────────────────────────
export interface AdminPayment {
  id: string;
  createdAt: string;
  userId: string | null;
  childId: string | null;
  packageId: string | null;
  slipokSuccess: boolean;
  slipokMessage: string | null;
  transRef: string | null;
  transDate: string | null;
  transTime: string | null;
  transTimestamp: string | null;
  sendingBank: string | null;
  receivingBank: string | null;
  senderName: string | null;
  senderAccount: string | null;
  receiverName: string | null;
  receiverAccount: string | null;
  amount: number | null;
  ref1: string | null;
  ref2: string | null;
  ref3: string | null;
  errorCode: number | null;
  errorMessage: string | null;
  failureReason: string | null;
  note: string | null;
  rawResponse: Record<string, unknown> | null;
  // purchase context
  paymentType: string | null;
  expectedAmount: number | null;
  packageName: string | null;
  packageType: string | null;
  packageSessions: number | null;
  remainingSessions: number | null;
  childName: string | null;
  // derived
  userName: string | null;
  userPhone: string | null;
  avatarColor: string;
  avatarInitial: string;
  displayDate: string;   // formatted slip date for table
  displayCreated: string; // formatted created_at for table
}

export interface PaymentSummary {
  successThisMonth: number;
  revenueThisMonth: number;
  totalThisMonth: number;
  failedThisMonth: number;
}

// ── Converter ─────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rawData(row: PaymentRow): any {
  // Prefer raw_response.data (new), fall back to api_response.data (legacy)
  return (row.raw_response as any)?.data
      ?? (row.api_response as any)?.data
      ?? {};
}

function rowToAdminPayment(row: PaymentRow): AdminPayment {
  const rd = rawData(row);

  // Prefer dedicated columns (post-migration); fall back to raw_response/api_response data.
  // slipok_success defaults to false in DB for old records that pre-date the migration,
  // so we can't use ?? (which only catches null/undefined). Use explicit true check instead:
  // if slipok_success is explicitly true → confirmed; otherwise fall back to legacy `success`
  // column or api_response.data.success.
  const slipokSuccess  = row.slipok_success === true
    ? true
    : (row.success === true || rd.success === true);
  const slipokMessage  = row.slipok_message  ?? rd.message  ?? null;
  const transRef       = row.trans_ref       ?? rd.transRef  ?? null;
  const transDate      = row.trans_date      ?? rd.transDate ?? null;
  const transTime      = row.trans_time      ?? rd.transTime ?? null;
  const transTimestamp = row.trans_timestamp ?? rd.transTimestamp ?? null;
  const sendingBank    = row.sending_bank    ?? rd.sendingBank   ?? null;
  const receivingBank  = row.receiving_bank  ?? rd.receivingBank ?? null;
  const senderName     = row.sender_name     ?? rd.sender?.displayName  ?? rd.sender?.name  ?? null;
  const senderAccount  = row.sender_account  ?? rd.sender?.account?.value ?? null;
  const receiverName   = row.receiver_name   ?? rd.receiver?.displayName ?? rd.receiver?.name ?? null;
  const receiverAccount = row.receiver_account ?? rd.receiver?.account?.value ?? null;
  const amount         = row.amount          ?? row.actual_amount ?? rd.amount ?? null;
  const ref1           = row.ref1            ?? rd.ref1   ?? null;
  const ref2           = row.ref2            ?? rd.ref2   ?? null;
  const ref3           = row.ref3            ?? rd.ref3   ?? null;

  const name = row.profiles?.full_name ?? senderName ?? null;

  return {
    id: row.id,
    createdAt: row.created_at,
    userId: row.user_id,
    childId: row.child_id,
    packageId: row.package_id,
    slipokSuccess,
    slipokMessage,
    transRef,
    transDate,
    transTime,
    transTimestamp,
    sendingBank,
    receivingBank,
    senderName,
    senderAccount,
    receiverName,
    receiverAccount,
    amount,
    ref1,
    ref2,
    ref3,
    errorCode: row.error_code ?? null,
    errorMessage: row.error_message ?? null,
    failureReason: row.failure_reason ?? null,
    note: row.note ?? null,
    rawResponse: row.raw_response,
    paymentType: row.payment_type ?? null,
    expectedAmount: row.expected_amount ?? row.actual_amount ?? null,
    packageName: row.user_packages?.package_templates?.name ?? null,
    packageType: row.user_packages?.package_templates?.type ?? null,
    packageSessions: row.user_packages?.package_templates?.session_count ?? null,
    remainingSessions: row.user_packages?.remaining_sessions ?? null,
    childName: row.child_profiles?.nickname ?? null,
    userName: row.profiles?.full_name ?? null,
    userPhone: row.profiles?.phone_number ?? null,
    avatarColor: avatarColor(name ?? "?"),
    avatarInitial: avatarInitial(name ?? "?"),
    displayDate: formatSlipDateTime(transDate, transTime),
    displayCreated: formatCreatedAt(row.created_at),
  };
}

// ── READ ──────────────────────────────────────────────────────────────────────
export async function fetchPayments(opts?: {
  from?: string;   // ISO date string
  to?: string;
  successOnly?: boolean;
  failedOnly?: boolean;
  limit?: number;
}): Promise<AdminPayment[]> {
  let query = getSupabaseClient()
    .from("payment_logs")
    .select(`*, profiles(full_name, phone_number), child_profiles(nickname), user_packages(remaining_sessions, package_templates(name, type, session_count, extra_session_price))`)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 200);

  if (opts?.from) query = query.gte("created_at", opts.from);
  if (opts?.to)   query = query.lte("created_at", opts.to);
  // Note: slipok_success filter applied client-side (column may not exist pre-migration)

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  let rows = (data as PaymentRow[]).map(rowToAdminPayment);
  if (opts?.successOnly) rows = rows.filter((r) => r.slipokSuccess);
  if (opts?.failedOnly)  rows = rows.filter((r) => !r.slipokSuccess);
  return rows;
}

export async function fetchPaymentSummary(): Promise<PaymentSummary> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Use select=* so this works both before and after the migration adds dedicated columns.
  // slipok_success / amount are derived in rowToAdminPayment via raw_response fallback.
  const { data, error } = await getSupabaseClient()
    .from("payment_logs")
    .select("*")
    .gte("created_at", monthStart)
    .lte("created_at", monthEnd);

  if (error) throw new Error(error.message);

  const rows = (data as PaymentRow[]).map(rowToAdminPayment);
  const success = rows.filter((r) => r.slipokSuccess);
  return {
    successThisMonth: success.length,
    revenueThisMonth: success.reduce((s, r) => s + (r.amount ?? 0), 0),
    totalThisMonth: rows.length,
    failedThisMonth: rows.filter((r) => !r.slipokSuccess).length,
  };
}

// ── Month range helpers ───────────────────────────────────────────────────────
export function thisMonthRange(): { from: string; to: string } {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    to:   new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
  };
}

export function lastMonthRange(): { from: string; to: string } {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(),
    to:   new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString(),
  };
}

export function last3MonthsRange(): { from: string; to: string } {
  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString(),
    to:   new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString(),
  };
}
