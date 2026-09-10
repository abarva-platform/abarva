# 2026-09-09-source-vendor-pack-quality-semantics — Source Vendor-Pack Quality Semantics

## Release ID

`2026-09-09-source-vendor-pack-quality-semantics`

## Status

`candidate`

## Plain-English Summary

Source deterministic document QA now evaluates vendor-facing solicitation packs as instructions to
suppliers rather than as executive decision memos. Their opening must state the solicitation purpose
and response direction, their close must carry a submission or certification control, and ordinary
security language no longer trips an infrastructure-jargon rule. Exhibit matching also tolerates
normal punctuation such as `Current-State` versus `Current State`.

## Layer Impact

- `global-control-lane`: Layer 4 Source artifact-quality assessment and display semantics change.
- Layers 1-3: No intake, adapter, canonical-record, schema, or tenant-data mutation.

## Client Applicability

- All clients: Yes, when a Source artifact uses the `vendor-pack` reader mode.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Apply solicitation-purpose and response-direction checks to vendor-pack openings.
- Apply submission, deadline, acknowledgement, or certification checks to vendor-pack closings.
- Exempt instructional vendor tables from executive exhibit-interpretation language.
- Replace ambiguous single-word infrastructure bans with explicit vector/embedding infrastructure
  phrases.
- Normalize punctuation and whitespace before checking required exhibit names.
- Restore the lifecycle summary test to the current six-artifact consulting-gate contract.

## QA / Validation

- Focused documentation-standard and artifact-lifecycle tests: PASS, 51 tests.
- Scoped ESLint: PASS.
- Git diff whitespace validation: PASS.
- Live signed-in proof required after deployment against an accepted vendor-facing RFP.

## Rollout Plan

Merge through a protected pull request. The repository-owned ACA main deploy workflow builds and
deploys the exact merge SHA, verifies the digest-pinned runtime invariant, and shifts shared traffic.
Then refresh the Source artifact lifecycle view and verify the deterministic content assessment no
longer reports executive-decision or punctuation false failures.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: The repo-owned main deploy workflow only.
- Approved image digest: Recorded by the deploy workflow.
- ACA runtime invariant: Web template, active revision, and worker images must match the approved
  digest.
- Worker image invariant: Required.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash merge through a new pull request and redeploy through the repository-owned ACA
workflow. No data rollback is required.

## Audit Evidence

- Pull request, merge SHA, focused test output, ACA deployment run, runtime invariant output, and
  signed-in Source artifact-quality readback.

## Known Gaps

- Consulting-grade model review and deterministic document QA remain separate controls. A pass in
  one does not erase a genuine finding from the other.
