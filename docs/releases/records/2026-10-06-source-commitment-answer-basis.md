# 2026-10-06 Source commitment answer basis

## Release ID

`2026-10-06-source-commitment-answer-basis`

## Status

`candidate`

## Plain-English Summary

Source aVa now reads the same stated full-term commitment field that the contract page displays. When an extracted value conflicts, the answer identifies the unresolved conflict instead of silently substituting the extracted amount. Annual committed spend and full-term committed value retain separate names and metrics.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 / Products: Source answer context and its presentation change for governed contract reads.
- Layers 1–3: No intake, adapter, canonical record, or tenant data changes.

## Client Applicability

- All clients: Source users asking aVa about a contract with governed Contract 360 data.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- The server-authorized Source contract answer context uses the stated `total_committed_value` field and carries its conflict flag.
- The structured Source answer names an unresolved full-term commitment conflict in its direct answer.
- Route and answer tests cover a conflicting extraction value and a missing stated value.

## QA / Validation

- Source aVa directory: 26 suites, 403 tests passed.
- Intelligence Ask route directory: 5 suites, 55 tests passed.
- Full TypeScript check with an 8 GB heap and scoped ESLint passed.
- Two behavioral mutations failed focused tests: substituting a resolved extraction for the stated value, and removing the unresolved-conflict wording. Both were restored.
- Release and repository audit gates are recorded with the PR before merge. CI and signed-in proof remain pending.

## Rollout Plan

Merge by reviewed PR. The repo-owned ACA main deploy workflow builds the merged SHA and deploys a digest-pinned image. Capture the runtime digest invariant, then perform signed-in Source answer and page parity checks in the operator acceptance lane.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: None in this change.
- Approved image digest: Pending deployment.
- ACA runtime invariant: Pending deployment.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes; not performed in this code lane.

## Rollback Plan

Revert this read-only change through a PR and deploy the revert with the repo-owned ACA workflow. No tenant records or schema need rollback.

## Audit Evidence

- PR and CI links, focused test output, typecheck, lint, mutation results, and release checks are recorded with the release candidate.
- Deployment and signed-in evidence: Pending.

## Known Gaps

- This does not reconcile conflicting source values or certify which value is finance confirmed.
- The separate annual-value read-path split and financial-exposure projection fallbacks require their own provenance and period checks. This slice does not repair those records or change projection jobs.
- Signed-in parity across Story, Economics, Optimize, aVa, and exports remains unverified.
