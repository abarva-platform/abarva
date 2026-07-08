# 2026-07-07-source-vendor-lever-migration-stray-tag — Strip stray tag from vendor_lever migration

## Release ID

`2026-07-07-source-vendor-lever-migration-stray-tag`

## Status

`candidate`

## Plain-English Summary

The `vendor_lever` entity-kind migration (`20260707190000_source_event_facts_vendor_lever_kind.sql`,
merged in #4572) shipped with a stray trailing `</content>` line after the SQL — a
serialization artifact from the authoring tool. As committed, the file is invalid SQL and
fails with `syntax error at or near "</"` when the migration runner reaches it. The lab DB
was unblocked by applying the corrected SQL through the VNet job, but the file on `main`
was still broken and would fail the deploy-time migrate run for any environment that has
not already applied it. This change deletes the stray line so the committed migration is
valid SQL.

## Layer Impact

- `client-data-lane`: a data-plane migration file correctness fix. It only removes a
  non-SQL artifact line; the two `ALTER TABLE ... CHECK` statements are unchanged.

## Client Applicability

All clients / all tenants receive this change. The migration widens a shared
`source_event_facts` CHECK constraint that is not tenant-scoped, so it applies to every
client equally. No tenant-specific behavior. The fix ensures the migration can be applied
cleanly in any environment where it has not run yet.

## Changes Included

- `supabase/migrations/20260707190000_source_event_facts_vendor_lever_kind.sql`: delete the
  stray trailing `</content>` line (line 26). SQL unchanged.

## QA / Validation

Status: **pass**.

- The file now ends with the `ADD CONSTRAINT ... CHECK (...)` statement and contains only
  valid SQL (two `ALTER TABLE` statements + comments).
- The corrected SQL is exactly what was already applied and verified against the lab DB via
  the VNet job (observed `pg_get_constraintdef` includes `vendor_lever`). This change makes
  the committed file match what runs.

## Rollout Plan

Merge via squash. The migration is idempotent-safe (`DROP CONSTRAINT IF EXISTS` +
`ADD CONSTRAINT`); on an environment where the corrected SQL already ran, re-running is a
no-op re-assertion of the same constraint. Applied via the VNet migrate job per the ACA
data-build-job rule; never from a feature branch, localhost, or a web request.

## Deployment Authority

Only the repo-owned ACA main deploy workflow shifts shared web traffic. This PR does not
deploy and does not mutate any shared runtime, revision weight, or Container App template.
The migration is applied out-of-band via the VNet migrate job.

## Rollback Plan

Revert this commit. The constraint itself is additive and harmless; reverting only
re-introduces the broken file, so there is no data risk in either direction.

## Audit Evidence

- Before: file line 26 = `</content>` → `syntax error at or near "</"` on the first VNet
  migrate attempt.
- After: file ends at the `CHECK (...)` statement; lab constraint already verified to
  include `vendor_lever`.

## Known Gaps

The broken `20260705180000_lakeshore_cio_tower_budget_seed.sql` migration remains at the head
of the lab pending queue (tracked separately); unrelated to this fix.
