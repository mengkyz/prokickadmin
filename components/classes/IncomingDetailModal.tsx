"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/context/ToastContext";
import { fetchClassBookings, cancelBooking, promoteFromWaitlist } from "@/lib/db/classes";
import type { AdminClass, AdminBooking } from "@/lib/db/classes";

interface Props {
  open: boolean;
  onClose: () => void;
  cls: AdminClass | null;
}

export function IncomingDetailModal({ open, cls, onClose }: Props) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"booked" | "waitlist">("booked");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // bookingId being saved

  const load = useCallback(async () => {
    if (!cls) return;
    setLoading(true);
    try {
      const data = await fetchClassBookings(cls.id);
      setBookings(data);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [cls, showToast]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const booked   = bookings.filter((b) => b.attendanceStatus !== "waitlist" && b.attendanceStatus !== "cancelled");
  const waitlist = bookings.filter((b) => b.attendanceStatus === "waitlist");
  const displayed = activeTab === "booked" ? booked : waitlist;

  async function handleCancel(bookingId: string) {
    if (!confirm("ยืนยันการยกเลิกการจองนี้?")) return;
    setSaving(bookingId);
    try {
      await cancelBooking(bookingId);
      showToast("ยกเลิกการจองแล้ว", "error");
      await load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(null);
    }
  }

  async function handlePromote(bookingId: string) {
    setSaving(bookingId);
    try {
      await promoteFromWaitlist(bookingId);
      showToast("ยืนยันผู้เรียนจากคิวแล้ว");
      await load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(null);
    }
  }

  const title = cls
    ? `${cls.packageFilter === "junior" ? "เด็ก" : cls.packageFilter === "adult" ? "ผู้ใหญ่" : ""} ${cls.dayLabel} ${cls.timeStart}–${cls.timeEnd}`.trim()
    : "รายละเอียดคลาส";

  const subtitle = cls ? `📍 ${cls.venue} · 👤 ${cls.coach || "ไม่ระบุโค้ช"}` : "";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      width={640}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>ปิด</Button>
        </>
      }
    >
      <div style={{ margin: "-16px -20px 0" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--bd)", padding: "4px 16px 0", background: "var(--card)" }}>
          {[
            { key: "booked",   label: `ผู้จอง (${booked.length}/${cls?.capacity ?? "?"})` },
            { key: "waitlist", label: `Waitlist (${waitlist.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                padding: "9px 13px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                color: activeTab === tab.key ? "var(--accent)" : "var(--tm)",
                background: "none", border: "none",
                borderBottom: activeTab === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
                fontFamily: "inherit", marginBottom: -1,
              } as React.CSSProperties}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>
            กำลังโหลด...
          </div>
        ) : displayed.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>
            {activeTab === "booked" ? "ยังไม่มีผู้จอง" : "ไม่มี Waitlist"}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>ผู้เรียน</th>
                <th>เบอร์โทร</th>
                <th>จองเมื่อ</th>
                <th>สถานะ</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((b, i) => (
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
                          <div style={{ fontSize: 10, color: "var(--tm)" }}>
                            <Badge variant="blue" style={{ fontSize: 9 }}>เด็ก</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="pk-mono" style={{ fontSize: 11 }}>{b.userPhone || "—"}</td>
                  <td className="pk-mono" style={{ fontSize: 10 }}>{b.bookedAt}</td>
                  <td>
                    {b.attendanceStatus === "confirmed" && <Badge variant="green">Confirmed</Badge>}
                    {b.attendanceStatus === "waitlist" && (
                      <Badge variant="orange">Waitlist {b.waitlistPosition ? `#${b.waitlistPosition}` : ""}</Badge>
                    )}
                  </td>
                  <td>
                    {b.attendanceStatus === "confirmed" ? (
                      <Button
                        variant="danger" size="sm"
                        disabled={saving === b.id}
                        onClick={() => handleCancel(b.id)}
                      >
                        {saving === b.id ? "..." : "ยกเลิก"}
                      </Button>
                    ) : (
                      <Button
                        variant="success" size="sm"
                        disabled={saving === b.id}
                        onClick={() => handlePromote(b.id)}
                      >
                        {saving === b.id ? "..." : "ยืนยันขึ้น"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Modal>
  );
}
