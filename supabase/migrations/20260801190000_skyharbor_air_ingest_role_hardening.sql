-- Harden the isolated lab ingest target role and bind the already-created
-- managed-identity login role to it.
DO $$
BEGIN
  IF current_database() <> 'abarva_skyharbor_air_knowledge_lab' THEN
    RAISE NOTICE 'skipping isolated ingest role hardening for database %', current_database();
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'skyharbor_air_ingest') THEN
    RAISE EXCEPTION 'required_role_missing: skyharbor_air_ingest';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mi-skair-ingest-lab-001') THEN
    RAISE EXCEPTION 'required_role_missing: mi-skair-ingest-lab-001';
  END IF;

  ALTER ROLE skyharbor_air_ingest NOLOGIN;
  GRANT skyharbor_air_ingest TO "mi-skair-ingest-lab-001";
END $$;
