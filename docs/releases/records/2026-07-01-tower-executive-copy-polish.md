# 2026-07-01-tower-executive-copy-polish — Tower Executive Copy Polish

## Release ID

`2026-07-01-tower-executive-copy-polish`

## Status

`candidate`

## Plain-English Summary

Tower keeps the same governed data path, but the visible dashboard language now reads like a CIO/CFO command center instead of an internal proof harness. The page no longer surfaces schema names, proof-script wording, or database-style phrases in the executive experience.

## Layer Impact

- `global-control-lane`: updates shared Tower copy and labels for all tenants that see the CXO command center.
- `client-data-lane`: no data, schema, migration, or ingestion change.

## Client Applicability

- All clients: yes, when the CXO command-center model is available.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Updates `src/lib/cio-tower/cxo-view-model.ts` headline and business-gap phrasing.
- Updates `src/components/tower/TowerIndexPage.tsx` CXO command-center copy, card footers, table headers, panel titles, and Ask aVa copy.
- Keeps machine-checkable `data-*` attributes for QA while removing proof-system language from visible UI.

## QA / Validation

- Passed: `npx eslint src/lib/cio-tower/cxo-view-model.ts src/components/tower/TowerIndexPage.tsx` completed with no errors. The large existing Tower component still reports pre-existing unused-symbol warnings.
- Passed: `npm test -- --runInBand src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts` completed `18/18` tests.
- Pending: signed-in browser proof after deploy.

## Rollout Plan

Merge to `main`, deploy through the repo-owned Azure Container Apps main workflow, and re-run the signed-in `/tower` browser proof.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by main deploy.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker image change.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, `/tower`.

## Rollback Plan

Revert this PR. It is copy-only for the Tower CXO command center and does not change the data model or answer path.

## Audit Evidence

- PR URL: pending.
- CI: pending.
- Browser screenshot: pending after deployment.

## Known Gaps

This polish does not build the next Portfolio Value Pack and does not normalize the signed-in tenant/persona display label. Those remain the next Tower slices.
