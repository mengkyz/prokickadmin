"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/lib/context/ToastContext";
import {
  fetchClassBookings,
  promoteFromWaitlist,
  fetchEligibleUsers,
  adminBookClass,
  adminCancelBooking,
  fetchAdminActionLogs,
  logAdminAction,
} from "@/lib/db/classes";
import type { AdminClass, AdminBooking, EligibleUser, AdminActionLog } from "@/lib/db/classes";

interface Props {
  open: boolean;
  onClose: () => void;
  cls: AdminClass | null;
}

export function IncomingDetailModal({ open, cls, onClose }: Props) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"booked" | "waitlist" | "logs">("booked");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [actionLogs, setActionLogs] = useState<AdminActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  // Booking view
  const [view, setView] = useState<"list" | "booking">("list");
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<EligibleUser | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [booking, setBooking] = useState(false);

  const load = useCallback(async () => {
    if (!cls) return;
    setLoading(true);
    try {
      const [bData, lData] = await Promise.all([
        fetchClassBookings(cls.id),
        fetchAdminActionLogs(cls.id),
      ]);
      setBookings(bData);
      setActionLogs(lData);
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [cls, showToast]);

  useEffect(() => {
    if (open) {
      setView("list");
      setActiveTab("booked");
      load();
    }
  }, [open, load]);

  const booked   = bookings.filter((b) => b.attendanceStatus !== "waitlist" && b.attendanceStatus !== "cancelled");
  const waitlist = bookings.filter((b) => b.attendanceStatus === "waitlist");
  const displayed = activeTab === "booked" ? booked : waitlist;

  async function handleCancel(b: AdminBooking) {
    if (!confirm("ยืนยันการยกเลิกการจองนี้?")) return;
    setSaving(b.id);
    try {
      await adminCancelBooking(b.id, b.userId);
      if (cls) await logAdminAction(cls.id, "cancel", b.userName, "ยกเลิกโดยแอดมิน");
      showToast("ยกเลิกการจองแล้ว", "error");
      await load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(null);
    }
  }

  async function handlePromote(b: AdminBooking) {
    setSaving(b.id);
    try {
      await promoteFromWaitlist(b.id);
      if (cls) await logAdminAction(cls.id, "promote", b.userName, "เลื่อนขึ้นจากคิวโดยแอดมิน");
      showToast("ยืนยันผู้เรียนจากคิวแล้ว");
      await load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setSaving(null);
    }
  }

  async function openBookingView() {
    if (!cls) return;
    setView("booking");
    setSearchQuery("");
    setSelectedUser(null);
    setSelectedPackageId(null);
    setLoadingUsers(true);
    try {
      const users = await fetchEligibleUsers(cls.packageFilter, cls.id);
      setEligibleUsers(users);
    } catch (err) {
      showToast((err as Error).message, "error");
      setView("list");
    } finally {
      setLoadingUsers(false);
    }
  }

  async function handleAdminBook() {
    if (!cls || !selectedUser || !selectedPackageId) return;
    setBooking(true);
    try {
      const pkg = selectedUser.packages.find((p) => p.id === selectedPackageId)!;
      const result = await adminBookClass(cls.id, selectedUser.userId, selectedPackageId, pkg.childId);
      const targetName = pkg.childName
        ? `${selectedUser.name} (${pkg.childName})`
        : selectedUser.name;
      await logAdminAction(cls.id, result.status === "booked" ? "book" : "standby", targetName, result.message);
      showToast(
        result.status === "booked"
          ? `จองสำเร็จสำหรับ ${targetName}`
          : `เพิ่มคิวรอสำหรับ ${targetName}`
      );
      setView("list");
      setActiveTab(result.status === "booked" ? "booked" : "waitlist");
      await load();
    } catch (err) {
      showToast((err as Error).message, "error");
    } finally {
      setBooking(false);
    }
  }

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return eligibleUsers;
    const q = searchQuery.toLowerCase();
    return eligibleUsers.filter(
      (u) => u.name.toLowerCase().includes(q) || u.phone.includes(q)
    );
  }, [eligibleUsers, searchQuery]);

  const title = cls
    ? `${cls.packageFilter === "junior" ? "เด็ก" : cls.packageFilter === "adult" ? "ผู้ใหญ่" : ""} ${cls.dayLabel} ${cls.timeStart}–${cls.timeEnd}`.trim()
    : "รายละเอียดคลาส";
  const subtitle = cls ? `📍 ${cls.venue} · 👤 ${cls.coach || "ไม่ระบุโค้ช"}` : "";

  function actionLabel(type: string): { label: string; color: string } {
    switch (type) {
      case "book":    return { label: "จองให้",    color: "var(--green)" };
      case "standby": return { label: "คิวรอ",     color: "var(--orange)" };
      case "cancel":  return { label: "ยกเลิก",    color: "var(--red)" };
      case "promote":       return { label: "เลื่อนขึ้น",   color: "var(--blue)" };
      case "cancel_class":  return { label: "ยกเลิกคลาส",  color: "var(--red)" };
      default:              return { label: type,           color: "var(--tm)" };
    }
  }

  const isFull = cls ? cls.booked >= cls.capacity : false;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      width={640}
      footer={
        view === "list" ? (
          <>
            <Button
              size="sm"
              style={{ background: "var(--accent)", color: "#fff", border: "none", marginRight: "auto" }}
              onClick={openBookingView}
            >
              ➕ จองให้ผู้ใช้
            </Button>
            <Button variant="ghost" onClick={onClose}>ปิด</Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setView("list")}>← ย้อนกลับ</Button>
            <Button
              size="sm"
              style={{
                background: selectedPackageId ? "var(--accent)" : "var(--bd)",
                color: selectedPackageId ? "#fff" : "var(--tm)",
                border: "none",
                cursor: selectedPackageId ? "pointer" : "not-allowed",
              }}
              onClick={handleAdminBook}
              disabled={!selectedPackageId || booking}
            >
              {booking ? "กำลังจอง..." : isFull ? "เพิ่มคิวรอ" : "ยืนยันการจอง"}
            </Button>
          </>
        )
      }
    >
      <div style={{ margin: "-16px -20px 0" }}>
        {view === "list" ? (
          <>
            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--bd)", padding: "4px 16px 0", background: "var(--card)" }}>
              {[
                { key: "booked",   label: `ผู้จอง (${booked.length}/${cls?.capacity ?? "?"})` },
                { key: "waitlist", label: `Waitlist (${waitlist.length})` },
                { key: "logs",     label: `บันทึก (${actionLogs.length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  style={{
                    padding: "9px 13px", cursor: "pointer", fontSize: 12, fontWeight: 600,
                    color: activeTab === tab.key ? "var(--accent)" : "var(--tm)",
                    background: "none", border: "none",
                    borderBottom: activeTab === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
                    fontFamily: "inherit", marginBottom: -1,
                  } as React.CSSProperties}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Logs tab */}
            {activeTab === "logs" ? (
              actionLogs.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>
                  ยังไม่มีบันทึกการดำเนินการ
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>เวลา</th>
                      <th>การดำเนินการ</th>
                      <th>ผู้ใช้งาน</th>
                      <th>หมายเหตุ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actionLogs.map((log) => {
                      const { label, color } = actionLabel(log.actionType);
                      return (
                        <tr key={log.id}>
                          <td className="pk-mono" style={{ fontSize: 10, whiteSpace: "nowrap" }}>{log.createdAt}</td>
                          <td>
                            <span style={{ fontSize: 11, fontWeight: 600, color }}>{label}</span>
                          </td>
                          <td style={{ fontSize: 12 }}>{log.targetUserName}</td>
                          <td style={{ fontSize: 11, color: "var(--tm)" }}>{log.notes ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            ) : loading ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>
                กำลังโหลด...
              </div>
            ) : displayed.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>
                {activeTab === "booked" ? "ยังไม่มีผู้จอง" : "ไม่มี Waitlist"}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ผู้เรียน</th>
                    <th>เบอร์โทร</th>
                    <th>จองเมื่อ</th>
                    <th>สถานะ</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((b, i) => (
                    <tr key={b.id}>
                      <td className="pk-mono">{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: "50%", background: b.avatarColor,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
                          }}>
                            {b.avatarInitial}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600 }}>{b.userName}</div>
                            {b.childId && (
                              <div style={{ fontSize: 10, color: "var(--tm)" }}>
                                <Badge variant="blue" style={{ fontSize: 9 }}>เด็ก</Badge>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="pk-mono" style={{ fontSize: 11 }}>{b.userPhone || "—"}</td>
                      <td className="pk-mono" style={{ fontSize: 10 }}>{b.bookedAt}</td>
                      <td>
                        {b.attendanceStatus === "confirmed" && <Badge variant="green">Confirmed</Badge>}
                        {b.attendanceStatus === "waitlist" && (
                          <Badge variant="orange">Waitlist {b.waitlistPosition ? `#${b.waitlistPosition}` : ""}</Badge>
                        )}
                      </td>
                      <td>
                        {b.attendanceStatus === "confirmed" ? (
                          <Button
                            variant="danger" size="sm"
                            disabled={saving === b.id}
                            onClick={() => handleCancel(b)}
                          >
                            {saving === b.id ? "..." : "ยกเลิก"}
                          </Button>
                        ) : (
                          <Button
                            variant="success" size="sm"
                            disabled={saving === b.id}
                            onClick={() => handlePromote(b)}
                          >
                            {saving === b.id ? "..." : "ยืนยันขึ้น"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        ) : (
          /* ── Booking view ── */
          <div style={{ padding: "16px 20px" }}>
            {isFull && (
              <div style={{
                marginBottom: 12, padding: "8px 12px", borderRadius: 7,
                background: "var(--orange-l, #fff8e1)", border: "1px solid var(--orange)",
                fontSize: 12, color: "var(--orange)",
              }}>
                ⚠️ คลาสเต็มแล้ว — จะเพิ่มเข้าคิวรอ (Standby)
              </div>
            )}

            <input
              type="text"
              placeholder="ค้นหาชื่อหรือเบอร์โทร..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedUser(null);
                setSelectedPackageId(null);
              }}
              style={{
                width: "100%", padding: "8px 12px", borderRadius: 7,
                border: "1.5px solid var(--bd2)", fontSize: 13,
                background: "var(--bg)", color: "var(--t1)",
                fontFamily: "inherit", boxSizing: "border-box",
                marginBottom: 12,
              } as React.CSSProperties}
            />

            {loadingUsers ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>
                กำลังโหลดรายชื่อผู้ใช้...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--tm)", fontSize: 13 }}>
                ไม่พบผู้ใช้ที่มีแพ็กเกจที่เหมาะสม
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
                {filteredUsers.map((user) => {
                  const isSelected = selectedUser?.userId === user.userId;
                  return (
                    <div
                      key={user.userId}
                      onClick={() => {
                        setSelectedUser(user);
                        setSelectedPackageId(null);
                      }}
                      style={{
                        border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--bd)"}`,
                        borderRadius: 9, padding: "10px 12px", cursor: "pointer",
                        background: isSelected ? "var(--bg)" : "var(--card)",
                        transition: "border-color 0.13s",
                      }}
                    >
                      {/* User header */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%", background: "#64b5f6",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0,
                        }}>
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
                          {user.phone && (
                            <div style={{ fontSize: 10, color: "var(--tm)" }}>{user.phone}</div>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--tm)" }}>
                          {user.packages.length} แพ็กเกจ
                        </div>
                      </div>

                      {/* Package list — only when selected */}
                      {isSelected && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
                          {user.packages.map((pkg) => {
                            const isPkgSelected = selectedPackageId === pkg.id;
                            return (
                              <div
                                key={pkg.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPackageId(pkg.id);
                                }}
                                style={{
                                  display: "flex", alignItems: "center", gap: 8,
                                  padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                                  border: `1.5px solid ${isPkgSelected ? "var(--accent)" : "var(--bd)"}`,
                                  background: isPkgSelected ? "var(--accent-l, #f0f4ff)" : "var(--bg)",
                                  transition: "border-color 0.13s",
                                }}
                              >
                                <span style={{ fontSize: 14 }}>📦</span>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 11, fontWeight: 600 }}>
                                    {pkg.name}
                                    {pkg.childName && (
                                      <span style={{ fontSize: 10, color: "var(--blue)", marginLeft: 6 }}>
                                        👶 {pkg.childName}
                                      </span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 1 }}>
                                    เหลือ {pkg.remainingSessions} ครั้ง · หมด{" "}
                                    {new Date(pkg.expiryDate).toLocaleDateString("th-TH", {
                                      day: "numeric", month: "short", year: "2-digit",
                                    })}
                                  </div>
                                </div>
                                {isPkgSelected && (
                                  <span style={{ fontSize: 14, color: "var(--accent)", fontWeight: 700 }}>✓</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
