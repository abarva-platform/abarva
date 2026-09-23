# 2026-09-23-source-scope-signer-proof - Scope signer-proof hold

## Release ID

`2026-09-23-source-scope-signer-proof`

## Status

`candidate`

## Plain-English Summary

Uploading or approving a scope memo does not, by itself, prove the required people signed it. The Scope gate now keeps signature-dependent criteria open until an authoritative signer-proof path exists or a separately recorded owner waiver applies.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 3, canonical decision state: upload cannot mark signature-dependent gate criteria met merely because an artifact was stored.
- Layer 4, Source projection: gate readiness rechecks legacy met criteria and reports a signer-proof blocker where appropriate.

## Client Applicability

- All clients: shared Source Scope gate behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Scope artifact upload criterion synchronization and Source gate-readiness checks.
- Focused behavioral tests for upload and previously marked-met states.
- No schema migration, intake adapter, supplier communication, or tenant-data build.

## QA / Validation

- Red-first governance tests: an approved memo without signer proof failed the new test before the fix.
- Focused route/governance tests, typecheck, lint, and release check are required before merge; record final results in the PR.
- Signed-in negative replay remains a separate post-deploy acceptance step.

## Rollout Plan

Squash-merge only after applicable CI checks pass. The repo-owned ACA main workflow builds and deploys the digest-pinned image; no branch or ad-hoc shared traffic update.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: record after deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required after deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: Scope remains blocked without verified signer evidence; no demo acknowledgement counts as approval.

## Rollback Plan

Revert the PR through the protected main branch and let the repo-owned ACA workflow deploy the replacement digest. Recheck the Scope gate before resuming stage approvals. No data rollback is needed because this change does not write tenant records.

## Audit Evidence

PR/CI, red-first test output, ACA runtime invariant, and signed-in negative gate replay. These are recorded separately when available.

## Known Gaps

Positive sponsor and EA signer evidence needs an authoritative, event- and artifact-version-bound source before these criteria can be positively cleared. An explicit owner waiver remains a distinct governed decision, not a signature.
