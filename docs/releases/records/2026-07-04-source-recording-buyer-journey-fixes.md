# 2026-07-04-source-recording-buyer-journey-fixes — Source Buyer Journey Readiness Fixes

## Release ID

`2026-07-04-source-recording-buyer-journey-fixes`

## Status

`candidate`

## Plain-English Summary

This release fixes the Source buyer-journey gaps found by the fresh-event recording readiness proof. New Source intake now captures the five required business facts more deterministically, approval pages read those facts back without collapsing them into one scope blob, fresh Lakeshore events no longer inherit curated demo case-study affordances, executive exports stay hidden until an event has earned them, generated artifacts fail honestly if File Cabinet persistence does not complete, and client-final uploads require a persisted AbarVa draft lineage before becoming authoritative.

## Layer Impact

- `global-control-lane`: Updates shared Source UI/API behavior for intake, canvas export visibility, artifact generation truth, client-final governance, and aVa Source answer preservation.
- `client-data-lane`: No migration or destructive data-plane change. The release changes how new event scope summaries are formatted and parsed in the existing `source_events.scope_description` field.

## Client Applicability

- All clients: Source intake, approval, artifact generation, and client-final governance behavior.
- Specific clients: Lakeshore fresh-event demo leakage is fixed by narrowing the curated Lakeshore case-study detector to the exact prepared event code only.
- Internal only: None.
- Public/demo only: None.
- Feature flag: Uses existing Source feature/runtime paths; no new feature flag.

## Changes Included

- Added shared Source intake summary helpers in `src/lib/source/intake-summary.ts`.
- Wired Source new-event chat intake to patch labeled buyer text into the five intake facts before approval.
- Extended Source event creation API to preserve value target and baseline owner as parseable scope-summary lines.
- Updated Source approval page to render scope, value target, and baseline owner from the shared parser.
- Narrowed Lakeshore case-study detection to `LAKE-SHARED-SERVICES-AMS-2026`.
- Gated Source canvas D24/CXO/deal-pack/value export links until the event has advisory/export readiness.
- Updated Source artifact generation to mark generated drafts as `drafting`, link the primary File Cabinet artifact, and return failure if registry persistence fails.
- Updated client-final upload API and UI so client-final authority requires an existing generated draft lineage.
- Preserved structured Source evidence answer text to avoid contradictory evidence/citation warnings.

## QA / Validation

- Pass: `npx eslint src/lib/source/intake-summary.ts src/components/source/SourceOriginatePage.tsx src/app/api/v1/source/events/route.ts 'src/app/(maestro)/source/events/[eventId]/approval/page.tsx' src/components/source/canvas/UniversalCanvasShell.tsx 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate/route.ts' 'src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/client-final/route.ts' src/components/source/canvas/workspace-tabs/AcceptClientFinalButton.tsx src/components/source/canvas/workspace-tabs/DocumentTab.tsx src/lib/source/nexus-api.ts src/lib/source/source-answer-engine.ts`
- Pass: `npm test -- --runTestsByPath src/__tests__/integration/source/source-originate-page.test.ts src/components/source/canvas/workspace-tabs/__tests__/DocumentTab.test.tsx src/lib/source/__tests__/client-final-artifacts.test.ts src/lib/source/__tests__/nexus-api-live-context.test.ts` (`4` suites / `30` tests). Jest reported pre-existing duplicate manual mock warnings for markdown mocks.
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pending: signed-in fresh-event buyer-journey browser proof after merge/deploy.

## Rollout Plan

Merge to `main`, build/deploy through the approved Azure Container Apps main lane, then rerun the Source recording readiness buyer journey on a fresh signed-in event.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow.
- Shared runtime mutators: Source app routes and UI components only; no manual data migration.
- Approved image digest: Pending deploy.
- ACA runtime invariant: Verify `ca-abarva-web-lab-eastus` traffic is pinned to the built image.
- Worker image invariant: Not affected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, fresh Source event buyer journey.

## Rollback Plan

Revert this PR and redeploy the prior ACA image. No migration rollback is required.

## Audit Evidence

- PR: `https://github.com/abarva-platform/abarva/pull/4416`
- Local validation commands listed above.
- Previous failing proof bundle: `/Users/anand/Downloads/source-recording-gate-001-2026-07-04T22-47-25-268Z.zip`

## Known Gaps

- Live signed-in buyer-journey proof remains pending until this candidate is deployed.
