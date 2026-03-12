"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/context/ToastContext";
import { INCOMING_DETAIL } from "@/lib/mock/data";

interface IncomingDetailModalProps {
  open: boolean;
  onClose: () => void;
}

export function IncomingDetailModal({ open, onClose }: IncomingDetailModalProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"booked" | "waitlist">("booked");

  const booked = INCOMING_DETAIL.filter((b) => b.attendanceStatus !== "Waitlist");
  const waitlist = INCOMING_DETAIL.filter((b) => b.attendanceStatus === "Waitlist");
  const displayed = activeTab === "booked" ? booked : waitlist;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pro Pack — จันทร์ 3 มี.ค. 19:00–20:30"
      subtitle="📍 Grand Field · 👤 Pro Coach"
      width={620}
      footer={
        <>
          <Button variant="danger" size="sm" onClick={() => { onClose(); showToast("ยกเลิกคลาสแล้ว", "error"); }}>
            ยกเลิกคลาสนี้
          </Button>
          <Button variant="ghost" onClick={onClose}>ปิด</Button>
          <Button variant="primary" onClick={() => { onClose(); showToast("บันทึกข้อมูลแล้ว"); }}>
            💾 บันทึก
          </Button>
        </>
      }
    >
      <div style={{ margin: "-16px -20px 0" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--bd)", padding: "4px 16px 0", background: "#fff" }}>
          {[
            { key: "booked", label: `ผู้จอง (${booked.length}/20)` },
            { key: "waitlist", label: `Waitlist (${waitlist.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              style={{
                padding: "9px 13px",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 600,
                color: activeTab === tab.key ? "var(--accent)" : "var(--tm)",
                background: "none",
                border: "none",
                borderBottom: activeTab === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
                fontFamily: "inherit",
                marginBottom: -1,
              } as React.CSSProperties}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>ผู้เรียน</th>
              <th>แพ็กเกจ</th>
              <th>ประเภท</th>
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
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: b.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                      {b.avatarInitial}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{b.userName}</div>
                  </div>
                </td>
                <td>{b.packageName}</td>
                <td>
                  <Badge variant={b.userType === "Parent+Player" ? "blue" : "orange"}>{b.userType}</Badge>
                </td>
                <td className="pk-mono">{b.bookedAt}</td>
                <td>
                  {b.attendanceStatus === "Confirmed" && <Badge variant="green">Confirmed</Badge>}
                  {b.attendanceStatus === "Waitlist" && (
                    <Badge variant="orange">Waitlist #{b.waitlistPosition}</Badge>
                  )}
                </td>
                <td>
                  {b.attendanceStatus === "Confirmed" ? (
                    <Button variant="danger" size="sm" onClick={() => showToast("ยกเลิกการจองแล้ว", "error")}>
                      ยกเลิก
                    </Button>
                  ) : (
                    <Button variant="success" size="sm" onClick={() => showToast("ยืนยันจากคิวแล้ว")}>
                      ยืนยันขึ้น
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}
