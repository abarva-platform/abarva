# 2026-09-15-source-contract-content-projection-truth

## Release ID

`2026-09-15-source-contract-content-projection-truth`

## Status

`candidate`

## Plain-English Summary

This release aligns the Source Contract 360 content model with the governed data that the
contract-content design expects. Contract archetype identity is read from the canonical contract
payload, evidence counts follow the active package, and Optimize only shows a monetary amount when
an approved sizing claim has a supported calculation or benchmark and resolvable evidence. Exact
contract grounding also takes precedence over portfolio and sourcing-event context in aVa. Source
workspace reads with an explicit, authorized client key no longer depend on a second active-client
lookup before loading the portfolio or contract detail.

## Layer Impact

- **Release lane:** `client-data-lane` for the governed Source projection and loader behavior;
  `global-control-lane` for the shared read-path code.
- **Layer 2 source adapters:** loader evidence references are counted as supported only when they
  resolve to a source-record snapshot in the same tenant and dataset version.
- **Layer 3 canonical model:** no new tenant data is invented. A projection migration reads the
  explicit archetype mapping carried by the canonical contract record.
- **Layer 4 product projections:** Source intelligence, portfolio opportunity rows, evidence
  coverage, and action candidates use the same package and sizing eligibility rules.
- **Products:** Contract 360 and Source portfolio surfaces can show a truthful archetype, evidence
  boundary, and lever value state without promoting compatibility amounts to supported value.

## Client Applicability

- All clients using the Source Contract 360 projection path.
- Synthetic/demo datasets receive the same rules; no client-specific exception is introduced.
- Feature flag: none.

## Changes Included

- Canonical archetype projection migration for `source.contract_intelligence_v2`.
- Claim-gated opportunity amount and range mapping in Contract 360 and Source portfolio adapters.
- Active-package archetype aliases for cloud data platforms and managed-service variants, with
  canonical contract identity refreshed in the hardened read model.
- Legacy opportunity rows are suppressed when the same contract has an active current-package
  opportunity, preventing duplicate or stale portfolio value.
- Cloud contract page text is retained in deterministic contract-intelligence projection inputs.
- Contract-scoped aVa grounding is authoritative for every answer mode and carries explicit
  annual-value, commitment, spend, and payment semantic boundaries.
- Explicit Source workspace client keys are authorized directly before portfolio, impact, or
  contract-detail reads; session tenancy remains the fallback when no client is supplied.
- Claim-gated Layer 4 action, coverage, and sourcing opportunity projections.
- Dataset-version-aware document lineage joins.
- Loader validation that distinguishes resolvable source references from descriptive tokens.
- Focused regression coverage for the Content Proof data contract.

## QA / Validation

- `npx tsc --noEmit --pretty false` passed.
- Focused Jest suites passed: 9 suites, 84 tests.
- ESLint passed for all changed TypeScript/JavaScript files.
- `git diff --check` passed.
- ACA data-job readback and signed-in browser proof are required after merge and deployment.

## Rollout Plan

Merge through the protected `main` PR path. The repo-owned ACA main deploy workflow builds the
exact main SHA, applies the migration with the normal application rollout, and publishes the
digest-pinned web revision. After the web deploy, run the sanctioned ACA operator data-build job for
the affected Source package(s), then verify Layer 3 and Layer 4 readback before treating the page as
accepted.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: only the repo-owned ACA main deploy workflow.
- Approved image digest: recorded by the deploy workflow after the exact merge SHA is built.
- ACA runtime invariant: template image, 100%-traffic revision image, and required worker images
  must match the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Source portfolio and Contract 360 tabs, including
  archetype, evidence lineage, and Optimize value-state behavior.

## Rollback Plan

Re-deploy the prior known-good main SHA through the repo-owned ACA workflow. Do not mutate shared
traffic manually. If a data job has already run, its idempotent package readback and proof bundle
identify the affected dataset version; do not delete unrelated tenant data.

## Audit Evidence

- PR and CI checks for this release candidate.
- ACA deploy workflow run, image digest, runtime invariant, and signed-in proof.
- ACA operator-job run id, progress output, quality-gate output, and Blob proof bundle.
- Layer 3 and Layer 4 readback summaries.
- Content Proof data-contract regression tests.

## Known Gaps

- Unmapped register headers remain outside the authoritative archetype population until a real
  mapping source is provided.
- Industry benchmarks remain explicitly unavailable unless licensed and loaded as governed data.
- Existing authored opportunity amounts remain unsized until their calculation or benchmark claim is
  supported by resolvable evidence.
