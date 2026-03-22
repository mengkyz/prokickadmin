import React from "react";

type BarColor = "green" | "orange" | "red" | "blue";

const barColorMap: Record<BarColor, string> = {
  green: "var(--green)",
  orange: "var(--accent)",
  red: "var(--red)",
  blue: "var(--blue)",
};

interface ProgressBarProps {
  value: number;
  max: number;
  color?: BarColor;
  showLabel?: boolean;
  label?: string; // override the default "value/max" label
}

function resolveColor(value: number, max: number): BarColor {
  const pct = max > 0 ? value / max : 0;
  if (pct >= 1) return "red";
  if (pct >= 0.75) return "orange";
  return "green";
}

export function ProgressBar({ value, max, color, showLabel = true, label }: ProgressBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const resolvedColor = color ?? resolveColor(value, max);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <div
        style={{
          flex: 1,
          height: 4,
          background: "var(--bd)",
          borderRadius: 10,
          overflow: "hidden",
          minWidth: 44,
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 10,
            width: `${pct}%`,
            background: barColorMap[resolvedColor],
          }}
        />
      </div>
      {showLabel && (
        <span
          style={{
            fontSize: 10,
            color: "var(--t2)",
            fontFamily: "'JetBrains Mono', monospace",
            minWidth: 32,
            textAlign: "right",
          }}
        >
          {label ?? `${value}/${max}`}
        </span>
      )}
    </div>
  );
}
