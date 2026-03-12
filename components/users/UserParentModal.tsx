"use client";

import React, { useState } from "react";
import { Modal, FormGrid, FormItem, FormSection, DefaultFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/ToastContext";

interface UserParentModalProps {
  open: boolean;
  onClose: () => void;
}

const LOG_ENTRIES = [
  { dot: "var(--green)", time: "22/02/69 16:30", action: "ชำระเงิน Pro Pack", detail: "Admin · 2,800 ฿" },
  { dot: "var(--red)", time: "20/02/69 19:05", action: "No-show หัก session", detail: "คลาส 19:00 Grand Field · −1 session อัตโนมัติ" },
];

const BOOKING_HISTORY = [
  { date: "22/02/69", venue: "Grand Field", time: "19:00–20:30", status: "Attended" },
  { date: "20/02/69", venue: "Grand Field", time: "19:00–20:30", status: "No-show" },
  { date: "15/02/69", venue: "Grand Field", time: "19:00–20:30", status: "Attended" },
];

export function UserParentModal({ open, onClose }: UserParentModalProps) {
  const { showToast } = useToast();
  const [tab, setTab] = useState(0);

  const tabs = ["ข้อมูลส่วนตัว", "แพ็กเกจ", "ประวัติการจอง"];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#3B82F6,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff" }}>P</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Ploiphailyn</div>
            <div style={{ fontSize: 11, color: "var(--tm)" }}>ผู้ปกครอง + Player · 2 เด็ก (พรีม, พัค)</div>
          </div>
        </div>
      }
      width={580}
      footer={
        <DefaultFooter
          onCancel={onClose}
          onConfirm={() => { onClose(); showToast("บันทึกข้อมูลแล้ว"); }}
        />
      }
    >
      <div style={{ margin: "-16px -20px 0" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--bd)", padding: "0 16px", background: "#fff" }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: "9px 13px", cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: tab === i ? "var(--accent)" : "var(--tm)",
              borderBottom: tab === i ? "2px solid var(--accent)" : "2px solid transparent",
              background: "none", border: "none",
              borderBottom: tab === i ? "2px solid var(--accent)" : "2px solid transparent",
              fontFamily: "inherit", marginBottom: -1,
            } as React.CSSProperties}>{t}</button>
          ))}
        </div>

        <div style={{ padding: 15 }}>
          {/* Personal Info */}
          {tab === 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#3B82F6,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff", position: "relative", cursor: "pointer" }}>
                  P
                  <div style={{ position: "absolute", bottom: 2, right: 2, width: 22, height: 22, background: "var(--accent)", borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>📷</div>
                </div>
              </div>
              <FormGrid>
                <FormItem label="ชื่อจริง-นามสกุล" full><input type="text" defaultValue="Ploiphailyn Wongwises" /></FormItem>
                <FormItem label="เบอร์โทรศัพท์"><input type="tel" defaultValue="089-xxx-xxxx" /></FormItem>
                <FormItem label="ชื่อเล่น"><input type="text" defaultValue="ปลอย" /></FormItem>
                <FormItem label="วันเกิด"><input type="date" defaultValue="1990-04-15" /></FormItem>
                <FormItem label="ส่วนสูง (ซม.)"><input type="number" placeholder="170" /></FormItem>
                <FormItem label="น้ำหนัก (กก.)"><input type="number" placeholder="60" /></FormItem>
                <FormItem label="ไซส์เสื้อ" full>
                  <select defaultValue="M"><option>XS</option><option>S</option><option>M</option><option>L</option><option>XL</option><option>XXL</option></select>
                </FormItem>
                <FormItem label="ประเภท" full>
                  <select defaultValue="Parent + Player"><option>Parent only</option><option>Player only</option><option>Parent + Player</option></select>
                </FormItem>
              </FormGrid>
            </>
          )}

          {/* Package */}
          {tab === 1 && (
            <>
              <div style={{ border: "1.5px solid var(--bd2)", borderRadius: 9, padding: 14, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Pro Pack</div>
                  <Badge variant="green">● Active</Badge>
                </div>
                <div style={{ fontSize: 11, color: "var(--tm)", marginBottom: 10 }}>13 ม.ค. 2569 – 22 ก.พ. 2569</div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, margin: "10px 0" }}>
                  {[{ v: 7, l: "Sessions", c: "var(--green)" }, { v: 0, l: "Extra", c: "var(--blue)" }, { v: 0, l: "วัน Pause", c: "var(--orange)" }].map((s, i) => (
                    <div key={i} style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.c }}>{s.v}</div>
                      <div style={{ fontSize: 9, color: "var(--tm)", marginTop: 2, fontWeight: 600, textTransform: "uppercase" }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {/* Pause / Extend */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, marginBottom: 9 }}>
                  <div style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 11 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--tm)", marginBottom: 8 }}>⏸ Pause</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", gap: 5 }}>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>เริ่ม</div><input type="date" style={{ fontSize: 10, padding: "4px 7px" }} /></div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>สิ้นสุด</div><input type="date" style={{ fontSize: 10, padding: "4px 7px" }} /></div>
                      </div>
                      <Button variant="ghost" size="sm" style={{ width: "100%", fontSize: 10 }} onClick={() => showToast("Pause แล้ว")}>บันทึก</Button>
                    </div>
                  </div>
                  <div style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 11 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--tm)", marginBottom: 8 }}>📅 Extend</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", gap: 5, alignItems: "flex-end" }}>
                        <div><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>+วัน</div><input type="number" placeholder="+7" style={{ width: 55, fontSize: 11, padding: "4px 6px", textAlign: "center" }} /></div>
                        <div style={{ flex: 1 }}><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>หรือวันใหม่</div><input type="date" style={{ fontSize: 10, padding: "4px 7px" }} /></div>
                      </div>
                      <Button variant="ghost" size="sm" style={{ width: "100%", fontSize: 10 }} onClick={() => showToast("ต่ออายุแล้ว")}>บันทึก</Button>
                    </div>
                  </div>
                </div>

                {/* Adjust sessions */}
                <div style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 11 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "var(--tm)", marginBottom: 8 }}>🔧 Adjust Sessions / Extra</div>
                  <div style={{ display: "grid", gridTemplateColumns: "auto auto 1fr auto", gap: 7, alignItems: "end" }}>
                    <div><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>Sessions</div><input className="ie" type="number" defaultValue={7} /></div>
                    <div><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>Extra</div><input className="ie" type="number" defaultValue={0} /></div>
                    <div><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>หมายเหตุ</div><input type="text" placeholder="ระบุเหตุผล..." style={{ fontSize: 11, padding: "5px 8px", width: "100%" }} /></div>
                    <Button variant="primary" size="sm" onClick={() => showToast("บันทึก + Log")}>บันทึก</Button>
                  </div>
                </div>
              </div>

              {/* Log */}
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", marginBottom: 7 }}>📋 Log การแก้ไข</div>
                {LOG_ENTRIES.map((entry, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, padding: "8px 0", borderBottom: i < LOG_ENTRIES.length - 1 ? "1px solid var(--bd)" : "none", fontSize: 11 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: entry.dot, flexShrink: 0, marginTop: 2 }} />
                    <div style={{ color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace", minWidth: 100, flexShrink: 0 }}>{entry.time}</div>
                    <div>
                      <div style={{ fontWeight: 600 }}>{entry.action}</div>
                      <div style={{ color: "var(--t2)", fontSize: 10 }}>{entry.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Booking History */}
          {tab === 2 && (
            <table>
              <thead><tr><th>วันที่</th><th>สนาม</th><th>เวลา</th><th>สถานะ</th></tr></thead>
              <tbody>
                {BOOKING_HISTORY.map((b, i) => (
                  <tr key={i}>
                    <td className="pk-mono">{b.date}</td>
                    <td>{b.venue}</td>
                    <td className="pk-mono">{b.time}</td>
                    <td><Badge variant={b.status === "Attended" ? "green" : "red"}>{b.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
