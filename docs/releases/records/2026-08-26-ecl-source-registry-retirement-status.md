# 2026-08-26-ecl-source-registry-retirement-status — ECL Source Registry Retirement Status

## Release ID

`2026-08-26-ecl-source-registry-retirement-status`

## Status

`candidate`

## Plain-English Summary

Records the governed cleanup proof that the legacy source registry schema is already absent in the lab data plane, with no active code references and no outside database dependencies. The four-lane ECL completion status now counts that proven absence as cleanup progress instead of leaving it invisible.

## Layer Impact

`client-data-lane` status/proof reporting only. The change updates ECL completion tracking and the status generator. It does not mutate the database, drop objects, change product routing, or alter tenant data.

## Client Applicability

- All clients: No direct product behavior change.
- Specific clients: None.
- Internal only: ECL cleanup tracking and operator proof reporting.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- Adds a compact cleanup proof artifact under `docs/architecture/`.
- Extends `scripts/ecl/write_ecl_four_lane_completion_status.mjs` to accept cleanup proof and count live-absent retired schemas.
- Updates `docs/architecture/ecl-four-lane-completion-status.json` from `25/851` to `34/851` for L-CLEANUP.
- Extends the four-lane status test to require the cleanup proof input and schema credit.

## QA / Validation

Current candidate validation:

- PASS — `ECL_RECONCILE_REF=HEAD node scripts/ecl/__tests__/run-ecl-four-lane-status-tests.mjs`
- PASS — `npm run ops:aca-job -- --self-test`
- PASS — targeted wrapper unit tests: 11/11 passing
- PASS — workflow static assertions
- PASS — `git diff --check`
- PENDING — `npm run release:check -- --base origin/main --head HEAD`

## Rollout Plan

Merge to `main` through PR. This is a tracking/proof update only. No Azure apply job is required because the live dry-run proof shows the schema is already absent.

## Deployment Authority

- Repo-owned deploy workflow: No web deploy required.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not applicable for this tracking-only update.
- ACA runtime invariant: Not applicable.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: No.

## Rollback Plan

Revert the PR to return the cleanup lane to the prior committed status.

## Audit Evidence

- GitHub workflow run `33020651518`.
- `docs/architecture/ecl-source-registry-retirement-proof-2026-08-26.json`.
- `docs/architecture/ecl-four-lane-completion-status.json`.

## Known Gaps

L-CLEANUP remains pending. Only the source registry tranche is credited by this proof; the remaining legacy data-plane assets still require classify-before-drop dry-runs or explicit retention records.
