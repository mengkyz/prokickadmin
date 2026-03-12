import React from "react";

export type ButtonVariant = "primary" | "ghost" | "danger" | "success" | "blue";
export type ButtonSize = "sm" | "md";

const baseStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  borderRadius: 7,
  cursor: "pointer",
  fontFamily: "inherit",
  fontWeight: 600,
  border: "none",
  whiteSpace: "nowrap",
  transition: "all 0.13s",
};

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "var(--accent)", color: "#fff", boxShadow: "0 2px 8px rgba(245,166,35,.25)" },
  ghost: { background: "transparent", color: "var(--t2)", border: "1.5px solid var(--bd2)" },
  danger: { background: "var(--red-l)", color: "var(--red)", border: "1.5px solid #FECACA" },
  success: { background: "var(--green-l)", color: "var(--green)", border: "1.5px solid #BBF7D0" },
  blue: { background: "var(--blue-l)", color: "var(--blue)", border: "1.5px solid #BFDBFE" },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: { padding: "4px 9px", fontSize: 11, borderRadius: 6 },
  md: { padding: "7px 13px", fontSize: 12 },
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", children, style, ...rest }: ButtonProps) {
  return (
    <button
      style={{ ...baseStyle, ...variantStyles[variant], ...sizeStyles[size], ...style }}
      {...rest}
    >
      {children}
    </button>
  );
}
