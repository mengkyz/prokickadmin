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
  updateChildProfile,
} from "@/lib/db/users";
import type { AdminChild, AdminPackage, AdminBooking, AdminLog } from "@/lib/db/users";
import { PackageEditorSection } from "./PackageEditorSection";

interface Props {
  open: boolean;
  onClose: () => void;
  child: AdminChild | null;
  onSaved?: () => void;
  isReadOnly?: boolean;
}

const JERSEY_SIZES = ["XS","S","M","L","XL","XXL","3XL","4XL"];

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
  return "Confirmed";
}

export function UserChildModal({ open, onClose, child, onSaved, isReadOnly = false }: Props) {
  const { showToast } = useToast();
  const [tab, setTab] = useState(0);
  const tabs = ["ข้อมูลนักเรียน", "แพ็กเกจ", "ประวัติการจอง"];

  // ── Child form ────────────────────────────────────────
  const [nickname,      setNickname]      = useState("");
  const [birthDate,     setBirthDate]     = useState("");
  const [height,        setHeight]        = useState("");
  const [weight,        setWeight]        = useState("");
  const [jerseySize,    setJerseySize]    = useState("S");
  const [adminNotes,    setAdminNotes]    = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // ── Package & booking data ────────────────────────────
  const [packages,     setPackages]     = useState<AdminPackage[]>([]);
  const [bookings,     setBookings]     = useState<AdminBooking[]>([]);
  const [loadingPkg,   setLoadingPkg]   = useState(false);
  const [loadingBk,    setLoadingBk]    = useState(false);
  const [logs,         setLogs]         = useState<AdminLog[]>([]);

  // Sync form when child prop changes
  useEffect(() => {
    if (child) {
      setNickname(child.nickname ?? "");
      setBirthDate(child.birthDate ?? "");
      setHeight(child.heightCm != null ? String(child.heightCm) : "");
      setWeight(child.weightKg != null ? String(child.weightKg) : "");
      setJerseySize(child.jerseySize ?? "S");
      setAdminNotes(child.adminNotes ?? "");
      setTab(0);
    }
  }, [child]);

  const loadPackages = useCallback(async () => {
    if (!child) return;
    setLoadingPkg(true);
    try {
      const [pkgs, adminLogs] = await Promise.all([
        fetchUserPackages(child.parentId, child.id),
        fetchAdminLogs(child.parentId, child.id),
      ]);
      setPackages(pkgs);
      setLogs(adminLogs);
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setLoadingPkg(false); }
  }, [child, showToast]);

  const loadBookings = useCallback(async () => {
    if (!child) return;
    setLoadingBk(true);
    try { setBookings(await fetchUserBookings(child.parentId, child.id)); }
    catch (err) { showToast((err as Error).message, "error"); }
    finally { setLoadingBk(false); }
  }, [child, showToast]);

  useEffect(() => {
    if (!open) return;
    if (tab === 1) loadPackages();
    if (tab === 2) loadBookings();
  }, [open, tab, loadPackages, loadBookings]);

  async function handleSaveProfile() {
    if (!child) return;
    setSavingProfile(true);
    try {
      await updateChildProfile(child.id, child.parentId, {
        nickname, birthDate,
        heightCm: height ? Number(height) : null,
        weightKg: weight ? Number(weight) : null,
        jerseySize, adminNotes,
      });
      showToast("บันทึกข้อมูลแล้ว");
      onSaved?.();
      onClose();
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingProfile(false); }
  }

  function calcAge(dob: string | null) {
    if (!dob) return null;
    return new Date().getFullYear() - new Date(dob).getFullYear();
  }

  if (!child) return null;
  const age = calcAge(child.birthDate);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: child.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff" }}>
            {child.avatarInitial}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{child.nickname}</div>
            <div style={{ fontSize: 11, color: "var(--tm)" }}>นักเรียน · ลูกของ {child.parentName}</div>
          </div>
        </div>
      }
      width={520}
      footer={
        tab === 0 && !isReadOnly
          ? <DefaultFooter onCancel={onClose} onConfirm={handleSaveProfile} confirmLabel={savingProfile ? "กำลังบันทึก..." : "บันทึก"} />
          : <Button variant="ghost" onClick={onClose}>ปิด</Button>
      }
    >
      <div style={{ margin: "-16px -20px 0" }}>
        {/* Tabs */}
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
          {/* ── Tab 0: Student Info ── */}
          {tab === 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: child.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff" }}>
                  {child.avatarInitial}
                </div>
              </div>
              <FormGrid>
                <FormItem label="ชื่อเล่น" full>
                  <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
                </FormItem>
                <FormItem label={`วันเกิด${age != null ? ` (อายุ ${age} ปี)` : ""}`} full>
                  <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                </FormItem>
                <FormItem label="ส่วนสูง (ซม.)">
                  <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="ซม." />
                </FormItem>
                <FormItem label="น้ำหนัก (กก.)">
                  <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="กก." />
                </FormItem>
                <FormItem label="ไซส์เสื้อ" full>
                  <select value={jerseySize} onChange={(e) => setJerseySize(e.target.value)}>
                    {JERSEY_SIZES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </FormItem>
                <FormItem label="ผู้ปกครอง" full>
                  <input value={child.parentName} readOnly style={{ background: "#F3F4F6", color: "var(--tm)" }} />
                </FormItem>
                <FormItem label="หมายเหตุ / ข้อมูลพิเศษ" full>
                  <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="เช่น อาการแพ้, ข้อควรระวัง..." />
                </FormItem>
              </FormGrid>
            </>
          )}

          {/* ── Tab 1: Package ── */}
          {tab === 1 && (
            loadingPkg ? (
              <div style={{ textAlign: "center", padding: 32, color: "var(--tm)" }}>กำลังโหลด...</div>
            ) : (
              <>
                <PackageEditorSection
                  packages={packages}
                  userId={child.parentId}
                  childId={child.id}
                  onRefresh={loadPackages}
                />
                {/* Admin log — child-specific */}
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", marginBottom: 7 }}>📋 LOG การแก้ไข</div>
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

          {/* ── Tab 2: Booking History ── */}
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
