import { Client } from 'pg';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: path.resolve(process.cwd(), '.env.local') });
loadEnv();

const COMPAT_SQL = `
DO $$
BEGIN
  CREATE ROLE anon NOLOGIN;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE ROLE authenticated NOLOGIN;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  CREATE ROLE service_role NOLOGIN;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'pgcrypto extension not created: insufficient privilege';
END $$;

DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EXCEPTION WHEN insufficient_privilege THEN
  RAISE NOTICE 'uuid-ossp extension not created: insufficient privilege';
END $$;

CREATE OR REPLACE FUNCTION auth.jwt()
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb;
$$;

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(current_setting('request.jwt.claim.role', true), ''),
    NULLIF(auth.jwt() ->> 'role', ''),
    current_user
  );
$$;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claim text;
BEGIN
  claim := NULLIF(auth.jwt() ->> 'sub', '');
  IF claim IS NULL THEN
    RETURN NULL;
  END IF;

  BEGIN
    RETURN claim::uuid;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
  END;
END;
$$;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN name IS NULL OR name = '' THEN ARRAY[]::text[]
    ELSE regexp_split_to_array(name, '/')
  END;
$$;

CREATE OR REPLACE FUNCTION public.text_eq_uuid(left_value text, right_value uuid)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT left_value = right_value::text;
$$;

CREATE OR REPLACE FUNCTION public.uuid_eq_text(left_value uuid, right_value text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT left_value::text = right_value;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_operator
    WHERE oprname = '='
      AND oprleft = 'text'::regtype
      AND oprright = 'uuid'::regtype
  ) THEN
    CREATE OPERATOR = (
      LEFTARG = text,
      RIGHTARG = uuid,
      PROCEDURE = public.text_eq_uuid
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_operator
    WHERE oprname = '='
      AND oprleft = 'uuid'::regtype
      AND oprright = 'text'::regtype
  ) THEN
    CREATE OPERATOR = (
      LEFTARG = uuid,
      RIGHTARG = text,
      PROCEDURE = public.uuid_eq_text
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  owner uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  public boolean NOT NULL DEFAULT false,
  avif_autodetection boolean NOT NULL DEFAULT false,
  file_size_limit bigint NULL,
  allowed_mime_types text[] NULL,
  owner_id text NULL
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL REFERENCES storage.buckets(id) ON DELETE CASCADE,
  name text NOT NULL,
  owner uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NULL,
  path_tokens text[] GENERATED ALWAYS AS (storage.foldername(name)) STORED,
  version text NULL,
  owner_id text NULL,
  user_metadata jsonb NULL,
  CONSTRAINT objects_bucket_id_name_unique UNIQUE (bucket_id, name)
);

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_storage_buckets" ON storage.buckets;
CREATE POLICY "service_role_all_storage_buckets" ON storage.buckets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_storage_objects" ON storage.objects;
CREATE POLICY "service_role_all_storage_objects" ON storage.objects
  FOR ALL TO service_role USING (true) WITH CHECK (true);

GRANT SELECT ON storage.buckets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO service_role;
GRANT ALL ON storage.objects TO service_role;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'current_tenant_key'
  ) THEN
    CREATE OR REPLACE FUNCTION public.can_read_tenant_by_id(p_client_id text)
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    AS $fn$
      SELECT EXISTS (
        SELECT 1 FROM clients
        WHERE (id::text = p_client_id OR tenant_key = p_client_id)
          AND tenant_key = current_tenant_key()
      ) OR is_maestro()
    $fn$;

    CREATE OR REPLACE FUNCTION public.can_write_tenant_by_id(p_client_id text)
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    AS $fn$
      SELECT EXISTS (
        SELECT 1 FROM clients
        WHERE (id::text = p_client_id OR tenant_key = p_client_id)
          AND tenant_key = current_tenant_key()
      ) AND is_tenant_admin()
    $fn$;

    GRANT EXECUTE ON FUNCTION public.can_read_tenant_by_id(text) TO authenticated;
    GRANT EXECUTE ON FUNCTION public.can_write_tenant_by_id(text) TO authenticated;
  END IF;
END $$;

GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.jwt() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION storage.foldername(text) TO anon, authenticated, service_role;
`;

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('✗ DATABASE_URL is required for Azure Postgres compatibility bootstrap.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(COMPAT_SQL);
    console.log('✓ Azure Postgres compatibility bootstrap complete.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('✗ Azure Postgres compatibility bootstrap failed.');
  console.error(error);
  process.exit(1);
});
