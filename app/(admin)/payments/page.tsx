"use client";

import React, { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { useToast } from "@/lib/context/ToastContext";
import { PAYMENTS, PAYMENT_SUMMARY } from "@/lib/mock/data";

export default function PaymentsPage() {
  const { showToast } = useToast();
  const [editPayOpen, setEditPayOpen] = useState(false);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        {/* Payment Method Card */}
        <Card>
          <CardHeader
            icon="🏦"
            title="ข้อมูลรับชำระเงิน"
            actions={<Button variant="primary" size="sm" onClick={() => setEditPayOpen(true)}>✏️ แก้ไข</Button>}
          />
          <div style={{ padding: 14 }}>
            {/* Bank card */}
            <div style={{ background: "linear-gradient(135deg, #1B2A4A, #2A3F6B)", borderRadius: 12, padding: 20, color: "#fff", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginBottom: 4 }}>ธนาคารกสิกรไทย (KBank)</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, marginBottom: 4 }}>012-3-45678-9</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>บจก. โปรคิก อะคาเดมี่</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 100, height: 100, background: "#fff", borderRadius: 10, padding: 6, border: "1.5px solid var(--bd)" }}>
                {/* QR placeholder grid - static pattern to avoid hydration mismatch */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, width: "100%", height: "100%" }}>
                  {[1,0,1,0,1,1,0,1,1,0,1,0,0,1,0,1,0,1,1,0,1,1,0,1,0,1,0,0,0,1,1,0,0,1,0,1,0,0,1,1,0,1,0,1,0,1,1,0,1].map((v, i) => (
                    <div key={i} style={{ background: v ? "#111" : "#fff", borderRadius: 1 }} />
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>สแกน QR พร้อมเพย์</div>
                <div style={{ fontSize: 10, color: "var(--tm)" }}>อัปโหลด QR ใน<br />ตั้งค่าการชำระเงิน</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader icon="📊" title="สรุปการชำระเงิน" />
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              { label: "⏳ รอยืนยัน", value: PAYMENT_SUMMARY.pending, bg: "var(--orange-l)", border: "var(--orange)", color: "var(--orange)", fontSize: 20 },
              { label: "✓ ยืนยันแล้ว (เดือนนี้)", value: PAYMENT_SUMMARY.confirmedThisMonth, bg: "var(--green-l)", border: "var(--green)", color: "var(--green)", fontSize: 20 },
              { label: "💰 รายได้เดือนนี้", value: `${PAYMENT_SUMMARY.revenueThisMonth.toLocaleString()} ฿`, bg: "var(--blue-l)", border: "var(--blue)", color: "var(--blue)", fontSize: 18 },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 12px",
                  background: item.bg,
                  borderRadius: 8,
                  borderLeft: `3px solid ${item.border}`,
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.label}</div>
                <div style={{ fontSize: item.fontSize, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader
          icon="💳"
          title="รายการชำระเงิน"
          actions={<Badge variant="red" style={{ padding: "3px 9px", fontSize: 11 }}>{PAYMENT_SUMMARY.pending} รอยืนยัน</Badge>}
        />
        <div style={{ display: "flex", gap: 7, padding: "10px 14px", borderBottom: "1px solid var(--bd)", background: "var(--card-h)" }}>
          <select style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
            <option>ทุกสถานะ</option>
            <option>รอยืนยัน</option>
            <option>ยืนยันแล้ว</option>
          </select>
          <select style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
            <option>เดือนนี้</option>
            <option>เดือนที่แล้ว</option>
          </select>
        </div>
        <table>
          <thead>
            <tr><th>ผู้ใช้</th><th>แพ็กเกจ</th><th>ยอดชำระ</th><th>วันที่</th><th>สถานะ</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {PAYMENTS.map((pay) => (
              <tr key={pay.id}>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: pay.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                      {pay.avatarInitial}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{pay.userName}</div>
                  </div>
                </td>
                <td>{pay.packageName}</td>
                <td className="pk-mono" style={{ color: "var(--green)", fontWeight: 700 }}>{pay.amount.toLocaleString()} ฿</td>
                <td className="pk-mono">{pay.date}</td>
                <td>
                  {pay.status === "pending" && <Badge variant="orange">⏳ รอยืนยัน</Badge>}
                  {pay.status === "confirmed" && <Badge variant="green">✓ ยืนยันแล้ว</Badge>}
                  {pay.status === "rejected" && <Badge variant="red">✕ ปฏิเสธ</Badge>}
                </td>
                <td>
                  {pay.status === "pending" ? (
                    <div style={{ display: "flex", gap: 5 }}>
                      <Button variant="success" size="sm" onClick={() => showToast("ยืนยันแล้ว")}>✓</Button>
                      <Button variant="danger" size="sm" onClick={() => showToast("ปฏิเสธ", "error")}>✕</Button>
                    </div>
                  ) : (
                    <Button variant="ghost" size="sm">ดูสลิป</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Edit Payment Method Modal */}
      <Modal
        open={editPayOpen}
        onClose={() => setEditPayOpen(false)}
        title="✏️ แก้ไขข้อมูลรับชำระเงิน"
        width={480}
        footer={
          <DefaultFooter
            onCancel={() => setEditPayOpen(false)}
            onConfirm={() => { setEditPayOpen(false); showToast("บันทึกแล้ว"); }}
          />
        }
      >
        <FormGrid>
          <FormItem label="ธนาคาร" full><input type="text" defaultValue="ธนาคารกสิกรไทย (KBank)" /></FormItem>
          <FormItem label="เลขบัญชี" full><input type="text" defaultValue="012-3-45678-9" /></FormItem>
          <FormItem label="ชื่อบัญชี" full><input type="text" defaultValue="บจก. โปรคิก อะคาเดมี่" /></FormItem>
          <FormItem label="QR Code PromptPay" full>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 80, height: 80, background: "var(--bg)", border: "1.5px dashed var(--bd2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--tm)", cursor: "pointer" }}>📷 อัปโหลด</div>
              <div style={{ fontSize: 10, color: "var(--tm)" }}>รองรับ PNG, JPG<br />ขนาดไม่เกิน 2MB</div>
            </div>
          </FormItem>
        </FormGrid>
      </Modal>
    </>
  );
}
