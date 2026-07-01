# 2026-07-01-tower-initiative-entity-binding — Tower Initiative Entity Binding

## Release ID

`2026-07-01-tower-initiative-entity-binding`

## Status

`candidate`

## Plain-English Summary

This release fixes the Tower governed data load path that left initiative spend facts disconnected from their initiative names. The source files already contain business-readable program names, but initiative spend rows use spend-line IDs as source rows and point to the initiative through a separate reference. The loader now binds those spend facts to the initiative entity, and fact upserts refresh the binding columns so a reload can repair old orphaned facts.

## Layer Impact

- `client-data-lane`: Updates the governed `cio_tower` loading script so Tower facts bind to named initiative entities instead of staying orphaned.
- `global-control-lane`: Adds answer/view-model fallback handling for readable source labels and strengthens the Tower quality report to catch orphan initiative-budget facts.

## Client Applicability

- All clients: applies to every tenant loaded through `tower-standardized-v1`.
- Specific clients: fixes the SkyHarbor visible symptom where top-program answers rendered `Program name not loaded`.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/tower/load-cio-tower-standardized-v1.mjs`
  - Resolves fact entity references from the correct business reference for initiative spend lines.
  - Updates `ON CONFLICT` behavior so reloads refresh `entity_key`, `entity_type`, lineage, and confidence columns.
- `src/lib/cio-tower/answer.ts`
  - Allows human-readable `source_label` values as a final visible-name fallback while preserving ID-shaped-name rejection.
- `src/lib/cio-tower/cxo-view-model.ts`
  - Aligns portfolio value row naming candidates with the governed answer path.
- `scripts/tower/validate-cio-tower-quality.mjs`
  - Fails Azure reconciliation when initiative-budget facts are not bound to an entity.
- `src/lib/cio-tower/__tests__/answer.test.ts`
  - Adds regression coverage for readable source-label fallback.

## QA / Validation

- `node scripts/tower/load-cio-tower-standardized-v1.mjs --dry-run` passed.
- `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand` passed: 20 tests.
- `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/cxo-view-model.ts src/lib/cio-tower/__tests__/answer.test.ts scripts/tower/load-cio-tower-standardized-v1.mjs scripts/tower/validate-cio-tower-quality.mjs` passed.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, then rerun the governed Tower loader for the standardized package inside the VNet-visible runtime. After reload, run the Tower quality report with database reconciliation and the signed-in Tower prompt/raw/render trace.

## Deployment Authority

- Repo-owned deploy workflow: required for app code.
- Shared runtime mutators: none in this PR.
- Approved image digest: recorded by ACA deploy workflow after merge.
- ACA runtime invariant: active template image, active revision image, and 100% traffic image must match the approved main digest.
- Worker image invariant: no worker image change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Tower trace must show named top programs and dashboard/chat parity.

## Rollback Plan

Rollback by reverting this PR. If a data reload has run, rerun the previous loader only if explicitly needed; the schema is unchanged and the fix is additive to entity binding.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA revision/digest: pending.
- Live proof: pending Tower quality report and signed-in trace after deploy and reload.

## Known Gaps

This PR repairs binding logic. It does not itself reload Azure data or prove the live browser answer; those are required rollout steps after deployment.
