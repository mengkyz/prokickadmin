"use client";

import React, { useEffect } from "react";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number | string;
}

export function Modal({ open, onClose, title, subtitle, children, footer, width = 560 }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(17,24,39,.45)",
        backdropFilter: "blur(3px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "all" : "none",
        transition: "opacity 0.18s",
      }}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1.5px solid var(--bd)",
          borderRadius: 14,
          width,
          maxWidth: "95vw",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          transform: open ? "scale(1) translateY(0)" : "scale(.97) translateY(8px)",
          transition: "transform 0.2s",
          boxShadow: "var(--sh-lg)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--bd)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
            borderRadius: "14px 14px 0 0",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{title}</div>
            {subtitle && <div style={{ fontSize: 11, color: "var(--tm)", marginTop: 2 }}>{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "var(--bg)",
              border: "1.5px solid var(--bd)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--tm)",
              fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--bd)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 9,
              flexShrink: 0,
              background: "var(--bg)",
              borderRadius: "0 0 14px 14px",
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Form helpers used inside modals ──────────────────────

interface FormGridProps { children: React.ReactNode; }
export function FormGrid({ children }: FormGridProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {children}
    </div>
  );
}

interface FormItemProps {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}
export function FormItem({ label, full, children }: FormItemProps) {
  return (
    <div className="pk-form-item" style={{ display: "flex", flexDirection: "column", gap: 4, ...(full ? { gridColumn: "1 / -1" } : {}) }}>
      <label style={{ fontSize: 10.5, fontWeight: 700, color: "var(--t2)", textTransform: "uppercase", letterSpacing: ".4px" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function FormSection({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        gridColumn: "1 / -1",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: ".8px",
        textTransform: "uppercase",
        color: "var(--tm)",
        padding: "4px 0 0",
        display: "flex",
        alignItems: "center",
        gap: 7,
      }}
    >
      {children}
      <span style={{ flex: 1, height: 1, background: "var(--bd)", display: "block" }} />
    </div>
  );
}

// ── Default modal footer shortcut ─────────────────────────
interface DefaultFooterProps {
  onCancel: () => void;
  onConfirm: () => void;
  cancelLabel?: string;
  confirmLabel?: string;
  extra?: React.ReactNode;
}
export function DefaultFooter({ onCancel, onConfirm, cancelLabel = "ยกเลิก", confirmLabel = "บันทึก", extra }: DefaultFooterProps) {
  return (
    <>
      {extra}
      <Button variant="ghost" onClick={onCancel}>{cancelLabel}</Button>
      <Button variant="primary" onClick={onConfirm}>{confirmLabel}</Button>
    </>
  );
}
