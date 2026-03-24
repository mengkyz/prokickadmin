"use client";

import React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/ToastContext";
import type { AdminUser } from "@/lib/db/users";

interface Props {
  open: boolean;
  onClose: () => void;
  users: AdminUser[];
}

function fmt(v: string | number | null | undefined): string {
  return v == null ? "" : String(v).replace(/"/g, '""');
}

function buildCSV(users: AdminUser[]): string {
  const headers = ["ชื่อ", "ชื่อเล่น", "เบอร์โทร", "ประเภท", "แพ็กเกจ", "Sessions เหลือ", "Sessions ทั้งหมด", "Extra เหลือ", "Extra ทั้งหมด", "สถานะ", "หมดอายุ", "หมายเหตุ (เด็ก ของ)"];
  const rows: (string | number)[][] = [];

  for (const u of users) {
    rows.push([
      u.fullName,
      u.nickname ?? "",
      u.phone ?? "",
      u.types.join(", "),
      u.activePackage?.packageName ?? "",
      u.sessionsTotal - u.sessionsUsed,
      u.sessionsTotal,
      u.extraTotal - u.extraUsed,
      u.extraTotal,
      u.status,
      u.expiresAt ? u.expiresAt.split("T")[0] : "",
      "",
    ]);
    // Children rows
    for (const child of u.children) {
      const pkg = child.activePackage;
      const used = pkg ? pkg.totalSessions + pkg.extraSessionsPurchased - pkg.remainingSessions : 0;
      const total = pkg ? pkg.totalSessions + pkg.extraSessionsPurchased : 0;
      const extraLeft = pkg ? pkg.extraSessionsPurchased - Math.max(0, used - pkg.totalSessions) : 0;
      rows.push([
        `  └ ${child.nickname}`,
        child.nickname,
        "",
        "เด็ก",
        pkg?.packageName ?? "",
        total - used,
        total,
        Math.max(0, extraLeft),
        pkg?.extraSessionsPurchased ?? 0,
        child.status,
        child.expiresAt ? child.expiresAt.split("T")[0] : "",
        `เด็กของ ${u.fullName}`,
      ]);
    }
  }

  return [headers, ...rows].map((row) => row.map((v) => `"${fmt(v)}"`).join(",")).join("\n");
}

export function ExportUsersModal({ open, onClose, users = [] }: Props) {
  const { showToast } = useToast();

  function handleCopy() {
    const csv = "\ufeff" + buildCSV(users);
    navigator.clipboard.writeText(csv)
      .then(() => showToast("คัดลอก CSV แล้ว!"))
      .catch(() => showToast("คัดลอกไม่สำเร็จ", "error"));
  }

  function handleDownload() {
    const csv = "\ufeff" + buildCSV(users);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("ดาวน์โหลด CSV แล้ว!");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="📥 Export ผู้ใช้"
      width={700}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>ยกเลิก</Button>
          <Button variant="ghost" onClick={handleCopy}>📋 คัดลอก CSV</Button>
          <Button variant="primary" onClick={handleDownload}>💾 ดาวน์โหลด .csv</Button>
        </>
      }
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--tm)", marginBottom: 8 }}>
        Preview ({users.length} ผู้ใช้):
      </div>
      {users.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>ไม่มีผู้ใช้ที่เลือก</div>
      ) : (
        <div style={{ maxHeight: 340, overflowY: "auto" }}>
          <table>
            <thead>
              <tr>
                <th>ชื่อ</th>
                <th>เบอร์โทร</th>
                <th>ประเภท</th>
                <th>แพ็กเกจ</th>
                <th>Sessions</th>
                <th>Extra</th>
                <th>สถานะ</th>
                <th>หมดอายุ</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <React.Fragment key={u.id}>
                  <tr>
                    <td style={{ fontSize: 12, fontWeight: 600 }}>{u.fullName}{u.nickname ? ` (${u.nickname})` : ""}</td>
                    <td className="pk-mono" style={{ fontSize: 11 }}>{u.phone ?? "—"}</td>
                    <td style={{ fontSize: 11 }}>{u.types.join(", ")}</td>
                    <td style={{ fontSize: 11 }}>{u.activePackage?.packageName ?? "—"}</td>
                    <td className="pk-mono" style={{ fontSize: 11 }}>{u.sessionsTotal - u.sessionsUsed}/{u.sessionsTotal}</td>
                    <td className="pk-mono" style={{ fontSize: 11 }}>{u.extraTotal - u.extraUsed}/{u.extraTotal}</td>
                    <td style={{ fontSize: 11 }}>{u.status}</td>
                    <td className="pk-mono" style={{ fontSize: 10 }}>{u.expiresAt ? u.expiresAt.split("T")[0] : "—"}</td>
                  </tr>
                  {u.children.map((child) => {
                    const pkg = child.activePackage;
                    const used = pkg ? pkg.totalSessions + pkg.extraSessionsPurchased - pkg.remainingSessions : 0;
                    const total = pkg ? pkg.totalSessions + pkg.extraSessionsPurchased : 0;
                    return (
                      <tr key={child.id} style={{ background: "var(--card-h)" }}>
                        <td style={{ fontSize: 11, color: "var(--t2)", paddingLeft: 20 }}>└ {child.nickname}</td>
                        <td></td>
                        <td style={{ fontSize: 10, color: "var(--tm)" }}>เด็ก</td>
                        <td style={{ fontSize: 11 }}>{pkg?.packageName ?? "—"}</td>
                        <td className="pk-mono" style={{ fontSize: 11 }}>{total - used}/{total}</td>
                        <td className="pk-mono" style={{ fontSize: 11 }}>{pkg?.extraSessionsPurchased ?? 0}</td>
                        <td style={{ fontSize: 11 }}>{child.status}</td>
                        <td className="pk-mono" style={{ fontSize: 10 }}>{child.expiresAt ? child.expiresAt.split("T")[0] : "—"}</td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
