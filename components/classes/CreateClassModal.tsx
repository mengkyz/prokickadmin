"use client";

import React, { useState, useEffect } from "react";
import { Modal, FormGrid, FormItem, FormSection, DefaultFooter } from "@/components/ui/Modal";
import { useToast } from "@/lib/context/ToastContext";
import { createClass, createClasses } from "@/lib/db/classes";
import type { ClassInput, PackageFilter, AdminClass } from "@/lib/db/classes";
import { fetchVenues, fetchCoaches } from "@/lib/db/settings";
import type { AdminVenue, AdminCoach } from "@/lib/db/settings";

const RECUR_OPTIONS = [
  { value: "none",     label: "Does not repeat",           desc: "" },
  { value: "daily",    label: "Daily",                     desc: "ทุกวัน" },
  { value: "weekly",   label: "Weekly on selected day",    desc: "ทุกสัปดาห์ ในวันที่เลือก" },
  { value: "weekdays", label: "Every weekday (Mon–Fri)",   desc: "จันทร์ ถึง ศุกร์ทุกสัปดาห์" },
  { value: "custom",   label: "Custom…",                   desc: "เลือกวันเองและกำหนดวันสิ้นสุด" },
];

const WEEKDAYS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: (cls: AdminClass | number) => void;
}

export function CreateClassModal({ open, onClose, onCreated }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [recur, setRecur] = useState("none");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 4]);

  // Venues & coaches from DB
  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [coaches, setCoaches] = useState<AdminCoach[]>([]);

  // Form state
  const [date, setDate]           = useState("");
  const [timeStart, setTimeStart] = useState("09:00");
  const [timeEnd, setTimeEnd]     = useState("10:30");
  const [selectedVenue, setSelectedVenue] = useState<AdminVenue | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<AdminCoach | null>(null);
  const [pkgFilter, setPkgFilter] = useState<PackageFilter>("all");
  const [capacity, setCapacity]   = useState(20);
  const [notes, setNotes]         = useState("");
  const [recurEnd, setRecurEnd]   = useState("");

  // Load venues & coaches when modal opens
  useEffect(() => {
    if (!open) return;
    Promise.all([fetchVenues(), fetchCoaches()])
      .then(([vs, cs]) => {
        setVenues(vs);
        setCoaches(cs);
        setSelectedVenue((prev) => prev ?? vs[0] ?? null);
        setSelectedCoach((prev) => prev ?? cs[0] ?? null);
      })
      .catch((err) => showToast((err as Error).message, "error"));
  }, [open, showToast]);

  function toggleDay(idx: number) {
    setSelectedDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
    );
  }

  // Generate recurring dates between a start date and end date
  function generateDates(startDate: Date, endDate: Date, recurType: string, days: number[]): Date[] {
    const dates: Date[] = [];
    const cur = new Date(startDate);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    if (recurType === "daily") {
      while (cur <= end) {
        dates.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
    } else if (recurType === "weekly") {
      // Repeat on the same day of week as startDate
      const targetDay = startDate.getDay();
      while (cur <= end) {
        if (cur.getDay() === targetDay) dates.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
    } else if (recurType === "weekdays") {
      while (cur <= end) {
        const d = cur.getDay();
        if (d >= 1 && d <= 5) dates.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
    } else if (recurType === "custom") {
      while (cur <= end) {
        if (days.includes(cur.getDay())) dates.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
    }
    return dates;
  }

  async function handleCreate() {
    if (!date) { showToast("กรุณาเลือกวันที่", "error"); return; }

    setSaving(true);
    try {
      const [sh, sm] = timeStart.split(":").map(Number);
      const [eh, em] = timeEnd.split(":").map(Number);
      const baseStart = new Date(`${date}T00:00:00`);

      const input: ClassInput = {
        startTime: new Date(baseStart.getFullYear(), baseStart.getMonth(), baseStart.getDate(), sh, sm).toISOString(),
        endTime:   new Date(baseStart.getFullYear(), baseStart.getMonth(), baseStart.getDate(), eh, em).toISOString(),
        venue: selectedVenue?.name ?? "",
        venueId: selectedVenue?.id ?? null,
        coach: selectedCoach?.name ?? "",
        coachId: selectedCoach?.id ?? null,
        capacity,
        packageFilter: pkgFilter,
        notes,
      };

      if (recur === "none") {
        const cls = await createClass(input);
        showToast("สร้างคลาสแล้ว!");
        onCreated?.(cls);
      } else {
        if (!recurEnd) { showToast("กรุณาเลือกวันสิ้นสุด", "error"); setSaving(false); return; }
        const endDate = new Date(recurEnd);
        const dates = generateDates(baseStart, endDate, recur, selectedDays);
        if (dates.length === 0) { showToast("ไม่พบวันที่ตรงเงื่อนไข", "error"); setSaving(false); return; }

        const inputs: ClassInput[] = dates.map((d) => ({
          ...input,
          startTime: new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm).toISOString(),
          endTime:   new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em).toISOString(),
        }));

        const count = await createClasses(inputs);
        showToast(`สร้าง ${count} คลาสแล้ว!`);
        onCreated?.(count);
      }

      onClose();
      // Reset form
      setDate(""); setTimeStart("09:00"); setTimeEnd("10:30");
      setSelectedVenue(venues[0] ?? null); setSelectedCoach(coaches[0] ?? null);
      setPkgFilter("all"); setCapacity(20); setNotes(""); setRecur("none"); setRecurEnd("");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🗓️ สร้างคลาสใหม่"
      width={520}
      footer={
        <DefaultFooter
          onCancel={onClose}
          onConfirm={handleCreate}
          confirmLabel={saving ? "กำลังสร้าง..." : "สร้างคลาส"}
        />
      }
    >
      <FormGrid>
        <FormItem label="วันที่" full>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </FormItem>
        <FormItem label="เวลาเริ่ม">
          <input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} />
        </FormItem>
        <FormItem label="เวลาสิ้นสุด">
          <input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} />
        </FormItem>
        <FormItem label="สนาม">
          <select
            value={selectedVenue?.id ?? ""}
            onChange={(e) => setSelectedVenue(venues.find((v) => v.id === e.target.value) ?? null)}
          >
            {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </FormItem>
        <FormItem label="โค้ช">
          <select
            value={selectedCoach?.id ?? ""}
            onChange={(e) => setSelectedCoach(coaches.find((c) => c.id === e.target.value) ?? null)}
          >
            {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </FormItem>
        <FormItem label="แพ็กเกจที่รับ">
          <select value={pkgFilter} onChange={(e) => setPkgFilter(e.target.value as PackageFilter)}>
            <option value="all">ทั้งหมด</option>
            <option value="adult">ผู้ใหญ่เท่านั้น</option>
            <option value="junior">เด็กเท่านั้น</option>
          </select>
        </FormItem>
        <FormItem label="จำนวนรับ">
          <input type="number" value={capacity} min={1} onChange={(e) => setCapacity(Number(e.target.value))} />
        </FormItem>
        <FormItem label="หมายเหตุ" full>
          <textarea placeholder="เพิ่มเติม..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormItem>

        <FormSection>🔁 ตั้งคลาสซ้ำ</FormSection>

        <FormItem label="" full>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {RECUR_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                onClick={() => setRecur(opt.value)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 9,
                  padding: "8px 11px", borderRadius: 7,
                  border: `1.5px solid ${recur === opt.value ? "var(--accent)" : "var(--bd)"}`,
                  background: recur === opt.value ? "var(--accent-dim)" : "transparent",
                  cursor: "pointer", transition: "all 0.12s",
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

          {recur !== "none" && (
            <div style={{ marginTop: 7, padding: 11, background: "var(--bg)", borderRadius: 7, border: "1.5px solid var(--bd)", display: "flex", flexDirection: "column", gap: 9 }}>
              {recur === "custom" && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", marginBottom: 6 }}>เลือกวัน</div>
                  <div style={{ display: "flex", gap: 5 }}>
                    {WEEKDAYS.map((d, i) => (
                      <div key={i} onClick={() => toggleDay(i)}
                        style={{
                          width: 32, height: 32, borderRadius: "50%",
                          border: `1.5px solid ${selectedDays.includes(i) ? "var(--accent)" : "var(--bd2)"}`,
                          background: selectedDays.includes(i) ? "var(--accent)" : "transparent",
                          color: selectedDays.includes(i) ? "#fff" : "var(--t2)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.12s",
                        }}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <FormItem label="วันสิ้นสุดการซ้ำ">
                <input type="date" value={recurEnd} onChange={(e) => setRecurEnd(e.target.value)} />
              </FormItem>
            </div>
          )}
        </FormItem>
      </FormGrid>
    </Modal>
  );
}
