# 2026-06-05-responsible-ai-ledger-client-key-canonicalization — Responsible AI Ledger Client Key Canonicalization

## Release ID

`2026-06-05-responsible-ai-ledger-client-key-canonicalization`

## Status

`candidate`

## Plain-English Summary

Responsible AI acknowledgment and training ledger rows were correctly tied to client UUIDs, but their denormalized `client_key` values could retain old app aliases such as `apexretail`, `meridian`, or `lakeshore`. This release backfills those ledger keys to the canonical `clients.tenant_key` values and adds a database trigger so future inserts stay canonical.

## Layer Impact

`client-data-lane`: Updates tenant-scoped Responsible AI evidence ledgers in the Postgres data plane. The change affects auditability and tenant-isolation regression behavior; it does not change the visible product workflow.

## Client Applicability

- All clients: The migration canonicalizes Responsible AI ledger `client_key` values wherever rows exist.
- Specific clients: Existing Apex Retail, Meridian Health, and Lakeshore Holdings ledger rows are expected to change from legacy aliases to canonical tenant keys.
- Internal only: None.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `supabase/migrations/20260605080000_responsible_ai_client_key_canonicalization.sql`
- `docs/releases/records/2026-06-05-responsible-ai-ledger-client-key-canonicalization.md`

## QA / Validation

- Pass: Live data inspection confirmed mismatched denormalized keys before the fix: `apexretail` vs `apex-retail`, `meridian` vs `meridian-health`, and `lakeshore` vs `lakeshore-holdings`.
- Pass: Local migration sanity check confirmed trigger drop/create counts match.
- Pass: Live migration rehearsal executed against the current database with final `COMMIT` replaced by `ROLLBACK`; the database accepted the migration without persisting changes.
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Not run yet: Scheduled RLS regression re-run requires this migration to be deployed/applied.

## Rollout Plan

Merge to `main`, deploy through the normal Vercel/CI path, and apply the Postgres migration through the established migration process. The migration is idempotent for existing rows and installs triggers for future writes.

## Rollback Plan

Rollback is normally not needed because canonical keys are the desired state. If a rollback is required, drop the two triggers and `public.canonicalize_responsible_ai_client_key()` function; existing rows can remain canonical because app and tenant-resolution code already accepts canonical keys.

## Audit Evidence

- Pull request URL and CI run after branch creation.
- Failed scheduled RLS regression before this fix: `https://github.com/abarva-platform/abarva/actions/runs/27002708933`
- Post-merge scheduled RLS regression evidence after migration apply.

## Known Gaps

The migration repairs and guards two Responsible AI ledgers. It does not change the broader app-client-key alias model used by legacy UI routing.
