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
  fetchAdminLogs,
  updateProfile,
  adjustPackageSessions,
  pausePackage,
  extendPackage,
} from "@/lib/db/users";
import type { AdminUser, AdminPackage, AdminBooking, AdminLog } from "@/lib/db/users";

interface Props {
  open: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onSaved?: (userId: string) => void;
}

const JERSEY_SIZES = ["XS","S","M","L","XL","XXL","3XL","4XL"];

function statusVariant(s: string): "green"|"orange"|"red"|"gray" {
  if (s === "Active") return "green";
  if (s === "Low")    return "orange";
  if (s === "Expired") return "red";
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

export function UserParentModal({ open, onClose, user, onSaved }: Props) {
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

  const activePkg = packages.find((p) => p.status === "active") ?? packages[0] ?? null;
  const [adjSessions, setAdjSessions] = useState(0);
  const [adjExtra,    setAdjExtra]    = useState(0);
  const [adjNote,     setAdjNote]     = useState("");
  const [savingAdj,   setSavingAdj]   = useState(false);
  const [pauseFrom,   setPauseFrom]   = useState("");
  const [pauseUntil,  setPauseUntil]  = useState("");
  const [savingPause, setSavingPause] = useState(false);
  const [extDays,     setExtDays]     = useState("");
  const [extNewDate,  setExtNewDate]  = useState("");
  const [savingExt,   setSavingExt]   = useState(false);

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
      const pkgs = await fetchUserPackages(user.id, null);
      setPackages(pkgs);
      const active = pkgs.find((p) => p.status === "active") ?? pkgs[0];
      if (active) { setAdjSessions(active.remainingSessions); setAdjExtra(active.extraSessionsPurchased); }
      setLogs(await fetchAdminLogs(user.id));
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

  async function handleAdjust() {
    if (!user || !activePkg) return;
    setSavingAdj(true);
    try {
      await adjustPackageSessions(activePkg.id, user.id, adjSessions, adjExtra, adjNote);
      showToast("บันทึก + Log แล้ว");
      await loadPackages();
      setAdjNote("");
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingAdj(false); }
  }

  async function handlePause() {
    if (!user || !activePkg || !pauseFrom || !pauseUntil) { showToast("กรุณาระบุวันเริ่ม-สิ้นสุด", "error"); return; }
    setSavingPause(true);
    try {
      await pausePackage(activePkg.id, user.id, pauseFrom, pauseUntil);
      showToast("Pause แล้ว");
      await loadPackages();
      setPauseFrom(""); setPauseUntil("");
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingPause(false); }
  }

  async function handleExtend() {
    if (!user || !activePkg) return;
    setSavingExt(true);
    try {
      let newDate = extNewDate;
      if (!newDate && extDays) {
        const d = new Date(activePkg.expiryDate);
        d.setDate(d.getDate() + Number(extDays));
        newDate = d.toISOString().split("T")[0];
      }
      if (!newDate) { showToast("ระบุวันหรือจำนวนวันที่ต้องการต่อ", "error"); setSavingExt(false); return; }
      await extendPackage(activePkg.id, user.id, newDate);
      showToast(`ต่ออายุถึง ${newDate} แล้ว`);
      await loadPackages();
      setExtDays(""); setExtNewDate("");
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingExt(false); }
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
      width={580}
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
            ) : activePkg ? (
              <>
                <div style={{ border: "1.5px solid var(--bd2)", borderRadius: 9, padding: 14, marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{activePkg.packageName}</div>
                    <Badge variant={statusVariant(user.status)}>● {user.status}</Badge>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--tm)", marginBottom: 6 }}>
                    {activePkg.startDate} – {activePkg.expiryDate}
                    {activePkg.pausedFrom && (
                      <span style={{ marginLeft: 8, color: "var(--orange)" }}>⏸ Paused {activePkg.pausedFrom}→{activePkg.pausedUntil}</span>
                    )}
                  </div>
                  <ProgressBar value={activePkg.totalSessions - activePkg.remainingSessions} max={activePkg.totalSessions} />

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, margin: "10px 0" }}>
                    {[
                      { v: activePkg.remainingSessions, l: "Sessions", c: "var(--green)" },
                      { v: activePkg.extraSessionsPurchased, l: "Extra", c: "var(--blue)" },
                      { v: activePkg.pausedFrom ? Math.max(0, Math.ceil((new Date(activePkg.pausedUntil!).getTime() - new Date(activePkg.pausedFrom).getTime()) / 86_400_000)) : 0, l: "วัน Pause", c: "var(--orange)" },
                    ].map((s, i) => (
                      <div key={i} style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: s.c }}>{s.v}</div>
                        <div style={{ fontSize: 9, color: "var(--tm)", marginTop: 2, fontWeight: 600, textTransform: "uppercase" }}>{s.l}</div>
                      </div>
                    ))}
                  </div>

                  {/* Pause / Extend */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 9 }}>
                    <div style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 11 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--tm)", marginBottom: 8 }}>⏸ Pause</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", gap: 5 }}>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>เริ่ม</div><input type="date" value={pauseFrom} onChange={(e) => setPauseFrom(e.target.value)} style={{ fontSize: 10, padding: "4px 7px" }} /></div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>สิ้นสุด</div><input type="date" value={pauseUntil} onChange={(e) => setPauseUntil(e.target.value)} style={{ fontSize: 10, padding: "4px 7px" }} /></div>
                        </div>
                        <Button variant="ghost" size="sm" style={{ width: "100%", fontSize: 10 }} onClick={handlePause} disabled={savingPause}>
                          {savingPause ? "กำลังบันทึก..." : "บันทึก"}
                        </Button>
                      </div>
                    </div>
                    <div style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 11 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--tm)", marginBottom: 8 }}>📅 Extend</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ display: "flex", gap: 5, alignItems: "flex-end" }}>
                          <div><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>+วัน</div><input type="number" placeholder="+7" value={extDays} onChange={(e) => setExtDays(e.target.value)} style={{ width: 55, fontSize: 11, padding: "4px 6px", textAlign: "center" }} /></div>
                          <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>หรือวันใหม่</div><input type="date" value={extNewDate} onChange={(e) => setExtNewDate(e.target.value)} style={{ fontSize: 10, padding: "4px 7px" }} /></div>
                        </div>
                        <Button variant="ghost" size="sm" style={{ width: "100%", fontSize: 10 }} onClick={handleExtend} disabled={savingExt}>
                          {savingExt ? "กำลังบันทึก..." : "บันทึก"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Adjust sessions */}
                  <div style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 11 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--tm)", marginBottom: 8 }}>🔧 Adjust Sessions / Extra</div>
                    <div style={{ display: "grid", gridTemplateColumns: "auto auto 1fr auto", gap: 7, alignItems: "end" }}>
                      <div><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>Sessions</div><input className="ie" type="number" value={adjSessions} min={0} onChange={(e) => setAdjSessions(Number(e.target.value))} /></div>
                      <div><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>Extra</div><input className="ie" type="number" value={adjExtra} min={0} onChange={(e) => setAdjExtra(Number(e.target.value))} /></div>
                      <div><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>หมายเหตุ</div><input type="text" placeholder="ระบุเหตุผล..." value={adjNote} onChange={(e) => setAdjNote(e.target.value)} style={{ fontSize: 11, padding: "5px 8px", width: "100%" }} /></div>
                      <Button variant="primary" size="sm" onClick={handleAdjust} disabled={savingAdj}>{savingAdj ? "..." : "บันทึก"}</Button>
                    </div>
                  </div>
                </div>

                {/* Log */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", marginBottom: 7 }}>📋 Log การแก้ไข</div>
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
            ) : (
              <div style={{ textAlign: "center", padding: 32, color: "var(--tm)", fontSize: 13 }}>ไม่มีแพ็กเกจ active</div>
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
