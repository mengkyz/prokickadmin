"use client";

import React, { useState } from "react";
import { Modal, FormGrid, FormItem, FormSection, DefaultFooter } from "@/components/ui/Modal";
import { useToast } from "@/lib/context/ToastContext";
import type { Package } from "@/lib/types";

interface PackageModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: Package;
}

export function PackageModal({ open, onClose, mode, initial }: PackageModalProps) {
  const { showToast } = useToast();
  const [extraEnabled, setExtraEnabled] = useState(true);

  const title = mode === "create" ? "📦 สร้างแพ็กเกจใหม่" : `✏️ แก้ไขแพ็กเกจ — ${initial?.name ?? ""}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={480}
      footer={
        <DefaultFooter
          onCancel={onClose}
          onConfirm={() => { onClose(); showToast(mode === "create" ? "สร้างแพ็กเกจแล้ว" : "บันทึกแล้ว"); }}
          confirmLabel={mode === "create" ? "สร้าง" : "บันทึก"}
        />
      }
    >
      <FormGrid>
        <FormItem label="ประเภทแพ็กเกจ" full>
          <select><option>ผู้ใหญ่ (Adult)</option><option>เด็ก (Junior)</option></select>
        </FormItem>
        <FormItem label="ชื่อแพ็กเกจ" full>
          <input type="text" defaultValue={initial?.name ?? ""} placeholder="เช่น Pro Pack" />
        </FormItem>
        <FormItem label="รายละเอียด (optional)" full>
          <textarea defaultValue={initial ? "สนุกกับการเรียนรู้และฝึกฝนทักษะฟุตบอล" : ""} placeholder="คำอธิบายสั้น ๆ..." />
        </FormItem>
        <FormItem label="ราคา (฿)" full>
          <input type="number" defaultValue={initial?.price ?? ""} placeholder="2800" />
        </FormItem>
        <FormItem label="อายุ (วัน)">
          <input type="number" defaultValue={initial?.durationDays ?? ""} placeholder="40" />
        </FormItem>
        <FormItem label="จำนวน Sessions">
          <input type="number" defaultValue={initial?.sessions ?? ""} placeholder="8" />
        </FormItem>

        <FormSection>Extra Session</FormSection>

        <FormItem label="เปิดให้ซื้อ Extra?" full>
          <select value={extraEnabled ? "yes" : "no"} onChange={(e) => setExtraEnabled(e.target.value === "yes")}>
            <option value="yes">✅ เปิด</option>
            <option value="no">❌ ปิด</option>
          </select>
        </FormItem>

        {extraEnabled && (
          <>
            <FormItem label="Extra Limit (ครั้ง)">
              <input type="number" defaultValue={initial?.extraLimit ?? ""} placeholder="2" />
            </FormItem>
            <FormItem label="Extra Price (฿)">
              <input type="number" defaultValue={initial?.extraPrice ?? ""} placeholder="300" />
            </FormItem>
          </>
        )}
      </FormGrid>
    </Modal>
  );
}
