"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { TodayClassesCard } from "@/components/dashboard/TodayClassesCard";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import type { DashboardAlert } from "@/components/dashboard/AlertsCard";
import { fetchClasses, todayRange } from "@/lib/db/classes";
import type { AdminClass } from "@/lib/db/classes";
import { fetchUsers } from "@/lib/db/users";
import type { AdminUser } from "@/lib/db/users";
import { fetchPaymentSummary } from "@/lib/db/payments";
import type { PaymentSummary } from "@/lib/db/payments";

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatBaht(n: number): string {
  if (n >= 1_000_000) return `฿${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `฿${(n / 1_000).toFixed(1)}K`;
  return `฿${n.toLocaleString()}`;
}

// ── Stat mini-card ─────────────────────────────────────────────────────────────

interface StatProps {
  icon: string;
  label: string;
  value: string | number;
  sub?: string;
  color?: "green" | "orange" | "red" | "blue";
  href?: string;
  loading?: boolean;
}

const accentVar: Record<string, string> = {
  green:  "var(--green)",
  orange: "var(--orange)",
  red:    "var(--red)",
  blue:   "var(--blue)",
};

function StatCard({ icon, label, value, sub, color = "orange", href, loading }: StatProps) {
  const accent = accentVar[color];
  const inner = (
    <div
      style={{
        background: "var(--card)",
        border: "1.5px solid var(--bd)",
        borderRadius: 12,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 13,
        cursor: href ? "pointer" : "default",
      }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, color: "var(--tm)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: accent, lineHeight: 1 }}>
          {loading ? "—" : value}
        </div>
        {sub && <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 3 }}>{sub}</div>}
      </div>
    </div>
  );
  return href
    ? <Link href={href} style={{ textDecoration: "none" }}>{inner}</Link>
    : inner;
}

// ── Payment summary bar ────────────────────────────────────────────────────────

function PaymentBar({ summary, loading }: { summary: PaymentSummary | null; loading: boolean }) {
  const items = [
    { label: "รายการทั้งหมด", value: String(summary?.totalThisMonth ?? 0),          color: "var(--t1)"    },
    { label: "✅ สำเร็จ",      value: String(summary?.successThisMonth ?? 0),        color: "var(--green)" },
    { label: "❌ ล้มเหลว",    value: String(summary?.failedThisMonth ?? 0),          color: (summary?.failedThisMonth ?? 0) > 0 ? "var(--red)" : "var(--tm)" },
    { label: "💰 รายได้",      value: formatBaht(summary?.revenueThisMonth ?? 0),    color: "var(--green)" },
  ];

  return (
    <div style={{ background: "var(--card)", border: "1.5px solid var(--bd)", borderRadius: 12, padding: "14px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>💳 ภาพรวมการชำระเงินเดือนนี้</div>
        <Link href="/payments" style={{ fontSize: 11, color: "var(--accent)", textDecoration: "none" }}>ดูทั้งหมด →</Link>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {items.map((item) => (
          <div key={item.label} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: loading ? "var(--tm)" : item.color }}>
              {loading ? "—" : item.value}
            </div>
            <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 3 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [todayClasses, setTodayClasses] = useState<AdminClass[] | null>(null);
  const [users,        setUsers]        = useState<AdminUser[] | null>(null);
  const [summary,      setSummary]      = useState<PaymentSummary | null>(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    setLoading(true);
    const { from, to } = todayRange();
    Promise.allSettled([
      fetchClasses({ from, to }),
      fetchUsers(),
      fetchPaymentSummary(),
    ]).then(([clsRes, usrRes, sumRes]) => {
      if (clsRes.status === "fulfilled") setTodayClasses(clsRes.value);
      if (usrRes.status === "fulfilled") setUsers(usrRes.value);
      if (sumRes.status === "fulfilled") setSummary(sumRes.value);
    }).finally(() => setLoading(false));
  }, []);

  // ── Derived stats ────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    if (!users) return { active: 0, low: 0, expired: 0, noPackage: 0, total: 0 };
    let active = 0, low = 0, expired = 0, noPackage = 0;
    function tally(status: string) {
      if (status === "Active")      active++;
      else if (status === "Low")    low++;
      else if (status === "Expired") expired++;
      else                           noPackage++;
    }
    for (const u of users) {
      tally(u.status);
      for (const c of u.children) tally(c.status);
    }
    return { active, low, expired, noPackage, total: users.length };
  }, [users]);

  const todayStats = useMemo(() => {
    const cls = todayClasses ?? [];
    const active = cls.filter((c) => c.status !== "cancelled");
    return {
      count:        active.length,
      totalBooked:  active.reduce((s, c) => s + c.booked, 0),
      totalCap:     active.reduce((s, c) => s + c.capacity, 0),
    };
  }, [todayClasses]);

  // ── Alerts (derived from real data) ─────────────────────────────────────────

  const alerts = useMemo((): DashboardAlert[] => {
    const list: DashboardAlert[] = [];

    if (users) {
      const lowNames: string[] = [];
      for (const u of users) {
        if (u.status === "Low") lowNames.push(u.fullName);
        for (const c of u.children) if (c.status === "Low") lowNames.push(c.nickname);
      }
      if (lowNames.length > 0) {
        const preview = lowNames.length <= 3
          ? lowNames.join(", ")
          : `${lowNames.slice(0, 3).join(", ")} +${lowNames.length - 3} ราย`;
        list.push({ type: "orange", title: `⚠️ แพ็กเกจใกล้หมด ${lowNames.length} ราย`, desc: preview, href: "/users" });
      }
    }

    if (todayClasses) {
      const full = todayClasses.filter((c) => c.status === "full");
      if (full.length > 0) {
        list.push({ type: "red", title: `🔴 คลาสเต็ม ${full.length} คลาสวันนี้`, desc: full.map((c) => `${c.timeStart} · ${c.venue}`).join(", "), href: "/classes" });
      }
      const totalWaitlist = todayClasses.reduce((s, c) => s + c.waitlist, 0);
      if (totalWaitlist > 0) {
        list.push({ type: "orange", title: `⏳ Waitlist รวม ${totalWaitlist} คนวันนี้`, desc: todayClasses.filter((c) => c.waitlist > 0).map((c) => `${c.timeStart} (${c.waitlist} คน)`).join(", "), href: "/classes" });
      }
    }

    if (summary && summary.failedThisMonth > 0) {
      list.push({ type: "red", title: `❌ ชำระเงินล้มเหลว ${summary.failedThisMonth} รายการเดือนนี้`, desc: "ตรวจสอบรายการในหน้า Payments", href: "/payments" });
    }

    if (users && stats.expired > 0) {
      list.push({ type: "blue", title: `📦 แพ็กเกจหมดอายุ ${stats.expired} ราย`, desc: "สมาชิกที่ควรต่ออายุหรือซื้อแพ็กเกจใหม่", href: "/users" });
    }

    return list;
  }, [users, todayClasses, summary, stats]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard
          icon="👥" label="สมาชิกทั้งหมด"
          value={stats.total}
          sub={`ใช้งาน ${stats.active + stats.low} ราย`}
          color="orange" href="/users" loading={loading}
        />
        <StatCard
          icon="⚠️" label="แพ็กเกจใกล้หมด"
          value={stats.low}
          sub={stats.low > 0 ? "ต้องดำเนินการ" : "ทุกอย่างปกติ"}
          color={stats.low > 0 ? "orange" : "green"} href="/users" loading={loading}
        />
        <StatCard
          icon="🗓️" label="คลาสวันนี้"
          value={todayStats.count}
          sub={todayStats.count > 0 ? `${todayStats.totalBooked}/${todayStats.totalCap} ที่นั่ง` : "ไม่มีคลาส"}
          color="blue" href="/classes" loading={loading}
        />
        <StatCard
          icon="💰" label="รายได้เดือนนี้"
          value={formatBaht(summary?.revenueThisMonth ?? 0)}
          sub={`${summary?.successThisMonth ?? 0} รายการสำเร็จ`}
          color="green" href="/payments" loading={loading}
        />
      </div>

      {/* ── Today classes + alerts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <TodayClassesCard classes={todayClasses} loading={loading} />
        <AlertsCard alerts={alerts} loading={loading} />
      </div>

      {/* ── Payment summary ── */}
      <PaymentBar summary={summary} loading={loading} />

    </div>
  );
}
