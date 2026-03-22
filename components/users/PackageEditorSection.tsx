"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useToast } from "@/lib/context/ToastContext";
import {
  adjustPackageSessions,
  togglePackageStatus,
  extendPackage,
  fetchPackageTemplatesForAssign,
  insertUserPackage,
  deleteUserPackage,
} from "@/lib/db/users";
import type { AdminPackage, PackageTemplateOption } from "@/lib/db/users";

export interface PackageEditorSectionProps {
  packages: AdminPackage[];
  userId: string;
  childId: string | null;
  onRefresh: () => Promise<void>;
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
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

function statusVariant(s: PkgStatus | null): "green" | "orange" | "red" | "gray" {
  if (s === "Active") return "green";
  if (s === "Low") return "orange";
  if (s === "Expired") return "red";
  return "gray";
}

export function PackageEditorSection({ packages, userId, childId, onRefresh }: PackageEditorSectionProps) {
  const { showToast } = useToast();

  // ── Existing editing state ────────────────────────────
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [adjSessions,  setAdjSessions]  = useState(0);
  const [adjExtra,     setAdjExtra]     = useState(0);
  const [adjNote,      setAdjNote]      = useState("");
  const [extDays,      setExtDays]      = useState("");
  const [extNewDate,   setExtNewDate]   = useState("");
  const [savingAdj,    setSavingAdj]    = useState(false);
  const [savingExt,    setSavingExt]    = useState(false);
  const [savingToggle, setSavingToggle] = useState(false);

  // ── Add package state ─────────────────────────────────
  const [showAddForm,      setShowAddForm]      = useState(false);
  const [templates,        setTemplates]        = useState<PackageTemplateOption[]>([]);
  const [addTemplateId,    setAddTemplateId]    = useState<number | null>(null);
  const [addStartDate,     setAddStartDate]     = useState(todayStr());
  const [addExpiryDate,    setAddExpiryDate]    = useState("");
  const [addNotes,         setAddNotes]         = useState("");
  const [savingAdd,        setSavingAdd]        = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // ── Delete confirm state ───────────────────────────────
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting,        setDeleting]        = useState(false);

  // Load templates once on mount
  useEffect(() => {
    setLoadingTemplates(true);
    fetchPackageTemplatesForAssign()
      .then((ts) => {
        setTemplates(ts);
        if (ts.length > 0) setAddTemplateId(ts[0].id);
      })
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
  }, []);

  // Auto-compute expiry when template or start date changes
  useEffect(() => {
    if (!addStartDate || !addTemplateId) return;
    const tmpl = templates.find((t) => t.id === addTemplateId);
    if (tmpl) {
      const d = new Date(addStartDate);
      d.setDate(d.getDate() + tmpl.daysValid);
      setAddExpiryDate(d.toISOString().split("T")[0]);
    }
  }, [addStartDate, addTemplateId, templates]);

  // Default: pick active package, or first
  useEffect(() => {
    if (packages.length === 0) { setSelectedId(null); return; }
    if (!selectedId || !packages.find((p) => p.id === selectedId)) {
      const active = packages.find((p) => p.status === "active");
      setSelectedId((active ?? packages[0]).id);
    }
  }, [packages]); // eslint-disable-line react-hooks/exhaustive-deps

  const pkg = packages.find((p) => p.id === selectedId) ?? null;

  // Sync adj fields when selected package changes
  useEffect(() => {
    if (pkg) {
      setAdjSessions(pkg.remainingSessions);
      setAdjExtra(pkg.extraSessionsPurchased);
    }
  }, [pkg?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ──────────────────────────────────────────
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

  async function handleAddPackage() {
    if (!addTemplateId || !addStartDate || !addExpiryDate) {
      showToast("กรุณาเลือกแพ็กเกจและวันที่", "error"); return;
    }
    const tmpl = templates.find((t) => t.id === addTemplateId);
    if (!tmpl) return;
    setSavingAdd(true);
    try {
      await insertUserPackage(
        userId,
        childId,
        { templateId: addTemplateId, startDate: addStartDate, expiryDate: addExpiryDate, notes: addNotes },
        tmpl.sessionCount
      );
      showToast("เพิ่มแพ็กเกจแล้ว");
      setShowAddForm(false);
      setAddNotes("");
      setAddStartDate(todayStr());
      await onRefresh();
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingAdd(false); }
  }

  async function handleDeletePackage(pkgId: string) {
    setDeleting(true);
    try {
      await deleteUserPackage(pkgId, userId);
      showToast("ลบแพ็กเกจแล้ว");
      setConfirmDeleteId(null);
      await onRefresh();
    } catch (err) {
      showToast((err as Error).message, "error");
      setConfirmDeleteId(null);
    }
    finally { setDeleting(false); }
  }

  // ── Derived values ────────────────────────────────────
  const pkgStatus = pkg ? derivePkgStatus(pkg) : null;
  const isExpired = pkgStatus === "Expired";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const previewDate: Date | null = (() => {
    if (extNewDate) return new Date(extNewDate);
    if (extDays && pkg) {
      const d = new Date(pkg.expiryDate);
      d.setDate(d.getDate() + Number(extDays));
      return d;
    }
    return null;
  })();
  const showActivateHint = isExpired && previewDate !== null && previewDate >= today;
  const totalIncExtra = pkg ? pkg.totalSessions + pkg.extraSessionsPurchased : 0;
  const sessionsUsed  = pkg ? totalIncExtra - pkg.remainingSessions : 0;

  const sortedPkgs = [...packages].sort((a, b) => {
    const order = (s: string) => (s === "active" ? 0 : s === "inactive" ? 1 : 2);
    return order(a.status) - order(b.status);
  });

  return (
    <div>
      {/* ── Header: Add Package button ── */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
        <Button
          variant="ghost"
          size="sm"
          style={{ fontSize: 11, border: "1.5px solid var(--green)", color: "var(--green)" }}
          onClick={() => setShowAddForm((v) => !v)}
        >
          {showAddForm ? "✕ ยกเลิก" : "+ เพิ่มแพ็กเกจ"}
        </Button>
      </div>

      {/* ── Add Package inline form ── */}
      {showAddForm && (
        <div style={{ background: "var(--bg)", border: "1.5px solid var(--green)", borderRadius: 9, padding: 14, marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--green)", marginBottom: 10 }}>➕ เพิ่มแพ็กเกจให้ผู้ใช้</div>
          {loadingTemplates ? (
            <div style={{ fontSize: 11, color: "var(--tm)" }}>กำลังโหลดแพ็กเกจ...</div>
          ) : (
            <>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 3, fontWeight: 600, textTransform: "uppercase" as const }}>แพ็กเกจ</div>
                <select
                  value={addTemplateId ?? ""}
                  onChange={(e) => setAddTemplateId(Number(e.target.value))}
                  style={{ width: "100%", fontSize: 12, padding: "6px 9px" }}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.type === "adult" ? "Adult" : "Junior"}] {t.name} · {t.sessionCount} sessions · {t.daysValid} วัน · ฿{t.price.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 3, fontWeight: 600, textTransform: "uppercase" as const }}>วันเริ่มต้น</div>
                  <input type="date" value={addStartDate} onChange={(e) => setAddStartDate(e.target.value)} style={{ width: "100%", fontSize: 11, padding: "5px 7px" }} />
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 3, fontWeight: 600, textTransform: "uppercase" as const }}>วันหมดอายุ</div>
                  <input type="date" value={addExpiryDate} onChange={(e) => setAddExpiryDate(e.target.value)} style={{ width: "100%", fontSize: 11, padding: "5px 7px" }} />
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 3, fontWeight: 600, textTransform: "uppercase" as const }}>หมายเหตุ</div>
                <input
                  type="text"
                  placeholder="เช่น ซื้อเอง / โปร / มอบ..."
                  value={addNotes}
                  onChange={(e) => setAddNotes(e.target.value)}
                  style={{ width: "100%", fontSize: 11, padding: "5px 8px" }}
                />
              </div>
              {addTemplateId && (() => {
                const tmpl = templates.find((t) => t.id === addTemplateId);
                return tmpl ? (
                  <div style={{ fontSize: 10, color: "var(--tm)", marginBottom: 10, padding: "6px 10px", background: "var(--card)", borderRadius: 6, border: "1px solid var(--bd)" }}>
                    📋 {tmpl.sessionCount} sessions · {tmpl.daysValid} วัน · ฿{tmpl.price.toLocaleString()}
                    {addExpiryDate && ` · หมดอายุ ${addExpiryDate}`}
                  </div>
                ) : null;
              })()}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="primary" size="sm" onClick={handleAddPackage} disabled={savingAdd}>
                  {savingAdd ? "กำลังเพิ่ม..." : "➕ เพิ่มแพ็กเกจ"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Package selector dropdown (multiple packages) ── */}
      {packages.length > 1 && (
        <div style={{ marginBottom: 10 }}>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ width: "100%", fontSize: 12, padding: "6px 9px" }}
          >
            {sortedPkgs.map((p) => {
              const st = derivePkgStatus(p);
              return (
                <option key={p.id} value={p.id}>
                  {p.packageName} · {st} · หมด {p.expiryDate}
                </option>
              );
            })}
          </select>
        </div>
      )}

      {/* ── Empty state ── */}
      {packages.length === 0 && !showAddForm && (
        <div style={{ textAlign: "center", padding: "18px 0", color: "var(--tm)", fontSize: 13 }}>
          ยังไม่มีแพ็กเกจ — กด + เพิ่มแพ็กเกจ เพื่อเพิ่ม
        </div>
      )}

      {/* ── Package card ── */}
      {pkg && (
        <div style={{ border: "1.5px solid var(--bd2)", borderRadius: 9, padding: 14, marginBottom: 12 }}>
          {/* Header: name + status badge + toggle + delete */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{pkg.packageName}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" as const, justifyContent: "flex-end" }}>
              <Badge variant={statusVariant(pkgStatus)}>● {pkgStatus}</Badge>
              {/* Active/Inactive toggle (not for expired) */}
              {!isExpired && (
                <Button
                  variant="ghost"
                  size="sm"
                  style={{
                    fontSize: 10, padding: "3px 9px",
                    border: pkg.status === "inactive" ? "1.5px solid var(--green)" : "1.5px solid var(--orange)",
                    color: pkg.status === "inactive" ? "var(--green)" : "var(--orange)",
                  }}
                  onClick={handleToggle}
                  disabled={savingToggle}
                >
                  {savingToggle ? "..." : pkg.status === "inactive" ? "เปิดใช้" : "ปิดใช้"}
                </Button>
              )}
              {/* Delete button with inline confirm */}
              {confirmDeleteId !== pkg.id ? (
                <Button
                  variant="ghost"
                  size="sm"
                  style={{ fontSize: 10, padding: "3px 8px", border: "1.5px solid var(--red)", color: "var(--red)" }}
                  onClick={() => setConfirmDeleteId(pkg.id)}
                  title="ลบแพ็กเกจ (เฉพาะที่ยังไม่มีการใช้งาน)"
                >
                  🗑️
                </Button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 600 }}>ยืนยันลบ?</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ fontSize: 10, padding: "3px 8px", background: "var(--red)", color: "#fff", border: "none" }}
                    onClick={() => handleDeletePackage(pkg.id)}
                    disabled={deleting}
                  >
                    {deleting ? "..." : "ลบ"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ fontSize: 10, padding: "3px 8px" }}
                    onClick={() => setConfirmDeleteId(null)}
                  >
                    ยกเลิก
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div style={{ fontSize: 11, color: "var(--tm)", marginBottom: 8 }}>
            {pkg.startDate} – {pkg.expiryDate}
          </div>

          {/* Progress bar */}
          <ProgressBar value={sessionsUsed} max={totalIncExtra || 1} />

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, margin: "10px 0" }}>
            {[
              { v: pkg.remainingSessions, l: "Sessions คงเหลือ", c: "var(--green)" },
              { v: pkg.extraSessionsPurchased, l: "Extra ซื้อเพิ่ม", c: "var(--blue)" },
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
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--tm)", marginBottom: 8 }}>📅 ปรับวันหมดอายุ</div>
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

          {/* Adjust Sessions / Extra */}
          <div style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 11 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, color: "var(--tm)", marginBottom: 8 }}>🔧 Adjust Sessions / Extra</div>
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
                <input
                  type="text"
                  placeholder="ระบุเหตุผล..."
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  style={{ fontSize: 11, padding: "5px 8px", width: "100%" }}
                />
              </div>
              <Button variant="primary" size="sm" onClick={handleAdjust} disabled={savingAdj}>
                {savingAdj ? "..." : "บันทึก"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
