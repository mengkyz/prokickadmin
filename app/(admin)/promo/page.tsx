"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PromoModal } from "@/components/promo/PromoModal";
import { Modal } from "@/components/ui/Modal";
import { fetchPromos, togglePromoActive, checkPromosDeletable, deletePromo } from "@/lib/db/promos";
import { useToast } from "@/lib/context/ToastContext";
import type { PromoCode } from "@/lib/types";

export default function PromoPage() {
  const { showToast } = useToast();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"none" | "create" | "edit">("none");
  const [editTarget, setEditTarget] = useState<PromoCode | undefined>();
  const [deletableMap, setDeletableMap] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchPromos();
      setPromos(data);
      checkPromosDeletable(data.map((p) => p.id)).then(setDeletableMap);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { load(); }, [load]);

  function openEdit(promo: PromoCode) {
    setEditTarget(promo);
    setModal("edit");
  }

  function openCreate() {
    setEditTarget(undefined);
    setModal("create");
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePromo(deleteTarget.id);
      showToast("ลบโค้ดแล้ว");
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setDeleting(false);
    }
  }

  async function handleToggle(promo: PromoCode) {
    const nextActive = promo.status === "Inactive";
    try {
      await togglePromoActive(promo.id, nextActive);
      showToast(nextActive ? "เปิดโค้ดแล้ว" : "ปิดโค้ดแล้ว");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    }
  }

  const statusVariant: Record<string, BadgeVariant> = {
    Active: "green",
    Expiring: "orange",
    Inactive: "gray",
  };

  const statusLabel: Record<string, string> = {
    Active: "● Active",
    Expiring: "⚠ Expiring",
    Inactive: "Inactive",
  };

  // Format ISO date (YYYY-MM-DD) to DD/MM/YY for display
  function fmtDate(iso: string) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y.slice(2)}`;
  }

  return (
    <>
      <Card>
        <CardHeader
          icon="🏷️"
          title="โปรโมชั่นโค้ด"
          actions={<Button variant="primary" size="sm" onClick={openCreate}>+ สร้างโค้ด</Button>}
        />
        {loading ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--t3)", fontSize: 14 }}>
            กำลังโหลด...
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>โค้ด</th>
                <th>ส่วนลด</th>
                <th>ใช้แล้ว</th>
                <th>หมดอายุ</th>
                <th>สถานะ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "var(--t3)", padding: "20px 0", fontSize: 13 }}>
                    ยังไม่มีโปรโมชั่นโค้ด
                  </td>
                </tr>
              ) : (
                promos.map((promo) => (
                  <tr key={promo.id}>
                    <td>
                      <span style={{ display: "inline-flex", background: "var(--purple-l)", border: "1px solid #DDD6FE", borderRadius: 5, padding: "2px 8px", fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "var(--purple)" }}>
                        {promo.code}
                      </span>
                    </td>
                    <td className="pk-mono" style={{ color: "var(--green)" }}>
                      {promo.discountType === "percent" ? `${promo.discount}%` : `${promo.discount} ฿`}
                    </td>
                    <td className="pk-mono">{promo.usedCount}/{promo.usageLimit}</td>
                    <td className="pk-mono">{fmtDate(promo.expiresAt)}</td>
                    <td>
                      <Badge variant={statusVariant[promo.status]}>
                        {statusLabel[promo.status]}
                      </Badge>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(promo)}>แก้ไข</Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleToggle(promo)}
                        >
                          {promo.status === "Inactive" ? "เปิด" : "ปิด"}
                        </Button>
                        <Button
                          size="sm"
                          style={{
                            border: deletableMap[promo.id] === false ? "1.5px solid var(--bd2)" : "1.5px solid var(--red)",
                            color: deletableMap[promo.id] === false ? "var(--tm)" : "var(--red)",
                            cursor: deletableMap[promo.id] === false ? "not-allowed" : "pointer",
                            opacity: deletableMap[promo.id] === false ? 0.45 : 1,
                            background: "transparent",
                          }}
                          onClick={() => { if (deletableMap[promo.id] !== false) setDeleteTarget(promo); }}
                          title={deletableMap[promo.id] === false ? "ไม่สามารถลบได้: โค้ดนี้ถูกใช้งานแล้ว" : "ลบโค้ด"}
                        >🗑️</Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </Card>

      <PromoModal
        open={modal === "create"}
        onClose={() => setModal("none")}
        mode="create"
        onSuccess={load}
      />
      <PromoModal
        key={editTarget?.id}
        open={modal === "edit"}
        onClose={() => setModal("none")}
        mode="edit"
        initial={editTarget}
        onSuccess={load}
      />

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="🗑️ ยืนยันการลบโค้ด"
        width={400}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteTarget(null)} disabled={deleting}>ยกเลิก</Button>
            <Button
              size="sm"
              style={{ background: "var(--red)", color: "#fff", border: "none", padding: "6px 16px", fontSize: 13 }}
              onClick={handleDelete}
              disabled={deleting}
            >{deleting ? "กำลังลบ..." : "ลบโค้ด"}</Button>
          </>
        }
      >
        <div style={{ fontSize: 14, color: "var(--t2)", lineHeight: 1.6 }}>
          <p>คุณต้องการลบโปรโมชั่นโค้ด</p>
          <p style={{ margin: "8px 0" }}>
            <span style={{ background: "var(--purple-l)", border: "1px solid #DDD6FE", borderRadius: 5, padding: "3px 10px", fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: "var(--purple)" }}>
              {deleteTarget?.code}
            </span>
          </p>
          <p>การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
        </div>
      </Modal>
    </>
  );
}
