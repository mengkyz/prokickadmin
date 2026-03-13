"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/context/ToastContext";
import { fetchClassBookings, updateBookingAttendance } from "@/lib/db/classes";
import type { AdminClass, AdminBooking, AttendanceStatus } from "@/lib/db/classes";

interface Props {
  open: boolean;
  onClose: () => void;
  cls: AdminClass | null;
}

export function HistoryDetailModal({ open, onClose, cls }: Props) {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!cls) return;
    setLoading(true);
    try {
      const data = await fetchClassBookings(cls.id);
      setBookings(data);
      // Initialize local status map from DB values
      const init: Record<string, AttendanceStatus> = {};
      for (const b of data) {
        if (b.attendanceStatus !== "waitlist" && b.attendanceStatus !== "cancelled") {
          init[b.id] = b.attendanceStatus === "no-show" ? "no-show" : "attended";
        }
      }
      setStatuses(init);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [cls, showToast]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const attended = Object.values(statuses).filter((s) => s === "attended").length;
  const noshow   = Object.values(statuses).filter((s) => s === "no-show").length;
  const cancelled = bookings.filter((b) => b.attendanceStatus === "cancelled").length;

  const displayedBookings = bookings.filter(
    (b) => b.attendanceStatus !== "waitlist" && b.attendanceStatus !== "cancelled"
  );

  async function handleSave(bookingId: string) {
    const status = statuses[bookingId];
    if (!status) return;
    setSaving(bookingId);
    try {
      await updateBookingAttendance(bookingId, status as "attended" | "no-show" | "confirmed");
      showToast("บันทึก + Log แล้ว");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(null);
    }
  }

  async function handleSaveAll() {
    setSaving("all");
    try {
      await Promise.all(
        Object.entries(statuses).map(([id, s]) =>
          updateBookingAttendance(id, s as "attended" | "no-show" | "confirmed")
        )
      );
      showToast(`บันทึกสถานะ ${Object.keys(statuses).length} คน แล้ว`);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(null);
    }
  }

  const title = cls
    ? `📚 ${cls.dayLabel} ${cls.timeStart}–${cls.timeEnd}`
    : "ประวัติคลาส";

  const subtitle = cls
    ? (
      <span>
        📍 {cls.venue} · 👤 {cls.coach || "ไม่ระบุโค้ช"} ·{" "}
        <Badge variant="green" style={{ fontSize: 9 }}>Completed</Badge>
      </span>
    )
    : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      width={660}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>ปิด</Button>
          <Button variant="primary" onClick={handleSaveAll} disabled={saving === "all" || displayedBookings.length === 0}>
            {saving === "all" ? "กำลังบันทึก..." : "💾 บันทึกทั้งหมด"}
          </Button>
        </>
      }
    >
      <div style={{ margin: "-16px -20px 0" }}>
        {/* Summary */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid var(--bd)" }}>
          {[
            { label: "เข้าเรียน",          value: loading ? "—" : attended,  color: "var(--green)" },
            { label: "No-show (หัก session)", value: loading ? "—" : noshow, color: "var(--red)" },
            { label: "ยกเลิกล่วงหน้า",      value: loading ? "—" : cancelled, color: "var(--tm)" },
          ].map((item, i) => (
            <div key={i} style={{
              padding: "12px 16px", textAlign: "center",
              borderRight: i < 2 ? "1px solid var(--bd)" : undefined,
            }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 10, color: "var(--tm)", fontWeight: 700, textTransform: "uppercase" }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div style={{ padding: "8px 14px", background: "var(--accent-dim)", borderBottom: "1px solid var(--bd)", fontSize: 11, color: "var(--orange)", fontWeight: 600 }}>
          💡 แก้ไขสถานะผู้เรียนได้ด้านล่าง — กด &ldquo;บันทึก&rdquo; เพื่อบันทึกรายคน หรือ &ldquo;บันทึกทั้งหมด&rdquo;
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>
            กำลังโหลด...
          </div>
        ) : displayedBookings.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>
            ไม่มีรายการการจอง
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ผู้เรียน</th>
                <th>เบอร์โทร</th>
                <th>สถานะ</th>
                <th>Session หัก</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedBookings.map((b, i) => {
                const isNoshow = statuses[b.id] === "no-show";
                return (
                  <tr key={b.id}>
                    <td className="pk-mono">{i + 1}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", background: b.avatarColor,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {b.avatarInitial}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{b.userName}</div>
                          {b.childId && (
                            <Badge variant="blue" style={{ fontSize: 9 }}>เด็ก</Badge>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="pk-mono" style={{ fontSize: 11 }}>{b.userPhone || "—"}</td>
                    <td>
                      <select
                        value={statuses[b.id] ?? "attended"}
                        onChange={(e) => setStatuses((prev) => ({ ...prev, [b.id]: e.target.value as AttendanceStatus }))}
                        style={{ padding: "3px 7px", fontSize: 11, width: "auto" }}
                      >
                        <option value="attended">✓ Attended</option>
                        <option value="no-show">✕ No-show</option>
                      </select>
                    </td>
                    <td className="pk-mono" style={{ color: isNoshow ? "var(--red)" : "var(--green)" }}>
                      {isNoshow ? "−1 (auto)" : "−1"}
                    </td>
                    <td>
                      <Button
                        variant="primary" size="sm" style={{ fontSize: 10 }}
                        disabled={saving === b.id}
                        onClick={() => handleSave(b.id)}
                      >
                        {saving === b.id ? "..." : "บันทึก"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
}
