"use client";

import React, { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { useToast } from "@/lib/context/ToastContext";
import { PROMO_CODES } from "@/lib/mock/data";

export default function PromoPage() {
  const { showToast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);

  const statusVariant: Record<string, BadgeVariant> = {
    Active: "green",
    Expiring: "orange",
    Inactive: "gray",
  };

  return (
    <>
      <Card>
        <CardHeader
          icon="🏷️"
          title="โปรโมชั่นโค้ด"
          actions={<Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>+ สร้างโค้ด</Button>}
        />
        <table>
          <thead>
            <tr><th>โค้ด</th><th>ส่วนลด</th><th>ใช้แล้ว</th><th>หมดอายุ</th><th>สถานะ</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {PROMO_CODES.map((promo) => (
              <tr key={promo.id}>
                <td>
                  <span style={{ display: "inline-flex", background: "var(--purple-l)", border: "1px solid #DDD6FE", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "var(--purple)" }}>
                    {promo.code}
                  </span>
                </td>
                <td className="pk-mono" style={{ color: "var(--green)" }}>
                  {promo.discountType === "percent" ? `${promo.discount}%` : `${promo.discount} ฿`}
                </td>
                <td className="pk-mono">{promo.usedCount}/{promo.usageLimit}</td>
                <td className="pk-mono">{promo.expiresAt}</td>
                <td><Badge variant={statusVariant[promo.status]}>
                  {promo.status === "Active" ? "● Active" : promo.status === "Expiring" ? "⚠ Expiring" : promo.status}
                </Badge></td>
                <td>
                  <div style={{ display: "flex", gap: 5 }}>
                    <Button variant="ghost" size="sm">แก้ไข</Button>
                    <Button variant="danger" size="sm" onClick={() => showToast("ปิดโค้ดแล้ว", "error")}>ปิด</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Create Promo Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="🏷️ สร้างโปรโมชั่นโค้ด"
        width={440}
        footer={
          <DefaultFooter
            onCancel={() => setCreateOpen(false)}
            onConfirm={() => { setCreateOpen(false); showToast("สร้างโค้ดแล้ว!"); }}
            confirmLabel="สร้าง"
          />
        }
      >
        <FormGrid>
          <FormItem label="โค้ด" full>
            <input type="text" placeholder="เช่น SUMMER2025" style={{ textTransform: "uppercase" }} />
          </FormItem>
          <FormItem label="ประเภทส่วนลด" full>
            <select><option>เปอร์เซ็นต์ (%)</option><option>จำนวนเงิน (฿)</option></select>
          </FormItem>
          <FormItem label="ส่วนลด">
            <input type="number" placeholder="10" />
          </FormItem>
          <FormItem label="จำนวนการใช้ (สูงสุด)">
            <input type="number" placeholder="100" />
          </FormItem>
          <FormItem label="วันหมดอายุ" full>
            <input type="date" />
          </FormItem>
        </FormGrid>
      </Modal>
    </>
  );
}
