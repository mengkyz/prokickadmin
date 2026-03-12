"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/context/ToastContext";
import { HISTORY_DETAIL_MAP } from "@/lib/mock/data";
import type { Booking } from "@/lib/types";

interface HistoryDetailModalProps {
  open: boolean;
  onClose: () => void;
  classId?: string;
}

export function HistoryDetailModal({ open, onClose, classId = "hcs-1" }: HistoryDetailModalProps) {
  const { showToast } = useToast();
  const detail = HISTORY_DETAIL_MAP[classId];
  const [statuses, setStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries((detail?.bookings ?? []).map((b) => [b.id, b.attendanceStatus === "No-show" ? "noshow" : "attended"]))
  );

  if (!detail) return null;

  function updateStatus(id: string, val: string) {
    setStatuses((prev) => ({ ...prev, [id]: val }));
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📚 อาทิตย์ 22 ก.พ. 16:00–17:30"
      subtitle={
        <span>
          📍 Small Arena · 👤 Coach Arm ·{" "}
          <Badge variant="green" style={{ fontSize: 9 }}>Completed</Badge>
        </span>
      }
      width={640}
      footer={<Button variant="ghost" onClick={onClose}>ปิด</Button>}
    >
      <div style={{ margin: "-16px -20px 0" }}>
        {/* Summary row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--bd)" }}>
          {[
            { label: "เข้าเรียน", value: detail.attended, color: "var(--green)" },
            { label: "No-show (หัก session)", value: detail.noshow, color: "var(--red)" },
            { label: "ยกเลิกล่วงหน้า", value: detail.cancelled, color: "var(--tm)" },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                padding: "12px 16px",
                textAlign: "center",
                borderRight: i < 2 ? "1px solid var(--bd)" : undefined,
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 10, color: "var(--tm)", fontWeight: 700, textTransform: "uppercase" }}>{item.label}</div>
            </div>
          ))}
        </div>

        {/* Info banner */}
        <div style={{ padding: "8px 14px", background: "var(--accent-dim)", borderBottom: "1px solid var(--bd)", fontSize: 11, color: "var(--orange)", fontWeight: 600 }}>
          💡 แก้ไขสถานะผู้เรียนได้ด้านล่าง — การบันทึก No-show จะหัก 1 session อัตโนมัติ
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>ผู้เรียน</th>
              <th>แพ็กเกจ</th>
              <th>ประเภท</th>
              <th>สถานะ</th>
              <th>Session หัก</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {detail.bookings.map((b, i) => {
              const isNoshow = statuses[b.id] === "noshow";
              return (
                <tr key={b.id}>
                  <td className="pk-mono">{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: b.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {b.avatarInitial}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{b.userName}</div>
                    </div>
                  </td>
                  <td>{b.packageName}</td>
                  <td>
                    <Badge variant={b.userType === "Parent+Player" ? "blue" : b.userType === "Child" ? "gray" : "orange"}>
                      {b.userType}
                    </Badge>
                  </td>
                  <td>
                    <select
                      value={statuses[b.id]}
                      onChange={(e) => updateStatus(b.id, e.target.value)}
                      style={{ padding: "3px 7px", fontSize: 11, width: "auto" }}
                    >
                      <option value="attended">✓ Attended</option>
                      <option value="noshow">✕ No-show</option>
                    </select>
                  </td>
                  <td className="pk-mono" style={{ color: isNoshow ? "var(--red)" : "var(--green)" }}>
                    {isNoshow ? "−1 (auto)" : "−1"}
                  </td>
                  <td>
                    <Button variant="primary" size="sm" style={{ fontSize: 10 }}
                      onClick={() => showToast("บันทึก + Log")}>
                      บันทึก
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
