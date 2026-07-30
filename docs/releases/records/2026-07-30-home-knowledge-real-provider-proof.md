# 2026-07-30-home-knowledge-real-provider-proof — Home Knowledge Real Provider Proof

## Release ID

`2026-07-30-home-knowledge-real-provider-proof`

## Status

`candidate`

## Plain-English Summary

The Home Knowledge product route now loads the Airline Foundation proof tenant through the governed HTTP Knowledge consumption provider instead of the synthetic fixture provider. The route resolves the approved proof user's tenant from Clerk metadata on the server and fails closed for any other signed-in identity or route scope.

## Layer Impact

Layer 4 Products: `/home/knowledge` now renders through the real consumption API path for the approved Airline Foundation proof tenant.

Control/auth seam: foundation proof-session resolution now exposes a server-only helper that can enforce route-specific metadata before activating the product route.

No Layer 1, Layer 2, or Layer 3 data is changed. No Source surface, Source loader, baseline, review decision, publication, or data-plane mutation is included.

## Client Applicability

- All clients: No.
- Specific clients: Airline Foundation proof tenant only.
- Internal only: No.
- Public/demo only: No.
- Feature flag: No feature flag change.

## Changes Included

- `/home/knowledge` resolves the proof tenant server-side and returns `notFound()` unless it is the approved Airline Foundation tenant.
- `KnowledgeAppMount` constructs `createHttpRuntime(tenantKey)` and no longer mounts `fixture-airline-demo-new`.
- Consumption API tenant resolution can fall back to signed-in foundation proof metadata when legacy tenancy is not present, while still refusing browser-supplied tenant keys.
- Home Knowledge tests and the signed-in Playwright smoke test now assert the real tenant marker and no fixture namespace.

## QA / Validation

- Pass: focused Jest coverage for foundation proof-session resolution and Home Knowledge HTTP mount behavior.
- Pass: focused ESLint on changed files.
- Pass: whitespace diff check.
- Pass: TypeScript check.
- Pass: production build.
- Pass: `npm run release:check`.
- Blocked: local signed-in Playwright smoke reached Clerk ticket sign-in and `/home/knowledge` returned 200, then local Responsible AI acknowledgment redirected to an unavailable local ledger. No bypass was used.
- Pending: signed-in browser proof after merge and repo-owned ACA deployment, with screenshots and data-quality report.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and deploys the exact merged SHA. No manual Azure command, traffic update, data load, review-decision application, baseline activation, or provider cutover is part of this PR.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None in this PR.
- Approved image digest: Resolved by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Must be verified after deployment before claiming live.
- Worker image invariant: Must be verified after deployment before claiming live.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, `/home/knowledge` with the approved Airline Foundation proof login.

## Rollback Plan

Revert this PR or roll the shared web runtime back to the previous approved ACA digest. Because this PR does not mutate data, rollback does not require baseline, publication, or schema rollback.

## Audit Evidence

- PR URL and commit SHA for this candidate.
- Jest, ESLint, TypeScript, build, and release-check output.
- ACA deploy workflow evidence after merge.
- Signed-in browser screenshots and data-quality report after deployment.

## Known Gaps

Some Home Knowledge sections are expected to remain `SOURCE_INCOMPLETE`, `not_loaded`, or otherwise withheld until the approved foundation baseline contains those projections. This PR does not authorize Knowledge promotion, publication, baseline activation, offline ingestion, Source changes, or production provider cutover.
