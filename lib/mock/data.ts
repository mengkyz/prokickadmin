import type {
  User, Package, ClassSession, Booking,
  PromoCode, Payment, Venue, Coach, AdminAccount,
} from "@/lib/types";

// ── Packages ──────────────────────────────────────────────
export const PACKAGES: Package[] = [
  { id: "pkg-1", name: "Fun Pack", category: "Adult", price: 1800, sessions: 4, durationDays: 30, extraLimit: 2, extraPrice: 450 },
  { id: "pkg-2", name: "Pro Pack", category: "Adult", price: 2800, sessions: 8, durationDays: 40, extraLimit: 2, extraPrice: 300 },
  { id: "pkg-3", name: "Elite Pack", category: "Adult", price: 4500, sessions: 16, durationDays: 60, extraLimit: 2, extraPrice: 250 },
  { id: "pkg-4", name: "First Step", category: "Junior", price: 1400, sessions: 4, durationDays: 30, extraLimit: 2, extraPrice: 350 },
  { id: "pkg-5", name: "Happy Kicks", category: "Junior", price: 2200, sessions: 7, durationDays: 40, extraLimit: 2, extraPrice: 350 },
];

// ── Users ─────────────────────────────────────────────────
export const USERS: User[] = [
  {
    id: "u-1",
    name: "Ploiphailyn",
    phone: "+66 89-xxx-xxxx",
    nickname: "ปลอย",
    types: ["Parent", "Player"],
    avatarColor: "linear-gradient(135deg,#3B82F6,#7C3AED)",
    avatarInitial: "P",
    email: "ploiphailyn@example.com",
    dob: "1990-04-15",
    height: 165,
    weight: 58,
    shirtSize: "M",
    package: {
      packageId: "pkg-2",
      packageName: "Pro Pack",
      startDate: "13 ม.ค. 2569",
      endDate: "22 ก.พ. 2569",
      sessionsRemaining: 7,
      sessionsTotal: 8,
      extraUsed: 0,
      extraTotal: 2,
      pausedDays: 0,
      status: "Active",
    },
    sessions: { used: 7, total: 8 },
    extra: { used: 0, total: 2 },
    status: "Active",
    expiresAt: "22/02/69",
    children: [
      {
        id: "c-1",
        nickname: "พรีม",
        parentId: "u-1",
        parentName: "Ploiphailyn",
        dob: "2017-04-07",
        height: 120,
        weight: 25,
        shirtSize: "L",
        package: {
          packageId: "pkg-4",
          packageName: "First Step",
          startDate: "13 ม.ค. 2569",
          endDate: "11 ก.พ. 2569",
          sessionsRemaining: 3,
          sessionsTotal: 4,
          extraUsed: 0,
          extraTotal: 0,
          pausedDays: 0,
          status: "Active",
        },
      },
      {
        id: "c-2",
        nickname: "พัค",
        parentId: "u-1",
        parentName: "Ploiphailyn",
        dob: "2019-08-14",
        height: 110,
        weight: 20,
        shirtSize: "S",
        package: {
          packageId: "pkg-4",
          packageName: "First Step",
          startDate: "13 ม.ค. 2569",
          endDate: "11 ก.พ. 2569",
          sessionsRemaining: 2,
          sessionsTotal: 4,
          extraUsed: 0,
          extraTotal: 0,
          pausedDays: 0,
          status: "Active",
        },
      },
    ],
  },
  {
    id: "u-2",
    name: "Somchai K.",
    phone: "+66 81-xxx-xxxx",
    types: ["Player"],
    avatarColor: "linear-gradient(135deg,#F5A623,#EA580C)",
    avatarInitial: "S",
    email: "somchai@example.com",
    package: {
      packageId: "pkg-3",
      packageName: "Elite Pack",
      startDate: "1 ก.พ. 2569",
      endDate: "1 เม.ย. 2569",
      sessionsRemaining: 7,
      sessionsTotal: 16,
      extraUsed: 1,
      extraTotal: 2,
      pausedDays: 0,
      status: "Active",
    },
    sessions: { used: 7, total: 16 },
    extra: { used: 1, total: 2 },
    status: "Active",
    expiresAt: "01/04/69",
    children: [],
  },
  {
    id: "u-3",
    name: "Nattawut P.",
    phone: "+66 86-xxx-xxxx",
    types: ["Player"],
    avatarColor: "linear-gradient(135deg,#16A34A,#0D9488)",
    avatarInitial: "N",
    email: "nattawut@example.com",
    package: {
      packageId: "pkg-1",
      packageName: "Fun Pack",
      startDate: "10 ก.พ. 2569",
      endDate: "11 มี.ค. 2569",
      sessionsRemaining: 1,
      sessionsTotal: 4,
      extraUsed: 0,
      extraTotal: 2,
      pausedDays: 0,
      status: "Active",
    },
    sessions: { used: 1, total: 4 },
    extra: { used: 0, total: 2 },
    status: "Low",
    expiresAt: "11/03/69",
    children: [],
  },
];

// ── Classes ────────────────────────────────────────────────
export const INCOMING_CLASSES: ClassSession[] = [
  { id: "cs-1", date: "2026-03-03", dayLabel: "จันทร์ 3 มี.ค.", timeStart: "09:00", timeEnd: "10:30", venue: "Small Arena", coach: "Coach Arm", packageFilter: "เด็ก", capacity: 12, booked: 9, waitlist: 0, status: "open" },
  { id: "cs-2", date: "2026-03-03", dayLabel: "จันทร์ 3 มี.ค.", timeStart: "19:00", timeEnd: "20:30", venue: "Grand Field", coach: "Pro Coach", packageFilter: "ผู้ใหญ่", capacity: 20, booked: 20, waitlist: 2, status: "waitlist" },
  { id: "cs-3", date: "2026-03-04", dayLabel: "อังคาร 4 มี.ค.", timeStart: "10:30", timeEnd: "12:00", venue: "Arena A", coach: "Coach Bee", packageFilter: "ผู้ใหญ่", capacity: 20, booked: 12, waitlist: 0, status: "open" },
];

export const HISTORY_CLASSES: ClassSession[] = [
  { id: "hcs-1", date: "2026-02-22", dayLabel: "อาทิตย์ 22 ก.พ.", timeStart: "16:00", timeEnd: "17:30", venue: "Small Arena", coach: "Coach Arm", packageFilter: "เด็ก", capacity: 12, booked: 12, waitlist: 0, status: "completed" },
  { id: "hcs-2", date: "2026-02-21", dayLabel: "เสาร์ 21 ก.พ.", timeStart: "10:00", timeEnd: "11:30", venue: "Grand Field", coach: "Pro Coach", packageFilter: "ผู้ใหญ่", capacity: 20, booked: 20, waitlist: 0, status: "completed" },
  { id: "hcs-3", date: "2026-02-20", dayLabel: "ศุกร์ 20 ก.พ.", timeStart: "19:00", timeEnd: "20:30", venue: "Arena A", coach: "Coach Bee", packageFilter: "ผู้ใหญ่", capacity: 20, booked: 0, waitlist: 0, status: "cancelled" },
];

export const HISTORY_DETAIL_MAP: Record<string, { attended: number; noshow: number; cancelled: number; bookings: Booking[] }> = {
  "hcs-1": {
    attended: 10,
    noshow: 2,
    cancelled: 0,
    bookings: [
      { id: "b-1", userId: "u-2", userName: "Somchai K.", packageName: "Elite Pack", userType: "Player", bookedAt: "22/02 16:30", attendanceStatus: "Attended", avatarColor: "linear-gradient(135deg,#F5A623,#EA580C)", avatarInitial: "S" },
      { id: "b-2", userId: "u-1", userName: "Ploiphailyn", packageName: "Pro Pack", userType: "Parent+Player", bookedAt: "20/02 09:15", attendanceStatus: "Attended", avatarColor: "linear-gradient(135deg,#3B82F6,#7C3AED)", avatarInitial: "P" },
      { id: "b-3", userId: "u-3", userName: "Nattawut P.", packageName: "Fun Pack", userType: "Player", bookedAt: "18/02 14:00", attendanceStatus: "No-show", avatarColor: "linear-gradient(135deg,#16A34A,#0D9488)", avatarInitial: "N" },
      { id: "b-4", userId: "c-1", userName: "พรีม", packageName: "First Step", userType: "Child", bookedAt: "17/02 10:00", attendanceStatus: "No-show", avatarColor: "linear-gradient(135deg,#60A5FA,#A78BFA)", avatarInitial: "พ" },
    ],
  },
};

export const INCOMING_DETAIL: Booking[] = [
  { id: "b-10", userId: "u-2", userName: "Somchai K.", packageName: "Elite Pack", userType: "Player", bookedAt: "22/02 16:30", attendanceStatus: "Confirmed", avatarColor: "linear-gradient(135deg,#F5A623,#EA580C)", avatarInitial: "S" },
  { id: "b-11", userId: "u-1", userName: "Ploiphailyn", packageName: "Pro Pack", userType: "Parent+Player", bookedAt: "20/02 09:15", attendanceStatus: "Confirmed", avatarColor: "linear-gradient(135deg,#3B82F6,#7C3AED)", avatarInitial: "P" },
  { id: "b-12", userId: "u-3", userName: "Nattawut P.", packageName: "Fun Pack", userType: "Player", bookedAt: "18/02 14:00", attendanceStatus: "Waitlist", waitlistPosition: 1, avatarColor: "linear-gradient(135deg,#16A34A,#0D9488)", avatarInitial: "N" },
];

// ── Promo Codes ───────────────────────────────────────────
export const PROMO_CODES: PromoCode[] = [
  { id: "promo-1", code: "PROKICK2024", discount: 10, discountType: "percent", usedCount: 47, usageLimit: 100, expiresAt: "31/03/69", status: "Active" },
  { id: "promo-2", code: "FUNPACK50", discount: 50, discountType: "fixed", usedCount: 12, usageLimit: 50, expiresAt: "28/02/69", status: "Expiring" },
];

// ── Payments ──────────────────────────────────────────────
export const PAYMENTS: Payment[] = [
  { id: "pay-1", userId: "u-2", userName: "Somchai K.", packageName: "Elite Pack", amount: 4500, date: "22/02/69", status: "pending", avatarColor: "linear-gradient(135deg,#F5A623,#EA580C)", avatarInitial: "S" },
  { id: "pay-2", userId: "u-1", userName: "Ploiphailyn", packageName: "Extra Session", amount: 300, date: "21/02/69", status: "confirmed", avatarColor: "linear-gradient(135deg,#3B82F6,#7C3AED)", avatarInitial: "P" },
];

export const PAYMENT_SUMMARY = {
  pending: 5,
  confirmedThisMonth: 38,
  revenueThisMonth: 84200,
};

// ── Venues ────────────────────────────────────────────────
export const VENUES: Venue[] = [
  { id: "v-1", name: "Grand Field", description: "สนามหลัก", capacity: 20 },
  { id: "v-2", name: "Arena A", description: "สนามรอง", capacity: 20 },
  { id: "v-3", name: "Small Arena", description: "สนามเด็ก", capacity: 12 },
];

// ── Coaches ───────────────────────────────────────────────
export const COACHES: Coach[] = [
  { id: "coach-1", name: "Pro Coach", role: "โค้ชหลัก", avatarColor: "linear-gradient(135deg,#1B2A4A,#2A3F6B)", avatarInitial: "PC" },
  { id: "coach-2", name: "Coach Arm", role: "โค้ชเด็ก", avatarColor: "linear-gradient(135deg,#16A34A,#0D9488)", avatarInitial: "A" },
  { id: "coach-3", name: "Coach Bee", role: "โค้ชรอง", avatarColor: "linear-gradient(135deg,#7C3AED,#A78BFA)", avatarInitial: "B" },
];

// ── Admin Accounts ────────────────────────────────────────
export const ADMIN_ACCOUNTS: AdminAccount[] = [
  { id: "acc-1", name: "Admin", email: "admin@prokick.co.th", role: "admin", status: "Active", avatarColor: "linear-gradient(135deg,#2563EB,#7C3AED)", avatarInitial: "A" },
  { id: "acc-2", name: "Pro Coach", email: "coach@prokick.co.th", role: "coach", status: "Active", avatarColor: "linear-gradient(135deg,#1B2A4A,#2A3F6B)", avatarInitial: "C" },
];

// ── Dashboard ─────────────────────────────────────────────
export const DASHBOARD_STATS = {
  activeMembers: { value: 247, change: "+12 ใหม่เดือนนี้" },
  todayClasses: { value: 6, change: "89 / 120 ที่นั่ง" },
};

export const TODAY_CLASSES = [
  { time: "09:00–10:30", name: "Fun Pack – เด็ก", venue: "Small Arena", coach: "Coach Arm", booked: 9, capacity: 12, status: "open" as const },
  { time: "13:00–14:30", name: "Elite Pack – ผู้ใหญ่", venue: "Arena A", coach: "Coach Bee", booked: 20, capacity: 20, status: "full" as const },
  { time: "19:00–20:30", name: "Pro Pack – ผู้ใหญ่", venue: "Grand Field", coach: "Pro Coach", booked: 20, capacity: 20, waitlist: 2, status: "waitlist" as const },
];

export const DASHBOARD_ALERTS = [
  { type: "red" as const, title: "🔴 แพ็กเกจหมดอายุวันนี้", desc: "3 ผู้ใช้ — Elite Pack" },
  { type: "blue" as const, title: "🔵 รอยืนยันการชำระเงิน", desc: "5 รายการรอตรวจสอบ" },
];
