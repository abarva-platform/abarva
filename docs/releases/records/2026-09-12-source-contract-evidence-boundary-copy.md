# 2026-09-12-source-contract-evidence-boundary-copy — Source contract evidence-boundary copy correction

## Release ID

`2026-09-12-source-contract-evidence-boundary-copy`

## Status

`candidate`

## Plain-English Summary

The cloud contract evidence summary now says that six governed document page rows are loaded, while raw source documents remain restricted. This keeps the contract narrative consistent with the canonical page-text facts and document lineage tables.

## Layer Impact

- Layer 1 client intake package: corrects the reviewed package context field.
- Layer 3 canonical model: the package field is loaded as governed contract context alongside the six page-text facts.
- `client-data-lane`: the change is limited to the controlled synthetic package and its loader test.

## Client Applicability

- All clients: no.
- Specific clients: none.
- Internal only: no.
- Public/demo only: yes, synthetic demo tenant only.
- Feature flag: none.

## Changes Included

- Corrected the package evidence-boundary field and generated CSV value.
- Added a regression assertion against the stale not-loaded statement.
- No route, schema, or raw document change.

## QA / Validation

- PASS: `node --check scripts/source/build-meridian-databricks-cloud-consumption-package.mjs`.
- PASS: `npx jest --runTestsByPath scripts/source/__tests__/load-cloud-consumption-package.test.ts --runInBand`.
- PASS: `npx eslint scripts/source/build-meridian-databricks-cloud-consumption-package.mjs scripts/source/__tests__/load-cloud-consumption-package.test.ts`.
- Required after merge: controlled ACA package reload and signed-in Evidence-tab proof.

## Rollout Plan

Merge through the protected `main` branch, deploy through the repo-owned ACA workflow, then rerun the governed operator job for the package and verify the refreshed contract projection.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned ACA deploy workflow only.
- Approved image digest: recorded after the main deploy workflow completes.
- ACA runtime invariant: required before live proof.
- Worker image invariant: required before live proof.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Evidence and Education tabs for the selected contract.

## Rollback Plan

Revert this commit, deploy the reverted `main` image through the protected ACA workflow, and rerun the governed package load. No database schema rollback or raw-document mutation is required.

## Audit Evidence

Inspect PR #7628, its release-control CI result, the package plan, the ACA Layer 2/3/4 proof bundles, the document-evidence job output, and the signed-in Evidence-tab readback.

## Known Gaps

The package contains reviewed synthetic page extracts rather than client PDFs. Invoice-line detail and performance rows are not fabricated; the cloud archetype marks performance as not required where applicable.
