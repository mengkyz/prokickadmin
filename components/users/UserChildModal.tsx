"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/lib/context/ToastContext";
import {
  fetchUserPackages,
  fetchUserBookings,
  updateChildProfile,
  adjustPackageSessions,
} from "@/lib/db/users";
import type { AdminChild, AdminPackage, AdminBooking } from "@/lib/db/users";

interface Props {
  open: boolean;
  onClose: () => void;
  child: AdminChild | null;
  onSaved?: () => void;
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

export function UserChildModal({ open, onClose, child, onSaved }: Props) {
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
  const [packages,   setPackages]   = useState<AdminPackage[]>([]);
  const [bookings,   setBookings]   = useState<AdminBooking[]>([]);
  const [loadingPkg, setLoadingPkg] = useState(false);
  const [loadingBk,  setLoadingBk]  = useState(false);

  const activePkg = packages.find((p) => p.status === "active") ?? packages[0] ?? null;
  const [adjSessions, setAdjSessions] = useState(0);
  const [adjNote,     setAdjNote]     = useState("");
  const [savingAdj,   setSavingAdj]   = useState(false);

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
      const pkgs = await fetchUserPackages(child.parentId, child.id);
      setPackages(pkgs);
      const active = pkgs.find((p) => p.status === "active") ?? pkgs[0];
      if (active) setAdjSessions(active.remainingSessions);
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

  async function handleAdjust() {
    if (!child || !activePkg) return;
    setSavingAdj(true);
    try {
      await adjustPackageSessions(
        activePkg.id, child.parentId,
        adjSessions, activePkg.extraSessionsPurchased, adjNote
      );
      showToast("บันทึกแล้ว");
      await loadPackages();
      setAdjNote("");
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingAdj(false); }
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
        tab === 0
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
            ) : activePkg ? (
              <div style={{ border: "1.5px solid var(--bd2)", borderRadius: 9, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{activePkg.packageName}</div>
                  <Badge variant={child.status === "Active" ? "green" : child.status === "Low" ? "orange" : child.status === "Expired" ? "red" : "gray"}>
                    ● {child.status}
                  </Badge>
                </div>
                <div style={{ fontSize: 11, color: "var(--tm)", marginBottom: 10 }}>
                  {activePkg.startDate} – {activePkg.expiryDate}
                </div>
                <ProgressBar value={activePkg.totalSessions - activePkg.remainingSessions} max={activePkg.totalSessions} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, margin: "10px 0" }}>
                  {[
                    { v: activePkg.remainingSessions, l: "Sessions", c: "var(--green)" },
                    { v: activePkg.extraSessionsPurchased || "—", l: "Extra", c: "var(--tm)" },
                    { v: activePkg.totalSessions, l: "Total", c: "var(--blue)" },
                  ].map((s, i) => (
                    <div key={i} style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 9, color: "var(--tm)", marginTop: 2, fontWeight: 600, textTransform: "uppercase" }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 11 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--tm)", marginBottom: 8 }}>🔧 Adjust Sessions</div>
                  <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 7, alignItems: "end" }}>
                    <div>
                      <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>Sessions คงเหลือ</div>
                      <input className="ie" type="number" value={adjSessions} min={0} onChange={(e) => setAdjSessions(Number(e.target.value))} />
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>หมายเหตุ</div>
                      <input type="text" placeholder="ระบุเหตุผล..." value={adjNote} onChange={(e) => setAdjNote(e.target.value)} style={{ fontSize: 11, padding: "5px 8px", width: "100%" }} />
                    </div>
                    <Button variant="primary" size="sm" onClick={handleAdjust} disabled={savingAdj}>
                      {savingAdj ? "..." : "บันทึก"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: 32, color: "var(--tm)", fontSize: 13 }}>ไม่มีแพ็กเกจ active</div>
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
