# 2026-09-08 Source Active Performance and aVa Grounding

## Release ID

`2026-09-08-source-active-performance-ava-grounding`

## Status

`candidate`

## Plain-English Summary

Contract 360 performance detail now reads only observations that belong to the active governed performance projection. Contract-specific aVa answers also state the loaded annual value, actual spend, scope coverage, active performance coverage, candidate opportunity total, evidence presence, and finance-confirmation boundary directly instead of leaving those facts only in supporting metadata.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 Products: Source Contract 360 read behavior and Source aVa answer composition.
- Layers 1-3: No intake, adapter, canonical-data, calculation, schema, or tenant-record changes.

## Client Applicability

- All clients: Yes, when a contract has versioned performance observations and governed Source opportunities.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Filter raw performance-detail fields through the active `consumption.sourcing_performance_v1` observation set.
- Add active performance and document-extraction counts to the selected contract context.
- State contract values, coverage counts, candidate totals, evidence presence, and finance gates in deterministic Source aVa prose.
- Normalize next-action punctuation in deterministic answers.
- Add focused read-adapter and aVa answer-contract tests.

## QA / Validation

- Source read-adapter and aVa answer tests: PASS, 19 tests.
- Scoped ESLint: PASS.
- TypeScript no-emit check: PASS.
- Release check: Pending before PR publication.
- Signed-in product proof: Pending deployment.

## Rollout Plan

Merge through the protected PR lane and deploy the exact main SHA through the repo-owned ACA workflow. Verify the ACA runtime image invariant, then open a contract with versioned performance data and confirm the visible count matches the active projection. Ask a contract-specific aVa question and confirm the direct answer states the loaded contract metrics and preserves the candidate-versus-realized boundary.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Recorded by the deploy workflow.
- ACA runtime invariant: Template, active revision, and 100% traffic image must match the workflow-approved digest.
- Worker image invariant: No worker change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert the squash merge through a new PR and redeploy that main SHA. No data rollback is required because this release changes only Layer 4 reads and deterministic answer composition.

## Audit Evidence

- PR URL, merge SHA, CI run, and ACA deploy run after publication.
- Focused read-adapter and Source aVa tests.
- Signed-in Contract 360 performance and Source aVa proof after deployment.

## Known Gaps

This release does not change document extraction or document-list rendering. Document evidence remains subject to its existing governed ingestion and citation path.
