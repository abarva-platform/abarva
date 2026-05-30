-- PRE-W4-PR-2 · connector status 'pending'
--
-- Extend admin_connectors.status to include 'pending', the lifecycle
-- status for connectors created via the AddConnectorPanel onboarding
-- drawer before credentials have been collected on the connector
-- detail page. Also adds three optional columns the panel writes:
--   - template_id  · which catalog template the operator picked
--   - scope        · free-text description of which objects/domains
--   - auth_method  · operator intent ('oauth' | 'api_key' | 'sso')
--
-- Credentials are NEVER written from the panel. Only the operator's
-- intent. The Configure auth flow on the detail page is where real
-- credentials get collected (out of scope for this PR).
--
-- Source: docs/build/PERSONA_A_TENANT_ADMIN_DAY1_2026-05-30.md §4.3
-- + §9 fix #3. Wave 4 connector.added comms uses the admin_audit_log
-- row this PR writes alongside the connector row.

BEGIN;

ALTER TABLE admin_connectors DROP CONSTRAINT IF EXISTS admin_connectors_status_check;
ALTER TABLE admin_connectors ADD CONSTRAINT admin_connectors_status_check
  CHECK (status IN (
    'not_configured', 'configured_stub', 'blocked', 'deferred', 'active', 'pending'
  ));

ALTER TABLE admin_connectors
  ADD COLUMN IF NOT EXISTS template_id TEXT,
  ADD COLUMN IF NOT EXISTS scope TEXT,
  ADD COLUMN IF NOT EXISTS auth_method TEXT
    CHECK (auth_method IS NULL OR auth_method IN ('oauth', 'api_key', 'sso'));

NOTIFY pgrst, 'reload schema';

COMMIT;
