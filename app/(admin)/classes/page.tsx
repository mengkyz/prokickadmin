"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tabs } from "@/components/ui/Tabs";
import { CreateClassModal } from "@/components/classes/CreateClassModal";
import { EditClassModal } from "@/components/classes/EditClassModal";
import { IncomingDetailModal } from "@/components/classes/IncomingDetailModal";
import { HistoryDetailModal } from "@/components/classes/HistoryDetailModal";
import { ExportClassesModal } from "@/components/classes/ExportClassesModal";
import { fetchClasses, todayRange, weekRange, checkClassesDeletable, deleteClass, deleteClasses } from "@/lib/db/classes";
import type { AdminClass } from "@/lib/db/classes";
import { Modal } from "@/components/ui/Modal";

type ModalType = "none" | "create" | "edit" | "incoming-detail" | "history-detail" | "export";
type DateFilter = "today" | "week" | "custom";

export default function ClassesPage() {
  const [modal, setModal]           = useState<ModalType>("none");
  const [dateFilter, setDateFilter] = useState<DateFilter>("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]     = useState("");

  const [classes, setClasses]       = useState<AdminClass[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [editTarget, setEditTarget]     = useState<AdminClass | null>(null);
  const [detailTarget, setDetailTarget] = useState<AdminClass | null>(null);

  const [selectedIn,   setSelectedIn]   = useState<Set<string>>(new Set());
  const [selectedHist, setSelectedHist] = useState<Set<string>>(new Set());
  const [exportClasses, setExportClasses] = useState<AdminClass[]>([]);

  // Delete state
  const [deletableMap, setDeletableMap] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<AdminClass | null>(null);
  const [deleteBatchConfirm, setDeleteBatchConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Filter dropdowns ─────────────────────────────────────
  const [filterVenue,  setFilterVenue]  = useState("");
  const [filterCoach,  setFilterCoach]  = useState("");
  const [filterPkg,    setFilterPkg]    = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // ── Load data ─────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let range: { from: string; to: string };
      if (dateFilter === "today") {
        range = todayRange();
      } else if (dateFilter === "week") {
        range = weekRange();
      } else {
        if (!customFrom || !customTo) {
          setClasses([]);
          setLoading(false);
          return;
        }
        range = {
          from: new Date(customFrom + "T00:00:00").toISOString(),
          to:   new Date(customTo   + "T23:59:59").toISOString(),
        };
      }
      const data = await fetchClasses(range);
      setClasses(data);
      // Check deletability for all loaded classes
      const allIds = data.map((c) => c.id);
      if (allIds.length > 0) {
        const dm = await checkClassesDeletable(allIds);
        setDeletableMap(dm);
      } else {
        setDeletableMap({});
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [dateFilter, customFrom, customTo]);

  useEffect(() => { load(); }, [load]);

  // ── Derived lists ─────────────────────────────────────────
  const now = new Date();

  function applyFilters(list: AdminClass[], isHistory: boolean) {
    return list.filter((cls) => {
      if (filterVenue  && !cls.venue.toLowerCase().includes(filterVenue.toLowerCase())) return false;
      if (filterCoach  && !cls.coach.toLowerCase().includes(filterCoach.toLowerCase())) return false;
      if (filterPkg    && cls.packageFilter !== filterPkg) return false;
      if (filterStatus && cls.status !== filterStatus) return false;
      return true;
    });
  }

  const incoming = applyFilters(
    classes.filter((c) => new Date(c.startTimeIso) >= now && c.status !== "cancelled"),
    false
  );
  const history = applyFilters(
    classes.filter((c) => new Date(c.startTimeIso) < now || c.status === "completed" || c.status === "cancelled"),
    true
  );

  // ── Checkbox helpers ──────────────────────────────────────
  function toggleIncoming(id: string) {
    setSelectedIn((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleHistory(id: string) {
    setSelectedHist((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAllIn(checked: boolean) {
    setSelectedIn(checked ? new Set(incoming.map((c) => c.id)) : new Set());
  }
  function toggleAllHist(checked: boolean) {
    setSelectedHist(checked ? new Set(history.map((c) => c.id)) : new Set());
  }

  // ── Modal open helpers ────────────────────────────────────
  function openEdit(cls: AdminClass) {
    setEditTarget(cls);
    setModal("edit");
  }
  function openIncomingDetail(cls: AdminClass) {
    setDetailTarget(cls);
    setModal("incoming-detail");
  }
  function openHistoryDetail(cls: AdminClass) {
    setDetailTarget(cls);
    setModal("history-detail");
  }

  // ── Delete handlers ───────────────────────────────────────
  async function handleDeleteOne() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteClass(deleteTarget.id);
      setClasses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeletableMap((prev) => { const n = { ...prev }; delete n[deleteTarget.id]; return n; });
      setDeleteTarget(null);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  async function handleDeleteBatch() {
    setDeleting(true);
    const ids = Array.from(selectedIn);
    try {
      const { deleted, skipped } = await deleteClasses(ids);
      await load();
      setSelectedIn(new Set());
      setDeleteBatchConfirm(false);
      alert(`ลบแล้ว ${deleted} คลาส${skipped > 0 ? ` · ข้าม ${skipped} คลาสที่มีการจอง` : ""}`);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  // ── Status badge ──────────────────────────────────────────
  const statusBadge = (status: string) => {
    if (status === "open")      return <Badge variant="green">● ว่าง</Badge>;
    if (status === "full")      return <Badge variant="red">● เต็ม</Badge>;
    if (status === "waitlist")  return <Badge variant="orange">⚠ Waitlist</Badge>;
    if (status === "completed") return <Badge variant="green">✓ Completed</Badge>;
    if (status === "cancelled") return <Badge variant="red">✕ Cancelled</Badge>;
    return null;
  };

  const pkgBadge = (filter: string) => {
    if (filter === "junior") return <Badge variant="blue">เด็ก</Badge>;
    if (filter === "adult")  return <Badge variant="orange">ผู้ใหญ่</Badge>;
    return <Badge variant="gray">ทุกประเภท</Badge>;
  };

  // ── Unique values for filter dropdowns ───────────────────
  const venues  = Array.from(new Set(classes.map((c) => c.venue))).filter(Boolean);
  const coaches = Array.from(new Set(classes.map((c) => c.coach))).filter(Boolean);

  return (
    <>
      {/* Date Filter Bar */}
      <Card style={{ marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", flexWrap: "wrap", background: "var(--card-h)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tm)", whiteSpace: "nowrap" }}>📅 แสดงคลาส:</span>
          {(["today", "week", "custom"] as DateFilter[]).map((key) => (
            <button
              key={key}
              onClick={() => setDateFilter(key)}
              style={{
                padding: "5px 11px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                border: "1.5px solid var(--bd2)",
                background: dateFilter === key ? "var(--accent)" : "var(--bg)",
                color:      dateFilter === key ? "#fff" : "var(--t2)",
                borderColor: dateFilter === key ? "var(--accent)" : "var(--bd2)",
                transition: "all 0.12s", fontFamily: "inherit",
              }}
            >
              {key === "today" ? "วันนี้" : key === "week" ? "สัปดาห์นี้" : "กำหนดเอง"}
            </button>
          ))}
          {dateFilter === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                style={{ padding: "5px 8px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", border: "1.5px solid var(--bd2)", background: "var(--bg)", color: "var(--t1)", cursor: "pointer", outline: "none" }} />
              <span style={{ color: "var(--tm)", fontSize: 11 }}>→</span>
              <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                style={{ padding: "5px 8px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", border: "1.5px solid var(--bd2)", background: "var(--bg)", color: "var(--t1)", cursor: "pointer", outline: "none" }} />
            </div>
          )}
          {loading && <span style={{ fontSize: 11, color: "var(--tm)" }}>กำลังโหลด...</span>}
          {error   && <span style={{ fontSize: 11, color: "var(--red)" }}>⚠ {error}</span>}
        </div>
      </Card>

      {/* Classes Tabs */}
      <Card>
        <Tabs
          tabs={[
            { key: "incoming", label: "📅 คลาสที่กำลังมา" },
            { key: "history",  label: "📚 ประวัติคลาส" },
          ]}
        >
          {(tab) => (
            <>
              {/* ── INCOMING ── */}
              {tab === "incoming" && (
                <>
                  <div style={{ display: "flex", gap: 7, padding: "10px 14px", borderBottom: "1px solid var(--bd)", flexWrap: "wrap", alignItems: "center", background: "var(--card-h)" }}>
                    {/* Venue filter */}
                    <select value={filterVenue} onChange={(e) => setFilterVenue(e.target.value)}
                      style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
                      <option value="">ทุกสนาม</option>
                      {venues.map((v) => <option key={v}>{v}</option>)}
                    </select>
                    {/* Coach filter */}
                    <select value={filterCoach} onChange={(e) => setFilterCoach(e.target.value)}
                      style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
                      <option value="">ทุกโค้ช</option>
                      {coaches.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    {/* Package filter */}
                    <select value={filterPkg} onChange={(e) => setFilterPkg(e.target.value)}
                      style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
                      <option value="">ทุกแพ็ก</option>
                      <option value="all">ทุกประเภท</option>
                      <option value="adult">ผู้ใหญ่</option>
                      <option value="junior">เด็ก</option>
                    </select>
                    {/* Status filter */}
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                      style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
                      <option value="">ทุกสถานะ</option>
                      <option value="open">ว่าง</option>
                      <option value="full">เต็ม</option>
                      <option value="waitlist">Waitlist</option>
                    </select>

                    <div style={{ marginLeft: "auto", display: "flex", gap: 7, alignItems: "center" }}>
                      {selectedIn.size > 0 && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => { setExportClasses(incoming.filter((c) => selectedIn.has(c.id))); setModal("export"); }}>
                            📥 Export ที่เลือก ({selectedIn.size})
                          </Button>
                          <Button
                            size="sm"
                            style={{ background: "var(--red-l)", color: "var(--red)", border: "1.5px solid var(--red)", fontSize: 11 }}
                            onClick={() => setDeleteBatchConfirm(true)}
                          >
                            🗑️ ลบที่เลือก ({selectedIn.size})
                          </Button>
                        </>
                      )}
                      <Button variant="primary" size="sm" onClick={() => setModal("create")}>
                        + สร้างคลาส
                      </Button>
                    </div>
                  </div>

                  {loading ? (
                    <div style={{ padding: 32, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>กำลังโหลด...</div>
                  ) : incoming.length === 0 ? (
                    <div style={{ padding: 32, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>ไม่มีคลาสในช่วงเวลานี้</div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th><input type="checkbox" checked={selectedIn.size === incoming.length && incoming.length > 0} onChange={(e) => toggleAllIn(e.target.checked)} /></th>
                          <th>วัน/เวลา</th>
                          <th>สนาม</th>
                          <th>โค้ช</th>
                          <th>แพ็กเกจ</th>
                          <th>ผู้จอง</th>
                          <th>Waitlist</th>
                          <th>สถานะ</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {incoming.map((cls) => (
                          <tr key={cls.id}>
                            <td><input type="checkbox" checked={selectedIn.has(cls.id)} onChange={() => toggleIncoming(cls.id)} /></td>
                            <td>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{cls.dayLabel}</div>
                              <div style={{ fontSize: 10, color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace" }}>
                                {cls.timeStart}–{cls.timeEnd}
                              </div>
                            </td>
                            <td style={{ fontSize: 12 }}>{cls.venue}</td>
                            <td style={{ fontSize: 12 }}>{cls.coach || "—"}</td>
                            <td>{pkgBadge(cls.packageFilter)}</td>
                            <td><ProgressBar value={cls.booked} max={cls.capacity} /></td>
                            <td className="pk-mono">{cls.waitlist}</td>
                            <td>{statusBadge(cls.status)}</td>
                            <td>
                              <div style={{ display: "flex", gap: 5 }}>
                                <Button variant="ghost" size="sm" onClick={() => openIncomingDetail(cls)}>ดู/จัดการ</Button>
                                <Button variant="ghost" size="sm" onClick={() => openEdit(cls)}>แก้ไข</Button>
                                <Button
                                  size="sm"
                                  disabled={!deletableMap[cls.id]}
                                  title={deletableMap[cls.id] ? "ลบคลาส" : "มีการจอง — ไม่สามารถลบได้"}
                                  style={{
                                    background: deletableMap[cls.id] ? "var(--red-l)" : "var(--bg)",
                                    color: deletableMap[cls.id] ? "var(--red)" : "var(--tm)",
                                    border: `1.5px solid ${deletableMap[cls.id] ? "var(--red)" : "var(--bd)"}`,
                                    cursor: deletableMap[cls.id] ? "pointer" : "not-allowed",
                                    fontSize: 11,
                                  }}
                                  onClick={() => deletableMap[cls.id] && setDeleteTarget(cls)}
                                >
                                  🗑️
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}

              {/* ── HISTORY ── */}
              {tab === "history" && (
                <>
                  <div style={{ display: "flex", gap: 7, padding: "10px 14px", borderBottom: "1px solid var(--bd)", flexWrap: "wrap", alignItems: "center", background: "var(--card-h)" }}>
                    <select value={filterVenue} onChange={(e) => setFilterVenue(e.target.value)}
                      style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
                      <option value="">ทุกสนาม</option>
                      {venues.map((v) => <option key={v}>{v}</option>)}
                    </select>
                    <select value={filterCoach} onChange={(e) => setFilterCoach(e.target.value)}
                      style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
                      <option value="">ทุกโค้ช</option>
                      {coaches.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                      style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
                      <option value="">ทุกสถานะ</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <div style={{ marginLeft: "auto" }}>
                      {selectedHist.size > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => { setExportClasses(history.filter((c) => selectedHist.has(c.id))); setModal("export"); }}>
                          📥 Export ที่เลือก ({selectedHist.size})
                        </Button>
                      )}
                    </div>
                  </div>

                  {loading ? (
                    <div style={{ padding: 32, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>กำลังโหลด...</div>
                  ) : history.length === 0 ? (
                    <div style={{ padding: 32, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>ไม่มีประวัติคลาสในช่วงเวลานี้</div>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th><input type="checkbox" checked={selectedHist.size === history.length && history.length > 0} onChange={(e) => toggleAllHist(e.target.checked)} /></th>
                          <th>วัน/เวลา</th>
                          <th>สนาม</th>
                          <th>โค้ช</th>
                          <th>ผู้จอง</th>
                          <th>สถานะ</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.map((cls) => (
                          <tr key={cls.id}>
                            <td><input type="checkbox" checked={selectedHist.has(cls.id)} onChange={() => toggleHistory(cls.id)} /></td>
                            <td>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{cls.dayLabel}</div>
                              <div style={{ fontSize: 10, color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace" }}>
                                {cls.timeStart}–{cls.timeEnd}
                              </div>
                            </td>
                            <td style={{ fontSize: 12 }}>{cls.venue}</td>
                            <td style={{ fontSize: 12 }}>{cls.coach || "—"}</td>
                            <td>
                              <ProgressBar value={cls.booked} max={cls.capacity} />
                            </td>
                            <td>{statusBadge(cls.status)}</td>
                            <td>
                              <Button variant="ghost" size="sm" onClick={() => openHistoryDetail(cls)}>
                                ดูบันทึก
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </>
          )}
        </Tabs>
      </Card>

      {/* ── Modals ── */}
      <CreateClassModal
        open={modal === "create"}
        onClose={() => setModal("none")}
        onCreated={() => { load(); setModal("none"); }}
      />

      {/* key forces re-mount so form is reset when switching edit targets */}
      <EditClassModal
        key={editTarget?.id ?? "edit-none"}
        open={modal === "edit"}
        onClose={() => { setModal("none"); setEditTarget(null); }}
        cls={editTarget}
        onSaved={(updated) => {
          setClasses((prev) => prev.map((c) => c.id === updated.id ? updated : c));
        }}
        onCancelled={(id) => {
          setClasses((prev) => prev.map((c) => c.id === id ? { ...c, status: "cancelled" } : c));
        }}
      />

      <IncomingDetailModal
        key={detailTarget?.id ?? "detail-none"}
        open={modal === "incoming-detail"}
        onClose={() => { setModal("none"); setDetailTarget(null); }}
        cls={detailTarget}
        onBookingChanged={load}
      />

      <HistoryDetailModal
        key={`hist-${detailTarget?.id ?? "none"}`}
        open={modal === "history-detail"}
        onClose={() => { setModal("none"); setDetailTarget(null); }}
        cls={detailTarget}
      />

      <ExportClassesModal
        open={modal === "export"}
        onClose={() => setModal("none")}
        classes={exportClasses}
      />

      {/* ── Single delete confirm ── */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="🗑️ ยืนยันการลบคลาส"
        width={400}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>ยกเลิก</Button>
            <Button
              size="sm"
              style={{ background: "var(--red)", color: "#fff", border: "none" }}
              onClick={handleDeleteOne}
              disabled={deleting}
            >
              {deleting ? "กำลังลบ..." : "ลบคลาส"}
            </Button>
          </>
        }
      >
        <div style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.7 }}>
          <p>คุณต้องการลบคลาส</p>
          <p style={{ fontWeight: 700, color: "var(--t1)" }}>
            {deleteTarget
              ? `${deleteTarget.packageFilter === "junior" ? "เด็ก" : deleteTarget.packageFilter === "adult" ? "ผู้ใหญ่" : ""} ${deleteTarget.dayLabel} ${deleteTarget.timeStart}–${deleteTarget.timeEnd}`.trim()
              : ""}
          </p>
          <p style={{ fontSize: 12, color: "var(--tm)", marginTop: 4 }}>
            การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </p>
        </div>
      </Modal>

      {/* ── Batch delete confirm ── */}
      {(() => {
        const ids = Array.from(selectedIn);
        const canDelete = ids.filter((id) => deletableMap[id]).length;
        const willSkip  = ids.length - canDelete;
        return (
          <Modal
            open={deleteBatchConfirm}
            onClose={() => setDeleteBatchConfirm(false)}
            title="🗑️ ยืนยันการลบคลาสที่เลือก"
            width={420}
            footer={
              <>
                <Button variant="ghost" onClick={() => setDeleteBatchConfirm(false)} disabled={deleting}>ยกเลิก</Button>
                <Button
                  size="sm"
                  style={{ background: canDelete > 0 ? "var(--red)" : "var(--bd)", color: canDelete > 0 ? "#fff" : "var(--tm)", border: "none" }}
                  onClick={handleDeleteBatch}
                  disabled={deleting || canDelete === 0}
                >
                  {deleting ? "กำลังลบ..." : `ลบ ${canDelete} คลาส`}
                </Button>
              </>
            }
          >
            <div style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.7 }}>
              <p>เลือกไว้ทั้งหมด <strong>{ids.length}</strong> คลาส</p>
              <p style={{ color: "var(--green)", fontWeight: 600 }}>✓ ลบได้ {canDelete} คลาส (ไม่มีการจอง)</p>
              {willSkip > 0 && (
                <p style={{ color: "var(--orange)", fontWeight: 600 }}>⚠ ข้ามไป {willSkip} คลาส (มีการจอง/คิวรอ)</p>
              )}
              {canDelete === 0 && (
                <p style={{ color: "var(--red)", fontSize: 12, marginTop: 4 }}>
                  คลาสที่เลือกทั้งหมดมีการจอง ไม่สามารถลบได้
                </p>
              )}
            </div>
          </Modal>
        );
      })()}
    </>
  );
}
