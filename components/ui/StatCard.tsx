import React from "react";

type StripeColor = "orange" | "green" | "blue" | "purple";

const stripeGradients: Record<StripeColor, string> = {
  orange: "linear-gradient(90deg, var(--accent), #FF6B35)",
  green: "linear-gradient(90deg, var(--green), #4ADE80)",
  blue: "linear-gradient(90deg, var(--blue), #60A5FA)",
  purple: "linear-gradient(90deg, var(--purple), #A78BFA)",
};

const valueColors: Record<StripeColor, string> = {
  orange: "var(--accent)",
  green: "var(--green)",
  blue: "var(--blue)",
  purple: "var(--purple)",
};

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  color?: StripeColor;
}

export function StatCard({ label, value, subtitle, icon, color = "orange" }: StatCardProps) {
  return (
    <div
      style={{
        background: "var(--card)",
        border: "1.5px solid var(--bd)",
        borderRadius: "var(--r)",
        padding: "16px 18px",
        boxShadow: "var(--sh)",
        position: "relative",
        overflow: "hidden",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
    >
      {/* Top stripe */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          borderRadius: "var(--r) var(--r) 0 0",
          background: stripeGradients[color],
        }}
      />
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--tm)", textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: -1,
          color: valueColors[color],
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div style={{ fontSize: 10, color: "var(--tm)", marginTop: 3 }}>{subtitle}</div>
      )}
      {icon && (
        <div
          style={{
            position: "absolute",
            right: 14,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 28,
            opacity: 0.08,
          }}
        >
          {icon}
        </div>
      )}
    </div>
  );
}
