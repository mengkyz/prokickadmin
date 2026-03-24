-- Migration 008: add promo code reference and discount amount to payment_logs
-- Run in Supabase Dashboard → SQL Editor
-- All statements are idempotent (safe to run multiple times)

ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL;
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 2);

CREATE INDEX IF NOT EXISTS payment_logs_promo_code_id_idx ON payment_logs (promo_code_id);
