"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/ToastContext";
import {
  fetchUserPackages,
  fetchUserBookings,
  fetchAdminLogs,
  updateProfile,
} from "@/lib/db/users";
import type { AdminUser, AdminPackage, AdminBooking, AdminLog, AdminChild } from "@/lib/db/users";
import { PackageEditorSection } from "./PackageEditorSection";

interface Props {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSaved?: (userId: string) => void;
  onOpenChild?: (child: AdminChild) => void;
}

const JERSEY_SIZES = ["XS","S","M","L","XL","XXL","3XL","4XL"];

function statusVariant(s: string): "green"|"orange"|"red"|"gray" {
  if (s === "Active") return "green";
  if (s === "Low")    return "orange";
  if (s === "Expired") return "red";
  if (s === "Inactive") return "gray";
  return "gray";
}
function attVariant(s: string): "green"|"red"|"orange"|"gray" {
  if (s === "attended")  return "green";
  if (s === "no-show" || s === "cancelled") return "red";
  if (s === "waitlist")  return "orange";
  return "gray";
}
function attLabel(s: string) {
  if (s === "attended")  return "✓ Attended";
  if (s === "no-show")   return "✕ No-show";
  if (s === "cancelled") return "ยกเลิก";
  if (s === "waitlist")  return "Waitlist";
  if (s === "confirmed") return "Confirmed";
  return s;
}

// ── Main modal ────────────────────────────────────────────
export function UserParentModal({ open, onClose, user, onSaved, onOpenChild }: Props) {
  const { showToast } = useToast();
  const [tab, setTab] = useState(0);
  const tabs = ["ข้อมูลส่วนตัว", "แพ็กเกจ", "ประวัติการจอง"];

  // ── Profile form ──────────────────────────────────────
  const [fullName,   setFullName]   = useState("");
  const [phone,      setPhone]      = useState("");
  const [nickname,   setNickname]   = useState("");
  const [birthDate,  setBirthDate]  = useState("");
  const [height,     setHeight]     = useState("");
  const [weight,     setWeight]     = useState("");
  const [jerseySize, setJerseySize] = useState("M");
  const [adminNotes, setAdminNotes] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Package data ──────────────────────────────────────
  const [packages,   setPackages]   = useState<AdminPackage[]>([]);
  const [bookings,   setBookings]   = useState<AdminBooking[]>([]);
  const [logs,       setLogs]       = useState<AdminLog[]>([]);
  const [loadingPkg, setLoadingPkg] = useState(false);
  const [loadingBk,  setLoadingBk]  = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? "");
      setPhone(user.phone ?? "");
      setNickname(user.nickname ?? "");
      setBirthDate(user.birthDate ?? "");
      setHeight(user.heightCm != null ? String(user.heightCm) : "");
      setWeight(user.weightKg != null ? String(user.weightKg) : "");
      setJerseySize(user.jerseySize ?? "M");
      setAdminNotes(user.adminNotes ?? "");
      setTab(0);
    }
  }, [user]);

  const loadPackages = useCallback(async () => {
    if (!user) return;
    setLoadingPkg(true);
    try {
      const [pkgs, adminLogs] = await Promise.all([
        fetchUserPackages(user.id, null),
        fetchAdminLogs(user.id),
      ]);
      setPackages(pkgs);
      setLogs(adminLogs);
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setLoadingPkg(false); }
  }, [user, showToast]);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    setLoadingBk(true);
    try { setBookings(await fetchUserBookings(user.id, null)); }
    catch (err) { showToast((err as Error).message, "error"); }
    finally { setLoadingBk(false); }
  }, [user, showToast]);

  useEffect(() => {
    if (!open) return;
    if (tab === 1) loadPackages();
    if (tab === 2) loadBookings();
  }, [open, tab, loadPackages, loadBookings]);

  async function handleSaveProfile() {
    if (!user) return;
    setSavingProfile(true);
    try {
      await updateProfile(user.id, {
        fullName, phone, nickname, birthDate,
        heightCm: height ? Number(height) : null,
        weightKg: weight ? Number(weight) : null,
        jerseySize, adminNotes,
      });
      showToast("บันทึกข้อมูลแล้ว");
      onSaved?.(user.id);
      onClose();
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingProfile(false); }
  }

  if (!user) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: user.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff" }}>
            {user.avatarInitial}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{user.fullName}</div>
            <div style={{ fontSize: 11, color: "var(--tm)" }}>
              {user.types.join(" + ")}
              {user.children.length > 0 && ` · ${user.children.length} เด็ก (${user.children.map(c => c.nickname).join(", ")})`}
            </div>
          </div>
        </div>
      }
      width={680}
      footer={
        tab === 0
          ? <DefaultFooter onCancel={onClose} onConfirm={handleSaveProfile} confirmLabel={savingProfile ? "กำลังบันทึก..." : "บันทึก"} />
          : <Button variant="ghost" onClick={onClose}>ปิด</Button>
      }
    >
      <div style={{ margin: "-16px -20px 0" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--bd)", padding: "0 16px", background: "var(--card)" }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: "9px 13px", cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: tab === i ? "var(--accent)" : "var(--tm)",
              background: "none", border: "none",
              borderBottom: tab === i ? "2px solid var(--accent)" : "2px solid transparent",
              fontFamily: "inherit", marginBottom: -1,
            } as React.CSSProperties}>{t}</button>
          ))}
        </div>

        <div style={{ padding: 15 }}>
          {/* Tab 0: Personal Info */}
          {tab === 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: user.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff" }}>
                  {user.avatarInitial}
                </div>
              </div>
              <FormGrid>
                <FormItem label="ชื่อจริง-นามสกุล" full><input value={fullName} onChange={(e) => setFullName(e.target.value)} /></FormItem>
                <FormItem label="เบอร์โทรศัพท์"><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></FormItem>
                <FormItem label="ชื่อเล่น"><input value={nickname} onChange={(e) => setNickname(e.target.value)} /></FormItem>
                <FormItem label="วันเกิด"><input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} /></FormItem>
                <FormItem label="ส่วนสูง (ซม.)"><input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="ซม." /></FormItem>
                <FormItem label="น้ำหนัก (กก.)"><input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="กก." /></FormItem>
                <FormItem label="ไซส์เสื้อ" full>
                  <select value={jerseySize} onChange={(e) => setJerseySize(e.target.value)}>
                    {JERSEY_SIZES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </FormItem>
                <FormItem label="หมายเหตุ (Admin)" full>
                  <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="บันทึกภายในสำหรับ Admin..." />
                </FormItem>
              </FormGrid>
            </>
          )}

          {/* Tab 1: Package */}
          {tab === 1 && (
            loadingPkg ? (
              <div style={{ textAlign: "center", padding: 32, color: "var(--tm)" }}>กำลังโหลด...</div>
            ) : (
              <>
                {/* Parent section */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: user.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {user.avatarInitial}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>{user.fullName}</div>
                    <div style={{ fontSize: 10, color: "var(--tm)" }}>แพ็กเกจส่วนตัว</div>
                  </div>
                </div>

                <PackageEditorSection
                  packages={packages}
                  userId={user.id}
                  childId={null}
                  onRefresh={loadPackages}
                />

                {/* Children overview */}
                {user.children.length > 0 && (
                  <>
                    <div style={{ margin: "16px 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 1, background: "var(--bd)" }} />
                      <div style={{ fontSize: 10, color: "var(--tm)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>เด็กในปกครอง</div>
                      <div style={{ flex: 1, height: 1, background: "var(--bd)" }} />
                    </div>
                    {user.children.map((child) => (
                      <div key={child.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1.5px solid var(--bd)", borderRadius: 9, marginBottom: 8, background: "var(--bg)" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: child.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {child.avatarInitial}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>{child.nickname}</div>
                          <div style={{ fontSize: 10, color: "var(--tm)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {child.activePackage
                              ? `${child.activePackage.packageName} · หมด ${child.activePackage.expiryDate}`
                              : "ยังไม่มีแพ็กเกจ"}
                          </div>
                        </div>
                        <Badge variant={child.status === "Active" ? "green" : child.status === "Low" ? "orange" : child.status === "Expired" ? "red" : "gray"}>
                          ● {child.status}
                        </Badge>
                        {onOpenChild && (
                          <Button variant="ghost" size="sm" style={{ fontSize: 11, whiteSpace: "nowrap" }} onClick={() => onOpenChild(child)}>
                            จัดการ →
                          </Button>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {/* Admin log */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", marginBottom: 7 }}>📋 Log การแก้ไข (ผู้ปกครอง + เด็ก)</div>
                  {logs.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--tm)", padding: "12px 0" }}>ยังไม่มี log</div>
                  ) : logs.slice(0, 10).map((entry, i) => (
                    <div key={entry.id} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "8px 0", borderBottom: i < Math.min(logs.length, 10) - 1 ? "1px solid var(--bd)" : "none", fontSize: 11 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: entry.dotColor, flexShrink: 0, marginTop: 2 }} />
                      <div style={{ color: "var(--tm)", fontFamily: "'JetBrains Mono',monospace", minWidth: 110, flexShrink: 0, fontSize: 10 }}>
                        {new Date(entry.createdAt).toLocaleString("th-TH", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{entry.action}</div>
                        <div style={{ color: "var(--t2)", fontSize: 10 }}>{entry.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}

          {/* Tab 2: Booking History */}
          {tab === 2 && (
            loadingBk ? (
              <div style={{ textAlign: "center", padding: 32, color: "var(--tm)" }}>กำลังโหลด...</div>
            ) : bookings.length === 0 ? (
              <div style={{ textAlign: "center", padding: 32, color: "var(--tm)", fontSize: 13 }}>ยังไม่มีประวัติการจอง</div>
            ) : (
              <table>
                <thead><tr><th>วันที่</th><th>สนาม</th><th>เวลา</th><th>สถานะ</th></tr></thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td className="pk-mono">{b.date}</td>
                      <td style={{ fontSize: 12 }}>{b.venue}</td>
                      <td className="pk-mono">{b.time}</td>
                      <td><Badge variant={attVariant(b.attendanceStatus)}>{attLabel(b.attendanceStatus)}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </Modal>
  );
}
