-- Migration 004: Venues and Coaches tables
-- Run in Supabase Dashboard → SQL Editor
-- All statements are idempotent (safe to run multiple times)

-- ── venues table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS venues (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name        TEXT        NOT NULL,
  description TEXT        NOT NULL DEFAULT '',
  capacity    INT         NOT NULL DEFAULT 20,
  is_active   BOOLEAN     NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS venues_name_key ON venues (name);

-- ── coaches table ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaches (
  id          UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name        TEXT        NOT NULL,
  role        TEXT        NOT NULL DEFAULT '',
  phone       TEXT        NOT NULL DEFAULT '',
  is_active   BOOLEAN     NOT NULL DEFAULT true
);

CREATE UNIQUE INDEX IF NOT EXISTS coaches_name_key ON coaches (name);

-- ── classes: add FK columns (nullable — old records keep their text values) ───
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL;

-- ── Seed data matching the existing hardcoded values in the app ───────────────
-- Venues
INSERT INTO venues (name, description, capacity) VALUES
  ('Grand Field',  'สนามหลัก',        20),
  ('Arena A',      'สนามรอง A',       20),
  ('Small Arena',  'สนามขนาดเล็ก',   10)
ON CONFLICT (name) DO NOTHING;

-- Coaches
INSERT INTO coaches (name, role) VALUES
  ('Pro Coach',  'โค้ชหลัก'),
  ('Coach Arm',  'โค้ชผู้ช่วย'),
  ('Coach Bee',  'โค้ชผู้ช่วย')
ON CONFLICT (name) DO NOTHING;

-- ── Back-fill venue_id / coach_id on existing classes rows ───────────────────
-- Links existing text-based records to the new FK tables where names match.
-- Safe to run multiple times (only updates rows where the FK is still NULL).
UPDATE classes c
SET venue_id = v.id
FROM venues v
WHERE c.location = v.name
  AND c.venue_id IS NULL;

UPDATE classes c
SET coach_id = co.id
FROM coaches co
WHERE c.coach = co.name
  AND c.coach_id IS NULL;
