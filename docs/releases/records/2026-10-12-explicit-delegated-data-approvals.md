# 2026-10-12-explicit-delegated-data-approvals

## Release ID

`2026-10-12-explicit-delegated-data-approvals`

## Status

`candidate`

## Plain-English Summary

Adds an optional, explicit delegated approval record. It names the actor who actually made the
decision and retains the human authorizer separately. Exact private proof bytes and two
release-controlled trust anchors prevent an uploaded receipt from approving itself. Legacy human
approvals are unchanged. This release loads no data and selects no product version.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 3 governance: stricter exact-operation evidence binding for a new optional approval branch.
- Layer 4: no rendering changes; native operator consumers opt in with verified evidence.
- Layers 1 and 2: no intake, source content or adapter changes.

## Client Applicability

- All clients: unchanged named-human approval behavior.
- Specific clients: none selected by this release.
- Internal only: authenticated operator proof decoding and validation.
- Public/demo only: initial delegated trust is restricted to registry-declared synthetic inputs.
- Feature flag: explicit optional manifest branch; missing verified evidence fails closed.

## Changes Included

Approval actor helper, delegated schema/decoder, authority roots, certified decision trust registry,
manifest resolver integration, portable synthetic declaration helper, focused tests and CI trigger
coverage. Existing clause-provenance schema work is not replaced or incorporated.

## QA / Validation

- 13 focused governance/insight suites: 196 tests passed.
- Native load/projection/identity gates: 35 tests passed.
- Disposable Postgres 18 Home selection: two-tenant fence passed.
- Node 24 full typecheck (8 GiB), changed-file ESLint, full context/corpus validation and release
  control (11/11) passed locally.
- Home ratchet: 749/777, 12 baselined suites, no movement; no baseline rewrite.
- Exact locally retained certified authority and decision bytes pass hash verification against
  committed trust anchors. This is not proof of private Blob upload or serving.
- Current-head CI records final integration and Postgres 16 results before merge.

## Rollout Plan

PR to protected main, squash merge, repo-owned ACA main deployment. Native consumers add the
verified context explicitly in separate releases. Existing manifests do not change. No migration,
approval manifest mutation, private proof upload or product selector promotion occurs here.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: that workflow only; none in this change.
- Approved image digest: resolved from the exact merged main image by the workflow.
- ACA runtime invariant: template and 100% traffic revision must match the approved digest.
- Worker image invariant: required worker jobs must match the same approved digest.
- Feature/env flag update path: no flags or env changes.
- Live signed-in proof required: native product acceptance belongs to its consumer/promotion release.

## Rollback Plan

Revert through a PR and the same ACA workflow, or revoke a trust registry entry through a controlled
release. Existing human approvals remain valid. Previously retained decisions stay auditable, but
withdrawn delegated authority cannot authorize a new operation. No stored data needs deletion.

## Audit Evidence

Current-head PR/CI, trusted decision ID and exact byte hash, private normalized authority/decision
certification, focused mutation tests and post-deploy runtime invariant. Private source proofs and
product acceptance are reported separately; no client narrative is copied into public artifacts.

## Known Gaps

This shared contract does not upload proof files, implement product-specific reviewers, satisfy
conditional native job preflight, merge current assessments or refresh product data. No independent
human review, Finance approval or agent readiness follows from delegated authorization.
