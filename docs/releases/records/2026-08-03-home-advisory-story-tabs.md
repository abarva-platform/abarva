# 2026-08-03-home-advisory-story-tabs — Home Advisory Story Tabs

## Release ID

`2026-08-03-home-advisory-story-tabs`

## Status

`candidate`

## Plain-English Summary

The airline demo Home advisory perspective now reads as a guided executive story instead of a single prose block. It adds top-level advisory tabs for thesis, current work, use cases, proof gap, decisions, and validation, and adds a Recharts/SVG value-priority matrix that frames where the first dollar should go across airline AI use cases.

## Layer Impact

Layer 4 Products: updates the Home projection only. It does not change intake data, source adapters, canonical objects, database schema, migrations, tenant routing, or data-plane jobs.

## Client Applicability

- All clients: No.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Airline demo Home command-center snapshot.
- Feature flag: None.

## Changes Included

- Added advisory story-tab data to the Home AI success snapshot reader.
- Replaced the advisory-perspective body with tabbed executive sections.
- Added a Recharts/SVG value-priority matrix for airline AI use cases, including developer productivity and HR/service-agent examples.
- Tightened Home canvas scroll behavior so tab and rail clicks replace content and return the page to the top.
- Improved mobile density for the Home advisory surface so the value matrix appears in the first viewport.

## QA / Validation

- `npx eslint src/components/home/ai-success-command-center src/lib/home/readSkyHarborAiSuccessHome.ts --max-warnings=0`: pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`: pass.
- Local browser QA through temporary non-shipped harness: desktop and mobile Use Cases tab rendered an SVG matrix, kept `scrollX=0`, kept `scrollY=0` after tab clicks, and had no horizontal overflow.
- Local browser QA verified tab content replacement by switching from Use Cases to Proof Gap and confirming the Proof Gap panel text rendered without URL/hash navigation.
- Desktop screenshot: `/Users/anand/Downloads/home-advisory-story-tabs-polished-desktop-20260803.png`.
- Mobile screenshot: `/Users/anand/Downloads/home-advisory-story-tabs-polished-mobile-20260803.png`.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deployment workflow builds and deploys the new web image. No manual Azure mutation, database migration, data load, feature flag, or environment-variable change is required.

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

- Local TypeScript and ESLint output.
- Local desktop and mobile browser screenshots captured during QA.
- Future PR and ACA deployment proof once merged.

## Known Gaps

The live Home route still reads checked-in snapshot data rather than the governed Postgres Home Knowledge pack model. Converging the narrative tables and the live Home snapshot path is out of scope for this UI release and remains a separate data-governance decision.
