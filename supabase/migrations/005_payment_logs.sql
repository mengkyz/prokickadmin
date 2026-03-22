-- Migration 005: payment_logs — align with SlipOK API response
-- Run in Supabase Dashboard → SQL Editor
-- All statements are idempotent (safe to run multiple times)

-- ── Create table if it doesn't exist yet ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_logs (
  id         UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── User / package links ──────────────────────────────────────────────────────
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS user_id    UUID REFERENCES profiles(id)       ON DELETE SET NULL;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS child_id   UUID REFERENCES child_profiles(id) ON DELETE SET NULL;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES user_packages(id)  ON DELETE SET NULL;

-- ── SlipOK verification result ────────────────────────────────────────────────
-- slipok_success = true  → slip verified OK
-- slipok_success = false → verification failed (see error_code / error_message)
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS slipok_success  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS slipok_message  TEXT;      -- e.g. "✅"

-- ── Transaction data (from SlipOK data object) ───────────────────────────────
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS trans_ref        TEXT;     -- transRef     e.g. "010092101507665143"
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS trans_date       TEXT;     -- transDate    yyyyMMdd e.g. "20200401"
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS trans_time       TEXT;     -- transTime    HH:mm:ss e.g. "10:15:07"
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS trans_timestamp  TIMESTAMPTZ; -- transTimestamp ISO 8601

-- ── Banks (3-digit codes per SlipOK guide) ────────────────────────────────────
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS sending_bank    TEXT;     -- sendingBank  e.g. "004"
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS receiving_bank  TEXT;     -- receivingBank e.g. "004"

-- ── Sender info ───────────────────────────────────────────────────────────────
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS sender_name     TEXT;     -- sender.displayName (Thai/EN)
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS sender_account  TEXT;     -- sender.account.value (masked)

-- ── Receiver info ─────────────────────────────────────────────────────────────
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS receiver_name    TEXT;    -- receiver.displayName
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS receiver_account TEXT;    -- receiver.account.value (masked)

-- ── Amount ────────────────────────────────────────────────────────────────────
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS amount DECIMAL(12, 2);    -- data.amount

-- ── Reference numbers ─────────────────────────────────────────────────────────
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS ref1 TEXT;                -- data.ref1
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS ref2 TEXT;                -- data.ref2
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS ref3 TEXT;                -- data.ref3

-- ── Error info (when slipok_success = false) ──────────────────────────────────
-- Error codes from SlipOK:
--   1008 = QR ไม่ใช่สำหรับชำระเงิน
--   1011 = QR หมดอายุ / ไม่มีรายการ
--   1012 = สลิปซ้ำ
--   1013 = ยอดไม่ตรง
--   1014 = บัญชีผู้รับไม่ตรง
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS error_code    INTEGER;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS error_message TEXT;

-- ── Admin note ────────────────────────────────────────────────────────────────
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS note TEXT;

-- ── Full raw SlipOK response (audit trail) ────────────────────────────────────
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS raw_response JSONB;

-- ── Index for common queries ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS payment_logs_created_at_idx ON payment_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS payment_logs_user_id_idx    ON payment_logs (user_id);
CREATE INDEX IF NOT EXISTS payment_logs_trans_ref_idx  ON payment_logs (trans_ref);
