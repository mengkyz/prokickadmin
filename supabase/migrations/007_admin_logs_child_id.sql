-- Migration 007: Add child_id to admin_logs so parent/child logs can be separated
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE admin_logs
  ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES child_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS admin_logs_child_id_idx ON admin_logs (child_id);
