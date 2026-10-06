# Quarantine Covers For Restored Suites

## Release ID

`2026-09-20-quarantine-covers-restored-suites`

## Status

`candidate`

## Plain-English Summary

Four restored integration suites now declare the shared QA module they import. This repairs a required check on current main without hiding, clearing, or weakening any quarantined suite.

## Layer Impact

- Release lane: `internal-admin`.
- Layers 1-4: no client intake, adapter, canonical model, or product behavior changes.
- QA governance: four quarantine cover declarations now match the imports measured from the tree.

## Client Applicability

- All clients: No runtime product change.
- Specific clients: None.
- Internal only: Yes, repository quality controls receive the change.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Classify `src/lib/qa/path-disposition.ts` as `kept-other-importer` for four restored Intelligence integration suites.
- Place items `T-600` and `T-601` on the structure-only platform track so both in-flight repairs remain visible regardless of merge order.
- Do not clear a quarantine entry, change the ceiling, or edit product code.

## QA / Validation

- PASS: the real Intelligence integration quarantine check, including its behavioral classifier suite.
- PASS: removing each new declaration independently recreates the named failure.
- PASS: focused JSON parsing, release control, and diff hygiene.
- Pending before merge: pull-request checks.

## Rollout Plan

Squash-merge through the normal pull-request lane. The repository-owned ACA workflow may rebuild the unchanged application image after merge. No migration, data build, or feature flag is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` may run after merge.
- Shared runtime mutators: None in this change.
- Approved image digest: Record if the normal main deploy runs.
- ACA runtime invariant: Read-only verification only.
- Worker image invariant: Read-only verification only.
- Feature/env flag update path: None.
- Live signed-in proof required: No; no product route changes.

## Rollback Plan

Revert the pull request. The required quarantine gate will again name the missing declarations.

## Audit Evidence

- Item `T-601`.
- `npm run check:intelligence-integration-quarantine` output.
- Pull request, CI checks, merge SHA, and read-only deployment evidence.

## Known Gaps

The four suites remain quarantined for their separately recorded retired-surface assertions. This release only restores truthful import classification.
