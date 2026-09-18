# Manifest Web Operator Boundary

## Release ID

`2026-09-18-manifest-web-operator-boundary`

## Status

`candidate`

## Plain-English Summary

The admin manifest web endpoint now requires tenant-admin authority for validation and refuses mutating loads. Operator data builds must use the governed ACA Job lane.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 1/2 intake control only. No schema, canonical, or product projection changes.

## Client Applicability

All tenants using the shared admin manifest endpoint. No feature flag or tenant exception.

## Changes Included

- Verify the authenticated Clerk user has tenant-admin rights for the active tenant before reading a manifest.
- Return `manifest_load_aca_job_required` for any request other than an explicit dry run, before file, Blob, or DB access.
- Keep the existing requested/manifest tenant-key comparison and declared-entry behavior.

## QA / Validation

- Focused handler tests: 4 passed / 2 failed before this change; 7 passed after. They cover non-admin refusal, missing Clerk identity, web-mutation refusal, same-tenant validation, and opposite-tenant manifests.
- Scoped ESLint and TypeScript passed. Disabling the ACA-Job gate makes the web-mutation test fail; the guard was restored. Release gate and PR CI remain pending.

## Rollout Plan

Merge only after review and CI. The repo-owned ACA main deploy workflow promotes the change. Check template/traffic/worker digest invariants, health, and a signed-in authorized dry run. No tenant-data build is part of this release.

## Deployment Authority

Only `.github/workflows/aca-main-deploy.yml` may change shared runtime traffic. No manual ACA update is authorized.

## Rollback Plan

Revert via PR and redeploy through the repo-owned workflow. No tenant-data rollback is required. A rollback would restore a web mutation path, so the operator should prefer a corrected forward release.

## Audit Evidence

Focused route tests, mutation check, TypeScript, release gate, and PR CI. No signed-in or data-plane proof is claimed in this candidate.

## Known Gaps

The existing web route still contains unreachable mutating branches after the dry-run gate. Removing them and defining an ACA Job command for this manifest loader are follow-up work. The gate does not certify an ACA Job contract by itself.
