"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { fetchPaymentSettings, savePaymentSettings } from "@/lib/db/payment-settings";
import { useAuth } from "@/lib/context/AuthContext";

// ── Image compression via Canvas API ─────────────────────────────────────────
async function compressImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX_DIM = 400;
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, w, h);
      // Try decreasing quality until the data URL is under ~200 KB
      const qualities = [0.9, 0.7, 0.5, 0.3];
      let result = "";
      for (const q of qualities) {
        result = canvas.toDataURL("image/jpeg", q);
        if (result.length < 270000) break;
      }
      resolve(result);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("โหลดรูปภาพไม่สำเร็จ"));
    };
    img.src = url;
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function paymentTypeLabel(type: string | null): { icon: string; label: string } {
  if (type === "extra_session") return { icon: "🎫", label: "ซื้อคลาสเพิ่มเติม" };
  if (type === "package" || type === "new_package") return { icon: "📦", label: "ซื้อแพ็กเกจ" };
  return { icon: "💳", label: "ชำระเงิน" };
}

function packageTypeLabel(type: string | null): string {
  if (type === "adult")  return "Adult";
  if (type === "junior") return "Junior";
  return type ?? "";
}

function promoDiscountLabel(payment: AdminPayment): string {
  if (!payment.promoCode) return "";
  const disc = payment.promoDiscount;
  const type = payment.promoDiscountType;
  if (disc == null) return payment.promoCode;
  return type === "percent" ? `${payment.promoCode} (−${disc}%)` : `${payment.promoCode} (−${disc} ฿)`;
}

// ── Slip detail modal ─────────────────────────────────────────────────────────
function SlipDetailModal({ payment, onClose }: { payment: AdminPayment | null; onClose: () => void }) {
  if (!payment) return null;
  const sending   = bankInfo(payment.sendingBank);
  const receiving = bankInfo(payment.receivingBank);
  const ptLabel   = paymentTypeLabel(payment.paymentType);
  const ok        = payment.slipokSuccess;

  const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) =>
    value != null && value !== "" ? (
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "5px 0", borderBottom: "1px solid var(--bd)" }}>
        <div style={{ fontSize: 11, color: "var(--tm)", flexShrink: 0, marginRight: 12 }}>{label}</div>
        <div style={{ fontSize: 11, fontWeight: 600, textAlign: "right", wordBreak: "break-all" }}>{value}</div>
      </div>
    ) : null;

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 9, fontWeight: 700, color: "var(--tm)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6, marginTop: 2 }}>
      {children}
    </div>
  );

  return (
    <Modal open={!!payment} onClose={onClose} title="🧾 รายละเอียดสลิป" width={500}
      footer={<DefaultFooter onCancel={onClose} onConfirm={onClose} confirmLabel="ปิด" />}
    >
      {/* ── Status banner ── */}
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "11px 14px", borderRadius: 10, marginBottom: 14,
        background: ok ? "var(--green-l)" : "var(--red-l)",
        border: `1.5px solid ${ok ? "var(--green)" : "var(--red)"}`,
      }}>
        <div style={{ fontSize: 20, lineHeight: 1, marginTop: 1 }}>{ok ? "✅" : "❌"}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: ok ? "var(--green)" : "var(--red)" }}>
            {ok ? "ยืนยันสลิปสำเร็จ" : "ยืนยันสลิปล้มเหลว"}
          </div>
          {payment.slipokMessage && (
            <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 2 }}>{payment.slipokMessage}</div>
          )}
          {!ok && payment.errorCode && (
            <div style={{ fontSize: 10, color: "var(--red)", marginTop: 3, fontWeight: 600 }}>
              รหัส {payment.errorCode}{payment.errorMessage ? ` — ${payment.errorMessage}` : ""}
            </div>
          )}
          {!ok && payment.failureReason && (
            <div style={{ fontSize: 10, color: "var(--red)", marginTop: 2 }}>
              {payment.failureReason}
            </div>
          )}
        </div>
      </div>

      {/* ── Amount ── */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "12px 0 14px", borderBottom: "1px solid var(--bd)", marginBottom: 14,
      }}>
        {payment.promoCode && payment.originalAmount != null && payment.originalAmount !== payment.amount && (
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "var(--tm)", textDecoration: "line-through", marginBottom: 2 }}>
            {payment.originalAmount.toLocaleString()} ฿
          </div>
        )}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 10, color: "var(--tm)", marginBottom: 3 }}>ยอดชำระ</div>
          <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: ok ? "var(--green)" : "var(--red)", lineHeight: 1 }}>
            {payment.amount != null ? `${payment.amount.toLocaleString()} ฿` : "— ฿"}
          </div>
        </div>
        {payment.promoCode && (
          <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 5, background: "var(--purple-l)", border: "1px solid #DDD6FE", borderRadius: 6, padding: "3px 9px" }}>
            <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "var(--purple)" }}>{payment.promoCode}</span>
            {payment.discountAmount != null && (
              <span style={{ fontSize: 10, color: "var(--purple)", fontWeight: 600 }}>
                ลด {payment.discountAmount.toLocaleString()} ฿
                {payment.promoDiscountType === "percent" && payment.promoDiscount != null ? ` (${payment.promoDiscount}%)` : ""}
              </span>
            )}
          </div>
        )}
        {!payment.promoCode && payment.expectedAmount != null && payment.expectedAmount !== payment.amount && (
          <div style={{ marginTop: 6, fontSize: 10, color: "var(--tm)" }}>
            ยอดที่คาดหวัง: {payment.expectedAmount.toLocaleString()} ฿
          </div>
        )}
      </div>

      {/* ── Purchase info ── */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>สินค้าที่ซื้อ</SectionLabel>
        <div style={{
          padding: "10px 12px", borderRadius: 9,
          background: "var(--bg)", border: "1.5px solid var(--bd)",
          display: "flex", flexDirection: "column", gap: 7,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>{ptLabel.icon}</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>
                {payment.paymentType === "extra_session"
                  ? "ซื้อคลาสเพิ่มเติม"
                  : payment.packageName
                    ? `${payment.packageName}${payment.packageType ? ` (${packageTypeLabel(payment.packageType)})` : ""}`
                    : ptLabel.label}
              </div>
              {payment.paymentType === "extra_session" && payment.packageName && (
                <div style={{ fontSize: 10, color: "var(--purple)", fontWeight: 600, marginTop: 1 }}>
                  แพ็กเกจ: {payment.packageName}{payment.packageType ? ` (${packageTypeLabel(payment.packageType)})` : ""}
                </div>
              )}
              {payment.packageSessions != null && payment.paymentType !== "extra_session" && (
                <div style={{ fontSize: 10, color: "var(--tm)" }}>
                  {payment.packageSessions} ครั้ง
                  {payment.remainingSessions != null ? ` · คงเหลือ ${payment.remainingSessions} ครั้ง` : ""}
                </div>
              )}
            </div>
          </div>

          {payment.childName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 7, borderTop: "1px dashed var(--bd)" }}>
              <span style={{ fontSize: 15 }}>👶</span>
              <div>
                <div style={{ fontSize: 10, color: "var(--tm)" }}>เจ้าของแพ็กเกจ</div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{payment.childName}</div>
              </div>
            </div>
          ) : payment.userName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 7, borderTop: "1px dashed var(--bd)" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: payment.avatarColor, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: "#fff",
              }}>
                {payment.avatarInitial}
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--tm)" }}>เจ้าของแพ็กเกจ</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{payment.userName}</div>
              </div>
            </div>
          ) : null}

          {payment.childName && payment.userName && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 7, borderTop: "1px dashed var(--bd)" }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: payment.avatarColor, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: "#fff",
              }}>
                {payment.avatarInitial}
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--tm)" }}>ผู้ชำระเงิน</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{payment.userName}</div>
                {payment.userPhone && <div style={{ fontSize: 10, color: "var(--tm)" }}>{payment.userPhone}</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bank transfer ── */}
      <div style={{ marginBottom: 14 }}>
        <SectionLabel>การโอนเงิน</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, alignItems: "center" }}>
          <div style={{ padding: "9px 10px", background: "var(--bg)", borderRadius: 8, border: "1.5px solid var(--bd)" }}>
            <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 4 }}>ผู้โอน</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: sending.color, flexShrink: 0 }} />
              <div style={{ fontSize: 11, fontWeight: 700 }}>{sending.short}</div>
              <div style={{ fontSize: 9, color: "var(--tm)" }}>{sending.full}</div>
            </div>
            {payment.senderName && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 1 }}>{payment.senderName}</div>}
            {payment.senderAccount && <div style={{ fontSize: 10, color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace" }}>{payment.senderAccount}</div>}
          </div>
          <div style={{ fontSize: 16, color: "var(--tm)", textAlign: "center" }}>→</div>
          <div style={{ padding: "9px 10px", background: "var(--bg)", borderRadius: 8, border: "1.5px solid var(--bd)" }}>
            <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 4 }}>ผู้รับ</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: receiving.color, flexShrink: 0 }} />
              <div style={{ fontSize: 11, fontWeight: 700 }}>{receiving.short}</div>
              <div style={{ fontSize: 9, color: "var(--tm)" }}>{receiving.full}</div>
            </div>
            {payment.receiverName && <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 1 }}>{payment.receiverName}</div>}
            {payment.receiverAccount && <div style={{ fontSize: 10, color: "var(--tm)", fontFamily: "'JetBrains Mono', monospace" }}>{payment.receiverAccount}</div>}
          </div>
        </div>
      </div>

      {/* ── Transaction details ── */}
      <div style={{ marginBottom: 10 }}>
        <SectionLabel>ข้อมูลรายการ</SectionLabel>
        <InfoRow label="เลขอ้างอิง" value={payment.transRef} />
        <InfoRow label="วัน/เวลา (สลิป)" value={formatSlipDateTime(payment.transDate, payment.transTime)} />
        <InfoRow label="วันที่รับแจ้ง" value={payment.displayCreated} />
        <InfoRow label="Ref 1" value={payment.ref1} />
        <InfoRow label="Ref 2" value={payment.ref2} />
        <InfoRow label="Ref 3" value={payment.ref3} />
      </div>

      {payment.note && (
        <div style={{ padding: "9px 12px", background: "var(--bg)", borderRadius: 8, border: "1.5px solid var(--bd)" }}>
          <div style={{ fontSize: 9, color: "var(--tm)", marginBottom: 3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>หมายเหตุ</div>
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
  const { isAdmin, portalUser } = useAuth();

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

  // Payment settings (loaded from DB)
  const [bankName,     setBankName]     = useState("");
  const [acctNumber,   setAcctNumber]   = useState("");
  const [acctName,     setAcctName]     = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  // Edit modal state
  const [editPayOpen,  setEditPayOpen]  = useState(false);
  const [draftBank,    setDraftBank]    = useState("");
  const [draftAcct,    setDraftAcct]    = useState("");
  const [draftName,    setDraftName]    = useState("");
  const [draftQr,      setDraftQr]      = useState<string | null>(null);
  const [acctError,    setAcctError]    = useState("");
  const [isSaving,     setIsSaving]     = useState(false);

  // Slip detail modal
  const [detailPay,    setDetailPay]    = useState<AdminPayment | null>(null);

  // Hidden file input for QR upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load payment settings once on mount ─────────────────
  useEffect(() => {
    fetchPaymentSettings()
      .then((s) => {
        if (s) {
          setBankName(s.bankName ?? "");
          setAcctNumber(s.accountNumber ?? "");
          setAcctName(s.accountName ?? "");
          setQrCodeBase64(s.qrCodeBase64 ?? null);
        }
      })
      .catch(() => {});
  }, []);

  // ── Load payments + summary ──────────────────────────────
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
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, statusFilter, customFrom, customTo, showToast]);

  useEffect(() => { load(); }, [load]);

  // ── Client-side search ───────────────────────────────────
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

  // ── Save handler ─────────────────────────────────────────
  async function handleSavePaymentSettings() {
    const digits = draftAcct.replace(/-/g, "");
    if (digits.length !== 10) {
      setAcctError("กรุณากรอกเลขบัญชีให้ครบ 10 หลัก");
      return;
    }
    if (!portalUser) return;
    setIsSaving(true);
    try {
      await savePaymentSettings(
        {
          bankName:      draftBank,
          bankCode:      null,
          accountNumber: draftAcct,
          accountName:   draftName,
          qrCodeBase64:  draftQr,
        },
        portalUser.id
      );
      setBankName(draftBank);
      setAcctNumber(draftAcct);
      setAcctName(draftName);
      setQrCodeBase64(draftQr);
      setAcctError("");
      setEditPayOpen(false);
      showToast("บันทึกแล้ว");
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setIsSaving(false);
    }
  }

  // ── Styles ───────────────────────────────────────────────
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
            actions={isAdmin ? (
              <Button variant="primary" size="sm" onClick={() => {
                setDraftBank(bankName);
                setDraftAcct(acctNumber);
                setDraftName(acctName);
                setDraftQr(qrCodeBase64);
                setAcctError("");
                setEditPayOpen(true);
              }}>✏️ แก้ไข</Button>
            ) : undefined}
          />
          <div style={{ padding: 14 }}>
            <div style={{ background: "linear-gradient(135deg, #009B3A, #007A2F)", borderRadius: 12, padding: 20, color: "#fff", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.65)", marginBottom: 3, fontWeight: 600, letterSpacing: 0.5 }}>
                {bankName || "—"}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", letterSpacing: 2, marginBottom: 4 }}>
                {acctNumber || "—"}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{acctName || "—"}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* QR code display */}
              <div style={{
                width: 80, height: 80,
                background: "var(--bg)", borderRadius: 10,
                border: "1.5px solid var(--bd)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 4, overflow: "hidden", flexShrink: 0,
              }}>
                {qrCodeBase64 ? (
                  <img
                    src={qrCodeBase64}
                    alt="QR PromptPay"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <>
                    <div style={{ fontSize: 20 }}>📱</div>
                    <div style={{ fontSize: 9, color: "var(--tm)", textAlign: "center", lineHeight: 1.3 }}>QR<br/>PromptPay</div>
                  </>
                )}
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
                label: "📋 รายการทั้งหมด",
                value: loading ? "…" : String(summary?.totalThisMonth ?? 0),
                bg: "var(--card-h)", border: "var(--bd)", color: "var(--t2)",
              },
              {
                label: "✅ ยืนยันแล้ว",
                value: loading ? "…" : String(summary?.successThisMonth ?? 0),
                bg: "var(--green-l)", border: "var(--green)", color: "var(--green)",
              },
              {
                label: "❌ ล้มเหลว",
                value: loading ? "…" : String(summary?.failedThisMonth ?? 0),
                bg: "var(--red-l)", border: "var(--red)", color: "var(--red)",
              },
              {
                label: "💰 รายได้เดือนนี้",
                value: loading ? "…" : `${(summary?.revenueThisMonth ?? 0).toLocaleString()} ฿`,
                bg: "var(--blue-l)", border: "var(--blue)", color: "var(--blue)",
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
                <th>สินค้า</th>
                <th>ยอด</th>
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
                    <td className="pk-mono" style={{ fontSize: 11, color: "var(--tm)", whiteSpace: "nowrap" }}>
                      {pay.displayDate !== "—" ? pay.displayDate : pay.displayCreated}
                    </td>
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
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: sending.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{sending.short}</span>
                        <span style={{ fontSize: 10, color: "var(--tm)" }}>→</span>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: bankInfo(pay.receivingBank).color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{bankInfo(pay.receivingBank).short}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 150 }}>
                      {pay.paymentType === "extra_session" ? (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>🎫 ซื้อคลาสเพิ่ม</div>
                          {pay.packageName && (
                            <div style={{ fontSize: 10, color: "var(--purple)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {pay.packageName}
                            </div>
                          )}
                        </div>
                      ) : pay.paymentType === "new_package" ? (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>📦 ซื้อแพ็กเกจ</div>
                          {pay.packageName && (
                            <div style={{ fontSize: 10, color: "var(--t2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {pay.packageName}{pay.packageType ? ` · ${packageTypeLabel(pay.packageType)}` : ""}
                            </div>
                          )}
                        </div>
                      ) : pay.packageName ? (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {pay.packageName}
                          </div>
                          {pay.packageType && (
                            <div style={{ fontSize: 10, color: "var(--tm)" }}>{packageTypeLabel(pay.packageType)}</div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--tm)" }}>
                          {paymentTypeLabel(pay.paymentType).icon} {paymentTypeLabel(pay.paymentType).label}
                        </span>
                      )}
                      {pay.childName ? (
                        <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 1 }}>👶 {pay.childName}</div>
                      ) : pay.userName ? (
                        <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 1 }}>👤 {pay.userName}</div>
                      ) : null}
                    </td>
                    <td className="pk-mono">
                      {pay.promoCode && pay.originalAmount != null && pay.originalAmount !== pay.amount ? (
                        <div title={promoDiscountLabel(pay)}>
                          <div style={{ fontSize: 10, color: "var(--tm)", textDecoration: "line-through", lineHeight: 1.2 }}>
                            {pay.originalAmount.toLocaleString()} ฿
                          </div>
                          <div style={{ fontWeight: 700, color: pay.slipokSuccess ? "var(--green)" : "var(--red)" }}>
                            {pay.amount != null ? `${pay.amount.toLocaleString()} ฿` : "—"}
                          </div>
                          <div style={{ fontSize: 9, color: "var(--purple)", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                            {pay.promoCode}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 700, color: pay.slipokSuccess ? "var(--green)" : "var(--red)" }}>
                          {pay.amount != null ? `${pay.amount.toLocaleString()} ฿` : "—"}
                        </span>
                      )}
                    </td>
                    <td>
                      {pay.slipokSuccess ? (
                        <Badge variant="green">✅ สำเร็จ</Badge>
                      ) : (
                        <Badge variant="red">❌ ล้มเหลว</Badge>
                      )}
                    </td>
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
        onClose={() => { setEditPayOpen(false); setAcctError(""); }}
        title="✏️ แก้ไขข้อมูลรับชำระเงิน"
        width={480}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setEditPayOpen(false); setAcctError(""); }} disabled={isSaving}>
              ยกเลิก
            </Button>
            <Button variant="primary" onClick={handleSavePaymentSettings} disabled={isSaving}>
              {isSaving ? "กำลังบันทึก…" : "บันทึก"}
            </Button>
          </>
        }
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          style={{ display: "none" }}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              const base64 = await compressImageToBase64(file);
              setDraftQr(base64);
            } catch {
              showToast("โหลดรูปภาพไม่สำเร็จ", "error");
            }
            e.target.value = "";
          }}
        />

        <FormGrid>
          <FormItem label="ธนาคาร" full>
            <input type="text" value={draftBank} onChange={(e) => setDraftBank(e.target.value)} />
          </FormItem>
          <FormItem label="เลขบัญชี" full>
            <input
              type="text"
              value={draftAcct}
              placeholder="012-3-45678-9"
              maxLength={13}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                let formatted = digits;
                if (digits.length > 3)  formatted = digits.slice(0, 3) + "-" + digits.slice(3);
                if (digits.length > 4)  formatted = digits.slice(0, 3) + "-" + digits.slice(3, 4) + "-" + digits.slice(4);
                if (digits.length > 9)  formatted = digits.slice(0, 3) + "-" + digits.slice(3, 4) + "-" + digits.slice(4, 9) + "-" + digits.slice(9);
                setDraftAcct(formatted);
                setAcctError("");
              }}
              style={acctError ? { borderColor: "var(--red)" } : undefined}
            />
            {acctError
              ? <div style={{ fontSize: 11, color: "var(--red)", marginTop: 3 }}>{acctError}</div>
              : <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 3 }}>รูปแบบ: XXX-X-XXXXX-X (10 หลัก)</div>
            }
          </FormItem>
          <FormItem label="ชื่อบัญชี" full>
            <input type="text" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
          </FormItem>
          <FormItem label="QR Code PromptPay" full>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {/* Clickable QR preview / upload button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 80, height: 80,
                  background: "var(--bg)",
                  border: draftQr ? "1.5px solid var(--bd)" : "1.5px dashed var(--bd2)",
                  borderRadius: 8,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", overflow: "hidden", flexShrink: 0,
                }}
              >
                {draftQr ? (
                  <img
                    src={draftQr}
                    alt="QR preview"
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                ) : (
                  <span style={{ fontSize: 10, color: "var(--tm)", textAlign: "center", lineHeight: 1.4 }}>
                    📷<br />อัปโหลด
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: "var(--tm)", lineHeight: 1.7 }}>
                รองรับ PNG, JPG<br />
                ปรับขนาดอัตโนมัติ<br />
                {draftQr && (
                  <span
                    onClick={() => setDraftQr(null)}
                    style={{ color: "var(--red)", cursor: "pointer", textDecoration: "underline" }}
                  >
                    ลบ QR Code
                  </span>
                )}
              </div>
            </div>
          </FormItem>
        </FormGrid>
      </Modal>
    </>
  );
}
