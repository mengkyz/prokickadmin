"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/classes", icon: "🗓️", label: "Class & Sessions", badge: 0 },
  { href: "/users", icon: "👥", label: "Users" },
  { href: "/packages", icon: "📦", label: "Packages" },
  { href: "/promo", icon: "🏷️", label: "Promo Codes" },
  { href: "/payments", icon: "💳", label: "Payments" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: 220,
        height: "100vh",
        background: "var(--sidebar-bg)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "16px 14px",
          borderBottom: "1px solid rgba(255,255,255,.07)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            background: "linear-gradient(135deg, var(--accent), #E8901A)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 800,
            color: "#fff",
            flexShrink: 0,
          }}
        >
          PK
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
            Pro<span style={{ color: "var(--accent)" }}>Kick</span>
          </div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".8px", marginTop: 1 }}>
            Admin Portal
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: 8, overflowY: "auto" }}>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 10px",
                borderRadius: 7,
                cursor: "pointer",
                color: isActive ? "#fff" : "rgba(255,255,255,.55)",
                fontWeight: isActive ? 600 : 500,
                fontSize: 13,
                marginBottom: 1,
                background: isActive ? "var(--accent)" : "transparent",
                textDecoration: "none",
                transition: "all 0.12s",
              }}
            >
              <span style={{ fontSize: 14, width: 18, textAlign: "center", flexShrink: 0 }}>
                {item.icon}
              </span>
              {item.label}
              {item.badge ? (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "var(--red)",
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "1px 6px",
                    borderRadius: 10,
                  }}
                >
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {/* Footer — admin info */}
      <div style={{ padding: 8, borderTop: "1px solid rgba(255,255,255,.07)" }}>
        <Link
          href="/profile"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "7px 9px",
            borderRadius: 7,
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--blue), var(--purple))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            A
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.85)" }}>Admin</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)" }}>Super Admin</div>
          </div>
        </Link>
      </div>
    </aside>
  );
}
