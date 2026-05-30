# 2026-05-30 · Migration audit marker for connector_status_pending — unblock prod deploy

## Release ID
`2026-05-30-migration-marker-connector-status`

## Status
candidate

## Plain-English Summary
The Vercel production deploy carrying the full Tower fleet (11 PRs) was
blocked because `supabase/migrations/20260530200000_connector_status_pending.sql`
contains the pattern `ALTER TABLE … DROP CONSTRAINT IF EXISTS …`, which
the production migration runner refuses to auto-apply without the opt-in
audit marker `-- migration:destructive-allowed`.

Reviewed the migration: it is the canonical PostgreSQL pattern for
**extending** a CHECK constraint. The old constraint is dropped and
immediately re-added with `'pending'` appended to the allowed status set
(`'not_configured','configured_stub','blocked','deferred','active','pending'`).
The whole thing is wrapped in `BEGIN/COMMIT`, atomic. The new constraint
is a strict superset of the old (every prior value still passes), so
zero data-loss risk. The migration also adds three nullable optional
columns (`template_id`, `scope`, `auth_method`) via `ADD COLUMN IF NOT
EXISTS` — non-destructive.

This PR prepends `-- migration:destructive-allowed` as the first line of
the migration file. That satisfies the deploy gate without changing any
SQL semantics. Result: production deploys unblock and the full Tower
fleet (10 source-system ingest pipelines + Apple-grade UI polish)
becomes live.

## Layer Impact
- `data-plane-lane`: one-line audit marker added to the migration file;
  no SQL semantics changed. The migration itself is the canonical
  drop-and-readd-superset pattern for extending a CHECK constraint and
  is safe under the existing transactional guarantees.
- `runtime-app-lane`: none — application code unchanged.
- `architecture-lane`: none.

## Client Applicability
- All clients: yes — the deploy gate applies to the shared production
  pipeline. Once this fix lands, the latest main with the full Tower
  fleet will deploy to all environments.
- Specific clients: none preferentially.
- Internal only: no.
- Feature flag: none.

## Changes Included
- `supabase/migrations/20260530200000_connector_status_pending.sql` —
  prepended `-- migration:destructive-allowed` as line 1. No other
  changes; the SQL body is byte-identical to what it was before.
- `docs/releases/records/2026-05-30-migration-marker-connector-status.md`
  — this release record.

## QA / Validation
- `Fresh Postgres migration replay` CI gate passes on this PR — confirms
  the migration applies cleanly against a fresh DB.
- `Typecheck + reasoning-layer tests`, `ESLint`, `Production readiness
  gate`, `New migration drift surface`, `Run hygiene_gate.sh`, `Verify
  canonical tenant allowlist` all pass on this PR.
- Manual review of the migration confirmed it is the canonical
  `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT … superset` pattern,
  atomic via `BEGIN/COMMIT`, with the new constraint a strict superset
  of the old (no row currently valid is invalidated).

## Rollout Plan
- Merge this PR to main.
- Vercel auto-deploys main. Production deploy applies the migration
  and serves the full Tower fleet.
- No customer comms required — this is a release-gate unblock.

## Rollback Plan
- If the deploy still fails, remove the audit marker line by reverting
  this commit. The deploy returns to its prior failing state but no
  data loss has occurred.
- If the migration itself misbehaves (it should not), revert the
  underlying migration PR. Tables `admin_connectors` will need an
  ALTER to restore the old CHECK constraint; no rows are lost because
  the new constraint is a strict superset of the old.

## Audit Evidence
- Vercel build log on commit `73c3bb14a` (the Jira merge commit) showed
  the migration runner failing 5 times with "Destructive migration
  patterns detected (auto-apply blocked)" on
  `20260530200000_connector_status_pending.sql:21`.
- The runner's own guidance: "If this is intentional, add the opt-in
  marker as the FIRST comment line in the migration file: --
  migration:destructive-allowed". This PR follows that guidance.
- CI gates on this PR pass (Typecheck, ESLint, Production readiness,
  hygiene_gate.sh build, Fresh Postgres migration replay, New
  migration drift surface).

## Known Gaps
- The `Routes and disclaimers` CI gate is failing on this PR. That gate
  runs `integrity:link-crawler`, `integrity:dom`,
  `integrity:disclaimers`, etc.; none are affected by adding a SQL
  comment line. The failure reproduces on other recent PRs and on main
  itself — pre-existing repo-wide breakage independent of this change,
  same pattern as the `hygiene_gate.sh` build-step failure that S9/S10/U1
  Tower agents documented and admin-merged through.
