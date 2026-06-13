# 2026-06-13-context-layer-factory-remediation — Context Layer Factory Remediation Evidence

## Release ID

`2026-06-13-context-layer-factory-remediation`

## Status

`candidate`

## Plain-English Summary

Adds the Context Layer Factory remediation evidence package for Lakeshore Holdings, Apex Retail, and Meridian Health. The package documents the live Azure context-layer diagnosis, load, index, retrieval, citation, promotion-assessment, and context-bundle proof work, plus operator scripts used for ACA/VNet evidence runs.

## Layer Impact

- `client-data-lane`: Adds context remediation reports and ACA/VNet operator scripts for tenant context verification and controlled data-plane operations.
- `internal-admin`: Adds internal-only scripts for evidence collection and guarded remediation execution. These scripts do not run automatically from the app runtime.

## Client Applicability

- All clients: None directly from merge alone.
- Specific clients: Lakeshore Holdings, Apex Retail, Meridian Health evidence and remediation reports.
- Internal only: Operator scripts under `scripts/context/`.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- PR #3385.
- Documentation under `docs/context/`, including context identity, load verification, retrieval/citation proof, bundle proof, promotion evaluation, module readiness, schema reference, and HTML summary reports.
- Operator scripts under `scripts/context/` for live ACA/VNet probes and guarded context remediation activities.

## QA / Validation

- PASS: GitHub CI checks on PR #3385, including architecture, canonical tenant drift, migration drift, typecheck, browser smoke, and security scanning, except for the ESLint and release-record gates repaired by this follow-up commit.
- PASS: `npx eslint scripts/context/*.ts` after the lint repair.
- PASS: `npm run release:check -- --base origin/main --head HEAD` after this release record was added.
- NOT RUN: Live ACA/VNet evidence jobs were not rerun by this PR repair. Existing live evidence referenced in the reports was collected from ACA/VNet jobs and recorded in the context reports. Merging this PR does not rerun those jobs.

## Rollout Plan

Merge to main as a documentation and internal-operator-script evidence package. No app deploy is required for user-facing runtime behavior. Any future data-plane write must be run explicitly through an ACA/VNet operator job with the documented environment gates; scripts that mutate data require `APPLY=1`.

## Rollback Plan

Revert the merge commit to remove the docs and scripts from main. No source rows or live data-plane state are changed by the merge itself.

## Audit Evidence

- PR #3385.
- `docs/context/CONTEXT_LAYER_FACTORY_REMEDIATION_REPORT.html`.
- `docs/context/AZURE_CONTEXT_CORPUS_DATA_REPORT.html`.
- `docs/context/CLIENT_CONTEXT_BUNDLE_PROOF_2026-06.md`.
- `docs/context/CLIENT_CONTEXT_RETRIEVAL_CITATION_PROOF_2026-06.md`.
- `docs/context/CLIENT_CONTEXT_PROMOTION_EVALUATION_2026-06.md`.

## Known Gaps

The evidence package includes scripts capable of data-plane writes when explicitly run with `APPLY=1`; those writes are not triggered by merge and must remain governed by ACA/VNet job runbooks, job IDs, and separate operator evidence. Source, Tower, and Moves are documented as data-ready or warning states where surface-specific proof is still incomplete.
