# 2026-08-04-source-motion-journeys - Source Motion Journeys

## Release ID

`2026-08-04-source-motion-journeys`

## Status

`candidate`

## Plain-English Summary

Source events no longer all render and advance through the same competitive-RFP journey. Events that are explicitly identified as incumbent contract optimization or renewal work now use a shorter negotiation journey: Strategy, Scope, Commercial Baseline, Negotiation Plan, Executive Decision, Agreement and Value. Competitive events keep the full RFP, Responses, Evaluation, BAFO and Selection path.

## Layer Impact

- `global-control-lane`: updates shared Source journey resolution, stage rail rendering and approval progression behavior.
- `client-data-lane`: no client data is loaded, changed or promoted.
- CLIENT INTAKE: no intake schema or upload behavior changes.
- SOURCE ADAPTERS: no adapter behavior changes.
- CANONICAL MODEL: no database schema or canonical IDs changed; persisted stage keys remain canonical Source stage keys.
- PRODUCTS: Source projects the right stage journey for competitive sourcing versus incumbent optimization.

## Client Applicability

- All clients: competitive Source events keep the existing 11-stage journey.
- Specific clients: events with renewal, renegotiation or contract-optimization signals receive the shorter negotiation journey.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds a Source journey resolver for competitive sourcing and contract optimization motions.
- Threads journey selection through the Source event route, analytics canvas, event shell rail and approval API.
- Lets approval and governance adjacency use the event journey order instead of the global RFP order.
- Adapts optimization-stage labels and sample copy so skipped RFP-specific language is not shown in a negotiation journey.
- Aligns the Source portfolio book with the same journey resolver so optimization cards show the shorter journey and labels before opening the event detail.
- Broadens the resolver to recognize commercial-renegotiation wording in event names and codes.
- Replaces the hard-coded "steps 1-9" rail helper with journey-aware guidance so optimization events do not imply an 11-stage RFP path.
- Adds focused tests for journey resolution, approval advancement, governance adjacency and shell rail rendering.

## QA / Validation

- PASS: `npx jest src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.stageFallbacks.test.tsx src/lib/source/__tests__/sourcing-motion-journeys.test.ts src/lib/source/__tests__/approval-decision.test.ts src/lib/source/__tests__/source-governance-enforcement.test.ts src/lib/source/__tests__/source-event-shell-v2.test.ts --runInBand`
- PASS: `npx eslint src/lib/source/sourcing-motion-journeys.ts src/lib/source/approval-decision.ts src/lib/source/source-governance-enforcement.ts src/lib/source/gate-advance-contract.ts 'src/app/(maestro)/source/events/[eventId]/page.tsx' 'src/app/api/v1/source/events/[eventId]/approve/route.ts' src/lib/source/source-event-shell-v2.ts src/components/source/canvas/analytics/SourceAnalyticsCanvas.tsx src/lib/source/__tests__/sourcing-motion-journeys.test.ts src/lib/source/__tests__/approval-decision.test.ts src/lib/source/__tests__/source-governance-enforcement.test.ts src/lib/source/__tests__/source-event-shell-v2.test.ts`
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`
- PASS: `npm run test:nav`
- PASS: `npm run test:behaviors`
- PASS: `npm run release:check`
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npm run build`
- PASS: signed-in Source browser proof surfaced a portfolio/detail mismatch; this follow-up record covers the correction before redeploy.
- PASS: signed-in Source browser proof after the corrected deployment showed the optimization portfolio and event detail on a 7-stage journey; the remaining rail-helper copy mismatch is corrected by this follow-up.
- Pending: repeat signed-in Source browser proof after the corrected production deployment.

## Rollout Plan

Merge through the normal PR path. The repo-owned Azure Container Apps main deploy workflow builds and deploys the web runtime after merge. No migration or manual data-plane job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned workflow only.
- Approved image digest: pending merge/deploy.
- ACA runtime invariant: must be proven after workflow deployment before claiming live status.
- Worker image invariant: no worker image change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source event route for both competitive and optimization journeys.

## Rollback Plan

Revert this PR and rerun the repo-owned web deploy workflow. No data rollback is required because this release does not change schema or mutate client data.

## Audit Evidence

- Local focused Jest, ESLint and TypeScript output.
- Signed-in production browser proof against the first deployment showed the target optimization event still rendering the generic RFP journey, which this follow-up fixes.
- Signed-in production browser proof against the second deployment showed the target optimization event rendering the right 7-stage journey but a stale rail helper still referenced the prior fixed step range, which this follow-up removes.
- Release gate output.
- PR review and merge record.
- ACA deploy workflow run after merge.
- Signed-in browser proof for a competitive event and an optimization event after deploy.

## Known Gaps

- This release does not add new canonical database stage keys; it projects motion-specific journeys using existing canonical Source stage keys.
- This release does not enrich the underlying evidence feed. Better renewal economics, benchmark and utilization evidence can improve the quality of the Commercial Baseline and Negotiation Plan in a later data-lane release.
