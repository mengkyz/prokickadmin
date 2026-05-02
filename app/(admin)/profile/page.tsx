"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { useToast } from "@/lib/context/ToastContext";
import { useAuth } from "@/lib/context/AuthContext";
import { createClient } from "@/lib/supabase/client";
import type { PortalUser } from "@/lib/types/auth";

export default function ProfilePage() {
  const { portalUser, isAdmin, signOut } = useAuth();
  const { showToast } = useToast();
  const supabase = createClient();

  // ── Profile edit ─────────────────────────────────────────
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Password change ───────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // ── Portal users (admin only) ─────────────────────────────
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "coach">("coach");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (portalUser) {
      setDisplayName(portalUser.display_name || "");
    }
  }, [portalUser]);

  useEffect(() => {
    if (isAdmin) loadPortalUsers();
  }, [isAdmin]);

  async function loadPortalUsers() {
    setLoadingUsers(true);
    const { data } = await supabase
      .from("portal_users")
      .select("*")
      .order("created_at", { ascending: true });
    setPortalUsers(data ?? []);
    setLoadingUsers(false);
  }

  async function handleSaveProfile() {
    if (!portalUser) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("portal_users")
      .update({ display_name: displayName || null })
      .eq("id", portalUser.id);
    setSavingProfile(false);
    if (error) {
      showToast("เกิดข้อผิดพลาด: " + error.message, "error");
    } else {
      showToast("บันทึกชื่อแล้ว");
    }
  }

  async function handleChangePassword() {
    if (!newPassword) return;
    if (newPassword !== confirmPassword) {
      showToast("รหัสผ่านไม่ตรงกัน", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "error");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);
    if (error) {
      showToast("เปลี่ยนรหัสผ่านไม่สำเร็จ: " + error.message, "error");
    } else {
      showToast("เปลี่ยนรหัสผ่านแล้ว");
      setNewPassword("");
      setConfirmPassword("");
    }
  }

  async function handleInvite() {
    setInviting(true);
    const res = await fetch("/api/portal-users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        display_name: inviteName || null,
        role: inviteRole,
        invited_by: portalUser?.id,
      }),
    });
    const json = await res.json();
    setInviting(false);
    if (!res.ok) {
      showToast("เกิดข้อผิดพลาด: " + json.error, "error");
    } else {
      showToast("ส่งคำเชิญแล้ว · " + inviteEmail);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("coach");
      loadPortalUsers();
    }
  }

  async function handleToggleActive(user: PortalUser) {
    if (user.id === portalUser?.id) {
      showToast("ไม่สามารถปิดบัญชีตัวเองได้", "error");
      return;
    }
    const { error } = await supabase
      .from("portal_users")
      .update({ is_active: !user.is_active })
      .eq("id", user.id);
    if (error) {
      showToast("เกิดข้อผิดพลาด: " + error.message, "error");
    } else {
      showToast(user.is_active ? "ปิดบัญชีแล้ว" : "เปิดบัญชีแล้ว");
      loadPortalUsers();
    }
  }

  async function handleChangeRole(user: PortalUser, role: "admin" | "coach") {
    if (user.id === portalUser?.id) {
      showToast("ไม่สามารถเปลี่ยนบทบาทตัวเองได้", "error");
      return;
    }
    const { error } = await supabase
      .from("portal_users")
      .update({ role })
      .eq("id", user.id);
    if (error) {
      showToast("เกิดข้อผิดพลาด: " + error.message, "error");
    } else {
      showToast("เปลี่ยนบทบาทแล้ว");
      loadPortalUsers();
    }
  }

  const initial = (displayName || portalUser?.email || "?").charAt(0).toUpperCase();

  return (
    <>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>

        {/* ── Profile Card ─────────────────────────────────── */}
        <Card style={{ marginBottom: 14 }}>
          <CardHeader icon="👤" title="Manage Profile" />
          <div style={{ padding: 20 }}>

            {/* Avatar + Name */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid var(--bd)" }}>
              <div
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: isAdmin
                    ? "linear-gradient(135deg, var(--accent), #E8901A)"
                    : "linear-gradient(135deg, var(--blue), var(--purple))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800, color: "#fff",
                }}
              >
                {initial}
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>
                  {displayName || portalUser?.email?.split("@")[0] || "—"}
                </div>
                <div style={{ fontSize: 11, color: "var(--tm)", marginTop: 3 }}>
                  {portalUser?.email}
                </div>
                <div style={{ marginTop: 6 }}>
                  <Badge variant={isAdmin ? "orange" : "blue"}>
                    {isAdmin ? "🔑 Admin" : "👁 Coach"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Display name */}
            <FormGrid>
              <FormItem label="ชื่อที่แสดง (Display Name)" full>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="ชื่อที่แสดงในระบบ"
                />
              </FormItem>
            </FormGrid>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="primary"
                onClick={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? "กำลังบันทึก..." : "💾 บันทึกชื่อ"}
              </Button>
            </div>

            {/* Password change */}
            <div style={{ marginTop: 22, paddingTop: 18, borderTop: "1px solid var(--bd)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", color: "var(--tm)", marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}>
                🔐 เปลี่ยนรหัสผ่าน
                <span style={{ flex: 1, height: 1, background: "var(--bd)" }} />
              </div>
              <FormGrid>
                <FormItem label="รหัสผ่านใหม่">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                  />
                </FormItem>
                <FormItem label="ยืนยันรหัสผ่านใหม่">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="กรอกซ้ำรหัสผ่านใหม่"
                  />
                </FormItem>
              </FormGrid>
              <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="ghost"
                  onClick={handleChangePassword}
                  disabled={savingPassword || !newPassword}
                >
                  {savingPassword ? "กำลังเปลี่ยน..." : "🔑 เปลี่ยนรหัสผ่าน"}
                </Button>
              </div>
            </div>

            {/* Sign out */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--bd)", display: "flex", justifyContent: "flex-end" }}>
              <Button variant="danger" onClick={signOut}>🚪 ออกจากระบบ</Button>
            </div>
          </div>
        </Card>

        {/* ── Portal Users Card (admin only) ───────────────── */}
        {isAdmin && (
          <Card>
            <CardHeader
              icon="👥"
              title="บัญชีผู้ใช้ระบบ (Portal Users)"
              actions={
                <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
                  + เชิญผู้ใช้ใหม่
                </Button>
              }
            />

            {loadingUsers ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--tm)", fontSize: 13 }}>
                กำลังโหลด...
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ชื่อ / อีเมล</th>
                    <th>บทบาท</th>
                    <th>สถานะ</th>
                    <th>เข้าใช้ล่าสุด</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portalUsers.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: "center", padding: 24, color: "var(--tm)", fontSize: 13 }}>
                        ยังไม่มีบัญชีผู้ใช้ระบบ
                      </td>
                    </tr>
                  )}
                  {portalUsers.map((u) => {
                    const isSelf = u.id === portalUser?.id;
                    const name = u.display_name || u.email.split("@")[0];
                    const lastLogin = u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })
                      : "—";
                    return (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%",
                              background: u.role === "admin"
                                ? "linear-gradient(135deg, var(--accent), #E8901A)"
                                : "linear-gradient(135deg, var(--blue), var(--purple))",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
                            }}>
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>
                                {name}
                                {isSelf && (
                                  <span style={{ marginLeft: 5, fontSize: 9, color: "var(--tm)", fontWeight: 400 }}>(คุณ)</span>
                                )}
                              </div>
                              <div style={{ fontSize: 10, color: "var(--tm)" }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {isSelf ? (
                            <Badge variant={u.role === "admin" ? "orange" : "blue"}>
                              {u.role === "admin" ? "🔑 Admin" : "👁 Coach"}
                            </Badge>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u, e.target.value as "admin" | "coach")}
                              style={{
                                padding: "3px 7px", fontSize: 11, fontWeight: 600,
                                borderRadius: 6, border: "1.5px solid var(--bd2)",
                                background: "var(--bg)", color: "var(--t1)",
                                cursor: "pointer", fontFamily: "inherit",
                              }}
                            >
                              <option value="admin">🔑 Admin</option>
                              <option value="coach">👁 Coach</option>
                            </select>
                          )}
                        </td>
                        <td>
                          <Badge variant={u.is_active ? "green" : "gray"}>
                            {u.is_active ? "● Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td style={{ fontSize: 11, color: "var(--tm)" }}>{lastLogin}</td>
                        <td>
                          {!isSelf && (
                            <Button
                              variant={u.is_active ? "danger" : "ghost"}
                              size="sm"
                              onClick={() => handleToggleActive(u)}
                            >
                              {u.is_active ? "ปิดบัญชี" : "เปิดบัญชี"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        )}
      </div>

      {/* ── Invite Modal ─────────────────────────────────────── */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="👥 เชิญผู้ใช้ระบบใหม่"
        width={440}
        footer={
          <DefaultFooter
            onCancel={() => setInviteOpen(false)}
            onConfirm={handleInvite}
            confirmLabel={inviting ? "กำลังส่งคำเชิญ..." : "ส่งคำเชิญ"}
          />
        }
      >
        <FormGrid>
          <FormItem label="อีเมล" full>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="email@prokick.co.th"
            />
          </FormItem>
          <FormItem label="ชื่อที่แสดง" full>
            <input
              type="text"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="ชื่อ-นามสกุล (ไม่จำเป็น)"
            />
          </FormItem>
          <FormItem label="บทบาท" full>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "admin" | "coach")}
            >
              <option value="coach">👁 Coach — ดูข้อมูลเท่านั้น</option>
              <option value="admin">🔑 Admin — จัดการทุกอย่าง</option>
            </select>
          </FormItem>
        </FormGrid>
        <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--bg)", borderRadius: 8, fontSize: 11, color: "var(--tm)", border: "1px solid var(--bd)" }}>
          📧 ระบบจะส่งอีเมลคำเชิญไปยังที่อยู่นี้ ผู้ใช้สามารถตั้งรหัสผ่านได้เองผ่านลิงก์ในอีเมล
        </div>
      </Modal>
    </>
  );
}
