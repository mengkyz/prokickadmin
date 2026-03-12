"use client";

import React, { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { UserParentModal } from "@/components/users/UserParentModal";
import { UserChildModal } from "@/components/users/UserChildModal";
import { ExportUsersModal } from "@/components/users/ExportUsersModal";
import { USERS } from "@/lib/mock/data";

type Modal = "none" | "parent" | "child" | "export";

const statusVariant: Record<string, BadgeVariant> = {
  Active: "green",
  Expired: "red",
  Low: "orange",
};

export default function UsersPage() {
  const [modal, setModal] = useState<Modal>("none");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggleUser(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const allIds = USERS.flatMap((u) => [u.id, ...u.children.map((c) => c.id)]);

  function toggleAll(checked: boolean) {
    setSelected(checked ? new Set(allIds) : new Set());
  }

  return (
    <>
      <Card>
        <CardHeader icon="👥" title="ผู้ใช้ทั้งหมด" />

        {/* Date range filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderBottom: "1px solid var(--bd)", flexWrap: "wrap", background: "var(--card-h)" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--tm)" }}>ช่วงเวลา:</span>
          <input type="date" defaultValue="2026-01-01" style={{ padding: "5px 8px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", border: "1.5px solid var(--bd2)", background: "var(--bg)", color: "var(--t1)", cursor: "pointer", outline: "none", width: "auto" }} />
          <span style={{ color: "var(--tm)", fontSize: 11 }}>→</span>
          <input type="date" defaultValue="2026-03-12" style={{ padding: "5px 8px", borderRadius: 6, fontSize: 11, fontFamily: "inherit", border: "1.5px solid var(--bd2)", background: "var(--bg)", color: "var(--t1)", cursor: "pointer", outline: "none", width: "auto" }} />
        </div>

        {/* Filters row */}
        <div style={{ display: "flex", gap: 7, padding: "10px 14px", borderBottom: "1px solid var(--bd)", flexWrap: "wrap", alignItems: "center", background: "var(--card-h)" }}>
          <input
            type="text"
            placeholder="ค้นหาชื่อ / เบอร์..."
            style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, outline: "none", width: 160 }}
          />
          {["ทุกประเภท", "ทุกแพ็กเกจ", "ทุกสถานะ"].map((opt, i) => (
            <select key={i} style={{ padding: "5px 9px", background: "var(--bg)", border: "1.5px solid var(--bd2)", borderRadius: 6, color: "var(--t1)", fontFamily: "inherit", fontSize: 11, cursor: "pointer", outline: "none" }}>
              <option>{opt}</option>
              {i === 0 && <><option>Player</option><option>Parent</option></>}
              {i === 1 && <><option>Fun Pack</option><option>Pro Pack</option><option>Elite Pack</option></>}
              {i === 2 && <><option>Active</option><option>Expired</option></>}
            </select>
          ))}
          <div style={{ marginLeft: "auto" }}>
            {selected.size > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setModal("export")}>
                📥 Export ที่เลือก ({selected.size})
              </Button>
            )}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th><input type="checkbox" checked={selected.size === allIds.length} onChange={(e) => toggleAll(e.target.checked)} /></th>
              <th>ผู้ใช้</th><th>ประเภท</th><th>แพ็กเกจ</th><th>Sessions</th><th>Extra</th><th>สถานะ</th><th>หมดอายุ</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {USERS.map((user) => (
              <React.Fragment key={user.id}>
                {/* Parent/Player row */}
                <tr onClick={() => setModal(user.types.includes("Parent") ? "parent" : "parent")} style={{ cursor: "pointer" }}>
                  <td onClick={(e) => { e.stopPropagation(); toggleUser(user.id); }}>
                    <input type="checkbox" checked={selected.has(user.id)} onChange={() => {}} />
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: user.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {user.avatarInitial}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{user.name}</div>
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
                    {user.package && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 600 }}>{user.package.packageName}</div>
                        <div style={{ fontSize: 10, color: "var(--tm)" }}>{user.package.startDate}–{user.package.endDate}</div>
                      </>
                    )}
                  </td>
                  <td>
                    {user.package && (
                      <ProgressBar value={user.sessions.used} max={user.sessions.total} />
                    )}
                  </td>
                  <td className="pk-mono">{user.extra.used}/{user.extra.total}</td>
                  <td><Badge variant={statusVariant[user.status] ?? "gray"}>
                    {user.status === "Active" ? "● Active" : user.status === "Low" ? "⚠ Low" : user.status}
                  </Badge></td>
                  <td className="pk-mono">{user.expiresAt}</td>
                  <td>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setModal("parent"); }}>
                      จัดการ
                    </Button>
                  </td>
                </tr>

                {/* Child rows */}
                {user.children.map((child) => (
                  <tr key={child.id} className="child-row" onClick={() => setModal("child")} style={{ cursor: "pointer" }}>
                    <td onClick={(e) => { e.stopPropagation(); toggleUser(child.id); }} className="child-indent">
                      <input type="checkbox" checked={selected.has(child.id)} onChange={() => {}} />
                    </td>
                    <td className="child-indent">
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#60A5FA,#A78BFA)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                          {child.nickname.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 600 }}>{child.nickname}</div>
                          <div style={{ fontSize: 10, color: "var(--tm)" }}>เด็ก · ลูกของ {user.name}</div>
                        </div>
                      </div>
                    </td>
                    <td><Badge variant="gray">Child</Badge></td>
                    <td>
                      {child.package && (
                        <>
                          <div style={{ fontSize: 10, fontWeight: 600 }}>{child.package.packageName}</div>
                          <div style={{ fontSize: 10, color: "var(--tm)" }}>{child.package.startDate}–{child.package.endDate}</div>
                        </>
                      )}
                    </td>
                    <td>
                      {child.package && (
                        <ProgressBar value={child.package.sessionsRemaining} max={child.package.sessionsTotal} />
                      )}
                    </td>
                    <td className="pk-mono">—</td>
                    <td><Badge variant="green">● Active</Badge></td>
                    <td className="pk-mono">{child.package?.endDate ?? "—"}</td>
                    <td>
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setModal("child"); }}>
                        จัดการ
                      </Button>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </Card>

      <UserParentModal open={modal === "parent"} onClose={() => setModal("none")} />
      <UserChildModal open={modal === "child"} onClose={() => setModal("none")} />
      <ExportUsersModal open={modal === "export"} onClose={() => setModal("none")} />
    </>
  );
}
