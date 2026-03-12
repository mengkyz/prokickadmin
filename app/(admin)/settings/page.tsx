"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { useToast } from "@/lib/context/ToastContext";
import { VENUES, COACHES } from "@/lib/mock/data";

type Modal = "none" | "add-venue" | "edit-venue" | "add-coach" | "edit-coach";

export default function SettingsPage() {
  const { showToast } = useToast();
  const [modal, setModal] = useState<Modal>("none");

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
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* Venues Card */}
        <div style={cardStyle}>
          <div style={cardHdrStyle}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>📍 จัดการสนาม</div>
            <Button variant="primary" size="sm" onClick={() => setModal("add-venue")}>+ เพิ่ม</Button>
          </div>
          {VENUES.map((venue, i) => (
            <div
              key={venue.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: i < VENUES.length - 1 ? "1px solid var(--bd)" : "none",
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{venue.name}</div>
                <div style={{ fontSize: 11, color: "var(--tm)" }}>{venue.description}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace" }}>
                  Max: {venue.capacity}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setModal("edit-venue")}>แก้ไข</Button>
              </div>
            </div>
          ))}
        </div>

        {/* Coaches Card */}
        <div style={cardStyle}>
          <div style={cardHdrStyle}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>👤 จัดการโค้ช</div>
            <Button variant="primary" size="sm" onClick={() => setModal("add-coach")}>+ เพิ่ม</Button>
          </div>
          {COACHES.map((coach, i) => (
            <div
              key={coach.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                borderBottom: i < COACHES.length - 1 ? "1px solid var(--bd)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: coach.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff" }}>
                  {coach.avatarInitial}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{coach.name}</div>
                  <div style={{ fontSize: 11, color: "var(--tm)" }}>{coach.role}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setModal("edit-coach")}>แก้ไข</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Venue Modals */}
      <Modal
        open={modal === "add-venue"}
        onClose={() => setModal("none")}
        title="📍 เพิ่มสนามใหม่"
        width={400}
        footer={<DefaultFooter onCancel={() => setModal("none")} onConfirm={() => { setModal("none"); showToast("เพิ่มสนามแล้ว"); }} confirmLabel="เพิ่ม" />}
      >
        <FormGrid>
          <FormItem label="ชื่อสนาม" full><input type="text" placeholder="เช่น Arena B" /></FormItem>
          <FormItem label="คำอธิบาย" full><input type="text" placeholder="สนามรอง" /></FormItem>
          <FormItem label="ความจุ (คน)" full><input type="number" placeholder="20" /></FormItem>
        </FormGrid>
      </Modal>

      <Modal
        open={modal === "edit-venue"}
        onClose={() => setModal("none")}
        title="✏️ แก้ไขสนาม"
        width={400}
        footer={<DefaultFooter onCancel={() => setModal("none")} onConfirm={() => { setModal("none"); showToast("บันทึกแล้ว"); }} />}
      >
        <FormGrid>
          <FormItem label="ชื่อสนาม" full><input type="text" defaultValue="Grand Field" /></FormItem>
          <FormItem label="คำอธิบาย" full><input type="text" defaultValue="สนามหลัก" /></FormItem>
          <FormItem label="ความจุ (คน)" full><input type="number" defaultValue={20} /></FormItem>
        </FormGrid>
      </Modal>

      {/* Coach Modals */}
      <Modal
        open={modal === "add-coach"}
        onClose={() => setModal("none")}
        title="👤 เพิ่มโค้ชใหม่"
        width={400}
        footer={<DefaultFooter onCancel={() => setModal("none")} onConfirm={() => { setModal("none"); showToast("เพิ่มโค้ชแล้ว"); }} confirmLabel="เพิ่ม" />}
      >
        <FormGrid>
          <FormItem label="ชื่อโค้ช" full><input type="text" placeholder="เช่น Coach Max" /></FormItem>
          <FormItem label="บทบาท" full><input type="text" placeholder="โค้ชผู้ช่วย" /></FormItem>
        </FormGrid>
      </Modal>

      <Modal
        open={modal === "edit-coach"}
        onClose={() => setModal("none")}
        title="✏️ แก้ไขโค้ช"
        width={400}
        footer={<DefaultFooter onCancel={() => setModal("none")} onConfirm={() => { setModal("none"); showToast("บันทึกแล้ว"); }} />}
      >
        <FormGrid>
          <FormItem label="ชื่อโค้ช" full><input type="text" defaultValue="Pro Coach" /></FormItem>
          <FormItem label="บทบาท" full><input type="text" defaultValue="โค้ชหลัก" /></FormItem>
        </FormGrid>
      </Modal>
    </>
  );
}
