-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 011: payment_settings
-- Stores the business's bank account info and PromptPay QR code.
-- Single-row table — always upserted, never multi-row.
-- No RLS — consistent with the rest of this portal's tables.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS payment_settings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name      TEXT,
  bank_code      TEXT,
  account_number TEXT,
  account_name   TEXT,
  qr_code_base64 TEXT,          -- full data URL: "data:image/jpeg;base64,..."
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by     UUID REFERENCES portal_users(id)
);
