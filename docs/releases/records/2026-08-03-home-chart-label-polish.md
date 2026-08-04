# 2026-08-03-home-chart-label-polish — Home Chart Label Polish

## Release ID

`2026-08-03-home-chart-label-polish`

## Status

`candidate`

## Plain-English Summary

This release fixes chart-label polish issues in the airline demo Home surface. It prevents the value funnel labels from escaping or being squeezed inside narrow funnel stages, tightens the AI use-case matrix marker labels, and shortens observation coverage axis labels so the charts stay readable on desktop and mobile.

## Layer Impact

Layer 4 Products: updates Home presentation only. It does not change source data, canonical data, tenant routing, schema, migrations, data ingestion, or data-plane jobs.

## Client Applicability

- All clients: No.
- Specific clients: None.
- Internal only: No.
- Public/demo only: Airline demo Home command-center snapshot.
- Feature flag: None.

## Changes Included

- Replaced inline value-funnel labels with a compact wrapping stage legend.
- Increased Recharts/SVG scatter marker sizing and reduced marker-label font size so short codes fit inside the bubbles.
- Abbreviated observation coverage x-axis labels to avoid mobile text overrun.

## QA / Validation

- `npx eslint src/components/home/ai-success-command-center --max-warnings=0`: pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`: pass.
- Local browser QA through temporary non-shipped harness: desktop and mobile Value and Use Cases views had `scrollX=0`, no horizontal overflow, no escaped Recharts text, and no claim-funnel legend overflow.
- Local screenshots captured:
  - `/Users/anand/Downloads/home-polish-value-final-desktop-20260803.png`
  - `/Users/anand/Downloads/home-polish-value-final-mobile-20260803.png`
  - `/Users/anand/Downloads/home-polish-usecases-labels-desktop-20260803.png`
  - `/Users/anand/Downloads/home-polish-usecases-labels-mobile-20260803.png`

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

Revert the Home chart-label polish commit or roll back the ACA web revision to the previous approved image. No database rollback is required.

## Audit Evidence

- Local TypeScript and ESLint output.
- Local desktop and mobile browser screenshots captured during QA.
- Future PR and ACA deployment proof once merged.

## Known Gaps

This is a presentation polish fix only. It does not address the separate Home narrative source-of-truth question between checked-in snapshots and governed Postgres narrative tables.
