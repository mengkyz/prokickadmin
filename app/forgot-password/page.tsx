"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/set-password`,
    });

    setLoading(false);

    if (resetError) {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      return;
    }

    setSent(true);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 52,
              height: 52,
              background: "linear-gradient(135deg, var(--accent), #E8901A)",
              borderRadius: 14,
              fontSize: 20,
              fontWeight: 800,
              color: "#fff",
              marginBottom: 14,
            }}
          >
            PK
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px" }}>
            Pro<span style={{ color: "var(--accent)" }}>Kick</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--tm)", marginTop: 4, letterSpacing: ".5px" }}>
            Admin Portal
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: "var(--card)",
            border: "1.5px solid var(--bd2)",
            borderRadius: 14,
            padding: "28px 28px 24px",
            boxShadow: "var(--sh-lg)",
          }}
        >
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📧</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>ส่งอีเมลแล้ว!</div>
              <div style={{ fontSize: 12, color: "var(--tm)", marginBottom: 24, lineHeight: 1.6 }}>
                ตรวจสอบกล่องจดหมายของ <strong>{email}</strong>
                <br />
                คลิกลิงก์ในอีเมลเพื่อตั้งรหัสผ่านใหม่
              </div>
              <button
                onClick={() => router.push("/login")}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: 13,
                  fontWeight: 700,
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                กลับไปหน้าเข้าสู่ระบบ
              </button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>ลืมรหัสผ่าน</div>
              <div style={{ fontSize: 11, color: "var(--tm)", marginBottom: 22 }}>
                กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้
              </div>

              {error && (
                <div
                  style={{
                    background: "var(--red-l)",
                    border: "1.5px solid var(--red)",
                    borderRadius: 8,
                    padding: "9px 12px",
                    fontSize: 12,
                    color: "var(--red)",
                    marginBottom: 16,
                    fontWeight: 600,
                  }}
                >
                  ⚠ {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 22 }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--t2)",
                      marginBottom: 5,
                      letterSpacing: ".3px",
                    }}
                  >
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@prokick.co.th"
                    required
                    autoFocus
                    autoComplete="email"
                    style={{
                      width: "100%",
                      padding: "9px 11px",
                      fontSize: 13,
                      border: "1.5px solid var(--bd2)",
                      borderRadius: 8,
                      background: "var(--bg)",
                      color: "var(--t1)",
                      fontFamily: "inherit",
                      outline: "none",
                      boxSizing: "border-box",
                      transition: "border-color .14s",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "var(--bd2)")}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "10px",
                    fontSize: 13,
                    fontWeight: 700,
                    background: loading ? "var(--bd2)" : "var(--accent)",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    letterSpacing: ".2px",
                    transition: "background .14s",
                    marginBottom: 14,
                  }}
                >
                  {loading ? "กำลังส่ง..." : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
                </button>

                <div style={{ textAlign: "center" }}>
                  <button
                    type="button"
                    onClick={() => router.push("/login")}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 12,
                      color: "var(--tm)",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      textDecoration: "underline",
                    }}
                  >
                    กลับไปหน้าเข้าสู่ระบบ
                  </button>
                </div>
              </form>
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "var(--t3)" }}>
          ProKick Admin Portal · สำหรับเจ้าหน้าที่เท่านั้น
        </div>
      </div>
    </div>
  );
}
