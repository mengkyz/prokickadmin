"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { useToast } from "@/lib/context/ToastContext";
import {
  fetchVenues, createVenue, updateVenue, toggleVenueActive, checkVenuesDeletable, deleteVenue,
  fetchCoaches, createCoach, updateCoach, toggleCoachActive, checkCoachesDeletable, deleteCoach,
} from "@/lib/db/settings";
import type { AdminVenue, AdminCoach, VenueInput, CoachInput } from "@/lib/db/settings";

type ModalType = "none" | "add-venue" | "edit-venue" | "add-coach" | "edit-coach";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [modal, setModal]         = useState<ModalType>("none");
  const [editVenue, setEditVenue] = useState<AdminVenue | null>(null);
  const [editCoach, setEditCoach] = useState<AdminCoach | null>(null);

  // ── Data ──────────────────────────────────────────────────
  const [venues,      setVenues]      = useState<AdminVenue[]>([]);
  const [coaches,     setCoaches]     = useState<AdminCoach[]>([]);
  const [loadingV,    setLoadingV]    = useState(true);
  const [loadingC,    setLoadingC]    = useState(true);
  const [showInactiveV, setShowInactiveV] = useState(false);
  const [showInactiveC, setShowInactiveC] = useState(false);

  // ── Venue form ────────────────────────────────────────────
  const [venueName,     setVenueName]     = useState("");
  const [venueDesc,     setVenueDesc]     = useState("");
  const [venueCapacity, setVenueCapacity] = useState(20);
  const [savingV,       setSavingV]       = useState(false);

  // ── Coach form ────────────────────────────────────────────
  const [coachName,  setCoachName]  = useState("");
  const [coachRole,  setCoachRole]  = useState("");
  const [coachPhone, setCoachPhone] = useState("");
  const [savingC,    setSavingC]    = useState(false);

  // ── Delete state ──────────────────────────────────────────
  const [deletableVenues,  setDeletableVenues]  = useState<Record<string, boolean>>({});
  const [deletableCoaches, setDeletableCoaches] = useState<Record<string, boolean>>({});
  const [confirmDeleteV,   setConfirmDeleteV]   = useState<string | null>(null);
  const [confirmDeleteC,   setConfirmDeleteC]   = useState<string | null>(null);
  const [deletingV,        setDeletingV]        = useState(false);
  const [deletingC,        setDeletingC]        = useState(false);

  // ── Loaders ───────────────────────────────────────────────
  const loadVenues = useCallback(async () => {
    setLoadingV(true);
    try {
      const vs = await fetchVenues(true);
      setVenues(vs);
      checkVenuesDeletable(vs.map((v) => v.id)).then(setDeletableVenues).catch(() => {});
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setLoadingV(false); }
  }, [showToast]);

  const loadCoaches = useCallback(async () => {
    setLoadingC(true);
    try {
      const cs = await fetchCoaches(true);
      setCoaches(cs);
      checkCoachesDeletable(cs.map((c) => c.id)).then(setDeletableCoaches).catch(() => {});
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setLoadingC(false); }
  }, [showToast]);

  useEffect(() => { loadVenues(); loadCoaches(); }, [loadVenues, loadCoaches]);

  // ── Helpers ───────────────────────────────────────────────
  function closeModal() {
    setModal("none");
    setEditVenue(null);
    setEditCoach(null);
  }

  function openAddVenue() {
    setVenueName(""); setVenueDesc(""); setVenueCapacity(20);
    setModal("add-venue");
  }

  function openEditVenue(v: AdminVenue) {
    setEditVenue(v);
    setVenueName(v.name); setVenueDesc(v.description); setVenueCapacity(v.capacity);
    setModal("edit-venue");
  }

  function openAddCoach() {
    setCoachName(""); setCoachRole(""); setCoachPhone("");
    setModal("add-coach");
  }

  function openEditCoach(c: AdminCoach) {
    setEditCoach(c);
    setCoachName(c.name); setCoachRole(c.role); setCoachPhone(c.phone);
    setModal("edit-coach");
  }

  // ── Venue CRUD ────────────────────────────────────────────
  async function handleSaveVenue() {
    if (!venueName.trim()) { showToast("กรุณาใส่ชื่อสนาม", "error"); return; }
    setSavingV(true);
    try {
      const input: VenueInput = { name: venueName, description: venueDesc, capacity: venueCapacity };
      if (modal === "add-venue") {
        await createVenue(input);
        showToast("เพิ่มสนามแล้ว");
      } else if (editVenue) {
        await updateVenue(editVenue.id, input);
        showToast("บันทึกแล้ว");
      }
      closeModal();
      await loadVenues();
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingV(false); }
  }

  async function handleToggleVenue(v: AdminVenue) {
    try {
      await toggleVenueActive(v.id, !v.isActive);
      showToast(v.isActive ? "ปิดการใช้งานสนามแล้ว" : "เปิดการใช้งานสนามแล้ว");
      await loadVenues();
    } catch (err) { showToast((err as Error).message, "error"); }
  }

  async function handleDeleteVenue(id: string) {
    setDeletingV(true);
    try {
      await deleteVenue(id);
      showToast("ลบสนามแล้ว");
      setConfirmDeleteV(null);
      await loadVenues();
    } catch (err) { showToast((err as Error).message, "error"); setConfirmDeleteV(null); }
    finally { setDeletingV(false); }
  }

  // ── Coach CRUD ────────────────────────────────────────────
  async function handleSaveCoach() {
    if (!coachName.trim()) { showToast("กรุณาใส่ชื่อโค้ช", "error"); return; }
    setSavingC(true);
    try {
      const input: CoachInput = { name: coachName, role: coachRole, phone: coachPhone };
      if (modal === "add-coach") {
        await createCoach(input);
        showToast("เพิ่มโค้ชแล้ว");
      } else if (editCoach) {
        await updateCoach(editCoach.id, input);
        showToast("บันทึกแล้ว");
      }
      closeModal();
      await loadCoaches();
    } catch (err) { showToast((err as Error).message, "error"); }
    finally { setSavingC(false); }
  }

  async function handleToggleCoach(c: AdminCoach) {
    try {
      await toggleCoachActive(c.id, !c.isActive);
      showToast(c.isActive ? "ปิดการใช้งานโค้ชแล้ว" : "เปิดการใช้งานโค้ชแล้ว");
      await loadCoaches();
    } catch (err) { showToast((err as Error).message, "error"); }
  }

  async function handleDeleteCoach(id: string) {
    setDeletingC(true);
    try {
      await deleteCoach(id);
      showToast("ลบโค้ชแล้ว");
      setConfirmDeleteC(null);
      await loadCoaches();
    } catch (err) { showToast((err as Error).message, "error"); setConfirmDeleteC(null); }
    finally { setDeletingC(false); }
  }

  // ── Styles ────────────────────────────────────────────────
  const cardStyle: React.CSSProperties = {
    background: "var(--card)",
    border: "1.5px solid var(--bd)",
    borderRadius: "var(--r)",
    boxShadow: "var(--sh)",
  };
  const cardHdrStyle: React.CSSProperties = {
    padding: "13px 16px",
    borderBottom: "1px solid var(--bd)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  };

  const filteredVenues  = showInactiveV ? venues  : venues.filter((v) => v.isActive);
  const filteredCoaches = showInactiveC ? coaches : coaches.filter((c) => c.isActive);

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* ── Venues Card ─────────────────────────────────── */}
        <div style={cardStyle}>
          <div style={cardHdrStyle}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>📍 จัดการสนาม</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--tm)", cursor: "pointer" }}>
                <input type="checkbox" checked={showInactiveV} onChange={(e) => setShowInactiveV(e.target.checked)} />
                แสดงที่ปิดแล้ว
              </label>
              <Button variant="primary" size="sm" onClick={openAddVenue}>+ เพิ่ม</Button>
            </div>
          </div>

          {loadingV && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--tm)", fontSize: 12 }}>กำลังโหลด...</div>
          )}
          {!loadingV && filteredVenues.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--tm)", fontSize: 12 }}>ยังไม่มีสนาม</div>
          )}
          {!loadingV && filteredVenues.map((venue, i) => (
            <div
              key={venue.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: i < filteredVenues.length - 1 ? "1px solid var(--bd)" : "none",
                opacity: venue.isActive ? 1 : 0.5,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{venue.name}</div>
                  {!venue.isActive && (
                    <span style={{ fontSize: 9, fontWeight: 700, color: "var(--red)", background: "var(--red-l)", padding: "1px 5px", borderRadius: 4 }}>ปิดแล้ว</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "var(--tm)" }}>{venue.description}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 11, color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace" }}>
                  Max: {venue.capacity}
                </span>
                <Button variant="ghost" size="sm" onClick={() => openEditVenue(venue)}>แก้ไข</Button>
                <Button
                  variant={venue.isActive ? "danger" : "success"}
                  size="sm"
                  onClick={() => handleToggleVenue(venue)}
                >
                  {venue.isActive ? "ปิด" : "เปิด"}
                </Button>
                {/* Delete button — disabled if venue has been used in any class */}
                {confirmDeleteV !== venue.id ? (
                  <button
                    onClick={() => { if (deletableVenues[venue.id] !== false) setConfirmDeleteV(venue.id); }}
                    title={deletableVenues[venue.id] === false ? "ไม่สามารถลบได้: สนามนี้ถูกใช้งานในคลาสอยู่แล้ว" : "ลบสนาม"}
                    style={{
                      fontSize: 12, padding: "3px 7px", borderRadius: 5, cursor: deletableVenues[venue.id] === false ? "not-allowed" : "pointer",
                      border: `1.5px solid ${deletableVenues[venue.id] === false ? "var(--bd2)" : "var(--red)"}`,
                      color: deletableVenues[venue.id] === false ? "var(--tm)" : "var(--red)",
                      background: "none", opacity: deletableVenues[venue.id] === false ? 0.4 : 1,
                    }}
                  >🗑️</button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 600 }}>ยืนยันลบ?</span>
                    <button
                      onClick={() => handleDeleteVenue(venue.id)} disabled={deletingV}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, cursor: "pointer", background: "var(--red)", color: "#fff", border: "none", fontFamily: "inherit" }}
                    >{deletingV ? "..." : "ลบ"}</button>
                    <button
                      onClick={() => setConfirmDeleteV(null)}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, cursor: "pointer", background: "none", border: "1.5px solid var(--bd)", color: "var(--t2)", fontFamily: "inherit" }}
                    >ยกเลิก</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── Coaches Card ─────────────────────────────────── */}
        <div style={cardStyle}>
          <div style={cardHdrStyle}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>👤 จัดการโค้ช</div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--tm)", cursor: "pointer" }}>
                <input type="checkbox" checked={showInactiveC} onChange={(e) => setShowInactiveC(e.target.checked)} />
                แสดงที่ปิดแล้ว
              </label>
              <Button variant="primary" size="sm" onClick={openAddCoach}>+ เพิ่ม</Button>
            </div>
          </div>

          {loadingC && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--tm)", fontSize: 12 }}>กำลังโหลด...</div>
          )}
          {!loadingC && filteredCoaches.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: "var(--tm)", fontSize: 12 }}>ยังไม่มีโค้ช</div>
          )}
          {!loadingC && filteredCoaches.map((coach, i) => (
            <div
              key={coach.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: i < filteredCoaches.length - 1 ? "1px solid var(--bd)" : "none",
                opacity: coach.isActive ? 1 : 0.5,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: coach.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {coach.avatarInitial}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{coach.name}</div>
                    {!coach.isActive && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--red)", background: "var(--red-l)", padding: "1px 5px", borderRadius: 4 }}>ปิดแล้ว</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--tm)" }}>
                    {coach.role}{coach.phone ? ` · ${coach.phone}` : ""}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <Button variant="ghost" size="sm" onClick={() => openEditCoach(coach)}>แก้ไข</Button>
                <Button
                  variant={coach.isActive ? "danger" : "success"}
                  size="sm"
                  onClick={() => handleToggleCoach(coach)}
                >
                  {coach.isActive ? "ปิด" : "เปิด"}
                </Button>
                {/* Delete button — disabled if coach has been used in any class */}
                {confirmDeleteC !== coach.id ? (
                  <button
                    onClick={() => { if (deletableCoaches[coach.id] !== false) setConfirmDeleteC(coach.id); }}
                    title={deletableCoaches[coach.id] === false ? "ไม่สามารถลบได้: โค้ชคนนี้ถูกใช้งานในคลาสอยู่แล้ว" : "ลบโค้ช"}
                    style={{
                      fontSize: 12, padding: "3px 7px", borderRadius: 5, cursor: deletableCoaches[coach.id] === false ? "not-allowed" : "pointer",
                      border: `1.5px solid ${deletableCoaches[coach.id] === false ? "var(--bd2)" : "var(--red)"}`,
                      color: deletableCoaches[coach.id] === false ? "var(--tm)" : "var(--red)",
                      background: "none", opacity: deletableCoaches[coach.id] === false ? 0.4 : 1,
                    }}
                  >🗑️</button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 10, color: "var(--red)", fontWeight: 600 }}>ยืนยันลบ?</span>
                    <button
                      onClick={() => handleDeleteCoach(coach.id)} disabled={deletingC}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, cursor: "pointer", background: "var(--red)", color: "#fff", border: "none", fontFamily: "inherit" }}
                    >{deletingC ? "..." : "ลบ"}</button>
                    <button
                      onClick={() => setConfirmDeleteC(null)}
                      style={{ fontSize: 10, padding: "3px 8px", borderRadius: 5, cursor: "pointer", background: "none", border: "1.5px solid var(--bd)", color: "var(--t2)", fontFamily: "inherit" }}
                    >ยกเลิก</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Venue Modals ──────────────────────────────────── */}
      <Modal
        open={modal === "add-venue" || modal === "edit-venue"}
        onClose={closeModal}
        title={modal === "add-venue" ? "📍 เพิ่มสนามใหม่" : "✏️ แก้ไขสนาม"}
        width={400}
        footer={
          <DefaultFooter
            onCancel={closeModal}
            onConfirm={handleSaveVenue}
            confirmLabel={savingV ? "กำลังบันทึก..." : modal === "add-venue" ? "เพิ่ม" : "บันทึก"}
          />
        }
      >
        <FormGrid>
          <FormItem label="ชื่อสนาม *" full>
            <input
              type="text"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="เช่น Arena B"
            />
          </FormItem>
          <FormItem label="คำอธิบาย" full>
            <input
              type="text"
              value={venueDesc}
              onChange={(e) => setVenueDesc(e.target.value)}
              placeholder="สนามรอง"
            />
          </FormItem>
          <FormItem label="ความจุ (คน)" full>
            <input
              type="number"
              value={venueCapacity}
              min={1}
              onChange={(e) => setVenueCapacity(Number(e.target.value))}
            />
          </FormItem>
        </FormGrid>
      </Modal>

      {/* ── Coach Modals ──────────────────────────────────── */}
      <Modal
        open={modal === "add-coach" || modal === "edit-coach"}
        onClose={closeModal}
        title={modal === "add-coach" ? "👤 เพิ่มโค้ชใหม่" : "✏️ แก้ไขโค้ช"}
        width={400}
        footer={
          <DefaultFooter
            onCancel={closeModal}
            onConfirm={handleSaveCoach}
            confirmLabel={savingC ? "กำลังบันทึก..." : modal === "add-coach" ? "เพิ่ม" : "บันทึก"}
          />
        }
      >
        <FormGrid>
          <FormItem label="ชื่อโค้ช *" full>
            <input
              type="text"
              value={coachName}
              onChange={(e) => setCoachName(e.target.value)}
              placeholder="เช่น Coach Max"
            />
          </FormItem>
          <FormItem label="บทบาท" full>
            <input
              type="text"
              value={coachRole}
              onChange={(e) => setCoachRole(e.target.value)}
              placeholder="โค้ชผู้ช่วย"
            />
          </FormItem>
          <FormItem label="เบอร์โทร" full>
            <input
              type="tel"
              value={coachPhone}
              onChange={(e) => setCoachPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
            />
          </FormItem>
        </FormGrid>
      </Modal>
    </>
  );
}
