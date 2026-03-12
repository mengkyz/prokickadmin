import React from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { DASHBOARD_ALERTS } from "@/lib/mock/data";

const alertBg: Record<"red" | "orange" | "blue", string> = {
  red: "var(--red-l)",
  orange: "var(--orange-l)",
  blue: "var(--blue-l)",
};

const alertBorder: Record<"red" | "orange" | "blue", string> = {
  red: "var(--red)",
  orange: "var(--orange)",
  blue: "var(--blue)",
};

const titleColor: Record<"red" | "orange" | "blue", string> = {
  red: "var(--red)",
  orange: "var(--orange)",
  blue: "var(--blue)",
};

export function AlertsCard() {
  return (
    <Card>
      <CardHeader icon="⚠️" title="แจ้งเตือน" />
      <div style={{ padding: 10 }}>
        {DASHBOARD_ALERTS.map((alert, i) => (
          <div
            key={i}
            style={{
              borderRadius: 7,
              padding: "9px 11px",
              marginBottom: i < DASHBOARD_ALERTS.length - 1 ? 7 : 0,
              borderLeft: `3px solid ${alertBorder[alert.type]}`,
              background: alertBg[alert.type],
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: titleColor[alert.type] }}>
              {alert.title}
            </div>
            <div style={{ fontSize: 10, color: "var(--t2)", marginTop: 2 }}>{alert.desc}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
