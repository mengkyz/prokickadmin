-- Admin action logs for tracking admin operations on classes

CREATE TABLE IF NOT EXISTS admin_action_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  class_id     UUID        REFERENCES classes(id) ON DELETE CASCADE,
  action_type  TEXT        NOT NULL CHECK (action_type IN ('book', 'standby', 'cancel', 'promote')),
  target_user_name TEXT    NOT NULL,
  notes        TEXT
);

CREATE INDEX IF NOT EXISTS idx_admin_action_logs_class_id    ON admin_action_logs(class_id);
CREATE INDEX IF NOT EXISTS idx_admin_action_logs_created_at  ON admin_action_logs(created_at DESC);
