-- Migration 003: Admin support for Users tab
-- Run in Supabase Dashboard → SQL Editor
-- All statements are idempotent (safe to run multiple times)

-- ── user_packages: pause support ─────────────────────────────────────────────
ALTER TABLE user_packages
  ADD COLUMN IF NOT EXISTS paused_from  DATE,
  ADD COLUMN IF NOT EXISTS paused_until DATE;

-- ── profiles: admin notes field ──────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ── child_profiles: admin notes field ────────────────────────────────────────
ALTER TABLE child_profiles
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- ── admin_logs: manual action audit trail ────────────────────────────────────
-- Tracks every admin action: session adjustments, pauses, extends, profile edits
CREATE TABLE IF NOT EXISTS admin_logs (
  id             UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id        UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  target_type    TEXT        NOT NULL, -- 'user_package' | 'profile' | 'child_profile'
  target_id      TEXT        NOT NULL, -- UUID of the affected record
  action         TEXT        NOT NULL, -- 'adjust_sessions' | 'pause' | 'extend' | 'profile_update' | 'payment'
  delta_sessions INTEGER,              -- positive = added, negative = deducted
  delta_extra    INTEGER,
  note           TEXT,
  performed_by   TEXT        NOT NULL DEFAULT 'admin'
);
