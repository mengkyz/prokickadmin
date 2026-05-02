"use client";

import React, { useState } from "react";
import { Modal, FormGrid, FormItem, FormSection } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/ToastContext";
import { createPackage, updatePackage, deletePackage, togglePackageActive } from "@/lib/db/packages";
import type { Package, PackageCategory } from "@/lib/types";

interface PackageModalProps {
  open: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  initial?: Package;
  isDeletable?: boolean;
  onSuccess?: () => void;
}

export function PackageModal({ open, onClose, mode, initial, isDeletable = false, onSuccess }: PackageModalProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    category: initial?.category ?? "Adult" as PackageCategory,
    name: initial?.name ?? "",
    price: initial?.price ?? "",
    durationDays: initial?.durationDays ?? "",
    sessions: initial?.sessions ?? "",
    extraEnabled: initial?.extraEnabled ?? true,
    extraLimit: initial?.extraLimit ?? 2,
    extraPrice: initial?.extraPrice ?? "",
  });

  function set(field: string, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleConfirm() {
    setLoading(true);
    try {
      const payload = {
        category: form.category as PackageCategory,
        name: form.name,
        price: Number(form.price),
        durationDays: Number(form.durationDays),
        sessions: Number(form.sessions),
        extraEnabled: form.extraEnabled,
        extraLimit: form.extraEnabled ? Number(form.extraLimit) : 0,
        extraPrice: form.extraEnabled ? Number(form.extraPrice) : 0,
      };

      if (mode === "create") {
        await createPackage(payload);
        showToast("สร้างแพ็กเกจแล้ว");
      } else {
        await updatePackage(initial!.id, payload);
        showToast("บันทึกแล้ว");
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!initial) return;
    setLoading(true);
    try {
      await deletePackage(initial.id);
      showToast("ลบแพ็กเกจแล้ว");
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive() {
    if (!initial) return;
    setLoading(true);
    try {
      await togglePackageActive(initial.id, !initial.isActive);
      showToast(initial.isActive ? "ปิดใช้งานแพ็กเกจแล้ว" : "เปิดใช้งานแพ็กเกจแล้ว");
      onSuccess?.();
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด", "error");
    } finally {
      setLoading(false);
    }
  }

  const isEdit = mode === "edit" && !!initial;
  const title = mode === "create" ? "📦 สร้างแพ็กเกจใหม่" : `✏️ แก้ไขแพ็กเกจ — ${initial?.name ?? ""}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      width={480}
      footer={
        <div style={{ display: "flex", width: "100%", alignItems: "center", gap: 8 }}>
          {/* Left side — destructive actions (edit only) */}
          {isEdit && (
            <div style={{ display: "flex", gap: 6, marginRight: "auto" }}>
              {/* Delete — only enabled when no user_packages reference this template */}
              <div style={{ position: "relative" }} title={!isDeletable ? "ไม่สามารถลบได้: มีผู้ใช้ที่ใช้แพ็กเกจนี้อยู่" : ""}>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading || !isDeletable}
                  style={{
                    background: isDeletable ? "var(--red, #ef4444)" : "var(--bd2, #e5e7eb)",
                    color: isDeletable ? "#fff" : "var(--tm, #9ca3af)",
                    border: "none",
                    borderRadius: 8,
                    padding: "6px 14px",
                    cursor: isDeletable && !loading ? "pointer" : "not-allowed",
                    fontSize: 13,
                    fontFamily: "inherit",
                    fontWeight: 600,
                    transition: "background 0.15s",
                  }}
                >
                  ลบ
                </button>
              </div>

              {/* Inactive / Active toggle */}
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={loading}
                style={{
                  background: initial.isActive ? "var(--orange, #f97316)" : "var(--green, #22c55e)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "6px 14px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: 13,
                  fontFamily: "inherit",
                  fontWeight: 600,
                  transition: "opacity 0.15s",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {initial.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
              </button>
            </div>
          )}

          {/* Right side — cancel / save */}
          <div style={{ display: "flex", gap: 8, marginLeft: isEdit ? 0 : "auto" }}>
            <Button variant="ghost" onClick={onClose} disabled={loading}>ยกเลิก</Button>
            <Button variant="primary" onClick={handleConfirm} disabled={loading}>
              {loading ? "กำลังบันทึก..." : mode === "create" ? "สร้าง" : "บันทึก"}
            </Button>
          </div>
        </div>
      }
    >
      <FormGrid>
        <FormItem label="ประเภทแพ็กเกจ" full>
          <select value={form.category} onChange={(e) => set("category", e.target.value)}>
            <option value="Adult">ผู้ใหญ่ (Adult)</option>
            <option value="Junior">เด็ก (Junior)</option>
          </select>
        </FormItem>
        <FormItem label="ชื่อแพ็กเกจ" full>
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="เช่น Pro Pack"
          />
        </FormItem>
        <FormItem label="ราคา (฿)" full>
          <input
            type="number"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            placeholder="2800"
          />
        </FormItem>
        <FormItem label="อายุ (วัน)">
          <input
            type="number"
            value={form.durationDays}
            onChange={(e) => set("durationDays", e.target.value)}
            placeholder="40"
          />
        </FormItem>
        <FormItem label="จำนวน Sessions">
          <input
            type="number"
            value={form.sessions}
            onChange={(e) => set("sessions", e.target.value)}
            placeholder="8"
          />
        </FormItem>

        <FormSection>Extra Session</FormSection>

        <FormItem label="เปิดให้ซื้อ Extra?" full>
          <select
            value={form.extraEnabled ? "yes" : "no"}
            onChange={(e) => set("extraEnabled", e.target.value === "yes")}
          >
            <option value="yes">✅ เปิด</option>
            <option value="no">❌ ปิด</option>
          </select>
        </FormItem>

        {form.extraEnabled && (
          <>
            <FormItem label="ซื้อได้สูงสุด (ครั้ง)">
              <input
                type="number"
                value={form.extraLimit}
                onChange={(e) => set("extraLimit", e.target.value)}
                placeholder="2"
                min={1}
              />
            </FormItem>
            <FormItem label="ราคา Extra/ครั้ง (฿)">
              <input
                type="number"
                value={form.extraPrice}
                onChange={(e) => set("extraPrice", e.target.value)}
                placeholder="300"
              />
            </FormItem>
          </>
        )}
      </FormGrid>
    </Modal>
  );
}
