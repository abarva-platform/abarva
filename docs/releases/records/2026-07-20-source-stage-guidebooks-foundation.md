# 2026-07-20-source-stage-guidebooks-foundation — Source-native stage guidebooks: schema, types, repository, first authored content

## Release ID

`2026-07-20-source-stage-guidebooks-foundation`

## Status

`candidate` — code is deployed and live. **The database migration is not confirmed
applied to the live database** — see QA / Validation and Known Gaps below for the full
investigation. Do not advance this to `released` until that is resolved.

## Plain-English Summary

First slice of Source stage guidebooks — the facilitator-guide content for the working
session that moves a Source event through a stage's gate (agenda, talking points,
decision-capture worksheet), matching the original proposal's reference to Moves'
Workshop Facilitator Guide pattern.

Moves already has a substantial, live workshop-guide system
(`src/lib/workshops/`, an admin UI at `/admin/workshops`, a per-program UI, and 9 API
routes). Per an explicit architecture decision this pass, Source stage guidebooks are a
**Source-native, parallel system** — new tables, no shared schema, no shared API routes,
no shared admin UI with Moves' workshops. Moves' well-designed content shape (purpose /
agenda / facilitator brief / worksheet / decision-capture / pre-mortem) informed this
system's section-type vocabulary, but nothing in this release reads or writes a Moves
table.

This release ships: the schema (`source_stage_guidebooks`), the TS type mirror, a
tenant-or-global read repository, and one genuinely authored guidebook for the Strategy
stage — grounded in the actual P0 approval workspace fields (why-now/trigger, decision
owner, scope boundary, value target, approval route) that this session explored live
in production earlier, not generic filler content.

## Layer Impact

- `global-control-lane`: new schema (`source_stage_guidebooks`) and a new, currently
  unconsumed-by-any-route TS module (`src/lib/source/stage-guidebooks/`). Zero runtime
  behavior change for any existing surface — nothing in the product reads this table yet.
- **Database migration**: `supabase/migrations/20260720130000_source_stage_guidebooks.sql`
  (schema) + `supabase/migrations/20260720131500_source_stage_guidebooks_seed_strategy.sql`
  (one authored content row). Both are pure additions (`CREATE TABLE IF NOT EXISTS`,
  `INSERT ... ON CONFLICT DO NOTHING`) — no ALTER on any existing table, no data
  mutation to any existing row.

## Client Applicability

- All clients: yes — the seeded Strategy guidebook has `client_key = NULL` (global
  default), so once a read surface exists it will render for every tenant.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none — there is no read surface yet for this to gate.

## Changes Included

- `supabase/migrations/20260720130000_source_stage_guidebooks.sql` — new table,
  RLS (service_role full access + authenticated tenant-or-global read via
  `can_read_tenant_by_key` / `client_key IS NULL`), index on `(stage_key, client_key,
  status)`.
- `supabase/migrations/20260720131500_source_stage_guidebooks_seed_strategy.sql` — one
  published, global Strategy-stage guidebook: purpose, a 20-minute agenda, facilitator
  talking points, a decision-capture worksheet, and a pre-mortem — all grounded in the
  real P0 approval workspace fields observed live this session.
- `src/lib/source/stage-guidebooks/types.ts` — `SourceStageGuidebookRecord`,
  `SourceStageGuidebookSection`, section-type union.
- `src/lib/source/stage-guidebooks/repository.ts` — `getSourceStageGuidebook(stageKey,
  clientKey)`, reading through `getAzureReadFluentClient` (the same data-plane seam the
  rest of Source uses — not a raw `pg.Pool` like Moves' `workshops/db.ts`, not the
  AgentContextBroker). Tenant override wins over the global default when both exist for
  a stage; returns `null` (not an error) when no guidebook is authored for a stage yet.
- `src/lib/source/stage-guidebooks/__tests__/repository.test.ts` — row-mapping,
  query-scoping (stage + tenant-or-global filter), graceful `null` for an unauthored
  stage, graceful degrade for a malformed `sections` payload, real-error propagation.
- This release record.

## QA / Validation

- `pass` — Focused Jest: `npx jest --runTestsByPath src/lib/source/stage-guidebooks/__tests__/repository.test.ts`
  — 5/5 passed.
- `pass` — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false -p tsconfig.json`
  — clean, no errors.
- `pending` — `npm run release:check` — to run before PR.
- `not applicable` — Live signed-in browser proof. This release has no UI surface yet
  (see Known Gaps) — there is nothing in the product for a human to click through.
- `pass` — CI's "Fresh Postgres migration replay" check confirms the migration replays
  cleanly from zero against a disposable synthetic Postgres instance. That workflow's own
  header comment is explicit that this is **not** evidence against the live database:
  "This intentionally uses disposable synthetic CI Postgres, not the Azure lab database
  ... Azure PITR restore and seed/data-copy replay remain separate live-environment
  drills." Recording the pass honestly as what it actually proves (replay-from-zero
  correctness), not as live-database evidence.
- `NOT CONFIRMED` — **Live-database application.** Investigated after the code deploy
  completed: the ACA main-deploy workflow
  (`.github/workflows/aca-main-deploy.yml`) has **no migration-apply step** — it builds
  and ships the container image only. Applying a migration to the real Azure lab
  database is a distinct, manual operator action per
  `docs/runbooks/db-migration.md` (`npm run db:migrate`, run by someone with a live
  `AZURE_DATABASE_URL`/`DATABASE_URL`). This environment has neither the credential nor
  network path to run it (confirmed: `npm run db:migrate:dry` fails immediately with "no
  DATABASE_URL"; this session's private-VNet-reachability limitation was already known
  from earlier work). **The `source_stage_guidebooks` table's live existence has not been
  verified.** Practical impact today is zero — no shipped code path calls
  `getSourceStageGuidebook()` yet — but this must be resolved (migration applied and
  confirmed) before any UI surface that reads this table can be built or claimed working.

## Rollout Plan

Merge to main via the repo-owned ACA main-deploy workflow, which ships the code only.
**Applying the migration to the live database is a separate, manual step** — see QA /
Validation and Known Gaps. Both migration files are purely additive
(`CREATE TABLE IF NOT EXISTS`, `INSERT ... ON CONFLICT DO NOTHING`) — no existing table,
route, or UI is touched by either the code or the pending schema change.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — ships code only;
  confirmed it has no migration-apply step.
- Shared runtime mutators: none for this release — the migration itself has not been
  applied by any automated mutator; it requires the manual `db:migrate` path in
  `docs/runbooks/db-migration.md`.
- Approved image digest: recorded below once the deploy run completed.
- ACA runtime invariant: verified for the **code** deploy (see Audit Evidence) — this
  does not cover the pending database migration.
- Worker image invariant: covered by the same main-deploy workflow step.
- Feature/env flag update path: none.
- Live signed-in proof required: not applicable this pass — no read surface exists yet.

## Rollback Plan

Revert the merge commit for the TS module. The migration itself is additive
(`CREATE TABLE IF NOT EXISTS`) — a code-level revert does not need a corresponding
`DROP TABLE`; the empty/unused table can remain until a follow-up migration removes it if
this direction is abandoned. No existing table or row is touched, so there is no
data-loss risk from either the deploy or a rollback.

## Audit Evidence

- PR: [#5135](https://github.com/abarva-platform/abarva/pull/5135), merged as
  `02c08d3e28f16d6fe708fb9caaca3c56d3e1547b`.
- Focused Jest log: 5/5 passed.
- Typecheck log: clean.
- Code deploy: run [29744269332](https://github.com/abarva-platform/abarva/actions/runs/29744269332).
  ACA runtime invariant verified 2026-07-20T13:05:14Z — template image, active image, and
  the 100%-traffic revision (`ca-abarva-web-lab-eastus--m02c08d3e`) all match digest
  `sha256:eddd35962f173162229b68b5684aaa3792912a8ca70da685de5d11721c9658c3`; health check
  `ok: true`. **This confirms the code is live; it does not confirm the database
  migration is applied — see QA / Validation above.**

## Known Gaps

- **The database migration has not been confirmed applied to the live database.** This
  is the most important open item in this record — see the `NOT CONFIRMED` line in QA /
  Validation above for the full investigation. Resolving it requires an operator with
  live `AZURE_DATABASE_URL`/`DATABASE_URL` access to run `npm run db:migrate` per
  `docs/runbooks/db-migration.md` against the target environment, then verify via
  `npm run db:verify:canonical-tenants` or a direct row-count check that
  `source_stage_guidebooks` exists with its one seeded Strategy row. Until that happens,
  any code path that calls `getSourceStageGuidebook()` (none exist yet) would fail at
  runtime with a missing-table error, not a graceful `null`.
- **No read surface exists yet.** This release ships the schema, types, repository, and
  one real authored guidebook, but nothing in the product UI or API calls
  `getSourceStageGuidebook()` yet. A user cannot see this content today. The next slice
  is a minimal read-only view — most likely a new `SourceShellWorkspace` value
  (alongside the existing `steps` / `files` / `intelligence` / `approvals`) rendering the
  guidebook for the currently-viewed stage, following the same pattern those four already
  use in `source-event-shell-v2.ts` / `SourceAnalyticsCanvas.tsx`.
- **Only the Strategy stage has authored content.** The other 10 canonical stages
  (scope, rfp, responses, evaluation, pricing, bafo, executive_decision, selection,
  transition, value) have no guidebook row — `getSourceStageGuidebook()` will correctly
  return `null` for them (by design, not a bug), but a real product surface needs to
  decide how to degrade for an unauthored stage (hide the tab entirely vs. show an
  "not yet authored" state) before those stages should be considered complete.
- **No authoring/admin UI.** Unlike Moves' workshops (draft → review → approve →
  publish, with a dedicated admin UI), this release's content was authored directly via
  a migration `INSERT`. That is a deliberate, disclosed simplification for a first
  slice — a real authoring workflow (if warranted) is separate, larger, and explicitly
  not attempted here, matching the "build a Source-native parallel system" decision
  without attempting the *full* parallel system in one pass.
- **No per-tenant override has been authored** — the schema and repository support one
  (`client_key` non-null wins over the global default), but no tenant-specific content
  exists yet. Untested against real data because none exists; the repository test
  covers the query-shape only.
