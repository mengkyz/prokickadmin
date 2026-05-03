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
import { ALL_VIEWONLY_PAGES } from "@/lib/types/auth";

function PageAccessCell({
  user,
  pageLabels,
  onEdit,
}: {
  user: PortalUser;
  pageLabels: Record<string, string>;
  onEdit: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const pages = user.allowed_pages ?? [...ALL_VIEWONLY_PAGES];
  const isAll = pages.length >= ALL_VIEWONLY_PAGES.length;
  const isNone = pages.length === 0;
  const label = isNone ? "ไม่มีสิทธิ์" : isAll ? "ทุกหน้า" : `${pages.length}/${ALL_VIEWONLY_PAGES.length} หน้า`;
  const labelColor = isNone ? "var(--red)" : "var(--tm)";
  const tooltipLines = isAll
    ? ALL_VIEWONLY_PAGES.map((p) => pageLabels[p] ?? p)
    : pages.map((p) => pageLabels[p] ?? p);

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={onEdit}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="คลิกเพื่อแก้ไขสิทธิ์หน้า"
        style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "none",
          borderWidth: "1.5px", borderStyle: "dashed",
          borderColor: hovered ? "var(--accent)" : "transparent",
          borderRadius: 6, padding: "3px 6px", cursor: "pointer",
          transition: "border-color 0.13s",
        }}
      >
        <span style={{ fontSize: 11, color: labelColor, fontWeight: isNone ? 700 : 400 }}>
          {label}
        </span>
        <span style={{ fontSize: 10, color: "var(--tm)", opacity: hovered ? 1 : 0.4, transition: "opacity 0.13s" }}>✏️</span>
      </button>

      {hovered && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: "50%",
          transform: "translateX(-50%)", zIndex: 50,
          background: "var(--sidebar-bg, #1a1a2e)", color: "#fff",
          borderRadius: 8, padding: "8px 10px", fontSize: 11, lineHeight: 1.7,
          whiteSpace: "nowrap", boxShadow: "0 4px 16px rgba(0,0,0,.25)",
          pointerEvents: "none",
        }}>
          {isNone ? (
            <span style={{ color: "#fca5a5" }}>ไม่มีหน้าที่เข้าถึงได้</span>
          ) : (
            tooltipLines.map((line) => <div key={line}>{line}</div>)
          )}
          {/* arrow */}
          <div style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            width: 0, height: 0,
            borderLeft: "5px solid transparent", borderRight: "5px solid transparent",
            borderTop: "5px solid var(--sidebar-bg, #1a1a2e)",
          }} />
        </div>
      )}
    </div>
  );
}

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
  const [deleteTarget, setDeleteTarget] = useState<PortalUser | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "view_only">("view_only");
  const [invitePassword, setInvitePassword] = useState("");
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState("");
  const [inviting, setInviting] = useState(false);

  // ── Manage pages (admin only) ─────────────────────────────
  const [pagesTarget, setPagesTarget] = useState<PortalUser | null>(null);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  const [savingPages, setSavingPages] = useState(false);

  const PAGE_LABELS: Record<string, string> = {
    dashboard: "📊 Dashboard",
    classes:   "🗓️ Class & Sessions",
    users:     "👥 Users",
    packages:  "📦 Packages",
    payments:  "💳 Payments",
  };

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
    if (!inviteEmail) {
      showToast("กรุณากรอกอีเมล", "error");
      return;
    }
    if (!invitePassword || invitePassword.length < 8) {
      showToast("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", "error");
      return;
    }
    if (invitePassword !== inviteConfirmPassword) {
      showToast("รหัสผ่านไม่ตรงกัน", "error");
      return;
    }
    setInviting(true);
    const res = await fetch("/api/portal-users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: inviteEmail,
        display_name: inviteName || null,
        role: inviteRole,
        invited_by: portalUser?.id,
        password: invitePassword,
      }),
    });
    const json = await res.json();
    setInviting(false);
    if (!res.ok) {
      showToast("เกิดข้อผิดพลาด: " + json.error, "error");
    } else {
      showToast("สร้างบัญชีแล้ว · " + inviteEmail);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteRole("view_only");
      setInvitePassword("");
      setInviteConfirmPassword("");
      loadPortalUsers();
    }
  }

  async function handleDeletePortalUser() {
    if (!deleteTarget) return;
    setDeletingUser(true);
    const res = await fetch("/api/portal-users/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: deleteTarget.id }),
    });
    const json = await res.json();
    setDeletingUser(false);
    if (!res.ok) {
      showToast("เกิดข้อผิดพลาด: " + json.error, "error");
    } else {
      showToast(`ลบบัญชี "${deleteTarget.display_name || deleteTarget.email}" แล้ว`);
      setDeleteTarget(null);
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

  async function handleChangeRole(user: PortalUser, role: "admin" | "view_only") {
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

  function openPagesModal(user: PortalUser) {
    setPagesTarget(user);
    setSelectedPages(user.allowed_pages ?? [...ALL_VIEWONLY_PAGES]);
  }

  function togglePage(page: string) {
    setSelectedPages((prev) =>
      prev.includes(page) ? prev.filter((p) => p !== page) : [...prev, page]
    );
  }

  async function handleSavePages() {
    if (!pagesTarget) return;
    setSavingPages(true);
    const { error } = await supabase
      .from("portal_users")
      .update({ allowed_pages: selectedPages })
      .eq("id", pagesTarget.id);
    setSavingPages(false);
    if (error) {
      showToast("เกิดข้อผิดพลาด: " + error.message, "error");
    } else {
      showToast("บันทึกสิทธิ์หน้าแล้ว");
      setPagesTarget(null);
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
                    {isAdmin ? "🔑 Admin" : "👁 View only"}
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
      </div>

      {/* ── Portal Users Card (admin only) ───────────────── */}
      {isAdmin && (
        <div style={{ marginTop: 14 }}>
          <Card>
            <CardHeader
              icon="👥"
              title="บัญชีผู้ใช้ระบบ (Portal Users)"
              actions={
                <Button variant="primary" size="sm" onClick={() => setInviteOpen(true)}>
                  + เพิ่มผู้ใช้ใหม่
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
                    <th style={{ width: "22%" }}>ชื่อ / อีเมล</th>
                    <th style={{ width: "18%" }}>บทบาท</th>
                    <th style={{ width: "16%" }}>หน้าที่เข้าถึงได้</th>
                    <th style={{ width: "12%" }}>สถานะ</th>
                    <th style={{ width: "16%" }}>เข้าใช้ล่าสุด</th>
                    <th style={{ width: "16%" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {portalUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--tm)", fontSize: 13 }}>
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
                              {u.role === "admin" ? "🔑 Admin" : "👁 View only"}
                            </Badge>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeRole(u, e.target.value as "admin" | "view_only")}
                              style={{
                                padding: "3px 7px", fontSize: 11, fontWeight: 600,
                                borderRadius: 6, border: "1.5px solid var(--bd2)",
                                background: "var(--bg)", color: "var(--t1)",
                                cursor: "pointer", fontFamily: "inherit",
                              }}
                            >
                              <option value="admin">🔑 Admin</option>
                              <option value="view_only">👁 View only</option>
                            </select>
                          )}
                        </td>
                        <td>
                          {u.role === "view_only" && !isSelf ? (
                            <PageAccessCell
                              user={u}
                              pageLabels={PAGE_LABELS}
                              onEdit={() => openPagesModal(u)}
                            />
                          ) : (
                            <span style={{ fontSize: 11, color: "var(--tm)", padding: "3px 6px" }}>ทุกหน้า</span>
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
                            <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                              <Button
                                variant={u.is_active ? "danger" : "ghost"}
                                size="sm"
                                onClick={() => handleToggleActive(u)}
                              >
                                {u.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteTarget(u)}
                                style={{ color: "var(--red)", border: "1.5px solid var(--red)" }}
                              >
                                ลบ
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {/* ── Invite Modal ──────────────────────────────────────── */}
      <Modal
        open={inviteOpen}
        onClose={() => {
          setInviteOpen(false);
          setInviteEmail("");
          setInviteName("");
          setInviteRole("view_only");
          setInvitePassword("");
          setInviteConfirmPassword("");
        }}
        title="👥 เพิ่มผู้ใช้ระบบใหม่"
        width={440}
        footer={
          <DefaultFooter
            onCancel={() => setInviteOpen(false)}
            onConfirm={handleInvite}
            confirmLabel={inviting ? "กำลังสร้างบัญชี..." : "สร้างบัญชี"}
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
              onChange={(e) => setInviteRole(e.target.value as "admin" | "view_only")}
            >
              <option value="view_only">👁 View only — ดูข้อมูลเท่านั้น</option>
              <option value="admin">🔑 Admin — จัดการทุกอย่าง</option>
            </select>
          </FormItem>
          <FormItem label="รหัสผ่านเริ่มต้น">
            <input
              type="password"
              value={invitePassword}
              onChange={(e) => setInvitePassword(e.target.value)}
              placeholder="อย่างน้อย 8 ตัวอักษร"
            />
          </FormItem>
          <FormItem label="ยืนยันรหัสผ่าน">
            <input
              type="password"
              value={inviteConfirmPassword}
              onChange={(e) => setInviteConfirmPassword(e.target.value)}
              placeholder="กรอกซ้ำรหัสผ่าน"
            />
          </FormItem>
        </FormGrid>
        <div style={{ marginTop: 10, padding: "10px 12px", background: "var(--bg)", borderRadius: 8, fontSize: 11, color: "var(--tm)", border: "1px solid var(--bd)" }}>
          🔑 บัญชีจะถูกสร้างทันที ผู้ใช้สามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่านที่ตั้งไว้ได้เลย
        </div>
      </Modal>
      {/* ── Manage Pages modal ───────────────────────────────── */}
      <Modal
        open={pagesTarget !== null}
        onClose={() => { if (!savingPages) setPagesTarget(null); }}
        title="🗂️ จัดการหน้าที่เข้าถึงได้"
        width={400}
        footer={
          <DefaultFooter
            onCancel={() => setPagesTarget(null)}
            onConfirm={handleSavePages}
            confirmLabel={savingPages ? "กำลังบันทึก..." : "💾 บันทึก"}
          />
        }
      >
        {pagesTarget && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--blue), var(--purple))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, fontWeight: 700, color: "#fff",
              }}>
                {(pagesTarget.display_name || pagesTarget.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {pagesTarget.display_name || pagesTarget.email.split("@")[0]}
                </div>
                <div style={{ fontSize: 10, color: "var(--tm)" }}>{pagesTarget.email}</div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: "var(--tm)", padding: "8px 10px", background: "var(--bg)", borderRadius: 7, border: "1px solid var(--bd)" }}>
              เลือกหน้าที่ผู้ใช้นี้สามารถเข้าถึงได้ หน้าที่ไม่ได้เลือกจะถูกซ่อนจาก sidebar
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {ALL_VIEWONLY_PAGES.map((page) => {
                const checked = selectedPages.includes(page);
                return (
                  <label
                    key={page}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                      border: `1.5px solid ${checked ? "var(--accent)" : "var(--bd)"}`,
                      background: checked ? "rgba(255,149,0,.06)" : "var(--bg)",
                      transition: "all 0.12s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePage(page)}
                      style={{ width: 15, height: 15, cursor: "pointer", accentColor: "var(--accent)" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: checked ? 600 : 400, color: checked ? "var(--t1)" : "var(--t2)" }}>
                      {PAGE_LABELS[page]}
                    </span>
                  </label>
                );
              })}
            </div>

            {selectedPages.length === 0 && (
              <div style={{ fontSize: 11, color: "var(--red)", padding: "8px 10px", background: "rgba(239,68,68,.06)", borderRadius: 7, border: "1px solid rgba(239,68,68,.2)" }}>
                ⚠️ ผู้ใช้นี้จะไม่มีสิทธิ์เข้าถึงหน้าใดเลย
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ── Delete portal user confirmation modal ────────────── */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => { if (!deletingUser) setDeleteTarget(null); }}
        title="ยืนยันการลบบัญชี"
        width={400}
        footer={
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", width: "100%" }}>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deletingUser}>
              ยกเลิก
            </Button>
            <button
              onClick={handleDeletePortalUser}
              disabled={deletingUser}
              style={{
                padding: "6px 16px",
                background: deletingUser ? "var(--bd2)" : "var(--red)",
                color: "#fff",
                border: "none",
                borderRadius: 7,
                cursor: deletingUser ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {deletingUser ? "กำลังลบ..." : "ยืนยันลบ"}
            </button>
          </div>
        }
      >
        {deleteTarget && (() => {
          const name = deleteTarget.display_name || deleteTarget.email.split("@")[0];
          const avatarChar = name.charAt(0).toUpperCase();
          return (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* User identity */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: deleteTarget.role === "admin"
                    ? "linear-gradient(135deg, var(--accent), #E8901A)"
                    : "linear-gradient(135deg, var(--blue), var(--purple))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16, fontWeight: 800, color: "#fff",
                }}>
                  {avatarChar}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{name}</div>
                  <div style={{ fontSize: 11, color: "var(--tm)" }}>{deleteTarget.email}</div>
                  <div style={{ marginTop: 4 }}>
                    <Badge variant={deleteTarget.role === "admin" ? "orange" : "blue"}>
                      {deleteTarget.role === "admin" ? "🔑 Admin" : "👁 View only"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Warning */}
              <div style={{ background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.25)", borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--red)", marginBottom: 4 }}>คำเตือน</div>
                <div style={{ fontSize: 12, color: "var(--t2)", lineHeight: 1.6 }}>
                  การลบบัญชีนี้จะเพิกถอนสิทธิ์การเข้าถึงระบบทันที และไม่สามารถย้อนกลับได้
                  ผู้ใช้จะไม่สามารถเข้าสู่ระบบได้อีก
                </div>
              </div>

              {/* Clarify difference vs deactivate */}
              <div style={{ background: "var(--bg)", border: "1px solid var(--bd)", borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "var(--tm)", lineHeight: 1.7 }}>
                💡 หากต้องการระงับชั่วคราวโดยไม่ลบข้อมูล ให้ใช้ปุ่ม <strong>ปิดใช้งาน</strong> แทน
              </div>
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
