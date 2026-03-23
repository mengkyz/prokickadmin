"use client";

import React, { useState } from "react";
import { Modal, FormGrid, FormItem, FormSection, DefaultFooter } from "@/components/ui/Modal";
import { useToast } from "@/lib/context/ToastContext";
import { createPromo, updatePromo } from "@/lib/db/promos";
import type { PromoCode, DiscountType } from "@/lib/types";

interface PromoModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: PromoCode;
  onSuccess?: () => void;
}

export function PromoModal({ open, onClose, mode, initial, onSuccess }: PromoModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    code: initial?.code ?? "",
    discountType: initial?.discountType ?? "percent" as DiscountType,
    discount: initial?.discount ?? "",
    usageLimit: initial?.usageLimit ?? "",
    expiresAt: initial?.expiresAt ?? "",
    isActive: initial ? initial.status !== "Inactive" : true,
  });

  function set(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const payload = {
        code: form.code,
        discountType: form.discountType as DiscountType,
        discount: Number(form.discount),
        usageLimit: Number(form.usageLimit),
        expiresAt: form.expiresAt,
        isActive: form.isActive,
      };

      if (mode === "create") {
        await createPromo(payload);
        showToast("สร้างโค้ดแล้ว!");
      } else {
        await updatePromo(initial!.id, payload);
        showToast("บันทึกแล้ว");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }

  const title = mode === "create"
    ? "🏷️ สร้างโปรโมชั่นโค้ด"
    : `✏️ แก้ไขโค้ด — ${initial?.code ?? ""}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={440}
      footer={
        <DefaultFooter
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmLabel={loading ? "กำลังบันทึก..." : mode === "create" ? "สร้าง" : "บันทึก"}
        />
      }
    >
      <FormGrid>
        <FormItem label="โค้ด" full>
          <input
            type="text"
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="เช่น SUMMER2025"
            style={{ textTransform: "uppercase" }}
          />
        </FormItem>

        <FormSection>ส่วนลด</FormSection>

        <FormItem label="ประเภทส่วนลด" full>
          <select value={form.discountType} onChange={(e) => set("discountType", e.target.value)}>
            <option value="percent">เปอร์เซ็นต์ (%)</option>
            <option value="fixed">จำนวนเงิน (฿)</option>
          </select>
        </FormItem>
        <FormItem label={form.discountType === "percent" ? "ส่วนลด (%)" : "ส่วนลด (฿)"} full>
          <input
            type="number"
            value={form.discount}
            onChange={(e) => set("discount", e.target.value)}
            placeholder={form.discountType === "percent" ? "10" : "50"}
            min={0}
            max={form.discountType === "percent" ? 100 : undefined}
          />
        </FormItem>

        <FormSection>การใช้งาน</FormSection>

        <FormItem label="จำนวนการใช้ (สูงสุด)">
          <input
            type="number"
            value={form.usageLimit}
            onChange={(e) => set("usageLimit", e.target.value)}
            placeholder="100"
            min={1}
          />
        </FormItem>
        <FormItem label="วันหมดอายุ">
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => set("expiresAt", e.target.value)}
          />
        </FormItem>

        {mode === "edit" && (
          <FormItem label="สถานะ" full>
            <select
              value={form.isActive ? "active" : "inactive"}
              onChange={(e) => set("isActive", e.target.value === "active")}
            >
              <option value="active">✅ เปิดใช้งาน</option>
              <option value="inactive">❌ ปิดใช้งาน</option>
            </select>
          </FormItem>
        )}
      </FormGrid>
    </Modal>
  );
}
