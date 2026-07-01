# 2026-06-30-tower-cxo-governed-vertical-slice — Tower CXO Governed Vertical Slice

## Release ID

`2026-06-30-tower-cxo-governed-vertical-slice`

## Status

`released`

## Plain-English Summary

Tower now has a smallest release-proof CXO command-center slice that reads the governed Tower facts first. The landing page is intentionally frozen around the first credible Tower v1 story: Money → Work → Value → Evidence. It shows the eight core budget/value measures, derived budget/value ratios, portfolio-control facts, peer benchmark rows, evidence/trust lineage, and an Ask aVa parity panel. Missing inputs render as named business gaps instead of `$0`, placeholder math, or demo values.

## Layer Impact

- `global-control-lane`: updates the shared Tower route experience for all tenants with governed Tower data.
- `client-data-lane`: reads the existing `cio_tower.measure_results`, `cio_tower.facts`, `cio_tower.relationships`, and `cio_tower.entities` layers; no new source-of-truth fixture data is introduced.

## Client Applicability

- All clients: Tower uses the same governed view model when `cio_tower` data exists.
- Specific clients: proof runner defaults to `skyharbor-air` but accepts any canonical tenant key.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Adds `src/lib/cio-tower/cxo-view-model.ts` for a governed `cio_tower`-only CXO view model.
- Updates `src/app/(maestro)/tower/page.tsx` to load and pass the governed model.
- Updates `src/components/tower/TowerIndexPage.tsx` to render the governed CXO command-center landing when available, including Budget Mix, Value Realization, Tenant Benchmark, Portfolio Control, Evidence and Trust, and Ask aVa reconciliation.
- Defers vendor concentration, renewal exposure, full CFO slicing, and AI governance views until those governed measures are populated and proven.
- Adds `scripts/qa/tower-cxo-parity-proof.ts` and `npm run tower:cio:cxo-parity` to prove one dashboard KPI and one aVa answer reconcile to the same governed measure.

## QA / Validation

- Passed: `npx eslint src/app/(maestro)/tower/page.tsx src/components/tower/TowerIndexPage.tsx src/lib/cio-tower/cxo-view-model.ts scripts/qa/tower-cxo-parity-proof.ts` completed with no new errors. The large existing Tower component still reports pre-existing unused-symbol warnings.
- Passed: `npm test -- --runInBand src/lib/cio-tower/__tests__/answer.test.ts src/lib/cio-tower/__tests__/answer-contract.test.ts` completed `18/18` tests.
- Passed in ACA/VNet: `tower:cio:cxo-parity` for `skyharbor-air`, measure `total_it_budget_fy26`, dashboard value `$2.6B`, aVa answer value `$2.6B`, validation status `passed`, latency `39ms`.
- Passed signed-in browser proof: deployed `/tower` returned `200` and rendered CIO portfolio command center, Value Command Center, Budget Mix, Value Realization, Portfolio Control, Tenant Benchmark, Evidence and Trust, plus the `$2.6B` FY26 IT budget.
- Blocked by baseline only: `npx tsc --noEmit --pretty false` currently fails on existing missing typings/packages (`js-yaml`, Azure Document Intelligence, axe Playwright), unrelated to this slice. GitHub typecheck passed for the merged PR.

## Rollout Plan

Merged to `main`, built through the repo-owned Azure Container Apps deployment workflow, and proved the signed-in `/tower` page on `https://app.abarva.ai` for SkyHarbor/Airline synthetic path.

## Deployment Authority

- Repo-owned deploy workflow: completed.
- Shared runtime mutators: none in this PR.
- Approved image digest: `sha256:83008929a4034f9bc15448079638855570bbb8d454fb26a6ee6f86026563c830`.
- ACA runtime invariant: passed on revision `ca-abarva-web-lab-eastus--md7db6c59`, 100% traffic.
- Worker image invariant: no worker image change.
- Feature/env flag update path: none.
- Live signed-in proof required: completed for `/tower`.

## Rollback Plan

Revert this PR. Existing Tower route and chat API remain in place; the governed CXO model is additive and the page falls back to the previous Tower panel if no governed model is returned.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/4213
- Main SHA: `d7db6c598dbbf3328ed5d0426af76b82d1097e12`
- ACA revision: `ca-abarva-web-lab-eastus--md7db6c59`
- Image digest: `sha256:83008929a4034f9bc15448079638855570bbb8d454fb26a6ee6f86026563c830`
- Proof bundle: `/Users/anand/Downloads/tower-cxo-v1-proof-20260701.zip`
- VNet trace: `cio_tower_trace_a2dc21a389c7dbb0d8dc724a`
- Prompt package: `cio_tower_prompt_d4f8e080c6bfd426e1d5f2ea`

## Known Gaps

This is intentionally one vertical slice. It does not complete the full Tower redesign, all-dashboard tab rewiring, vendor concentration, renewal exposure, AI governance, or all-tenant browser proof. Portfolio Control still mixes budget envelope categories and true initiative rows; the next slice should be the Portfolio Value Pack: initiative-level spend, promised value, measured value, owner, blocker, and evidence status. The signed-in display label still shows `Airline Demo` for the SkyHarbor-derived proof path and should be normalized.
