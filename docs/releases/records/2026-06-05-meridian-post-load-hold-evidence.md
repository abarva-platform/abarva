# 2026-06-05-meridian-post-load-hold-evidence — Meridian/PHS Post-Load Evidence Package

## Release ID

`2026-06-05-meridian-post-load-hold-evidence`

## Status

`candidate`

## Plain-English Summary

This release records the live Meridian/PHS Admin loader evidence after the production reload attempt. It preserves screenshots, API results, and the readiness report showing validate-only passed while stage-and-process remains blocked by Azure Blob write authorization.

## Layer Impact

- `client-data-lane`: Documents the Meridian/PHS live load state and Azure RBAC blocker.
- `internal-admin`: Provides audit evidence for Admin bulk upload validation and failed Blob staging.
- Runtime behavior: None.

## Client Applicability

- Meridian/PHS only.
- No Lakeshore, SkyHarbor, Apex, or other tenant behavior is changed.
- Public/demo only: No.
- Feature flag: No.

## Changes Included

- Adds screenshot/API evidence under `docs/build/meridian-demo-walkthrough/post-load-2026-06-05T19-50/`.
- Adds `MERIDIAN_POST_LOAD_READINESS_REPORT_2026-06-05.md` with a HOLD recommendation.
- Records exact next fixes for Azure Blob RBAC/secret correction before rerunning live stage/process.

## QA / Validation

- PASS: Evidence captured live against `https://app.abarva.ai` after production deployment `dpl_GfVZVSZzuDnb8P19qJ3UgQSkzc9W`.
- PASS: Validate-only accepted 26 Meridian/PHS files.
- PASS: Stage/process failure captured with safe Azure error detail: `code=AuthorizationFailure;status=403`.
- PASS: `npm run release:check -- --base origin/main --head HEAD` after adding this release record.
- NOT RUN: Runtime tests; docs/evidence only.

## Rollout Plan

Merge to `main` as audit evidence. No production deployment is required for this docs-only evidence package.

## Rollback Plan

Revert the evidence PR if a newer successful reload report supersedes it and the team wants to remove the HOLD packet.

## Audit Evidence

- `docs/build/meridian-demo-walkthrough/post-load-2026-06-05T19-50/manifest.json`
- `docs/build/meridian-demo-walkthrough/post-load-2026-06-05T19-50/02-validate-only-result.json`
- `docs/build/meridian-demo-walkthrough/post-load-2026-06-05T19-50/03-stage-and-process-result.json`
- `docs/build/meridian-phs-demo/MERIDIAN_POST_LOAD_READINESS_REPORT_2026-06-05.md`

## Known Gaps

The live reset/reload remains blocked until Azure Blob write authorization is corrected for the production runtime credential.
