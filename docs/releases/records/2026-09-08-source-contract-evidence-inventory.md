# 2026-09-08-source-contract-evidence-inventory - Source Contract Evidence Inventory

## Release ID

`2026-09-08-source-contract-evidence-inventory`

## Status

`candidate`

## Plain-English Summary

The contract detail surface now reads the governed document inventory for the selected contract and presents a compact evidence summary. Documents with extracted facts are ranked ahead of the remaining inventory, which stays counted without creating a long audit page.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3: read-only access to the existing `doc.file` and `doc.extraction` evidence substrate.
- Layer 4: Contract 360 Evidence presents governed file, page, extraction, document-type, and authenticity states.
- No schema change and no new data mutation are introduced by this release.

## Client Applicability

- All clients: Yes, where governed contract document evidence is present.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source workspace route.

## Changes Included

- Contract document inventory reader and typed view-model field.
- Contract detail API composition.
- Compact Evidence-tab document summary and responsive table.
- Focused view-model regression coverage.

## QA / Validation

- `pass` - focused contract detail view tests.
- `pass` - workspace component tests.
- `pass` - scoped ESLint and full TypeScript validation.
- `pass` - release control gate after this record passes disclosure validation.
- `not-run` - post-deploy signed-in evidence-tab proof; required after rollout.

## Rollout Plan

Merge through a pull request and deploy through the repo-owned ACA main workflow. Verify the selected contract's governed document counts and evidence table in the authenticated Source workspace.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None.
- ACA runtime invariant: Required.
- Live signed-in proof required: Yes.

## Rollback Plan

Redeploy the prior approved image digest. The evidence data remains unchanged because this release is read-only.

## Audit Evidence

- PR, deployment run, runtime-invariant bundle, and signed-in proof to be recorded after rollout.

## Known Gaps

The compact view summarizes source files and extracted facts; opening original binary documents remains governed by the separate file-access workflow.
