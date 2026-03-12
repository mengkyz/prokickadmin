"use client";

import React, { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { useToast } from "@/lib/context/ToastContext";
import { ADMIN_ACCOUNTS } from "@/lib/mock/data";

export default function ProfilePage() {
  const { showToast } = useToast();
  const [role, setRole] = useState<"admin" | "coach">("admin");
  const [displayName, setDisplayName] = useState("Admin");
  const [addAccountOpen, setAddAccountOpen] = useState(false);

  return (
    <>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>
        {/* Profile Card */}
        <Card style={{ marginBottom: 14 }}>
          <CardHeader icon="👤" title="Manage Profile" />
          <div style={{ padding: 20 }}>
            {/* Avatar + Name */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 22, paddingBottom: 18, borderBottom: "1px solid var(--bd)" }}>
              <div
                style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--blue), var(--purple))",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 800, color: "#fff", cursor: "pointer", position: "relative",
                }}
              >
                {displayName.charAt(0).toUpperCase()}
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 20, height: 20, background: "var(--accent)", borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>
                  📷
                </div>
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{displayName}</div>
                <div style={{ marginTop: 4 }}>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "admin" | "coach")}
                    style={{ padding: "4px 9px", fontSize: 11, fontWeight: 600, borderRadius: 6, border: "1.5px solid var(--bd2)", background: "var(--bg)", color: "var(--t1)", cursor: "pointer", fontFamily: "inherit" }}
                  >
                    <option value="admin">🔑 Admin — จัดการทุกอย่าง</option>
                    <option value="coach">👤 Coach — ดู Class &amp; Sessions เท่านั้น</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Fields */}
            <FormGrid>
              <FormItem label="ชื่อที่แสดง (Display Name)" full>
                <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </FormItem>
              <FormItem label="อีเมล" full>
                <input type="email" defaultValue="admin@prokick.co.th" />
              </FormItem>

              <div style={{ gridColumn: "1 / -1", fontSize: 10, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase", color: "var(--tm)", padding: "4px 0 0", display: "flex", alignItems: "center", gap: 7 }}>
                🔐 เปลี่ยนรหัสผ่าน
                <span style={{ flex: 1, height: 1, background: "var(--bd)" }} />
              </div>

              <FormItem label="รหัสผ่านปัจจุบัน" full>
                <input type="password" placeholder="กรอกรหัสผ่านปัจจุบัน" />
              </FormItem>
              <FormItem label="รหัสผ่านใหม่">
                <input type="password" placeholder="อย่างน้อย 8 ตัวอักษร" />
              </FormItem>
              <FormItem label="ยืนยันรหัสผ่านใหม่">
                <input type="password" placeholder="กรอกซ้ำรหัสผ่านใหม่" />
              </FormItem>
            </FormGrid>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 9 }}>
              <Button variant="ghost">ยกเลิก</Button>
              <Button variant="primary" onClick={() => showToast("บันทึกการเปลี่ยนแปลงแล้ว")}>
                💾 บันทึกการเปลี่ยนแปลง
              </Button>
            </div>
          </div>
        </Card>

        {/* System Accounts Card (admin only) */}
        {role === "admin" && (
          <Card>
            <CardHeader
              icon="👥"
              title="บัญชีผู้ใช้ระบบ"
              actions={<Button variant="primary" size="sm" onClick={() => setAddAccountOpen(true)}>+ เพิ่มบัญชี</Button>}
            />
            <table>
              <thead>
                <tr><th>ชื่อ</th><th>อีเมล</th><th>บทบาท</th><th>สถานะ</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {ADMIN_ACCOUNTS.map((acc) => (
                  <tr key={acc.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: acc.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                          {acc.avatarInitial}
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{acc.name}</div>
                      </div>
                    </td>
                    <td style={{ fontSize: 11, color: "var(--t2)" }}>{acc.email}</td>
                    <td>
                      <Badge variant={acc.role === "admin" ? "blue" : "gray"}>
                        {acc.role === "admin" ? "🔑 Admin" : "👤 Coach"}
                      </Badge>
                    </td>
                    <td><Badge variant="green">● Active</Badge></td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <Button variant="ghost" size="sm">แก้ไข</Button>
                        {acc.role !== "admin" && (
                          <Button variant="danger" size="sm" onClick={() => showToast("ปิดบัญชีแล้ว", "error")}>ปิด</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>

      {/* Add Account Modal */}
      <Modal
        open={addAccountOpen}
        onClose={() => setAddAccountOpen(false)}
        title="👥 เพิ่มบัญชีผู้ใช้ระบบ"
        width={440}
        footer={
          <DefaultFooter
            onCancel={() => setAddAccountOpen(false)}
            onConfirm={() => { setAddAccountOpen(false); showToast("เพิ่มบัญชีแล้ว"); }}
            confirmLabel="เพิ่ม"
          />
        }
      >
        <FormGrid>
          <FormItem label="ชื่อ" full><input type="text" placeholder="ชื่อผู้ใช้" /></FormItem>
          <FormItem label="อีเมล" full><input type="email" placeholder="email@prokick.co.th" /></FormItem>
          <FormItem label="บทบาท" full>
            <select><option>🔑 Admin</option><option>👤 Coach</option></select>
          </FormItem>
          <FormItem label="รหัสผ่าน" full><input type="password" placeholder="อย่างน้อย 8 ตัวอักษร" /></FormItem>
        </FormGrid>
      </Modal>
    </>
  );
}
