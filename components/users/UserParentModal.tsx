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
  togglePackageStatus,
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

type PkgStatus = "Active" | "Low" | "Expired" | "Inactive";

function derivePkgStatus(pkg: AdminPackage): PkgStatus {
  if (pkg.status === "inactive") return "Inactive";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const expiry = new Date(pkg.expiryDate);
  if (expiry < today || pkg.status === "expired") return "Expired";
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86_400_000);
  if (pkg.remainingSessions <= 2 || daysLeft <= 7) return "Low";
  return "Active";
}

// ── Inner helper component ────────────────────────────────
interface PackageEditorSectionProps {
  packages: AdminPackage[];
  userId: string;
  childId: string | null;
  onRefresh: () => Promise<void>;
}

function PackageEditorSection({ packages, userId, childId, onRefresh }: PackageEditorSectionProps) {
  const { showToast } = useToast();

  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [adjSessions,  setAdjSessions]  = useState(0);
  const [adjExtra,     setAdjExtra]     = useState(0);
  const [adjNote,      setAdjNote]      = useState("");
  const [extDays,      setExtDays]      = useState("");
  const [extNewDate,   setExtNewDate]   = useState("");
  const [savingAdj,    setSavingAdj]    = useState(false);
  const [savingExt,    setSavingExt]    = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  // On packages load: pick active or first
  useEffect(() => {
    if (packages.length === 0) { setSelectedId(null); return; }
    if (!selectedId || !packages.find((p) => p.id === selectedId)) {
      const active = packages.find((p) => p.status === "active");
      setSelectedId((active ?? packages[0]).id);
    }
  }, [packages]); // eslint-disable-line react-hooks/exhaustive-deps

  const pkg = packages.find((p) => p.id === selectedId) ?? null;

  // Sync adjSessions/adjExtra from selected pkg
  useEffect(() => {
    if (pkg) {
      setAdjSessions(pkg.remainingSessions);
      setAdjExtra(pkg.extraSessionsPurchased);
    }
  }, [pkg?.remainingSessions, pkg?.extraSessionsPurchased]); // eslint-disable-line react-hooks/exhaustive-deps

  if (packages.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "18px 0", color: "var(--tm)", fontSize: 13 }}>
        ยังไม่มีแพ็กเกจ
      </div>
    );
  }

  const pkgStatus = pkg ? derivePkgStatus(pkg) : null;
  const isExpired = pkgStatus === "Expired";

  // Sorted for dropdown: active first
  const sortedPkgs = [...packages].sort((a, b) => {
    const order = (s: string) => (s === "active" ? 0 : s === "inactive" ? 1 : 2);
    return order(a.status) - order(b.status);
  });

  // Preview new expiry date for hint
  const previewDate: Date | null = (() => {
    if (extNewDate) return new Date(extNewDate);
    if (extDays && pkg) {
      const d = new Date(pkg.expiryDate);
      d.setDate(d.getDate() + Number(extDays));
      return d;
    }
    return null;
  })();
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const showActivateHint = isExpired && previewDate !== null && previewDate >= today;

  async function handleToggle() {
    if (!pkg) return;
    setSavingToggle(true);
    try {
      const newStatus = pkg.status === "inactive" ? "active" : "inactive";
      await togglePackageStatus(pkg.id, userId, newStatus);
      showToast(newStatus === "active" ? "เปิดใช้แพ็กเกจแล้ว" : "ปิดใช้แพ็กเกจแล้ว");
      await onRefresh();
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingToggle(false); }
  }

  async function handleExtend() {
    if (!pkg) return;
    setSavingExt(true);
    try {
      let newDate = extNewDate;
      if (!newDate && extDays) {
        const d = new Date(pkg.expiryDate);
        d.setDate(d.getDate() + Number(extDays));
        newDate = d.toISOString().split("T")[0];
      }
      if (!newDate) { showToast("ระบุวันหรือจำนวนวันที่ต้องการ", "error"); setSavingExt(false); return; }
      await extendPackage(pkg.id, userId, newDate);
      showToast(`อัปเดตวันหมดอายุเป็น ${newDate} แล้ว`);
      await onRefresh();
      setExtDays(""); setExtNewDate("");
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingExt(false); }
  }

  async function handleAdjust() {
    if (!pkg) return;
    setSavingAdj(true);
    try {
      await adjustPackageSessions(pkg.id, userId, adjSessions, adjExtra, adjNote);
      showToast("บันทึก + Log แล้ว");
      await onRefresh();
      setAdjNote("");
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingAdj(false); }
  }

  const sessionsUsed = pkg ? pkg.totalSessions - pkg.remainingSessions : 0;

  return (
    <div>
      {/* Package selector dropdown (only if more than 1 package) */}
      {packages.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ width: "100%", fontSize: 12, padding: "6px 9px" }}
          >
            {sortedPkgs.map((p) => {
              const st = derivePkgStatus(p);
              const expLabel = p.expiryDate ? `หมด ${p.expiryDate}` : "";
              return (
                <option key={p.id} value={p.id}>
                  {p.packageName} · {st} · {expLabel}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {pkg && (
        <div style={{ border: "1.5px solid var(--bd2)", borderRadius: 9, padding: 14, marginBottom: 12 }}>
          {/* Package name + badge + toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{pkg.packageName}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Badge variant={statusVariant(pkgStatus ?? "Active")}>● {pkgStatus}</Badge>
              {!isExpired && (
                <Button
                  variant="ghost"
                  size="sm"
                  style={{
                    fontSize: 10,
                    padding: "3px 9px",
                    border: pkg.status === "inactive"
                      ? "1.5px solid var(--green)"
                      : "1.5px solid var(--red)",
                    color: pkg.status === "inactive" ? "var(--green)" : "var(--red)",
                  }}
                  onClick={handleToggle}
                  disabled={savingToggle}
                >
                  {savingToggle ? "..." : pkg.status === "inactive" ? "เปิดใช้" : "ปิดใช้"}
                </Button>
              )}
            </div>
          </div>

          {/* Dates */}
          <div style={{ fontSize: 11, color: "var(--tm)", marginBottom: 8 }}>
            {pkg.startDate} – {pkg.expiryDate}
          </div>

          {/* Progress bar */}
          <ProgressBar value={sessionsUsed} max={pkg.totalSessions} />

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, margin: "10px 0" }}>
            {[
              { v: pkg.remainingSessions, l: "Sessions คงเหลือ", c: "var(--green)" },
              { v: pkg.extraSessionsPurchased, l: "Extra", c: "var(--blue)" },
              { v: sessionsUsed, l: "ใช้ไปแล้ว", c: "var(--tm)" },
            ].map((s, i) => (
              <div key={i} style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono',monospace", color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 9, color: "var(--tm)", marginTop: 2, fontWeight: 600, textTransform: "uppercase" }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Adjust Expiry */}
          <div style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 11, marginBottom: 9 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--tm)", marginBottom: 8 }}>📅 ปรับวันหมดอายุ</div>
            <div style={{ display: "grid", gridTemplateColumns: "70px auto 1fr auto", gap: 7, alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>±วัน</div>
                <input
                  type="number"
                  placeholder="±7"
                  value={extDays}
                  onChange={(e) => { setExtDays(e.target.value); setExtNewDate(""); }}
                  style={{ width: "100%", fontSize: 11, padding: "5px 6px", textAlign: "center" }}
                />
              </div>
              <div style={{ fontSize: 11, color: "var(--tm)", paddingBottom: 6, paddingLeft: 2, paddingRight: 2 }}>หรือ</div>
              <div>
                <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>วันที่ใหม่</div>
                <input
                  type="date"
                  value={extNewDate}
                  onChange={(e) => { setExtNewDate(e.target.value); setExtDays(""); }}
                  style={{ width: "100%", fontSize: 11, padding: "5px 7px" }}
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleExtend} disabled={savingExt}>
                {savingExt ? "..." : "บันทึก"}
              </Button>
            </div>
            {showActivateHint && (
              <div style={{ marginTop: 7, fontSize: 10, color: "var(--green)" }}>
                ℹ️ วันใหม่อยู่ในอนาคต — แพ็กเกจจะเปลี่ยนเป็น Active อัตโนมัติ
              </div>
            )}
          </div>

          {/* Adjust Sessions */}
          <div style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 11 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--tm)", marginBottom: 8 }}>🔧 Adjust Sessions / Extra</div>
            <div style={{ display: "grid", gridTemplateColumns: "auto auto 1fr auto", gap: 7, alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>Sessions คงเหลือ</div>
                <input className="ie" type="number" value={adjSessions} min={0} onChange={(e) => setAdjSessions(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>Extra</div>
                <input className="ie" type="number" value={adjExtra} min={0} onChange={(e) => setAdjExtra(Number(e.target.value))} />
              </div>
              <div>
                <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>หมายเหตุ</div>
                <input type="text" placeholder="ระบุเหตุผล..." value={adjNote} onChange={(e) => setAdjNote(e.target.value)} style={{ fontSize: 11, padding: "5px 8px", width: "100%" }} />
              </div>
              <Button variant="primary" size="sm" onClick={handleAdjust} disabled={savingAdj}>{savingAdj ? "..." : "บันทึก"}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────
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
  const [packages,        setPackages]        = useState<AdminPackage[]>([]);
  const [childPkgs,       setChildPkgs]       = useState<Record<string, AdminPackage[]>>({});
  const [loadingChildPkgs,setLoadingChildPkgs]= useState<Record<string, boolean>>({});
  const [bookings,        setBookings]        = useState<AdminBooking[]>([]);
  const [logs,            setLogs]            = useState<AdminLog[]>([]);
  const [loadingPkg,      setLoadingPkg]      = useState(false);
  const [loadingBk,       setLoadingBk]       = useState(false);

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
      const [pkgs, logs] = await Promise.all([
        fetchUserPackages(user.id, null),
        fetchAdminLogs(user.id),
      ]);
      setPackages(pkgs);
      setLogs(logs);
      // Load children packages in parallel
      const initLoading: Record<string, boolean> = {};
      user.children.forEach((c) => { initLoading[c.id] = true; });
      setLoadingChildPkgs(initLoading);
      const results = await Promise.allSettled(
        user.children.map((child) => fetchUserPackages(child.parentId, child.id))
      );
      const map: Record<string, AdminPackage[]> = {};
      user.children.forEach((child, i) => {
        const r = results[i];
        map[child.id] = r.status === "fulfilled" ? r.value : [];
      });
      setChildPkgs(map);
      setLoadingChildPkgs({});
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setLoadingPkg(false); }
  }, [user, showToast]);

  const loadChildPackages = useCallback(async (childId: string) => {
    const child = user?.children.find((c) => c.id === childId);
    if (!child) return;
    setLoadingChildPkgs((prev) => ({ ...prev, [childId]: true }));
    try {
      const [pkgs, updatedLogs] = await Promise.all([
        fetchUserPackages(child.parentId, childId),
        fetchAdminLogs(user!.id),
      ]);
      setChildPkgs((prev) => ({ ...prev, [childId]: pkgs }));
      setLogs(updatedLogs);
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setLoadingChildPkgs((prev) => ({ ...prev, [childId]: false })); }
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

                {/* Children sections */}
                {user.children.length > 0 && (
                  <>
                    <div style={{ margin: "16px 0", display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 1, background: "var(--bd)" }} />
                      <div style={{ fontSize: 10, color: "var(--tm)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>เด็กในปกครอง</div>
                      <div style={{ flex: 1, height: 1, background: "var(--bd)" }} />
                    </div>

                    {user.children.map((child, idx) => (
                      <div key={child.id}>
                        {idx > 0 && <div style={{ height: 1, background: "var(--bd)", margin: "12px 0" }} />}
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                          <div style={{ width: 26, height: 26, borderRadius: "50%", background: child.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {child.avatarInitial}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{child.nickname}</div>
                            <div style={{ fontSize: 10, color: "var(--tm)" }}>นักเรียน</div>
                          </div>
                        </div>
                        {loadingChildPkgs[child.id] ? (
                          <div style={{ textAlign: "center", padding: "12px 0", color: "var(--tm)", fontSize: 12 }}>กำลังโหลด...</div>
                        ) : (
                          <PackageEditorSection
                            packages={childPkgs[child.id] ?? []}
                            userId={child.parentId}
                            childId={child.id}
                            onRefresh={() => loadChildPackages(child.id)}
                          />
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
