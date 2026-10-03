# 2026-09-28 Source artifact quality receipt projection

## Release ID

`2026-09-28-source-artifact-quality-receipt-projection`

## Status

`candidate`

## Plain-English Summary

The Source Files read model now carries a persisted generation-quality receipt alongside its matching draft body. A receipt for a different body is not presented as the current draft's review result.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source Files artifact lifecycle read model.
- Layer 3 Canonical Model: read-only projection of existing artifact state; no canonical fact, schema, approval, or event-state write.

## Client Applicability

- All clients: Source events with generated artifact bodies and persisted generation metadata.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Preserve the persisted quality receipt for a registry-backed draft when its body matches the authored state.
- Preserve the receipt when the authored state supplies a missing registry body or a state-only draft.
- Do not attach a receipt when the registry and authored-state bodies differ, or invent one when metadata is absent.

## QA / Validation

- Pass: red-first tests reproduced missing receipt projection across registry-backed and state-only drafts.
- Pass: negative tests cover mismatched body and missing metadata.
- Pass: deliberate mutations removed missing-body receipt mapping and mismatched-body protection; each failed its targeted test and was restored.
- Not run: PR CI, runtime readback, and signed-in Files review; required before live claims.

## Rollout Plan

Squash merge after local validation, applicable CI, and review. Deploy only through the repo-owned ACA main workflow. Verify the digest-pinned web and worker runtimes, then inspect the Files audit matrix signed in.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: None outside that workflow.
- Approved image digest: Resolve from the successful main workflow.
- ACA runtime invariant: Verify digest-pinned template and 100%-traffic revision.
- Worker image invariant: Verify both required workers match the approved digest.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert through a reviewed PR and the same main deploy workflow. No migration or data rollback is required.

## Audit Evidence

PR, applicable CI, official deploy, runtime readback, and signed-in read-model review are tracked in the private execution ledger.

## Known Gaps

This change projects an existing quality receipt; it does not create or rerun a review. A draft without a persisted receipt remains `Not run`. A receipt does not approve a draft or advance a stage gate.
