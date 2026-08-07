# 2026-08-06-source-door1-front-door — Source Door 1 Front Door

## Release ID

`2026-08-06-source-door1-front-door`

## Status

`candidate`

## Plain-English Summary

Source now has an explicit front door for optimizing an existing contract. A user can start a contract-optimization event from the portfolio or Contract 360, the event is created with a persisted `contract_optimization` motion signal, and the UI calls the existing Door 1 diagnose endpoint instead of relying on free-text regex inference. Competitive RFP events keep the existing full journey.

## Layer Impact

Release lane: `global-control-lane` with a `client-data-lane` migration.

Client Intake: adds a shaped intake mode for existing-contract optimization with contract context prefill when launched from Contract 360.

Source Adapters: adds an explicit `source_events.sourcing_motion` column so the event motion is declared at creation time.

Canonical Model: no new canonical entity model; the persisted Source event remains the operating record and the deterministic Door 1 engine still reads cited `source_event_facts`.

Products: Source portfolio, Contract 360, originate intake, and aVa event creation can now create deterministic Door 1 events.

## Client Applicability

- All clients: Source event creation supports the new optional sourcing motion field.
- Specific clients: SkyHarbor Global is the first expected proof tenant for the smoke run.
- Internal only: none.
- Public/demo only: none.
- Feature flag: existing Source feature flags continue to govern Source surfaces and Door 1 diagnosis.

## Changes Included

- Migration: `supabase/migrations/20260806190000_source_events_sourcing_motion.sql`
- UI: `SourcePortfolioBookPage`, `SourceContract360Page`, `SourceOriginatePage`
- API: `/api/v1/source/events`
- Source model/read path: event row mapping, read adapter, and journey resolver
- aVa tool: `commit_source_event` accepts optional `sourcing_motion`
- Cleanup: removed dead `AnalyticsStageRail.tsx`
- Smoke harness: `npm run source:door1:smoke`

## QA / Validation

- `npm test -- --runTestsByPath src/lib/source/__tests__/intake-intent.test.ts src/lib/source/__tests__/sourcing-motion-journeys.test.ts src/lib/source/__tests__/create-sourcing-event-scaffold.test.ts src/__tests__/integration/source/source-originate-page.test.ts src/components/source/__tests__/SourcePortfolioBookPage.honesty.test.tsx src/components/source/__tests__/SourceContract360Page.test.tsx src/lib/source/door1/__tests__/door1-flow.test.ts src/lib/source/door1/__tests__/door1-play.test.ts` — passed, 75/75 tests.
- `npx eslint` on touched Source, API, aVa tool, tests, and smoke files — passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit` — passed.
- `npm run source:door1:smoke -- --env-file=/Users/anand/Projects/nexus/.env.local` — blocked locally because the lab PostgreSQL host did not resolve from this environment. The smoke harness is committed and must be run from the operator/ACA network after the migration is applied.

## Rollout Plan

Merge through PR to `main`, let the repo-owned Azure Container Apps deploy workflow build and deploy the new image, then apply the migration through the approved migration/operator path. After the migration is present, run `npm run source:door1:smoke -- --env-file=<operator-env>` in rollback mode first, then perform signed-in Source proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: no ad-hoc shared web runtime mutation in this PR.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required if any operator job image is changed or used for migration/smoke proof.
- Feature/env flag update path: no new feature flag.
- Live signed-in proof required: yes.

## Rollback Plan

Rollback the web image to the prior ACA digest if UI behavior regresses. The migration is additive and nullable; existing events are unaffected if the UI rolls back. If the column must be removed later, first confirm no new events rely on `sourcing_motion`.

## Audit Evidence

- PR diff for this release record and listed files.
- Local Jest, ESLint, and TypeScript command outputs.
- Operator smoke output from `npm run source:door1:smoke` after migration apply.
- Signed-in screenshots or DOM/network proof for creating one Door 1 event and one competitive RFP event.

## Known Gaps

Live DB smoke and signed-in browser proof are still required after the migration is applied from a network that can reach the database. The smoke harness proves `source_events` plus `source_event_facts` persistence/readback and deterministic Door 1 diagnosis; it does not replace the required signed-in UI proof.
