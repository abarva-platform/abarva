-- Tower W3 · tower_user_preferences
-- Per-user Tower view defaults and UX preferences.

BEGIN;

CREATE TABLE IF NOT EXISTS tower_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES persons(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  dashboard_variant TEXT NOT NULL DEFAULT 'cio'
    CHECK (dashboard_variant IN ('cio','maestro')),
  default_surface TEXT NOT NULL DEFAULT 'dashboard'
    CHECK (default_surface IN ('dashboard','signals','pipeline','use_cases','data')),
  default_filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  atlas_panel_state TEXT NOT NULL DEFAULT 'expanded'
    CHECK (atlas_panel_state IN ('expanded','collapsed')),
  mobile_summary_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS tower_user_preferences_person_client_key
  ON tower_user_preferences(person_id, client_id);
CREATE INDEX IF NOT EXISTS idx_tower_user_preferences_client
  ON tower_user_preferences(client_id);

DROP TRIGGER IF EXISTS tower_user_preferences_set_updated_at ON tower_user_preferences;
CREATE TRIGGER tower_user_preferences_set_updated_at BEFORE UPDATE ON tower_user_preferences
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE tower_user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_tower_user_preferences" ON tower_user_preferences;
CREATE POLICY "service_role_all_tower_user_preferences" ON tower_user_preferences
  FOR ALL TO service_role USING (true) WITH CHECK (true);

NOTIFY pgrst, 'reload schema';

COMMIT;
