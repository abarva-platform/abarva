# 2026-09-14 — Source contract population reconciliation

## Release ID

`2026-09-14-source-contract-population-reconciliation`

## Status

`candidate`

## Plain-English Summary

Source now keeps the governed contract book, supplemental evidence records, and
action records as distinct populations. Spend or candidate amounts from a
supplemental record are no longer presented as annual contract value, and
portfolio annual value is calculated from the governed contract book only.

## Layer Impact

- **Products:** Source portfolio Contract, Coverage, and value surfaces use the
  reconciled population/read-model helpers in the `global-control-lane`.
- **Source adapters:** No adapter change.
- **Canonical model:** No schema change and no data mutation.
- **Client intake:** No change.

## Client Applicability

- All clients using the Source workspace read path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Added a shared population count for register, evidence, and action contract
  records.
- Added a contract-book annual-value helper that refuses evidence spend and
  action candidate amounts as substitutes.
- Kept supplemental evidence records searchable while excluding them from
  annual-value archetype totals.
- Updated Contract 360 depth copy to name the contract-book and evidence
  populations separately.
- Clarified the Contract 360 remainder copy so mixed contract records are not
  mislabeled as registry-only rows, and summarized dollars remain explicitly
  scoped to contract-book value.
- Added regression coverage for population arithmetic and value-source
  separation.

## QA / Validation

- Focused Jest suite: 3 suites, 60 tests passed.
- ESLint passed for all changed source and test files.
- TypeScript passed with the repository typecheck command.
- `git diff --check` passed.
- Follow-up wording regression: focused Contract 360 performance suite, 49
  tests passed.
- Live signed-in proof is required after ACA deployment for Command, Coverage,
  and Contracts surfaces.

## Rollout Plan

Merge the PR to `main`. The repo-owned ACA main deploy workflow builds a
digest-pinned image, deploys the new revision, assigns 100% traffic, and runs
the required runtime checks. No data-build job or migration is part of this
release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: The repo-owned ACA deploy workflow only.
- Approved image digest: Recorded by the deployment workflow after merge.
- ACA runtime invariant: Template image, 100% traffic revision image, and
  required worker images must match the approved digest.
- Worker image invariant: No worker image change.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source portfolio population and value
  surfaces.

## Rollback Plan

Reassign traffic to the previous verified digest through the repo-owned ACA
deployment lane. No database rollback is required.

## Audit Evidence

- Pull request and CI checks.
- Release workflow run and digest-pinned ACA runtime invariant.
- Signed-in Source workspace smoke output for Command, Coverage, and Contracts.
- Focused Jest, ESLint, TypeScript, and diff checks listed above.

## Known Gaps

This release reconciles the read path and display denominators; it does not
reload or reclassify the underlying contract populations. A data-plane refresh
and authoritative identity mapping remain separate operator work.
