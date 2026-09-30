# 2026-09-30-home-source-reference-lineage - Home source-reference lineage

## Release ID

`2026-09-30-home-source-reference-lineage`

## Status

`candidate`

## Plain-English Summary

Home now carries source-row references from the served record into its fact browser and evidence labels. A fact with no admitted source link is identified as unmapped rather than described as source-backed. The context version records a source-set hash only when all citable served rows have admitted source links.

## Layer Impact

- `global-control-lane`: shared Home reader and presentation behavior changes for all tenants using the served Home projection.
- Source adapters and canonical model are unchanged. This release reads existing serving metadata and does not write tenant data.

## Client Applicability

- All clients: Home served-projection readers.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Home availability controls only; no new flag.

## Changes Included

- Select source hash, source references, object ID, and admission status from existing Home serving views.
- Carry admitted source references into deterministic context facts and the record browser.
- Keep unmapped or refused rows explicitly unverified in evidence labels and context coherence.
- Add reader, rendering, and filtering regression tests.

## QA / Validation

- Focused Home tests: 44 suites, 509 tests passed before final release packaging.
- Typecheck and touched-file lint passed before final release packaging.
- Final CI and signed-in browser proof are required before the release is called live-proven.

## Rollout Plan

Squash merge a reviewed PR to main. Deploy only through the repository-owned ACA main workflow. No migration or data build is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Record from the completed deploy.
- ACA runtime invariant: Verify template image and 100% traffic revision match the approved digest.
- Worker image invariant: Verify required worker jobs match the approved digest.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, including record source and evidence-state behavior.

## Rollback Plan

Revert this PR through a new reviewed PR and deploy the resulting main image through the ACA main workflow. No tenant data rollback is required.

## Audit Evidence

PR, CI, deploy run, digest invariant, and signed-in browser evidence will be linked in the private completion ledger after rollout.

## Known Gaps

This does not regenerate stored chapter narrative or assert that a resolved context ID alone is a governed source citation. Full source-to-claim coherence remains gated on published claims whose packet hash and source links match the served record.
