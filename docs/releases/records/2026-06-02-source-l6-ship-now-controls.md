# 2026-06-02-source-l6-ship-now-controls — Source L6 Ship-Now Controls

## Release ID

`2026-06-02-source-l6-ship-now-controls`

## Status

`candidate`

## Plain-English Summary

This release tightens the Source module around the L6 QA findings. It adds visible AI Draft labeling for generated stored documents, prevents early-stage CXO reports from saying "Award / proceed," strips foreign `client` query parameters outside admin tenant switching, introduces idempotent Source event creation controls, adds a Source event activity log table and writers, blocks gate/stage approvals unless human reason, artifact, and evidence controls are satisfied, and gives legacy events a truthful stub scaffold instead of an empty developer-facing canvas.

## Layer Impact

- `global-control-lane`: Source route behavior, approval enforcement, CXO export copy, and chat response handling change for all Source users.
- `client-data-lane`: New migrations add `source_event_activity` and a uniqueness constraint path for `(client_key, event_code)`. The idempotency migration requires duplicate cleanup before application.
- `internal-admin`: The dedupe script is an operator runbook tool. It is read-only by default and requires `--apply` for soft-archiving duplicate rows.

## Client Applicability

- All clients: Source users receive gate enforcement, activity logging, CXO verdict gating, parameter stripping, AI Draft labeling, and virtual scaffold fallback.
- Specific clients: Apex Retail and Meridian Health currently have duplicate Source events that must be cleaned before the idempotency migration is applied.
- Internal only: `scripts/source-events-dedup.ts` is for operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/components/source/canvas/workspace-tabs/DocumentTab.tsx`: shows an `AI Draft` chip on generated stored document tiles.
- `src/lib/source/exports/cxo-report/source-cxo-narrative-report.ts`: gates CXO verdict language so pre-decision stages show `Pending — <stage>`.
- `src/proxy.ts`: strips foreign `?client=` params on `/tower`, `/home`, and `/admin` for non-admin roles.
- `supabase/migrations/20260602100000_source_events_idempotency.sql`: adds Source event idempotency constraint path.
- `scripts/source-events-dedup.ts`: audits duplicate Source events and soft-archives non-oldest duplicates only with `--apply`.
- `src/lib/source/queries.ts`: uses idempotent upsert for Source event creation.
- `supabase/migrations/20260602113000_source_event_activity.sql`: adds append-only Source event activity log table.
- `src/lib/data-plane/write-adapters/sourceWriteAdapter.ts`: adds activity-log writes and gate reason persistence.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts`: logs artifact generation.
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/body/route.ts`: records human edit metadata and logs artifact body writes.
- `src/app/api/v1/source/[eventId]/gate-criteria/[criterionId]/state/route.ts`: blocks gate-met actions without reason, committed artifact evidence, and required evidence readiness; logs successful gate actions.
- `src/app/api/v1/source/[eventId]/stage/route.ts`: blocks stage promotion without adjacent-stage, gate, artifact, evidence, and reason controls; logs successful promotions.
- `src/app/(maestro)/source/events/[eventId]/page.tsx`: reads real activity log rows and falls back to a runtime-only scaffold for legacy events with empty substrate rows.
- `src/lib/source/canvas-substrate/scaffold.ts`: builds deterministic virtual stub/pending/not-requested scaffold rows for legacy events.
- `src/lib/source/source-answer-engine.ts`: removes a hard 1,800-character answer slice that could cut deterministic Source answers mid-sentence.

## QA / Validation

- `npx jest src/lib/source/__tests__/source-governance-enforcement.test.ts --runInBand` — passed, 10 tests.
- `npx jest src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts --runInBand` — passed, 23 tests.
- `npx jest src/lib/source/__tests__/source-answer-engine.test.ts --runInBand` — passed, 34 tests.
- `npx jest src/lib/source/__tests__/source-governance-enforcement.test.ts src/lib/data-plane/write-adapters/__tests__/source-write-adapter.test.ts src/lib/source/__tests__/source-answer-engine.test.ts --runInBand` — passed, 67 tests.
- `npx tsc --noEmit --pretty false` — passed.
- `git diff --check` — passed.
- `npm run release:check -- --base origin/main --head HEAD` — passed.
- `npx tsx scripts/source-events-dedup.ts` — read-only duplicate audit completed and found 5 duplicate groups before cleanup.
- `npx tsx scripts/source-events-dedup.ts --apply` — soft-archived and archive-suffixed 12 duplicate Source event rows across 5 groups.
- `npx tsx scripts/source-events-dedup.ts` — post-cleanup audit found no duplicate `(client_key, event_code)` groups.
- `npm run db:migrate` with the reachable production `DATABASE_URL` as migration URL — applied `20260602100000_source_events_idempotency.sql` and `20260602113000_source_event_activity.sql`.
- `npx tsx scripts/provision-cxo-personas.ts --apply` — updated 22 canonical CXO personas across Clerk/person/membership records; no eligible legacy demo accounts were banned.
- Clerk production-domain check — blocked: available Clerk keys are `pk_test` / `sk_test`; no `pk_live` / `sk_live` values were available in local environment files.

## Rollout Plan

1. Merge the code after CI passes.
2. Duplicate cleanup has already been run against the reachable production data-plane connection: 12 non-oldest rows were archived and archive-suffixed.
3. Migrations have already been applied against that same connection.
4. Deploy the app.
5. Re-run Source E2E coverage for tenant isolation, approval governance, stored document labeling, CXO report verdict gating, event creation idempotency, persona authentication, and activity-log visibility.

## Rollback Plan

Revert the application commits to remove gate/stage enforcement, activity logging, virtual scaffold fallback, Source answer slice removal, CXO verdict gating, foreign-param stripping, and AI Draft labeling. The `source_event_activity` migration is additive and can remain if unused. The unique constraint migration should not be rolled back unless duplicate event creation must be temporarily allowed; if rolled back, retain the dedupe audit evidence.

## Audit Evidence

- Focused Jest outputs listed in QA / Validation.
- Duplicate audit/apply output from `scripts/source-events-dedup.ts`, showing 5 duplicate groups before cleanup, 12 rows soft-archived with archive-suffixed event codes, and 0 duplicate groups after cleanup.
- Migration output showing both Source idempotency and Source activity-log migrations applied.
- Persona provisioning output showing 22 personas updated and 0 legacy accounts banned.
- L6 QA memos for Apex Retail, Meridian Health, and SkyHarbor Air Source crawls.
- Future PR URL, CI run, deployment URL, and post-deploy E2E reports should be appended before release.

## Known Gaps

- Clerk production-domain migration remains blocked until production Clerk publishable/secret keys are available.
- Production deploy and post-deploy Source E2E remain to be completed after merge/deploy.
- Pricing and BAFO are now prevented from rendering as empty developer-facing canvases for legacy events, but real pricing normalization math, vendor bid data, BAFO deltas, and savings proof are still not implemented as audited business content.
- Activity logging code and migration are implemented, but production visibility is not verified until the migration is applied and browser E2E is rerun.
- RSC 503 investigation remains open.
- Clerk development-domain migration remains open.
- Full 20-spec E2E suite was not run in this local pass.
