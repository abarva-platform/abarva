# Tower V3 Intake File Aliases

## Release ID

`2026-09-18-tower-v3-intake-file-aliases`

## Status

`candidate`

## Plain-English Summary

The Tower V3 context-pack reader now opens the current spend and managed-service intake files and preserves their recorded labels, amounts, and file provenance.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1 file-read mapping to a Tower context projection. No tenant input, schema, or canonical rows change.

## Client Applicability

Shared reader for tenants with the current intake filenames. No tenant-specific exception or feature-flag change.

## Changes Included

- Replace two retired filenames with the current intake names.
- Recognize current spend-category, service-name, annual-spend, and run-cost fields while retaining older field fallbacks.

## QA / Validation

- The existing real-input reader suite failed 3/3 before the fix on a missing file. It passes 3/3 after the fix, with assertions for selected filenames and a numeric service-scope fact.
- A mutation restoring the retired spend filename must make the suite fail again.
- Scoped lint, TypeScript, release gate, and PR CI are required before merge.

## Rollout Plan

Merge after review and CI; use only the repo-owned ACA main deploy. Confirm digest and healthy traffic revision. A deployed runtime does not by itself prove the flag is enabled or that an executive claim is eligible.

## Deployment Authority

Only `.github/workflows/aca-main-deploy.yml` may change shared web traffic.

## Rollback Plan

Revert via PR and redeploy through the repo-owned workflow. No data rollback is required. The previous reader would fail on current intake filenames.

## Audit Evidence

Focused test output, mutation result, scoped checks, release gate, PR CI, and ACA digest readback. Signed-in Tower acceptance remains separate.

## Known Gaps

The reader remains flag-gated. This change does not promote planning-grade intake values to approved financial claims.
