"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("error") === "unauthorized") {
      setError("บัญชีของคุณถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
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
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>เข้าสู่ระบบ</div>
          <div style={{ fontSize: 11, color: "var(--tm)", marginBottom: 22 }}>
            กรุณากรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน
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
            <div style={{ marginBottom: 14 }}>
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

            <div style={{ marginBottom: 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--t2)",
                    letterSpacing: ".3px",
                  }}
                >
                  รหัสผ่าน
                </label>
                <a
                  href="/forgot-password"
                  style={{
                    fontSize: 11,
                    color: "var(--accent)",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  ลืมรหัสผ่าน?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
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
              }}
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "var(--t3)" }}>
          ProKick Admin Portal · สำหรับเจ้าหน้าที่เท่านั้น
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
