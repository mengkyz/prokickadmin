-- Add 'inactive' value to package_status enum
-- (ALTER TYPE ... ADD VALUE cannot run inside a transaction block in some Postgres versions)
ALTER TYPE package_status ADD VALUE IF NOT EXISTS 'inactive';

-- Remove pause columns — no longer used
ALTER TABLE user_packages DROP COLUMN IF EXISTS paused_from;
ALTER TABLE user_packages DROP COLUMN IF EXISTS paused_until;
