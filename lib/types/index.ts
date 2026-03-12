// ── User / Member ────────────────────────────────────────
export type UserType = "Parent" | "Player" | "Child";
export type UserStatus = "Active" | "Expired" | "Low";

export interface Child {
  id: string;
  nickname: string;
  parentId: string;
  parentName: string;
  dob: string;
  height: number;
  weight: number;
  shirtSize: string;
  package: PackageAssignment | null;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  types: UserType[];
  package: PackageAssignment | null;
  sessions: { used: number; total: number };
  extra: { used: number; total: number };
  status: UserStatus;
  expiresAt: string;
  children: Child[];
  dob?: string;
  height?: number;
  weight?: number;
  shirtSize?: string;
  nickname?: string;
  email?: string;
  avatarColor: string;
  avatarInitial: string;
}

// ── Package ──────────────────────────────────────────────
export type PackageCategory = "Adult" | "Junior";

export interface Package {
  id: string;
  name: string;
  category: PackageCategory;
  price: number;
  sessions: number;
  durationDays: number;
  extraLimit: number;
  extraPrice: number;
  description?: string;
}

export interface PackageAssignment {
  packageId: string;
  packageName: string;
  startDate: string;
  endDate: string;
  sessionsRemaining: number;
  sessionsTotal: number;
  extraUsed: number;
  extraTotal: number;
  pausedDays: number;
  status: "Active" | "Expired";
}

// ── Class / Session ──────────────────────────────────────
export type ClassStatus = "open" | "full" | "waitlist" | "completed" | "cancelled";

export interface ClassSession {
  id: string;
  date: string;
  dayLabel: string;
  timeStart: string;
  timeEnd: string;
  venue: string;
  coach: string;
  packageFilter: string;
  capacity: number;
  booked: number;
  waitlist: number;
  status: ClassStatus;
}

export interface Booking {
  id: string;
  userId: string;
  userName: string;
  packageName: string;
  userType: string;
  bookedAt: string;
  attendanceStatus: "Confirmed" | "Waitlist" | "Attended" | "No-show" | "Cancelled";
  waitlistPosition?: number;
  avatarColor: string;
  avatarInitial: string;
}

// ── Promo ────────────────────────────────────────────────
export type PromoStatus = "Active" | "Expiring" | "Inactive";
export type DiscountType = "percent" | "fixed";

export interface PromoCode {
  id: string;
  code: string;
  discount: number;
  discountType: DiscountType;
  usedCount: number;
  usageLimit: number;
  expiresAt: string;
  status: PromoStatus;
}

// ── Payment ──────────────────────────────────────────────
export type PaymentStatus = "pending" | "confirmed" | "rejected";

export interface Payment {
  id: string;
  userId: string;
  userName: string;
  packageName: string;
  amount: number;
  date: string;
  status: PaymentStatus;
  avatarColor: string;
  avatarInitial: string;
}

// ── Settings ─────────────────────────────────────────────
export interface Venue {
  id: string;
  name: string;
  description: string;
  capacity: number;
}

export interface Coach {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  avatarInitial: string;
}

// ── Admin Account ────────────────────────────────────────
export type AdminRole = "admin" | "coach";

export interface AdminAccount {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: "Active" | "Inactive";
  avatarColor: string;
  avatarInitial: string;
}
