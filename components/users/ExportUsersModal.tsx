"use client";

import React from "react";
import { Modal, DefaultFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/context/ToastContext";

const PREVIEW = [
  { name: "Ploiphailyn", type: "Parent+Player", pkg: "Pro Pack", sessions: "7/8", extra: "0/2", status: "Active", expires: "22/02/69" },
  { name: "Somchai K.", type: "Player", pkg: "Elite Pack", sessions: "7/16", extra: "1/2", status: "Active", expires: "01/04/69" },
];

interface ExportUsersModalProps {
  open: boolean;
  onClose: () => void;
}

export function ExportUsersModal({ open, onClose }: ExportUsersModalProps) {
  const { showToast } = useToast();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📥 Export ผู้ใช้ที่เลือก"
      width={640}
      footer={
        <DefaultFooter
          onCancel={onClose}
          onConfirm={() => { onClose(); showToast("Export สำเร็จ!"); }}
          cancelLabel="ยกเลิก"
          confirmLabel="📥 Download CSV"
        />
      }
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--t2)", marginBottom: 8 }}>Preview ผู้ใช้ที่เลือก:</div>
      <table>
        <thead>
          <tr><th>ชื่อ</th><th>ประเภท</th><th>แพ็กเกจ</th><th>Sessions</th><th>Extra</th><th>สถานะ</th><th>หมดอายุ</th></tr>
        </thead>
        <tbody>
          {PREVIEW.map((r, i) => (
            <tr key={i}>
              <td>{r.name}</td>
              <td><Badge variant={r.type === "Parent+Player" ? "blue" : "orange"}>{r.type}</Badge></td>
              <td>{r.pkg}</td>
              <td className="pk-mono">{r.sessions}</td>
              <td className="pk-mono">{r.extra}</td>
              <td><Badge variant="green">{r.status}</Badge></td>
              <td className="pk-mono">{r.expires}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
