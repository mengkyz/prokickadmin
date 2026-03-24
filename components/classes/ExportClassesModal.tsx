"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/ToastContext";
import type { AdminClass } from "@/lib/db/classes";

interface Props {
  open: boolean;
  onClose: () => void;
  classes: AdminClass[];
}

const PKG_LABEL: Record<string, string> = { all: "ทั้งหมด", adult: "ผู้ใหญ่", junior: "เด็ก" };

function buildCSV(classes: AdminClass[]): string {
  const headers = ["วันที่", "วัน", "เวลาเริ่ม", "เวลาสิ้นสุด", "สนาม", "โค้ช", "แพ็กเกจ", "ผู้จอง", "จำนวนรับ", "Waitlist", "สถานะ"];
  const rows = classes.map((c) => [
    c.date,
    c.dayLabel,
    c.timeStart,
    c.timeEnd,
    c.venue,
    c.coach || "",
    PKG_LABEL[c.packageFilter] ?? c.packageFilter,
    c.booked,
    c.capacity,
    c.waitlist,
    c.status,
  ]);
  return [headers, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
}

export function ExportClassesModal({ open, onClose, classes = [] }: Props) {
  const { showToast } = useToast();

  function handleCopy() {
    const csv = "\ufeff" + buildCSV(classes);
    navigator.clipboard.writeText(csv)
      .then(() => showToast("คัดลอก CSV แล้ว!"))
      .catch(() => showToast("คัดลอกไม่สำเร็จ", "error"));
  }

  function handleDownload() {
    const csv = "\ufeff" + buildCSV(classes);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `classes_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("ดาวน์โหลด CSV แล้ว!");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📥 Export คลาส"
      width={640}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button variant="ghost" onClick={handleCopy}>📋 คัดลอก CSV</Button>
          <Button variant="primary" onClick={handleDownload}>💾 ดาวน์โหลด .csv</Button>
        </>
      }
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tm)", marginBottom: 8 }}>
        Preview ({classes.length} คลาส):
      </div>
      {classes.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>ไม่มีคลาสที่เลือก</div>
      ) : (
        <div style={{ maxHeight: 320, overflowY: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>วันที่</th>
                <th>เวลา</th>
                <th>สนาม</th>
                <th>โค้ช</th>
                <th>แพ็กเกจ</th>
                <th>ผู้จอง</th>
                <th>Waitlist</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontSize: 11 }}>{c.dayLabel}</td>
                  <td className="pk-mono" style={{ fontSize: 10 }}>{c.timeStart}–{c.timeEnd}</td>
                  <td style={{ fontSize: 11 }}>{c.venue}</td>
                  <td style={{ fontSize: 11 }}>{c.coach || "—"}</td>
                  <td style={{ fontSize: 11 }}>{PKG_LABEL[c.packageFilter] ?? c.packageFilter}</td>
                  <td className="pk-mono" style={{ fontSize: 11 }}>{c.booked}/{c.capacity}</td>
                  <td className="pk-mono" style={{ fontSize: 11 }}>{c.waitlist}</td>
                  <td style={{ fontSize: 11 }}>{c.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
