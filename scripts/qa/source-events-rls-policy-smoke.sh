#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
migration="${1:-$repo_root/supabase/migrations/20260916201000_source_events_service_policy_scope.sql}"
tmp="$(mktemp -d)"
cleanup() {
  pg_ctl -D "$tmp/db" -m immediate -w stop >/dev/null 2>&1 || true
  rm -rf "$tmp"
}
trap cleanup EXIT

initdb -D "$tmp/db" -A trust --no-instructions >/dev/null
pg_ctl -D "$tmp/db" -o "-k $tmp -c listen_addresses=''" -w start >/dev/null
export PGHOST="$tmp"

psql -X -v ON_ERROR_STOP=1 -d postgres <<'SQL' >/dev/null
CREATE ROLE service_role;
CREATE ROLE authenticated;
CREATE TABLE source_events (id integer PRIMARY KEY, client_key text NOT NULL);
ALTER TABLE source_events ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON source_events TO authenticated;
CREATE POLICY service_role_full_access ON source_events USING (true) WITH CHECK (true);
CREATE POLICY auth_read ON source_events FOR SELECT TO authenticated
  USING (client_key = current_setting('app.tenant'));
CREATE POLICY auth_insert ON source_events FOR INSERT TO authenticated
  WITH CHECK (client_key = current_setting('app.tenant'));
INSERT INTO source_events VALUES (1, 'tenant-a'), (2, 'tenant-b');
SQL

before="$(psql -X -At -d postgres -c "SET ROLE authenticated; SET app.tenant='tenant-a'; SELECT count(*) FROM source_events" | tail -1)"
[[ "$before" == 2 ]] || { echo "precondition failed: original policy did not bypass tenant filter" >&2; exit 1; }

psql -X -v ON_ERROR_STOP=1 -d postgres -f "$migration" >/dev/null
psql -X -v ON_ERROR_STOP=1 -d postgres -f "$migration" >/dev/null
after="$(psql -X -At -d postgres -c "SET ROLE authenticated; SET app.tenant='tenant-a'; SELECT count(*) FROM source_events" | tail -1)"
[[ "$after" == 1 ]] || { echo "tenant-a read leaked rows: $after" >&2; exit 1; }

if psql -X -v ON_ERROR_STOP=1 -d postgres -c "SET ROLE authenticated; SET app.tenant='tenant-a'; INSERT INTO source_events VALUES (3, 'tenant-b')" >"$tmp/insert.log" 2>&1; then
  echo "cross-tenant insert unexpectedly succeeded" >&2
  exit 1
fi
rg -q 'row-level security policy' "$tmp/insert.log"

scope="$(psql -X -At -d postgres -c "SELECT array_to_string(roles, ',') FROM pg_policies WHERE tablename='source_events' AND policyname='service_role_all_source_events'")"
[[ "$scope" == service_role ]] || { echo "service policy scope is $scope" >&2; exit 1; }

# Reintroducing the broad policy must make the negative assertion fail.
psql -X -v ON_ERROR_STOP=1 -d postgres -c 'CREATE POLICY service_role_full_access ON source_events USING (true) WITH CHECK (true)' >/dev/null
mutated="$(psql -X -At -d postgres -c "SET ROLE authenticated; SET app.tenant='tenant-a'; SELECT count(*) FROM source_events" | tail -1)"
[[ "$mutated" == 2 ]] || { echo "mutation probe did not expose the bypass" >&2; exit 1; }
echo "PASS: scoped policy blocks cross-tenant reads and inserts; broad-policy mutation exposes bypass"
