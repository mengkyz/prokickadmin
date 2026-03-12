"use client";

import React from "react";
import { Modal, DefaultFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/context/ToastContext";

const PREVIEW_ROWS = [
  { name: "Somchai K.", type: "Player", status: "Confirmed" },
  { name: "Ploiphailyn", type: "Parent+Player", status: "Confirmed" },
  { name: "Nattawut P.", type: "Player", status: "Waitlist #1" },
  { name: "พรีม", type: "Child", status: "Confirmed" },
];

interface ExportClassesModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExportClassesModal({ open, onClose }: ExportClassesModalProps) {
  const { showToast } = useToast();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📥 Export รายชื่อผู้เรียน"
      width={600}
      footer={
        <DefaultFooter
          onCancel={onClose}
          onConfirm={() => { onClose(); showToast("Export สำเร็จ!"); }}
          cancelLabel="ยกเลิก"
          confirmLabel="📥 Download CSV"
        />
      }
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t2)", marginBottom: 8 }}>Preview (คลาสที่เลือก):</div>
      <table>
        <thead>
          <tr><th>ชื่อ</th><th>ประเภท</th><th>สถานะ</th></tr>
        </thead>
        <tbody>
          {PREVIEW_ROWS.map((r, i) => (
            <tr key={i}>
              <td>{r.name}</td>
              <td><Badge variant={r.type === "Parent+Player" ? "blue" : r.type === "Child" ? "gray" : "orange"}>{r.type}</Badge></td>
              <td><Badge variant={r.status.includes("Waitlist") ? "orange" : "green"}>{r.status}</Badge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
