"use client";

import React, { useState, useEffect } from "react";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/ToastContext";
import { updateClass, cancelClass } from "@/lib/db/classes";
import type { AdminClass, ClassInput, PackageFilter } from "@/lib/db/classes";
import { fetchVenues, fetchCoaches } from "@/lib/db/settings";
import type { AdminVenue, AdminCoach } from "@/lib/db/settings";

interface Props {
  open: boolean;
  onClose: () => void;
  cls: AdminClass | null;
  onSaved?: (updated: AdminClass) => void;
  onCancelled?: (id: string) => void;
}

export function EditClassModal({ open, onClose, cls, onSaved, onCancelled }: Props) {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  // Venues & coaches from DB
  const [venues, setVenues] = useState<AdminVenue[]>([]);
  const [coaches, setCoaches] = useState<AdminCoach[]>([]);

  // Pre-fill form from cls prop
  const isoToDate = (iso: string) => iso ? iso.split("T")[0] : "";
  const isoToTime = (iso: string) => {
    if (!iso) return "";
    const d = new Date(iso);
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
  };

  const [date, setDate]           = useState(() => isoToDate(cls?.startTimeIso ?? ""));
  const [timeStart, setTimeStart] = useState(() => isoToTime(cls?.startTimeIso ?? ""));
  const [timeEnd, setTimeEnd]     = useState(() => isoToTime(cls?.endTimeIso ?? ""));
  const [selectedVenue, setSelectedVenue] = useState<AdminVenue | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<AdminCoach | null>(null);
  const [pkgFilter, setPkgFilter] = useState<PackageFilter>(() => cls?.packageFilter ?? "all");
  const [capacity, setCapacity]   = useState(() => cls?.capacity ?? 20);
  const [notes, setNotes]         = useState(() => cls?.notes ?? "");

  // Load venues & coaches when modal opens, then match current class values
  useEffect(() => {
    if (!open) return;
    Promise.all([fetchVenues(), fetchCoaches()])
      .then(([vs, cs]) => {
        setVenues(vs);
        setCoaches(cs);
        // Match by name (covers both old text-only records and new FK records)
        setSelectedVenue(vs.find((v) => v.name === cls?.venue) ?? vs[0] ?? null);
        setSelectedCoach(cs.find((c) => c.name === cls?.coach) ?? cs[0] ?? null);
      })
      .catch((err) => showToast((err as Error).message, "error"));
  }, [open, cls, showToast]);

  // Re-sync date/time/filter fields when cls changes
  useEffect(() => {
    if (cls) {
      setDate(isoToDate(cls.startTimeIso));
      setTimeStart(isoToTime(cls.startTimeIso));
      setTimeEnd(isoToTime(cls.endTimeIso));
      setPkgFilter(cls.packageFilter);
      setCapacity(cls.capacity);
      setNotes(cls.notes);
    }
  }, [cls]);

  async function handleSave() {
    if (!cls) return;
    setSaving(true);
    try {
      const [sh, sm] = timeStart.split(":").map(Number);
      const [eh, em] = timeEnd.split(":").map(Number);
      const base = new Date(date);

      const input: ClassInput = {
        startTime: new Date(base.getFullYear(), base.getMonth(), base.getDate(), sh, sm).toISOString(),
        endTime:   new Date(base.getFullYear(), base.getMonth(), base.getDate(), eh, em).toISOString(),
        venue: selectedVenue?.name ?? "",
        venueId: selectedVenue?.id ?? null,
        coach: selectedCoach?.name ?? "",
        coachId: selectedCoach?.id ?? null,
        capacity,
        packageFilter: pkgFilter,
        notes,
      };

      const updated = await updateClass(cls.id, input);
      showToast("บันทึกแล้ว");
      onSaved?.(updated);
      onClose();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    if (!cls) return;
    if (!confirm("ยืนยันการยกเลิกคลาสนี้? การจองทั้งหมดจะถูกยกเลิกด้วย")) return;
    setSaving(true);
    try {
      await cancelClass(cls.id);
      showToast("ยกเลิกคลาสแล้ว", "error");
      onCancelled?.(cls.id);
      onClose();
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
      title="✏️ แก้ไขคลาส"
      width={440}
      footer={
        <>
          <Button variant="danger" size="sm" onClick={handleCancel} disabled={saving}>
            ยกเลิกคลาส
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </>
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
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormItem>
      </FormGrid>
    </Modal>
  );
}
