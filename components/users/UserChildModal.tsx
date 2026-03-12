"use client";

import React, { useState } from "react";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/context/ToastContext";

interface UserChildModalProps {
  open: boolean;
  onClose: () => void;
}

const BOOKING_HISTORY = [
  { date: "18/02/69", venue: "Small Arena", time: "09:00–10:30", status: "Attended" },
  { date: "11/02/69", venue: "Small Arena", time: "09:00–10:30", status: "No-show" },
];

export function UserChildModal({ open, onClose }: UserChildModalProps) {
  const { showToast } = useToast();
  const [tab, setTab] = useState(0);
  const tabs = ["ข้อมูลนักเรียน", "แพ็กเกจ", "ประวัติการจอง"];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#60A5FA,#A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🧒</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>พรีม</div>
            <div style={{ fontSize: 11, color: "var(--tm)" }}>นักเรียน · ลูกของ Ploiphailyn</div>
          </div>
        </div>
      }
      width={520}
      footer={
        <DefaultFooter
          onCancel={onClose}
          onConfirm={() => { onClose(); showToast("บันทึกข้อมูลแล้ว"); }}
        />
      }
    >
      <div style={{ margin: "-16px -20px 0" }}>
        <div style={{ display: "flex", borderBottom: "1px solid var(--bd)", padding: "0 16px", background: "#fff" }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{
              padding: "9px 13px", cursor: "pointer", fontSize: 12, fontWeight: 600,
              color: tab === i ? "var(--accent)" : "var(--tm)",
              background: "none", border: "none",
              borderBottom: tab === i ? "2px solid var(--accent)" : "2px solid transparent",
              fontFamily: "inherit", marginBottom: -1,
            } as React.CSSProperties}>{t}</button>
          ))}
        </div>

        <div style={{ padding: 15 }}>
          {tab === 0 && (
            <>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, position: "relative", cursor: "pointer" }}>
                  🧒
                  <div style={{ position: "absolute", bottom: 2, right: 2, width: 22, height: 22, background: "var(--accent)", borderRadius: "50%", border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>📷</div>
                </div>
              </div>
              <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, marginBottom: 14 }}>ข้อมูลนักเรียน</div>
              <FormGrid>
                <FormItem label="ชื่อเล่น" full><input type="text" defaultValue="พรีม" /></FormItem>
                <FormItem label="วันเกิด (อายุ 7 ปี)" full><input type="date" defaultValue="2017-04-07" /></FormItem>
                <FormItem label="ส่วนสูง (ซม.)"><input type="number" defaultValue={120} /></FormItem>
                <FormItem label="น้ำหนัก (กก.)"><input type="number" defaultValue={25} /></FormItem>
                <FormItem label="ไซส์เสื้อ" full>
                  <select defaultValue="L"><option>XS</option><option>S</option><option>L</option><option>XL</option></select>
                </FormItem>
                <FormItem label="ผู้ปกครอง" full>
                  <input type="text" defaultValue="Ploiphailyn" readOnly style={{ background: "#F3F4F6", color: "var(--tm)" }} />
                </FormItem>
                <FormItem label="หมายเหตุ / ข้อมูลพิเศษ" full>
                  <textarea placeholder="เช่น อาการแพ้, ข้อควรระวัง..." />
                </FormItem>
              </FormGrid>
            </>
          )}

          {tab === 1 && (
            <div style={{ border: "1.5px solid var(--bd2)", borderRadius: 9, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>First Step</div>
                <Badge variant="green">● Active</Badge>
              </div>
              <div style={{ fontSize: 11, color: "var(--tm)", marginBottom: 10 }}>13 ม.ค. 2569 – 11 ก.พ. 2569</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, margin: "10px 0" }}>
                {[{ v: 3, l: "Sessions", c: "var(--green)" }, { v: "—", l: "Extra", c: "var(--tm)" }, { v: 0, l: "วัน Pause", c: "var(--orange)" }].map((s, i) => (
                  <div key={i} style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 10, textAlign: "center" }}>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: s.c }}>{s.v}</div>
                    <div style={{ fontSize: 9, color: "var(--tm)", marginTop: 2, fontWeight: 600, textTransform: "uppercase" }}>{s.l}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "var(--bg)", border: "1.5px solid var(--bd)", borderRadius: 8, padding: 11 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "var(--tm)", marginBottom: 8 }}>🔧 Adjust Sessions</div>
                <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 7, alignItems: "end" }}>
                  <div><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>Sessions คงเหลือ</div><input className="ie" type="number" defaultValue={3} /></div>
                  <div><div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 2 }}>หมายเหตุ</div><input type="text" placeholder="ระบุเหตุผล..." style={{ fontSize: 11, padding: "5px 8px", width: "100%" }} /></div>
                  <Button variant="primary" size="sm" onClick={() => showToast("บันทึกแล้ว")}>บันทึก</Button>
                </div>
              </div>
            </div>
          )}

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
