-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 010: Portal Auth — portal_users table + RLS on all tables
-- Apply via Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Portal users: linked to Supabase Auth, separate from app user profiles
CREATE TABLE IF NOT EXISTS portal_users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'coach' CHECK (role IN ('admin', 'coach')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  invited_by    UUID REFERENCES portal_users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;

-- Each user can read their own row
CREATE POLICY "portal_users: read own" ON portal_users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Admins can read all portal users
CREATE POLICY "portal_users: admin read all" ON portal_users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portal_users pu
      WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true
    )
  );

-- Admins can insert new portal users
CREATE POLICY "portal_users: admin insert" ON portal_users
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portal_users pu
      WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true
    )
  );

-- Admins can update portal users
CREATE POLICY "portal_users: admin update" ON portal_users
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portal_users pu
      WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true
    )
  );

-- Admins can delete portal users
CREATE POLICY "portal_users: admin delete" ON portal_users
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM portal_users pu
      WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true
    )
  );

-- ─── RLS helper macro (repeated per table) ───────────────────────────────────
-- Read: any authenticated portal user
-- Write (INSERT/UPDATE/DELETE): admins only

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles: authenticated read"  ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles: admin insert" ON profiles FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "profiles: admin update" ON profiles FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "profiles: admin delete" ON profiles FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));

-- child_profiles
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "child_profiles: authenticated read"  ON child_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "child_profiles: admin insert" ON child_profiles FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "child_profiles: admin update" ON child_profiles FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "child_profiles: admin delete" ON child_profiles FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));

-- classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classes: authenticated read"  ON classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "classes: admin insert" ON classes FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "classes: admin update" ON classes FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "classes: admin delete" ON classes FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));

-- bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings: authenticated read"  ON bookings FOR SELECT TO authenticated USING (true);
CREATE POLICY "bookings: admin insert" ON bookings FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "bookings: admin update" ON bookings FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "bookings: admin delete" ON bookings FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));

-- user_packages
ALTER TABLE user_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_packages: authenticated read"  ON user_packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_packages: admin insert" ON user_packages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "user_packages: admin update" ON user_packages FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "user_packages: admin delete" ON user_packages FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));

-- package_templates
ALTER TABLE package_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "package_templates: authenticated read"  ON package_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "package_templates: admin insert" ON package_templates FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "package_templates: admin update" ON package_templates FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "package_templates: admin delete" ON package_templates FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));

-- payment_logs
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_logs: authenticated read"  ON payment_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "payment_logs: admin insert" ON payment_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "payment_logs: admin update" ON payment_logs FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "payment_logs: admin delete" ON payment_logs FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));

-- promo_codes (admin only — coaches never see promo data)
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promo_codes: admin only" ON promo_codes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true))
  WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));

-- venues
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "venues: authenticated read"  ON venues FOR SELECT TO authenticated USING (true);
CREATE POLICY "venues: admin insert" ON venues FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "venues: admin update" ON venues FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "venues: admin delete" ON venues FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));

-- coaches
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coaches: authenticated read"  ON coaches FOR SELECT TO authenticated USING (true);
CREATE POLICY "coaches: admin insert" ON coaches FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "coaches: admin update" ON coaches FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
CREATE POLICY "coaches: admin delete" ON coaches FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));

-- admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_logs: authenticated read"  ON admin_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_logs: admin insert" ON admin_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));

-- admin_action_logs
ALTER TABLE admin_action_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_action_logs: authenticated read"  ON admin_action_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_action_logs: admin insert" ON admin_action_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM portal_users pu WHERE pu.id = auth.uid() AND pu.role = 'admin' AND pu.is_active = true));
