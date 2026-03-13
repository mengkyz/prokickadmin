"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { UserParentModal } from "@/components/users/UserParentModal";
import { UserChildModal } from "@/components/users/UserChildModal";
import { ExportUsersModal } from "@/components/users/ExportUsersModal";
import { fetchUsers } from "@/lib/db/users";
import type { AdminUser, AdminChild } from "@/lib/db/users";

type Modal = "none" | "parent" | "child" | "export";

const statusVariant: Record<string, BadgeVariant> = {
  Active: "green",
  Expired: "red",
  Low: "orange",
  "No Package": "gray",
};

export default function UsersPage() {
  const [modal, setModal]             = useState<Modal>("none");
  const [selected, setSelected]       = useState<Set<string>>(new Set());
  const [users, setUsers]             = useState<AdminUser[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);
  const [editTarget, setEditTarget]   = useState<AdminUser | null>(null);
  const [childTarget, setChildTarget] = useState<AdminChild | null>(null);

  // Filters
  const [search, setSearch]           = useState("");
  const [filterType, setFilterType]   = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setUsers(await fetchUsers());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      if (q && !u.fullName.toLowerCase().includes(q) && !u.phone.includes(q)) return false;
      if (filterType === "parent" && !u.types.includes("Parent")) return false;
      if (filterType === "player" && !u.types.includes("Player")) return false;
      if (filterStatus !== "all" && u.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
      return true;
    });
  }, [users, search, filterType, filterStatus]);

  const allIds = useMemo(() =>
    filtered.flatMap((u) => [u.id, ...u.children.map((c) => c.id)]),
    [filtered]
  );

  function toggleUser(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(allIds) : new Set());
  }

  function openParent(user: AdminUser) {
    setEditTarget(user);
    setModal("parent");
  }

  function openChild(child: AdminChild) {
    setChildTarget(child);
    setModal("child");
  }

  function handleClose() {
    setModal("none");
  }

  return (
    <>
      <Card>
        <CardHeader icon="👥" title="ผู้ใช้ทั้งหมด" />

        {/* Filters row */}
        <div style={{ display: "flex", gap: 7, padding: "10px 14px", borderBottom: "1px solid var(--bd)", flexWrap: "wrap", alignItems: "center", background: "var(--card-h)" }}>
          <input
            type="text"
            placeholder="ค้นหาชื่อ / เบอร์..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, outline: "none", width: 160 }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}
          >
            <option value="all">ทุกประเภท</option>
            <option value="player">Player</option>
            <option value="parent">Parent</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}
          >
            <option value="all">ทุกสถานะ</option>
            <option value="active">Active</option>
            <option value="low">Low</option>
            <option value="expired">Expired</option>
            <option value="no package">No Package</option>
          </select>
          <div style={{ marginLeft: "auto", display: "flex", gap: 7, alignItems: "center" }}>
            {!loading && (
              <span style={{ fontSize: 11, color: "var(--tm)" }}>
                {filtered.length} ราย
              </span>
            )}
            <Button variant="ghost" size="sm" onClick={load}>
              🔄 รีเฟรช
            </Button>
            {selected.size > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setModal("export")}>
                📥 Export ที่เลือก ({selected.size})
              </Button>
            )}
          </div>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--tm)", fontSize: 13 }}>
            กำลังโหลด...
          </div>
        )}
        {error && (
          <div style={{ textAlign: "center", padding: 40, color: "var(--red)", fontSize: 13 }}>
            {error}
          </div>
        )}

        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allIds.length > 0 && selected.size === allIds.length}
                    onChange={(e) => toggleAll(e.target.checked)}
                  />
                </th>
                <th>ผู้ใช้</th>
                <th>ประเภท</th>
                <th>แพ็กเกจ</th>
                <th>Sessions</th>
                <th>Extra</th>
                <th>สถานะ</th>
                <th>หมดอายุ</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--tm)", fontSize: 13 }}>
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
              {filtered.map((user) => (
                <React.Fragment key={user.id}>
                  {/* Parent/Player row */}
                  <tr onClick={() => openParent(user)} style={{ cursor: "pointer" }}>
                    <td onClick={(e) => { e.stopPropagation(); toggleUser(user.id); }}>
                      <input type="checkbox" checked={selected.has(user.id)} onChange={() => {}} />
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: "50%", background: user.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {user.avatarInitial}
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{user.fullName}</div>
                          <div style={{ fontSize: 10, color: "var(--tm)" }}>{user.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 3 }}>
                        {user.types.map((t) => (
                          <Badge key={t} variant={t === "Parent" ? "blue" : "orange"}>{t}</Badge>
                        ))}
                      </div>
                    </td>
                    <td>
                      {user.activePackage && (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>{user.activePackage.packageName}</div>
                          <div style={{ fontSize: 10, color: "var(--tm)" }}>{user.activePackage.startDate} – {user.activePackage.expiryDate}</div>
                        </>
                      )}
                    </td>
                    <td style={{ minWidth: 90 }}>
                      {user.activePackage ? (
                        <ProgressBar
                          value={user.activePackage.totalSessions - user.activePackage.remainingSessions}
                          max={user.activePackage.totalSessions}
                        />
                      ) : <span style={{ color: "var(--tm)", fontSize: 11 }}>—</span>}
                    </td>
                    <td className="pk-mono">
                      {user.activePackage ? (user.activePackage.extraSessionsPurchased ?? 0) : "—"}
                    </td>
                    <td>
                      <Badge variant={statusVariant[user.status] ?? "gray"}>
                        {user.status === "Active" ? "● Active"
                          : user.status === "Low" ? "⚠ Low"
                          : user.status}
                      </Badge>
                    </td>
                    <td className="pk-mono">{user.activePackage?.expiryDate ?? "—"}</td>
                    <td>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openParent(user); }}>
                        จัดการ
                      </Button>
                    </td>
                  </tr>

                  {/* Child rows */}
                  {user.children.map((child) => (
                    <tr key={child.id} className="child-row" onClick={() => openChild(child)} style={{ cursor: "pointer" }}>
                      <td onClick={(e) => { e.stopPropagation(); toggleUser(child.id); }} className="child-indent">
                        <input type="checkbox" checked={selected.has(child.id)} onChange={() => {}} />
                      </td>
                      <td className="child-indent">
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 22, height: 22, borderRadius: "50%", background: child.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                            {child.avatarInitial}
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 600 }}>{child.nickname}</div>
                            <div style={{ fontSize: 10, color: "var(--tm)" }}>เด็ก · ลูกของ {user.fullName}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge variant="gray">Child</Badge></td>
                      <td>
                        {child.activePackage && (
                          <>
                            <div style={{ fontSize: 10, fontWeight: 600 }}>{child.activePackage.packageName}</div>
                            <div style={{ fontSize: 10, color: "var(--tm)" }}>{child.activePackage.startDate} – {child.activePackage.expiryDate}</div>
                          </>
                        )}
                      </td>
                      <td style={{ minWidth: 90 }}>
                        {child.activePackage ? (
                          <ProgressBar
                            value={child.activePackage.totalSessions - child.activePackage.remainingSessions}
                            max={child.activePackage.totalSessions}
                          />
                        ) : <span style={{ color: "var(--tm)", fontSize: 11 }}>—</span>}
                      </td>
                      <td className="pk-mono">—</td>
                      <td>
                        <Badge variant={statusVariant[child.status] ?? "gray"}>
                          {child.status === "Active" ? "● Active"
                            : child.status === "Low" ? "⚠ Low"
                            : child.status}
                        </Badge>
                      </td>
                      <td className="pk-mono">{child.activePackage?.expiryDate ?? "—"}</td>
                      <td>
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openChild(child); }}>
                          จัดการ
                        </Button>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* key= ensures modal form state resets when target changes */}
      <UserParentModal
        key={editTarget?.id ?? "parent-none"}
        open={modal === "parent"}
        onClose={handleClose}
        user={editTarget}
        onSaved={() => load()}
      />
      <UserChildModal
        key={childTarget?.id ?? "child-none"}
        open={modal === "child"}
        onClose={handleClose}
        child={childTarget}
        onSaved={() => load()}
      />
      <ExportUsersModal open={modal === "export"} onClose={() => setModal("none")} />
    </>
  );
}
