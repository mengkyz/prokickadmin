import React from "react";

export type BadgeVariant =
  | "green" | "red" | "orange" | "blue" | "purple" | "gray" | "dark";

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  green: { background: "var(--green-l)", color: "var(--green)" },
  red: { background: "var(--red-l)", color: "var(--red)" },
  orange: { background: "var(--orange-l)", color: "var(--orange)" },
  blue: { background: "var(--blue-l)", color: "var(--blue)" },
  purple: { background: "var(--purple-l)", color: "var(--purple)" },
  gray: { background: "#F3F4F6", color: "var(--t2)" },
  dark: { background: "#1B2A4A", color: "#fff" },
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function Badge({ variant = "gray", children, style }: BadgeProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 10,
        fontWeight: 600,
        whiteSpace: "nowrap",
        ...variantStyles[variant],
        ...style,
      }}
    >
      {children}
    </span>
  );
}
