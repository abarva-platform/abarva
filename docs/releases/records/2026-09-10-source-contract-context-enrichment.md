# 2026-09-10-source-contract-context-enrichment — Source Contract Context Enrichment

## Release ID

`2026-09-10-source-contract-context-enrichment`

## Status

`candidate`

## Plain-English Summary

Source cloud-consumption packages now require reviewed plain-English contract context at load time:
what the contract is, what scope is loaded, what the commercial posture is, what relationships are
declared, and what evidence boundary applies. Source projects those reviewed context facts into
Contract 360 instead of deriving generic story text inside the page.

## Layer Impact

- Lane: `client-data-lane` for package/load/canonical fact behavior.
- Lane: `global-control-lane` for the shared Source Contract 360 projection contract.
- Layer 1 client intake: cloud contract register rows add reviewed context fields and review-state
  metadata.
- Layer 2 source adapters: the cloud-consumption loader validates those fields, review state,
  reviewer role, and review timestamp before accepting a package.
- Layer 3 canonical model: reviewed context is inserted as `source.canonical_fact_assertion` rows
  with fact keys, confidence, source refs, and staleness metadata.
- Layer 4 products: Source Contract 360 projections prefer reviewed context facts for contract
  scope and purpose summaries; unreviewed context is not projected.

## Client Applicability

- All clients: the loader/projection contract applies to cloud-consumption packages.
- Specific clients: none named in this public release record.
- Internal only: no.
- Public/demo only: existing synthetic demo packages are enriched and regenerated.
- Feature flag: none.

## Changes Included

- `scripts/source/load-cloud-consumption-package.mjs`
- `scripts/source/project-contract-depth-package-layer4.ts`
- `scripts/data-build/refresh-source-l4-cube.ts`
- `src/lib/source/data-model/types.ts`
- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- synthetic cloud-consumption package source files, workbook, and QA proof
- `docs/design/source/CONTRACT360_CONTEXT_DATA_LAYER_DESIGN_CONTRACT_2026-09-10.md`

## QA / Validation

- `node --check scripts/source/load-cloud-consumption-package.mjs` — pass.
- `node --check scripts/source/build-meridian-databricks-cloud-consumption-package.mjs` — pass.
- Cloud package plan gate for the default cloud-consumption package — pass; expected canonical fact
  assertions increased to include reviewed context facts.
- Cloud package plan gate for the Databricks cloud-consumption package — pass; expected canonical
  fact assertions increased to include reviewed context facts.
- `npx jest --runInBand --runTestsByPath scripts/source/__tests__/load-cloud-consumption-package.test.ts scripts/source/__tests__/project-contract-depth-package-layer4.test.ts` — pass.
- `npx eslint` on touched source, loader, projection, and test files — pass.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — pass.

## Rollout Plan

Merge by pull request, allow the repo-owned Azure Container Apps main deploy workflow to build and
deploy the new web image, then run the governed ACA data-build job path for affected package loads.
Layer 4 projections must be refreshed from the approved deployed image before live proof.

## Deployment Authority

- Repo-owned deploy workflow: required for shared web runtime.
- Shared runtime mutators: not allowed outside the approved workflow.
- Approved image digest: pending deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: required before data-build jobs.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for Source Contract 360 and aVa on affected contract detail and
  Optimize flows.

## Rollback Plan

Revert the pull request and redeploy through the repo-owned ACA main workflow. Existing canonical
fact rows are additive and scoped by dataset/load; if a package was loaded with the new context
facts, rerun the prior governed package load or activate the prior Layer 4 cube load run.

## Audit Evidence

- Pull request URL: pending.
- CI/check run: pending.
- ACA deploy run and runtime invariant: pending.
- ACA data-build job proof bundle: pending.
- Live signed-in Source/aVa proof: pending.

## Known Gaps

This does not extract reviewed context directly from real restricted contract documents yet. The
current implementation requires reviewed context fields in the governed package. A private
document-derivation job inside the client data plane remains the next step for real-client contract
paper.
