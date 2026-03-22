"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { IncomingDetailModal } from "@/components/classes/IncomingDetailModal";
import type { AdminClass } from "@/lib/db/classes";

const borderColor: Record<string, string> = {
  open:      "var(--green)",
  full:      "var(--red)",
  waitlist:  "var(--orange)",
  completed: "var(--bd2)",
  cancelled: "var(--bd2)",
};

const countColor: Record<string, string> = {
  open:      "var(--green)",
  full:      "var(--red)",
  waitlist:  "var(--orange)",
  completed: "var(--tm)",
  cancelled: "var(--tm)",
};

const pkgLabel: Record<string, string> = {
  all:    "ทุกแพ็กเกจ",
  adult:  "Adult",
  junior: "Junior",
};

interface Props {
  classes: AdminClass[] | null;
  loading?: boolean;
}

export function TodayClassesCard({ classes, loading }: Props) {
  const [selected, setSelected] = useState<AdminClass | null>(null);

  const visible = (classes ?? []).filter((c) => c.status !== "cancelled");

  return (
    <>
      <Card>
        <CardHeader
          icon="🗓️"
          title="คลาสวันนี้"
          actions={
            <Link href="/classes">
              <Button variant="ghost" size="sm">ดูทั้งหมด →</Button>
            </Link>
          }
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: 12 }}>
          {loading && (
            <div style={{ textAlign: "center", padding: 20, color: "var(--tm)", fontSize: 12 }}>
              กำลังโหลด...
            </div>
          )}

          {!loading && visible.length === 0 && (
            <div style={{ textAlign: "center", padding: 20, color: "var(--tm)", fontSize: 12 }}>
              ไม่มีคลาสวันนี้
            </div>
          )}

          {!loading && visible.map((cls) => (
            <div
              key={cls.id}
              onClick={() => setSelected(cls)}
              style={{
                background: "var(--bg)",
                border: "1.5px solid var(--bd)",
                borderLeft: `4px solid ${borderColor[cls.status] ?? "var(--bd2)"}`,
                borderRadius: 8,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                opacity: cls.status === "completed" ? 0.6 : 1,
                transition: "opacity 0.12s",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", minWidth: 100 }}>
                {cls.timeStart}–{cls.timeEnd}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {pkgLabel[cls.packageFilter] ?? cls.packageFilter}
                  {cls.status === "completed" && (
                    <span style={{ fontSize: 9, color: "var(--tm)", fontWeight: 400, marginLeft: 6 }}>● เสร็จแล้ว</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 1 }}>
                  📍 {cls.venue} · 👤 {cls.coach}
                  {cls.waitlist > 0 && (
                    <span style={{ color: "var(--orange)", fontWeight: 600 }}> · Waitlist: {cls.waitlist}</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, minWidth: 56 }}>
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: countColor[cls.status] ?? "var(--tm)" }}>
                  {cls.booked}/{cls.capacity}
                </div>
                <ProgressBar value={cls.booked} max={cls.capacity} showLabel={false} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <IncomingDetailModal open={!!selected} onClose={() => setSelected(null)} cls={selected} />
    </>
  );
}
