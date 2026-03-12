"use client";

import React, { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tabs } from "@/components/ui/Tabs";
import { CreateClassModal } from "@/components/classes/CreateClassModal";
import { EditClassModal } from "@/components/classes/EditClassModal";
import { IncomingDetailModal } from "@/components/classes/IncomingDetailModal";
import { HistoryDetailModal } from "@/components/classes/HistoryDetailModal";
import { ExportClassesModal } from "@/components/classes/ExportClassesModal";
import { INCOMING_CLASSES, HISTORY_CLASSES } from "@/lib/mock/data";

type Modal = "none" | "create" | "edit" | "incoming-detail" | "history-detail" | "export";
type DateFilter = "today" | "week" | "custom";

export default function ClassesPage() {
  const [modal, setModal] = useState<Modal>("none");
  const [dateFilter, setDateFilter] = useState<DateFilter>("today");
  const [selectedIn, setSelectedIn] = useState<Set<string>>(new Set());
  const [selectedHist, setSelectedHist] = useState<Set<string>>(new Set());

  function toggleIncoming(id: string) {
    setSelectedIn((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleHistory(id: string) {
    setSelectedHist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAllIn(checked: boolean) {
    setSelectedIn(checked ? new Set(INCOMING_CLASSES.map((c) => c.id)) : new Set());
  }

  function toggleAllHist(checked: boolean) {
    setSelectedHist(checked ? new Set(HISTORY_CLASSES.map((c) => c.id)) : new Set());
  }

  const statusBadge = (status: string) => {
    if (status === "open") return <Badge variant="green">● ว่าง</Badge>;
    if (status === "full") return <Badge variant="red">● เต็ม</Badge>;
    if (status === "waitlist") return <Badge variant="orange">⚠ Waitlist</Badge>;
    if (status === "completed") return <Badge variant="green">✓ Completed</Badge>;
    if (status === "cancelled") return <Badge variant="red">✕ Cancelled</Badge>;
    return null;
  };

  const packageBadge = (pkg: string) => {
    if (pkg === "เด็ก") return <Badge variant="blue">{pkg}</Badge>;
    return <Badge variant="orange">{pkg}</Badge>;
  };

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
                padding: "5px 11px",
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                border: "1.5px solid var(--bd2)",
                background: dateFilter === key ? "var(--accent)" : "var(--bg)",
                color: dateFilter === key ? "#fff" : "var(--t2)",
                borderColor: dateFilter === key ? "var(--accent)" : "var(--bd2)",
                transition: "all 0.12s",
                fontFamily: "inherit",
              }}
            >
              {key === "today" ? "วันนี้" : key === "week" ? "สัปดาห์นี้" : "กำหนดเอง"}
            </button>
          ))}
          {dateFilter === "custom" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="date" style={{ padding: "5px 8px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", border: "1.5px solid var(--bd2)", background: "var(--bg)", color: "var(--t1)", cursor: "pointer", outline: "none", width: "auto" }} />
              <span style={{ color: "var(--tm)", fontSize: 11 }}>→</span>
              <input type="date" style={{ padding: "5px 8px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", border: "1.5px solid var(--bd2)", background: "var(--bg)", color: "var(--t1)", cursor: "pointer", outline: "none", width: "auto" }} />
            </div>
          )}
        </div>
      </Card>

      {/* Classes Tabs Card */}
      <Card>
        <Tabs
          tabs={[
            { key: "incoming", label: "📅 คลาสที่กำลังมา" },
            { key: "history", label: "📚 ประวัติคลาส" },
          ]}
        >
          {(tab) => (
            <>
              {tab === "incoming" && (
                <>
                  {/* Filters */}
                  <div style={{ display: "flex", gap: 7, padding: "10px 14px", borderBottom: "1px solid var(--bd)", flexWrap: "wrap", alignItems: "center", background: "var(--card-h)" }}>
                    {["ทุกสนาม", "ทุกโค้ช", "ทุกแพ็ก", "ทุกสถานะ"].map((opt, i) => (
                      <select key={i} style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
                        <option>{opt}</option>
                        {i === 0 && <><option>Grand Field</option><option>Arena A</option><option>Small Arena</option></>}
                        {i === 1 && <><option>Pro Coach</option><option>Coach Arm</option><option>Coach Bee</option></>}
                        {i === 2 && <><option>Fun Pack</option><option>Pro Pack</option><option>Elite Pack</option></>}
                        {i === 3 && <><option>ว่าง</option><option>เต็ม</option><option>Waitlist</option></>}
                      </select>
                    ))}
                    <div style={{ marginLeft: "auto", display: "flex", gap: 7, alignItems: "center" }}>
                      {selectedIn.size > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setModal("export")}>
                          📥 Export ที่เลือก ({selectedIn.size})
                        </Button>
                      )}
                      <Button variant="primary" size="sm" onClick={() => setModal("create")}>+ สร้างคลาส</Button>
                    </div>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th><input type="checkbox" checked={selectedIn.size === INCOMING_CLASSES.length} onChange={(e) => toggleAllIn(e.target.checked)} /></th>
                        <th>วัน/เวลา</th><th>สนาม</th><th>โค้ช</th><th>แพ็กเกจ</th><th>ผู้จอง</th><th>Waitlist</th><th>สถานะ</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {INCOMING_CLASSES.map((cls) => (
                        <tr key={cls.id}>
                          <td><input type="checkbox" checked={selectedIn.has(cls.id)} onChange={() => toggleIncoming(cls.id)} /></td>
                          <td>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{cls.dayLabel}</div>
                            <div style={{ fontSize: 10, color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace" }}>{cls.timeStart}–{cls.timeEnd}</div>
                          </td>
                          <td>{cls.venue}</td>
                          <td>{cls.coach}</td>
                          <td>{packageBadge(cls.packageFilter)}</td>
                          <td><ProgressBar value={cls.booked} max={cls.capacity} /></td>
                          <td className="pk-mono">{cls.waitlist}</td>
                          <td>{statusBadge(cls.status)}</td>
                          <td>
                            <div style={{ display: "flex", gap: 5 }}>
                              <Button variant="ghost" size="sm" onClick={() => setModal("incoming-detail")}>ดู/จัดการ</Button>
                              <Button variant="ghost" size="sm" onClick={() => setModal("edit")}>แก้ไข</Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {tab === "history" && (
                <>
                  <div style={{ display: "flex", gap: 7, padding: "10px 14px", borderBottom: "1px solid var(--bd)", flexWrap: "wrap", alignItems: "center", background: "var(--card-h)" }}>
                    {["ทุกสนาม", "ทุกโค้ช", "ทุกแพ็ก", "ทุกสถานะ"].map((opt, i) => (
                      <select key={i} style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
                        <option>{opt}</option>
                      </select>
                    ))}
                    <div style={{ marginLeft: "auto" }}>
                      {selectedHist.size > 0 && (
                        <Button variant="ghost" size="sm" onClick={() => setModal("export")}>
                          📥 Export ที่เลือก ({selectedHist.size})
                        </Button>
                      )}
                    </div>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th><input type="checkbox" checked={selectedHist.size === HISTORY_CLASSES.length} onChange={(e) => toggleAllHist(e.target.checked)} /></th>
                        <th>วัน/เวลา</th><th>สนาม</th><th>โค้ช</th><th>เข้าเรียน</th><th>No-show</th><th>สถานะ</th><th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HISTORY_CLASSES.map((cls) => {
                        const detail = cls.id === "hcs-1" ? { attended: 10, noshow: 2 } : cls.id === "hcs-2" ? { attended: 18, noshow: 2 } : null;
                        return (
                          <tr key={cls.id}>
                            <td><input type="checkbox" checked={selectedHist.has(cls.id)} onChange={() => toggleHistory(cls.id)} /></td>
                            <td>
                              <div style={{ fontSize: 12, fontWeight: 600 }}>{cls.dayLabel}</div>
                              <div style={{ fontSize: 10, color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace" }}>{cls.timeStart}–{cls.timeEnd}</div>
                            </td>
                            <td>{cls.venue}</td>
                            <td>{cls.coach}</td>
                            <td className="pk-mono" style={{ color: detail ? "var(--green)" : "var(--tm)", fontWeight: 700 }}>
                              {detail ? detail.attended : "—"}
                            </td>
                            <td className="pk-mono" style={{ color: detail ? "var(--red)" : "var(--tm)", fontWeight: 700 }}>
                              {detail ? detail.noshow : "—"}
                            </td>
                            <td>{statusBadge(cls.status)}</td>
                            <td>
                              <Button variant="ghost" size="sm" onClick={() => setModal("history-detail")}>ดูบันทึก</Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </Tabs>
      </Card>

      {/* Modals */}
      <CreateClassModal open={modal === "create"} onClose={() => setModal("none")} />
      <EditClassModal open={modal === "edit"} onClose={() => setModal("none")} />
      <IncomingDetailModal open={modal === "incoming-detail"} onClose={() => setModal("none")} />
      <HistoryDetailModal open={modal === "history-detail"} onClose={() => setModal("none")} />
      <ExportClassesModal open={modal === "export"} onClose={() => setModal("none")} />
    </>
  );
}
