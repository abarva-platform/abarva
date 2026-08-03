# 2026-08-03-home-ai-success-architecture-flow — Home Architecture Flow Polish

## Release ID

`2026-08-03-home-ai-success-architecture-flow`

## Status

`candidate`

## Plain-English Summary

The airline demo Home surface now shows a clearer executive current-state architecture flow before the detailed graph preview. The flow groups real snapshot records into source systems, integration, transformation, data platforms, and AI outcomes, and aggregates duplicate AI tool rows by tool name so repeated products do not appear as separate executive boxes.

## Layer Impact

Layer 4 Products: updates the Home projection only. It does not change canonical data, ingestion, database schema, tenant routing, or production data-plane jobs.

## Client Applicability

- All clients: No.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Airline demo Home command-center snapshot.
- Feature flag: None.

## Changes Included

- Added the Home architecture flow component.
- Updated the Home command-center architecture section to show the flow before the detailed graph preview.
- Changed the Intelligence explorer link to the enterprise-landscape route.
- Aggregated AI tool rows by product name, summing estimated cost and active users.
- Added responsive layout constraints for the Home command-center rail and architecture flow.

## QA / Validation

- `npx tsx -e "<Home data sanity script>"`: pass; duplicate AI tools `[]`, 5 flow stages, 24 flow boxes, blank fields `[]`.
- `npx eslint src/components/home/ai-success-command-center src/lib/home/readSkyHarborAiSuccessHome.ts --max-warnings=0`: pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`: pass.
- Local browser QA through temporary non-shipped harness: desktop and mobile architecture-section click kept the URL stable, kept scroll position at top, rendered the new flow, and showed no component-level horizontal overflow.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deployment workflow builds and deploys the new web image. No manual Azure mutation, data load, migration, feature flag, or environment-variable change is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for production rollout.
- Shared runtime mutators: None in this change.
- Approved image digest: Produced by the main deploy workflow after merge.
- ACA runtime invariant: Must be checked after deploy by the standard ACA proof process.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for the Home route after deployment.

## Rollback Plan

Revert the Home UI/data-reader commit or roll back the ACA web revision to the previous approved image. No database rollback is required.

## Audit Evidence

- Local data sanity output.
- Local TypeScript and ESLint output.
- Desktop and mobile local screenshots captured during QA.
- Future PR and ACA deployment proof once merged.

## Known Gaps

The live Home route still reads checked-in snapshot data rather than the governed Postgres Home Knowledge pack model. Converging those two narrative paths is out of scope for this UI polish release and should be handled as a separate data-governance decision.
