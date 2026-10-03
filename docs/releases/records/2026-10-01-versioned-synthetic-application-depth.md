# 2026-10-01-versioned-synthetic-application-depth — Independent Application Grain

## Release ID

`2026-10-01-versioned-synthetic-application-depth`

## Status

`candidate`

## Plain-English Summary

Adds a successor synthetic enterprise source set with independently identified logical services. The existing source version and loaded assessment remain immutable. Module rows remain separate from application totals.

## Layer Impact

- Release lanes: `client-data-lane` for the scoped synthetic assessment and `global-control-lane` for shared adapter/loader code.
- Layer 1: a new versioned, owner-shaped synthetic source definition expands the application register.
- Layer 2: the adapter recognizes logical services as applications while retaining module grain and source-row lineage.
- Layer 3: the existing canonical object and relationship types accept the successor assessment; no schema change is included.
- Layer 4: no Home projection, aVa context, or export is activated by this release.

## Client Applicability

- All clients: no data changes.
- Specific clients: none; this is a synthetic lab source set only.
- Internal only: private operator job can load a new assessment after release.
- Public/demo only: no automatic publication.
- Feature flag: none.

## Changes Included

Versioned source definition, generator and validator support, Layer 2 normalization, private load-job selector, dataset manifest, and source/physical-admission tests.

## QA / Validation

- Existing V1 source and adapter tests pass; the V1 source hash is unchanged.
- V2 generation, independent validation, and adapter tests pass with source hash `deb504f6d34d3381dd2f09d323f352302d106076c96fa182b5d485084fd93829`.
- After the final source-hash freeze, disposable local Postgres admission and V1/V2 canonical loads pass, including distinct logical application/module readback and duplicate-assessment refusal. CI must independently repeat these checks.
- No signed-in Home claim is made by these tests.

## Rollout Plan

Squash-merge through the protected PR path. Build/deploy the exact main SHA through the repo-owned ACA main workflow. Submit a digest-pinned private operator job to load only the new synthetic assessment. Require independent readback, quality gate, and explicit promotion before any Home use.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none outside the workflow.
- Approved image digest: record from the successful deploy run before any job.
- ACA runtime invariant: verify web template, 100%-traffic revision, and required workers against that digest.
- Worker image invariant: required workers use the approved digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after any later serving promotion.

## Rollback Plan

Do not promote the successor assessment. If code rollback is needed, revert via a new PR and approved main deploy; preserve immutable source and canonical rows for audit. Never delete the earlier assessment to make the successor fit.

## Audit Evidence

PR checks, pinned source hash, local disposable-Postgres results, ACA deploy run and runtime-invariant report, private load-job proof, subsequent independent readback and signed-in proof.

## Known Gaps

The source set is not yet loaded or serving. A passing application-depth gate alone does not establish executive-question quality, retrieval readiness, narrative parity, or export parity.
