import React from "react";
import { StatCard } from "@/components/ui/StatCard";
import { TodayClassesCard } from "@/components/dashboard/TodayClassesCard";
import { AlertsCard } from "@/components/dashboard/AlertsCard";
import { DASHBOARD_STATS } from "@/lib/mock/data";

export default function DashboardPage() {
  return (
    <div>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 18 }}>
        <StatCard
          label="Active Members"
          value={DASHBOARD_STATS.activeMembers.value}
          subtitle={DASHBOARD_STATS.activeMembers.change}
          icon="👥"
          color="orange"
        />
        <StatCard
          label="Today's Classes"
          value={DASHBOARD_STATS.todayClasses.value}
          subtitle={DASHBOARD_STATS.todayClasses.change}
          icon="🗓️"
          color="green"
        />
      </div>

      {/* Main content row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }}>
        <TodayClassesCard />
        <AlertsCard />
      </div>
    </div>
  );
}
