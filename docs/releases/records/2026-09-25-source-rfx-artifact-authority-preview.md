# 2026-09-25 Source RFx Artifact Authority Preview

## Release ID

`2026-09-25-source-rfx-artifact-authority-preview`

## Status

`candidate`

## Plain-English Summary

The read-only RFx preparation preview now checks that each proposed package artifact resolves to a current record for the same tenant and event with the same SHA-256. Missing, retired, deleted, cross-event, and changed-byte records fail the comparison. This does not release a package or contact a supplier.

## Layer Impact

- Release lane: `client-data-lane` because the read checks tenant-scoped artifact metadata.
- Layer 3: read-only lookup of existing Source artifact records; no schema or row change.
- Layer 4: the internal preparation preview adds generic failure codes. No product route changes.

## Client Applicability

- All clients: the preview applies when their existing artifact registry is available.
- Specific clients: none.
- Internal only: yes. No external route or transmission.
- Feature flag: none.

## Changes Included

- Resolve proposed artifact IDs under the declared tenant and event, comparing current lifecycle and stored SHA-256 with the proposed frozen package.
- Distinguish an empty match from an unavailable read and fail closed on inconsistent returned rows.
- Preserve `governedReleaseReady: false` and `issued: false` for every result.

## QA / Validation

- Pass: red-first preview tests failed on missing, cross-tenant, cross-event, retired, deleted, and hash-changed artifacts before implementation; 22 focused tests passed after it.
- Pass: removing the SHA-256 comparison made the changed-bytes case fail; restoring it returned the test to green.
- Pass: TypeScript typecheck.
- Pass: six focused RFx suites (63 tests), targeted ESLint, library orphan audit, CI coverage census check, and release control gate.
- Not run: tenant row readback, governed release, or supplier delivery; these require separate gates and authority.

## Rollout Plan

Merge through a reviewed PR; only the repo-owned ACA main workflow may deploy shared runtime changes. No migration, data build, tenant write, invitation, or supplier contact is included.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside that workflow.
- Approved digest: determined and checked after merge.
- Runtime invariant: template, sole 100%-traffic revision, and required workers match the approved digest.
- Feature/env change: none.
- Signed-in acceptance: frozen Scope replay is a separate check.

## Rollback Plan

Revert the read-only code through a PR. No database rollback or deletion is needed.

## Audit Evidence

The focused test run, mutation result, PR, CI, and deployment evidence are recorded separately.

## Known Gaps

- Artifact identity and hash consistency do not prove malware clearance, disclosure approval, final release authorization, issuance, or delivery receipts. The preview remains non-issuable.
- No source artifact rows or package versions have been read back for the frozen event.
- The governed Scope gate still requires genuine sponsor and review evidence.
