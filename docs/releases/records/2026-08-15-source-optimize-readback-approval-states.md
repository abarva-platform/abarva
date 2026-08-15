# 2026-08-15-source-optimize-readback-approval-states — Source Optimize Readback Approval States

## Release ID

`2026-08-15-source-optimize-readback-approval-states`

## Status

`candidate`

## Plain-English Summary

Source Optimize operator readback now reports approval request counts by both
approval type and approval state. This lets the proof bundle distinguish a
pending Finance/Tower confirmation request from an approved one, instead of
showing only that the request exists.

No product calculation changes. No data writes. This is a proof-quality
improvement for the read-only operator command.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3 Canonical Model: no schema or data mutation.
- Operator/readback: extends the read-only Source optimization spine readback
  event with approval-state counts.
- Products: no direct UI change.

## Client Applicability

- All clients: yes, for tenants using the shared Source Optimize workflow.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/source/readback-contract-optimization-spine.ts`

## QA / Validation

- Required before merge: ESLint for the changed readback script.
- Required before merge: TypeScript compile.
- Required before merge: release-control check.
- Required after deploy: repo-owned ACA deploy workflow completes.
- Required after deploy: ACA runtime invariant passes for web and worker images.
- Required before claiming data proof: private ACA operator readback emits
  `approval_request_counts_by_type_and_state` and
  `finance_value_confirmation_request_counts_by_state`.

## Rollout Plan

Merge through the protected pull-request lane. The repo-owned Azure Container
Apps main deploy workflow builds and deploys the resulting image. After the
runtime invariant passes, run the private ACA operator readback command and
capture the proof bundle.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the deploy workflow after merge.
- ACA runtime invariant: required before claiming live.
- Worker image invariant: required before claiming live.
- Mutating data job: not applicable; this is read-only.

## Rollback Plan

Revert the merge commit to return the readback event to type-only approval
request counts. No data rollback is required.

## Audit Evidence

- Pull request URL after publication.
- GitHub Actions deploy run after merge.
- ACA runtime-invariant readback after deploy.
- Private ACA operator readback proof bundle after deploy.

## Known Gaps

This release does not create or approve Finance/Tower confirmation requests.
It only improves proof output for the current state.
