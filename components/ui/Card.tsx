import React from "react";

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export function Card({ children, style, className }: CardProps) {
  return (
    <div
      className={className}
      style={{
        background: "var(--card)",
        border: "1.5px solid var(--bd)",
        borderRadius: "var(--r)",
        overflow: "hidden",
        boxShadow: "var(--sh)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  icon?: React.ReactNode;
  title: React.ReactNode;
  actions?: React.ReactNode;
}

export function CardHeader({ icon, title, actions }: CardHeaderProps) {
  return (
    <div
      style={{
        padding: "13px 16px",
        borderBottom: "1px solid var(--bd)",
        display: "flex",
        alignItems: "center",
        gap: 7,
        flexWrap: "wrap",
      }}
    >
      {icon && <span>{icon}</span>}
      <div style={{ fontSize: 13, fontWeight: 700 }}>{title}</div>
      {actions && (
        <div style={{ marginLeft: "auto", display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }}>
          {actions}
        </div>
      )}
    </div>
  );
}
