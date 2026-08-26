# 2026-08-26-ecl-retired-code-reference-manifest — Retired Reference Gate Separates Active Code From Historical Scripts

## Release ID

`2026-08-26-ecl-retired-code-reference-manifest`

## Status

`candidate`

## Plain-English Summary

The retired-layer purge operator now distinguishes active code references from references that are
explicitly declared as historical, pre-ECL script residue. Active references still block physical
retirement. Declared-retired references remain visible in the proof bundle with their file, line,
disposition, and ECL replacement path.

## Layer Impact

Layer 2 and Layer 4 operator proofing only. This does not change product reads, serving views,
canonical ECL data, or Azure data-plane rows by itself.

## Client Applicability

- All clients: No product behavior change.
- Specific clients: None.
- Internal only: Retired-layer dry-run/apply operators.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `scripts/ops/purge-retired-data-layers.mjs`: adds a retired code-reference manifest, classifies
  code references as active or declared-retired, and keeps apply blocked by active references.
- `docs/architecture/ecl-retired-code-reference-manifest.json`: declares the first pre-ECL
  source-registry script references as historical residue with ECL replacement paths.

## QA / Validation

- PASS: `node scripts/ops/purge-retired-data-layers.mjs --self-test`
- PASS: `npx eslint scripts/ops/purge-retired-data-layers.mjs`

## Rollout Plan

Merge to main, then deploy through the repo-owned Azure Container Apps main deploy workflow before
using the updated operator image for retirement dry-runs or applies.

## Deployment Authority

- Repo-owned deploy workflow: Required before ACA operator use.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by main deploy workflow after merge.
- ACA runtime invariant: Required after deploy before operator use.
- Worker image invariant: Operator job image must match the approved digest when run.
- Feature/env flag update path: None.
- Live signed-in proof required: No.

## Rollback Plan

Revert this PR. Existing retirement operator behavior resumes and treats all matching code
references as active blockers.

## Audit Evidence

- PR URL: to be added by GitHub.
- Local validation: commands listed above.
- ACA proof: to be captured after merge/deploy when the next dry-run uses this image.

## Known Gaps

This release only classifies the first source-registry script residue. Runtime product references
and other pre-ECL schemas remain blocking until separately bridged, retired, or proven inactive.
