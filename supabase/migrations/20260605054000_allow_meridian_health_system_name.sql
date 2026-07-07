-- Allow the canonical Meridian Health System display name.
-- Earlier demo-era guardrails blocked "Meridian Health System" as a
-- placeholder-like name. The tenant is now a canonical synthetic pilot tenant,
-- so the DB trigger must allow the full system name while still blocking
-- real third-party/company names and retired placeholders.

BEGIN;

CREATE OR REPLACE FUNCTION check_client_name_allowed() RETURNS trigger AS $$
BEGIN
  IF lower(trim(NEW.name)) = ANY(ARRAY[
    'cade','accenture','dell','mckinsey','deloitte','bcg','bain',
    'huron','navigant','presbyterian','phs','md anderson',
    'commonspirit health','hp inc'
  ]) THEN
    RAISE EXCEPTION 'Forbidden client name: % violates AbarVa naming rules', NEW.name;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

UPDATE public.clients
SET
  name = 'Meridian Health System',
  legal_name = 'Meridian Health System',
  slug = 'meridian-health',
  tenant_key = 'meridian-health',
  industry_code = 'healthcare_provider',
  updated_at = now()
WHERE tenant_key IN ('meridian', 'meridian-health')
   OR slug IN ('meridian', 'meridian-health')
   OR name IN ('Meridian Health', 'Meridian Health System')
   OR legal_name IN ('Meridian Health', 'Meridian Health System');

NOTIFY pgrst, 'reload schema';

COMMIT;
