"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal, FormGrid, FormItem, DefaultFooter } from "@/components/ui/Modal";
import { useToast } from "@/lib/context/ToastContext";
import {
  fetchPayments,
  fetchPaymentSummary,
  thisMonthRange,
  lastMonthRange,
  last3MonthsRange,
  bankInfo,
  formatSlipDateTime,
  type AdminPayment,
  type PaymentSummary,
} from "@/lib/db/payments";

// ── Slip detail modal ─────────────────────────────────────────────────────────
function SlipDetailModal({ payment, onClose }: { payment: AdminPayment | null; onClose: () => void }) {
  if (!payment) return null;
  const sending  = bankInfo(payment.sendingBank);
  const receiving = bankInfo(payment.receivingBank);

  const row = (label: string, value: string | number | null | undefined) =>
    value ? (
      <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--bd)" }}>
        <div style={{ fontSize: 11, color: "var(--tm)", flexShrink: 0, marginRight: 12 }}>{label}</div>
        <div style={{ fontSize: 11, fontWeight: 600, textAlign: "right", wordBreak: "break-all" }}>{value}</div>
      </div>
    ) : null;

  return (
    <Modal open={!!payment} onClose={onClose} title="🧾 รายละเอียดสลิป" width={480}
      footer={<DefaultFooter onCancel={onClose} onConfirm={onClose} confirmLabel="ปิด" />}
    >
      {/* Status banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 14px", borderRadius: 8, marginBottom: 14,
        background: payment.slipokSuccess ? "var(--green-l)" : "var(--red-l)",
        border: `1.5px solid ${payment.slipokSuccess ? "var(--green)" : "var(--red)"}`,
      }}>
        <div style={{ fontSize: 18 }}>{payment.slipokSuccess ? "✅" : "❌"}</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: payment.slipokSuccess ? "var(--green)" : "var(--red)" }}>
            {payment.slipokSuccess ? "ยืนยันสลิปสำเร็จ" : "ยืนยันสลิปล้มเหลว"}
          </div>
          {payment.slipokMessage && (
            <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 1 }}>{payment.slipokMessage}</div>
          )}
          {!payment.slipokSuccess && payment.errorCode && (
            <div style={{ fontSize: 10, color: "var(--red)", marginTop: 1 }}>
              รหัสข้อผิดพลาด: {payment.errorCode} — {payment.errorMessage ?? ""}
            </div>
          )}
          {!payment.slipokSuccess && payment.failureReason && (
            <div style={{ fontSize: 10, color: "var(--red)", marginTop: 1 }}>
              สาเหตุ: {payment.failureReason}
            </div>
          )}
        </div>
      </div>

      {/* Amount */}
      {payment.amount != null && (
        <div style={{ textAlign: "center", padding: "10px 0 14px", borderBottom: "1px solid var(--bd)", marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: "var(--tm)", marginBottom: 2 }}>ยอดชำระ</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: "var(--green)" }}>
            {payment.amount.toLocaleString()} ฿
          </div>
        </div>
      )}

      {/* Transaction info */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>ข้อมูลรายการ</div>
        {row("เลขอ้างอิง", payment.transRef)}
        {row("วัน/เวลา (สลิป)", formatSlipDateTime(payment.transDate, payment.transTime))}
        {row("วันที่รับแจ้ง", payment.displayCreated)}
        {row("Ref 1", payment.ref1)}
        {row("Ref 2", payment.ref2)}
        {row("Ref 3", payment.ref3)}
      </div>

      {/* Sender */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>ผู้โอน</div>
        <div style={{ padding: "8px 10px", background: "var(--bg)", borderRadius: 7, border: "1.5px solid var(--bd)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: sending.color, flexShrink: 0 }} />
            <div style={{ fontSize: 11, fontWeight: 700 }}>{sending.short}</div>
            <div style={{ fontSize: 10, color: "var(--tm)" }}>{sending.full}</div>
          </div>
          {payment.senderName && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{payment.senderName}</div>}
          {payment.senderAccount && <div style={{ fontSize: 10, color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace" }}>{payment.senderAccount}</div>}
        </div>
      </div>

      {/* Receiver */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>ผู้รับ</div>
        <div style={{ padding: "8px 10px", background: "var(--bg)", borderRadius: 7, border: "1.5px solid var(--bd)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: receiving.color, flexShrink: 0 }} />
            <div style={{ fontSize: 11, fontWeight: 700 }}>{receiving.short}</div>
            <div style={{ fontSize: 10, color: "var(--tm)" }}>{receiving.full}</div>
          </div>
          {payment.receiverName && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 2 }}>{payment.receiverName}</div>}
          {payment.receiverAccount && <div style={{ fontSize: 10, color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace" }}>{payment.receiverAccount}</div>}
        </div>
      </div>

      {/* Linked user */}
      {payment.userName && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>ผู้ใช้ที่เชื่อมโยง</div>
          {row("ชื่อ", payment.userName)}
          {row("โทร", payment.userPhone)}
        </div>
      )}

      {/* Note */}
      {payment.note && (
        <div style={{ marginTop: 8, padding: "8px 10px", background: "var(--bg)", borderRadius: 7, border: "1.5px solid var(--bd)" }}>
          <div style={{ fontSize: 10, color: "var(--tm)", marginBottom: 2 }}>หมายเหตุ</div>
          <div style={{ fontSize: 11 }}>{payment.note}</div>
        </div>
      )}
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
type DateFilter = "this_month" | "last_month" | "3_months" | "custom";
type StatusFilter = "all" | "success" | "failed";

export default function PaymentsPage() {
  const { showToast } = useToast();

  // Data
  const [payments,    setPayments]    = useState<AdminPayment[]>([]);
  const [summary,     setSummary]     = useState<PaymentSummary | null>(null);
  const [loading,     setLoading]     = useState(true);

  // Filters
  const [dateFilter,   setDateFilter]   = useState<DateFilter>("this_month");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [customFrom,   setCustomFrom]   = useState("");
  const [customTo,     setCustomTo]     = useState("");
  const [search,       setSearch]       = useState("");

  // Modals
  const [detailPay,    setDetailPay]    = useState<AdminPayment | null>(null);
  const [editPayOpen,  setEditPayOpen]  = useState(false);

  // ── Loader ──────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      let range: { from: string; to: string } | undefined;
      if (dateFilter === "this_month")  range = thisMonthRange();
      if (dateFilter === "last_month")  range = lastMonthRange();
      if (dateFilter === "3_months")    range = last3MonthsRange();
      if (dateFilter === "custom" && customFrom && customTo) {
        range = { from: new Date(customFrom).toISOString(), to: new Date(`${customTo}T23:59:59`).toISOString() };
      }

      // Use allSettled so a summary error never blocks the payments list
      const [paysResult, sumResult] = await Promise.allSettled([
        fetchPayments({
          from: range?.from,
          to: range?.to,
          successOnly: statusFilter === "success" || undefined,
          failedOnly:  statusFilter === "failed"  || undefined,
        }),
        fetchPaymentSummary(),
      ]);

      if (paysResult.status === "fulfilled") setPayments(paysResult.value);
      else showToast((paysResult.reason as Error).message, "error");

      if (sumResult.status === "fulfilled") setSummary(sumResult.value);
      // Summary failure is non-fatal — keep showing zeroes from useState init
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter, customFrom, customTo, showToast]);

  useEffect(() => { load(); }, [load]);

  // ── Client-side search ──────────────────────────────────
  const filtered = search.trim()
    ? payments.filter((p) => {
        const q = search.toLowerCase();
        return (
          (p.senderName ?? "").toLowerCase().includes(q) ||
          (p.userName   ?? "").toLowerCase().includes(q) ||
          (p.transRef   ?? "").toLowerCase().includes(q) ||
          (p.ref1       ?? "").toLowerCase().includes(q)
        );
      })
    : payments;

  // ── Styles ──────────────────────────────────────────────
  const selStyle: React.CSSProperties = {
    padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)",
    borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11,
    cursor: "pointer", outline: "none",
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>

        {/* ── Bank account card ─────────────────────────── */}
        <Card>
          <CardHeader
            icon="🏦"
            title="ข้อมูลรับชำระเงิน"
            actions={<Button variant="primary" size="sm" onClick={() => setEditPayOpen(true)}>✏️ แก้ไข</Button>}
          />
          <div style={{ padding: 14 }}>
            <div style={{ background: "linear-gradient(135deg, #009B3A, #007A2F)", borderRadius: 12, padding: 20, color: "#fff", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", marginBottom: 3, fontWeight: 600, letterSpacing: 0.5 }}>KBANK · ธนาคารกสิกรไทย</div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, marginBottom: 4 }}>012-3-45678-9</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>บจก. โปรคิก อะคาเดมี่</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 80, height: 80, background: "var(--bg)", borderRadius: 10, border: "1.5px solid var(--bd)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 4 }}>
                <div style={{ fontSize: 20 }}>📱</div>
                <div style={{ fontSize: 9, color: "var(--tm)", textAlign: "center", lineHeight: 1.3 }}>QR<br/>PromptPay</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>สแกน QR พร้อมเพย์</div>
                <div style={{ fontSize: 10, color: "var(--tm)" }}>ยืนยันสลิปผ่าน SlipOK API<br />อัตโนมัติทุกรายการ</div>
              </div>
            </div>
          </div>
        </Card>

        {/* ── Summary card ──────────────────────────────── */}
        <Card>
          <CardHeader icon="📊" title="สรุปการชำระเงิน (เดือนนี้)" />
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
            {[
              {
                label: "✅ ยืนยันแล้ว",
                value: loading ? "…" : String(summary?.successThisMonth ?? 0),
                bg: "var(--green-l)", border: "var(--green)", color: "var(--green)",
              },
              {
                label: "💰 รายได้เดือนนี้",
                value: loading ? "…" : `${(summary?.revenueThisMonth ?? 0).toLocaleString()} ฿`,
                bg: "var(--blue-l)", border: "var(--blue)", color: "var(--blue)",
              },
              {
                label: "📋 รายการทั้งหมด",
                value: loading ? "…" : String(summary?.totalThisMonth ?? 0),
                bg: "var(--card-h)", border: "var(--bd)", color: "var(--t2)",
              },
              {
                label: "❌ ล้มเหลว",
                value: loading ? "…" : String(summary?.failedThisMonth ?? 0),
                bg: "var(--red-l)", border: "var(--red)", color: "var(--red)",
              },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: item.bg, borderRadius: 8, borderLeft: `3px solid ${item.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: item.color }}>{item.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Transactions table ────────────────────────────── */}
      <Card>
        <CardHeader
          icon="💳"
          title="รายการชำระเงิน"
          actions={
            <Badge variant="green" style={{ padding: "3px 9px", fontSize: 11 }}>
              SlipOK Verified
            </Badge>
          }
        />

        {/* Filter bar */}
        <div style={{ display: "flex", gap: 7, padding: "10px 14px", borderBottom: "1px solid var(--bd)", background: "var(--card-h)", flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="text"
            placeholder="🔍 ค้นหาชื่อ / transRef"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...selStyle, minWidth: 180 }}
          />
          <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} style={selStyle}>
            <option value="this_month">เดือนนี้</option>
            <option value="last_month">เดือนที่แล้ว</option>
            <option value="3_months">3 เดือนล่าสุด</option>
            <option value="custom">กำหนดเอง</option>
          </select>
          {dateFilter === "custom" && (
            <>
              <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} style={selStyle} />
              <input type="date" value={customTo}   onChange={(e) => setCustomTo(e.target.value)}   style={selStyle} />
            </>
          )}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} style={selStyle}>
            <option value="all">ทุกสถานะ</option>
            <option value="success">✅ สำเร็จ</option>
            <option value="failed">❌ ล้มเหลว</option>
          </select>
          <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--tm)" }}>
            {filtered.length} รายการ
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--tm)", fontSize: 12 }}>กำลังโหลด...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--tm)", fontSize: 12 }}>ไม่มีรายการ</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>วัน/เวลา</th>
                <th>ผู้โอน</th>
                <th>ธนาคาร</th>
                <th>ยอด</th>
                <th>เลขอ้างอิง</th>
                <th>สถานะ</th>
                <th>รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((pay) => {
                const sending = bankInfo(pay.sendingBank);
                const displayName = pay.userName ?? pay.senderName ?? "—";
                return (
                  <tr key={pay.id}>
                    {/* Date */}
                    <td className="pk-mono" style={{ fontSize: 11, color: "var(--tm)", whiteSpace: "nowrap" }}>
                      {pay.displayDate !== "—" ? pay.displayDate : pay.displayCreated}
                    </td>

                    {/* Sender */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: pay.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {pay.avatarInitial}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{displayName}</div>
                          {pay.senderAccount && (
                            <div style={{ fontSize: 10, color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace" }}>{pay.senderAccount}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Bank */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: sending.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{sending.short}</span>
                        <span style={{ fontSize: 10, color: "var(--tm)" }}>→</span>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: bankInfo(pay.receivingBank).color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{bankInfo(pay.receivingBank).short}</span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="pk-mono" style={{ color: pay.slipokSuccess ? "var(--green)" : "var(--red)", fontWeight: 700 }}>
                      {pay.amount != null ? `${pay.amount.toLocaleString()} ฿` : "—"}
                    </td>

                    {/* Trans Ref */}
                    <td className="pk-mono" style={{ fontSize: 10, color: "var(--tm)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pay.transRef ?? "—"}
                    </td>

                    {/* Status */}
                    <td>
                      {pay.slipokSuccess ? (
                        <Badge variant="green">✅ สำเร็จ</Badge>
                      ) : (
                        <div>
                          <Badge variant="red">❌ ล้มเหลว</Badge>
                          {pay.errorCode && (
                            <div style={{ fontSize: 9, color: "var(--red)", marginTop: 2 }}>#{pay.errorCode}</div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Detail */}
                    <td>
                      <Button variant="ghost" size="sm" onClick={() => setDetailPay(pay)}>🧾 ดู</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* ── Detail modal ──────────────────────────────────── */}
      <SlipDetailModal payment={detailPay} onClose={() => setDetailPay(null)} />

      {/* ── Edit payment method modal ─────────────────────── */}
      <Modal
        open={editPayOpen}
        onClose={() => setEditPayOpen(false)}
        title="✏️ แก้ไขข้อมูลรับชำระเงิน"
        width={480}
        footer={
          <DefaultFooter
            onCancel={() => setEditPayOpen(false)}
            onConfirm={() => { setEditPayOpen(false); showToast("บันทึกแล้ว"); }}
          />
        }
      >
        <FormGrid>
          <FormItem label="ธนาคาร" full><input type="text" defaultValue="ธนาคารกสิกรไทย (KBank)" /></FormItem>
          <FormItem label="เลขบัญชี" full><input type="text" defaultValue="012-3-45678-9" /></FormItem>
          <FormItem label="ชื่อบัญชี" full><input type="text" defaultValue="บจก. โปรคิก อะคาเดมี่" /></FormItem>
          <FormItem label="QR Code PromptPay" full>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 80, height: 80, background: "var(--bg)", border: "1.5px dashed var(--bd2)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: "var(--tm)", cursor: "pointer" }}>📷 อัปโหลด</div>
              <div style={{ fontSize: 10, color: "var(--tm)" }}>รองรับ PNG, JPG<br />ขนาดไม่เกิน 2MB</div>
            </div>
          </FormItem>
        </FormGrid>
      </Modal>
    </>
  );
}
