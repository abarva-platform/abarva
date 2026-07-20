# 2026-07-20-source-stage-guidebooks-foundation — Source-native stage guidebooks: schema, types, repository, first authored content

## Release ID

`2026-07-20-source-stage-guidebooks-foundation`

## Status

`candidate`

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
  (see Known Gaps) — there is nothing in the product for a human to click through. The
  migration itself will be exercised by the standard ACA deploy's migration-apply step;
  runtime-invariant verification confirms the deploy succeeded, not that a user can see
  the guidebook (they can't yet).
- `not run locally` — The migration was not dry-run against a live database from this
  environment (established this session: localhost cannot reach the private-VNet
  Postgres instance). Reviewed carefully against the established
  `source_event_facts` migration's conventions (RLS policy shape, index style, comment
  format) as the closest recent precedent; will be exercised for real by the ACA
  deploy's migration-apply step, and its result — the "Verify ACA runtime invariant" and
  general deploy health — is real evidence the migration applied cleanly.

## Rollout Plan

Merge to main via the repo-owned ACA main-deploy workflow, which applies pending
migrations as part of deploy. Purely additive — no existing table, route, or UI is
touched.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: the migration-apply step within the standard deploy workflow
  (not an ad-hoc `az` command).
- Approved image digest: recorded post-merge once the deploy run completes.
- ACA runtime invariant: to be verified post-deploy.
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

- PR URL: recorded post-open.
- Focused Jest log: 5/5 passed.
- Typecheck log: clean.

## Known Gaps

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
