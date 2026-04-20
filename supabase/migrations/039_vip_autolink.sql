-- Migration 039 · Auto-link vip_profiles to persons on INSERT/UPDATE of persons
-- by case-insensitive display_name match. Saves a manual UPDATE step when a
-- VIP signs in for the first time.

BEGIN;

CREATE OR REPLACE FUNCTION link_vip_profile_on_person()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE vip_profiles
  SET person_id = NEW.id,
      last_updated = now()
  WHERE person_id IS NULL
    AND lower(display_name) = lower(NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_vip_profile ON persons;
CREATE TRIGGER trg_link_vip_profile
  AFTER INSERT OR UPDATE OF name ON persons
  FOR EACH ROW
  EXECUTE FUNCTION link_vip_profile_on_person();

-- Backfill — link any existing persons rows whose name matches a VIP profile
-- whose person_id is still NULL.
UPDATE vip_profiles v
SET person_id = p.id,
    last_updated = now()
FROM persons p
WHERE v.person_id IS NULL
  AND lower(v.display_name) = lower(p.name);

COMMIT;
