import React from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";

export interface DashboardAlert {
  type: "red" | "orange" | "blue";
  title: string;
  desc: string;
  href?: string;
}

const alertBg:     Record<"red" | "orange" | "blue", string> = { red: "var(--red-l)",  orange: "var(--orange-l)", blue: "var(--blue-l)"  };
const alertBorder: Record<"red" | "orange" | "blue", string> = { red: "var(--red)",    orange: "var(--orange)",   blue: "var(--blue)"    };
const titleColor:  Record<"red" | "orange" | "blue", string> = { red: "var(--red)",    orange: "var(--orange)",   blue: "var(--blue)"    };

interface Props {
  alerts: DashboardAlert[];
  loading?: boolean;
}

export function AlertsCard({ alerts, loading }: Props) {
  return (
    <Card>
      <CardHeader icon="⚠️" title="แจ้งเตือน" />
      <div style={{ padding: 10 }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 16, color: "var(--tm)", fontSize: 12 }}>กำลังโหลด...</div>
        )}
        {!loading && alerts.length === 0 && (
          <div style={{ textAlign: "center", padding: 16, color: "var(--tm)", fontSize: 12 }}>✅ ไม่มีแจ้งเตือน</div>
        )}
        {!loading && alerts.map((alert, i) => {
          const inner = (
            <div
              style={{
                borderRadius: 7,
                padding: "9px 11px",
                marginBottom: i < alerts.length - 1 ? 7 : 0,
                borderLeft: `3px solid ${alertBorder[alert.type]}`,
                background: alertBg[alert.type],
                cursor: alert.href ? "pointer" : "default",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: titleColor[alert.type] }}>{alert.title}</div>
              <div style={{ fontSize: 10, color: "var(--t2)", marginTop: 2 }}>{alert.desc}</div>
            </div>
          );
          return alert.href
            ? <Link key={i} href={alert.href} style={{ textDecoration: "none" }}>{inner}</Link>
            : <div key={i}>{inner}</div>;
        })}
      </div>
    </Card>
  );
}
