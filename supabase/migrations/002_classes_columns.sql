-- Migration 002: Add admin columns to classes + attendance_status to bookings
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Safe to run multiple times (uses IF NOT EXISTS / idempotent)

-- ── classes table ─────────────────────────────────────────────────────────────
-- Add coach name (free text, matches existing webapp workflow)
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS coach TEXT;

-- Add explicit status for admin control
-- Derived default: open. Webapp sets this when creating/cancelling.
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'full', 'waitlist', 'completed', 'cancelled'));

-- Add package filter for class type restriction
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS package_filter TEXT NOT NULL DEFAULT 'all'
    CHECK (package_filter IN ('all', 'adult', 'junior'));

-- Add optional notes
ALTER TABLE classes
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ── bookings table ────────────────────────────────────────────────────────────
-- Add attendance status (separate from booking lifecycle status)
-- Null = not yet recorded. Set after class completes.
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS attendance_status TEXT
    CHECK (attendance_status IN ('confirmed', 'attended', 'no-show', 'cancelled', 'waitlist'));
