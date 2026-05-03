"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Stage = "loading" | "ready" | "error" | "done";

export default function SetPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const searchParams = new URLSearchParams(window.location.search);

    // Supabase redirects here with ?error=... when the token is already expired/consumed
    if (searchParams.get("error") || searchParams.get("error_code")) {
      window.history.replaceState({}, "", "/set-password");
      setStage("error");
      return;
    }

    // PKCE flow: Supabase appends ?token_hash=xxx&type=recovery to the redirectTo URL
    const token_hash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (token_hash && type === "recovery") {
      supabase.auth
        .verifyOtp({ token_hash, type: "recovery" })
        .then(({ error }) => {
          if (error) {
            setStage("error");
          } else {
            // Clean the URL so the token_hash isn't visible / reusable
            window.history.replaceState({}, "", "/set-password");
            setStage("ready");
          }
        });
      return;
    }

    // Implicit flow fallback: Supabase puts tokens in the URL hash fragment
    const hash = window.location.hash.substring(1);
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const access_token = hashParams.get("access_token");
      const refresh_token = hashParams.get("refresh_token");
      const hashType = hashParams.get("type");

      if (access_token && refresh_token && hashType === "recovery") {
        supabase.auth
          .setSession({ access_token, refresh_token })
          .then(({ error }) => {
            if (error) {
              setStage("error");
            } else {
              window.history.replaceState({}, "", "/set-password");
              setStage("ready");
            }
          });
        return;
      }
    }

    // Already has a recovery session (e.g. arrived via /auth/callback)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStage("ready");
      } else {
        setStage("error");
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError("เกิดข้อผิดพลาด: " + updateError.message);
      return;
    }

    setStage("done");
    setTimeout(() => router.push("/dashboard"), 1500);
  }

  const containerStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--bg)",
    padding: "20px",
  };

  const logoBlock = (
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
  );

  const cardStyle: React.CSSProperties = {
    background: "var(--card)",
    border: "1.5px solid var(--bd2)",
    borderRadius: 14,
    padding: "28px 28px 24px",
    boxShadow: "var(--sh-lg)",
  };

  const footer = (
    <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "var(--t3)" }}>
      ProKick Admin Portal · สำหรับเจ้าหน้าที่เท่านั้น
    </div>
  );

  if (stage === "loading") {
    return (
      <div style={containerStyle}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {logoBlock}
          <div style={{ ...cardStyle, textAlign: "center", padding: "36px 28px" }}>
            <div style={{ fontSize: 13, color: "var(--tm)" }}>กำลังตรวจสอบลิงก์...</div>
          </div>
          {footer}
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div style={containerStyle}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {logoBlock}
          <div style={{ ...cardStyle, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>ลิงก์หมดอายุ</div>
            <div style={{ fontSize: 12, color: "var(--tm)", marginBottom: 24, lineHeight: 1.6 }}>
              ลิงก์รีเซ็ตรหัสผ่านนี้ใช้ไม่ได้หรือหมดอายุแล้ว
              <br />
              กรุณาขอลิงก์ใหม่อีกครั้ง
            </div>
            <button
              onClick={() => router.push("/forgot-password")}
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
              ขอลิงก์ใหม่
            </button>
          </div>
          {footer}
        </div>
      </div>
    );
  }

  if (stage === "done") {
    return (
      <div style={containerStyle}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          {logoBlock}
          <div style={{ ...cardStyle, textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>ตั้งรหัสผ่านสำเร็จ!</div>
            <div style={{ fontSize: 12, color: "var(--tm)", lineHeight: 1.6 }}>
              กำลังพาคุณเข้าสู่ระบบ...
            </div>
          </div>
          {footer}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        {logoBlock}

        <div style={cardStyle}>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>ตั้งรหัสผ่านใหม่</div>
          <div style={{ fontSize: 11, color: "var(--tm)", marginBottom: 22 }}>
            กรุณาตั้งรหัสผ่านใหม่เพื่อเข้าใช้งานระบบ
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
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="อย่างน้อย 8 ตัวอักษร"
                required
                autoFocus
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
                ยืนยันรหัสผ่าน
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="กรอกซ้ำรหัสผ่าน"
                required
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
              {loading ? "กำลังบันทึก..." : "ตั้งรหัสผ่านและเข้าสู่ระบบ"}
            </button>
          </form>
        </div>

        {footer}
      </div>
    </div>
  );
}
