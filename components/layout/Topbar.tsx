"use client";

import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/context/AuthContext";
import { Badge } from "@/components/ui/Badge";

const PAGE_META: Record<string, { title: string; crumb: string }> = {
  "/dashboard": { title: "Dashboard", crumb: "Overview & Analytics" },
  "/classes":   { title: "Class & Sessions", crumb: "จัดการคลาสและตารางเรียน" },
  "/users":     { title: "Users", crumb: "จัดการผู้ใช้และสมาชิก" },
  "/packages":  { title: "Packages", crumb: "จัดการแพ็กเกจ" },
  "/promo":     { title: "Promo Codes", crumb: "โปรโมชั่นโค้ด" },
  "/payments":  { title: "Payments", crumb: "การชำระเงิน" },
  "/settings":  { title: "Settings", crumb: "ตั้งค่าระบบ" },
  "/profile":   { title: "Manage Profile", crumb: "บัญชีผู้ดูแลระบบ" },
};

export function Topbar() {
  const pathname = usePathname();
  const { portalUser, isAdmin, isCoach, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const meta =
    Object.entries(PAGE_META).find(([key]) => pathname.startsWith(key))?.[1] ??
    { title: "ProKick Admin", crumb: "" };

  const displayName = portalUser?.display_name || portalUser?.email?.split("@")[0] || "User";
  const initial = displayName.charAt(0).toUpperCase();

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <header
      style={{
        height: 54,
        background: "var(--card)",
        borderBottom: "1px solid var(--bd)",
        display: "flex",
        alignItems: "center",
        padding: "0 22px",
        gap: 12,
        flexShrink: 0,
        boxShadow: "var(--sh)",
      }}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{meta.title}</div>
        <div style={{ fontSize: 11, color: "var(--tm)", marginTop: 1 }}>{meta.crumb}</div>
      </div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 9, alignItems: "center" }}>
        {/* View-only badge for coaches */}
        {isCoach && (
          <div
            style={{
              padding: "3px 9px",
              background: "var(--blue-l, rgba(59,130,246,.12))",
              border: "1.5px solid var(--blue)",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              color: "var(--blue)",
              letterSpacing: ".3px",
            }}
          >
            👁 View Only
          </div>
        )}

        {/* Profile dropdown */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button
            onClick={() => setProfileOpen((v) => !v)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "5px 10px",
              background: "var(--bg)",
              border: "1.5px solid var(--bd2)",
              borderRadius: 8,
              cursor: "pointer",
              transition: "border-color .14s",
              userSelect: "none",
              fontFamily: "inherit",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: isAdmin
                  ? "linear-gradient(135deg, var(--accent), #E8901A)"
                  : "linear-gradient(135deg, var(--blue), var(--purple))",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 12, fontWeight: 700 }}>{displayName}</div>
              <div style={{ fontSize: 9, color: "var(--tm)" }}>
                {isAdmin ? "Admin" : "View only"}
              </div>
            </div>
            <span style={{ fontSize: 9, color: "var(--tm)" }}>▾</span>
          </button>

          {profileOpen && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                right: 0,
                background: "var(--card)",
                border: "1.5px solid var(--bd2)",
                borderRadius: 10,
                boxShadow: "var(--sh-lg)",
                width: 210,
                zIndex: 500,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  borderBottom: "1px solid var(--bd)",
                  background: "var(--bg)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700 }}>{displayName}</div>
                <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 2 }}>
                  {portalUser?.email}
                </div>
                <div style={{ marginTop: 6 }}>
                  <Badge variant={isAdmin ? "orange" : "blue"}>
                    {isAdmin ? "🔑 Admin" : "👁 View only"}
                  </Badge>
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => setProfileOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--t1)",
                  textDecoration: "none",
                }}
              >
                <span>👤</span> Manage Profile
              </Link>
              <div style={{ borderTop: "1px solid var(--bd)" }} />
              <button
                onClick={() => { setProfileOpen(false); signOut(); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "10px 14px",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--red)",
                  width: "100%",
                  background: "none",
                  border: "none",
                  fontFamily: "inherit",
                }}
              >
                <span>🚪</span> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
