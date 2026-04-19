-- Migration 036 · Pack F Part 4 — forbidden-client-name DB trigger
-- Idempotent. Belt-and-suspenders on top of the app-layer
-- assertClientNameAllowed() guard in src/lib/config/naming.ts.

BEGIN;

CREATE OR REPLACE FUNCTION check_client_name_allowed() RETURNS trigger AS $$
BEGIN
  IF lower(trim(NEW.name)) = ANY(ARRAY[
    'cade','accenture','dell','mckinsey','deloitte','bcg','bain',
    'huron','navigant','presbyterian','phs','md anderson',
    'commonspirit health','hp inc',
    'first capital financial','meridian health system'
  ]) THEN
    RAISE EXCEPTION 'Forbidden client name: % violates AbarVa naming rules', NEW.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_client_naming ON clients;
CREATE TRIGGER enforce_client_naming
  BEFORE INSERT OR UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION check_client_name_allowed();

NOTIFY pgrst, 'reload schema';

COMMIT;
