"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { IncomingDetailModal } from "@/components/classes/IncomingDetailModal";
import { TODAY_CLASSES } from "@/lib/mock/data";

type ClassStatus = "open" | "full" | "waitlist";

const statusBorderColor: Record<ClassStatus, string> = {
  open: "var(--green)",
  full: "var(--red)",
  waitlist: "var(--orange)",
};

const statusCapColor: Record<ClassStatus, string> = {
  open: "var(--green)",
  full: "var(--red)",
  waitlist: "var(--orange)",
};

export function TodayClassesCard() {
  const [detailOpen, setDetailOpen] = useState(false);

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
          {TODAY_CLASSES.map((cls, i) => (
            <div
              key={i}
              onClick={() => setDetailOpen(true)}
              style={{
                background: "var(--bg)",
                border: "1.5px solid var(--bd)",
                borderLeft: `4px solid ${statusBorderColor[cls.status]}`,
                borderRadius: 8,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                transition: "all 0.12s",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", minWidth: 96 }}>
                {cls.time}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{cls.name}</div>
                <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 1 }}>
                  📍 {cls.venue} · 👤 {cls.coach}
                  {cls.status === "waitlist" && cls.waitlist && (
                    <span style={{ color: "var(--orange)", fontWeight: 600 }}> · Waitlist: {cls.waitlist}</span>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, minWidth: 66 }}>
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: statusCapColor[cls.status] }}>
                  {cls.booked}/{cls.capacity}
                </div>
                <ProgressBar value={cls.booked} max={cls.capacity} showLabel={false} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <IncomingDetailModal open={detailOpen} onClose={() => setDetailOpen(false)} />
    </>
  );
}
