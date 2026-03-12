"use client";

import React, { useState } from "react";
import { Modal, FormGrid, FormItem, FormSection, DefaultFooter } from "@/components/ui/Modal";
import { useToast } from "@/lib/context/ToastContext";

interface CreateClassModalProps {
  open: boolean;
  onClose: () => void;
}

const RECUR_OPTIONS = [
  { value: "none", label: "Does not repeat", desc: "" },
  { value: "daily", label: "Daily", desc: "ทุกวัน" },
  { value: "weekly", label: "Weekly on [selected day]", desc: "ทุกสัปดาห์ ในวันที่เลือก" },
  { value: "weekdays", label: "Every weekday (Mon–Fri)", desc: "จันทร์ ถึง ศุกร์ทุกสัปดาห์" },
  { value: "custom", label: "Custom…", desc: "เลือกวันเองและกำหนดวันสิ้นสุด" },
];

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

export function CreateClassModal({ open, onClose }: CreateClassModalProps) {
  const { showToast } = useToast();
  const [recur, setRecur] = useState("none");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 4]);

  function toggleDay(idx: number) {
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
    );
  }

  function handleCreate() {
    onClose();
    showToast("สร้างคลาสแล้ว!");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🗓️ สร้างคลาสใหม่"
      width={520}
      footer={<DefaultFooter onCancel={onClose} onConfirm={handleCreate} confirmLabel="สร้างคลาส" />}
    >
      <FormGrid>
        <FormItem label="วันที่" full>
          <input type="date" />
        </FormItem>
        <FormItem label="เวลาเริ่ม">
          <input type="time" defaultValue="09:00" />
        </FormItem>
        <FormItem label="เวลาสิ้นสุด">
          <input type="time" defaultValue="10:30" />
        </FormItem>
        <FormItem label="สนาม">
          <select>
            <option>Grand Field (max 20)</option>
            <option>Arena A (max 20)</option>
            <option>Small Arena (max 12)</option>
          </select>
        </FormItem>
        <FormItem label="โค้ช">
          <select>
            <option>Pro Coach</option>
            <option>Coach Arm</option>
            <option>Coach Bee</option>
          </select>
        </FormItem>
        <FormItem label="แพ็กเกจที่รับ">
          <select>
            <option>ทั้งหมด</option>
            <option>ผู้ใหญ่เท่านั้น</option>
            <option>เด็กเท่านั้น</option>
          </select>
        </FormItem>
        <FormItem label="จำนวนรับ">
          <input type="number" defaultValue={20} />
        </FormItem>
        <FormItem label="หมายเหตุ" full>
          <textarea placeholder="เพิ่มเติม..." />
        </FormItem>

        <FormSection>🔁 ตั้งคลาสซ้ำ</FormSection>

        <FormItem label="" full>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {RECUR_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                onClick={() => setRecur(opt.value)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 9,
                  padding: "8px 11px",
                  borderRadius: 7,
                  border: `1.5px solid ${recur === opt.value ? "var(--accent)" : "var(--bd)"}`,
                  background: recur === opt.value ? "var(--accent-dim)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.12s",
                }}
              >
                <input type="radio" name="recur" readOnly checked={recur === opt.value}
                  style={{ accentColor: "var(--accent)", width: 13, height: 13, flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{opt.label}</div>
                  {opt.desc && <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 1 }}>{opt.desc}</div>}
                </div>
              </div>
            ))}
          </div>

          {recur === "custom" && (
            <div style={{ marginTop: 7, padding: 11, background: "var(--bg)", borderRadius: 7, border: "1.5px solid var(--bd)", display: "flex", flexDirection: "column", gap: 9 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", marginBottom: 6 }}>เลือกวัน</div>
                <div style={{ display: "flex", gap: 5 }}>
                  {WEEKDAYS.map((d, i) => (
                    <div
                      key={i}
                      onClick={() => toggleDay(i)}
                      style={{
                        width: 32, height: 32, borderRadius: "50%",
                        border: `1.5px solid ${selectedDays.includes(i) ? "var(--accent)" : "var(--bd2)"}`,
                        background: selectedDays.includes(i) ? "var(--accent)" : "transparent",
                        color: selectedDays.includes(i) ? "#fff" : "var(--t2)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, cursor: "pointer",
                        transition: "all 0.12s",
                      }}
                    >
                      {d}
                    </div>
                  ))}
                </div>
              </div>
              <FormItem label="วันสิ้นสุดการซ้ำ">
                <input type="date" />
              </FormItem>
            </div>
          )}
        </FormItem>
      </FormGrid>
    </Modal>
  );
}
