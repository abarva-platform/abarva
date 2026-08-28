# 2026-08-28-source-contract-depth-demo-slice — Source Contract Depth Demonstration Slice

## Release ID

`2026-08-28-source-contract-depth-demo-slice`

## Status

`candidate`

## Plain-English Summary

Adds a governed operator job path for loading one Source contract-depth demonstration slice into the
canonical Source performance, spend, service-credit, and optimization-opportunity tables. The slice
lets Contract 360 display monthly SLA performance, monthly spend, and an unclaimed service-credit
opportunity when the job is run and the post-run quality gate passes.

## Layer Impact

- `client-data-lane`: the operator job writes idempotent contract performance, consumption,
  service-credit, and optimization-opportunity records for one scoped demonstration contract only
  after an explicit apply gate is set. The governed apply run also materialized the scoped
  canonical contract backbone row from the already-authorized serving projection when the backbone
  row was absent.

- `global-control-lane`: Contract 360 now reads and renders monthly performance/spend rows, and the
  Source workspace proof-layer summary reads the governed consumption views instead of reporting
  those layers as hard-coded empty.

- `public-demo`: a controlled demonstration data slice can be loaded and proven for a demo script
  without turning the synthetic values into production client truth.

Governance impact: a dataset manifest is added for the demonstration slice, and the job emits
local/ACA proof bundle files with row counts, reconciliation, quality-gate output, and release
metadata.

## Client Applicability

- All clients: no default data changes.
- Specific clients: one scoped synthetic demonstration tenant when the operator job is explicitly run
  with that tenant key.
- Internal only: operator job, proof bundle, and QA harnesses.
- Public/demo only: intended for a controlled demo narrative, not production client truth.
- Feature flag: none; mutation requires the job apply gate and scoped operator invocation.

## Changes Included

- `scripts/source/load-contract-depth-demo-slice.ts`
- `src/lib/source/data-model/contract-depth-demo-slice.ts`
- `src/lib/source/data-model/read-adapter.ts`
- `src/lib/source/data-model/contract-360-view.ts`
- `src/lib/source/data-model/types.ts`
- `src/app/api/source/workspace/contract/[contractId]/route.ts`
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`
- `src/app/(maestro)/source/preview/workspace/live/portfolioAdapter.ts`
- `docs/governance/dataset-manifests/source-contract-depth-sla-credit-v1.json`
- `docs/backlog/tracks/04-source-commercial/BACKLOG.md`

## QA / Validation

- pass: `npm test -- --runTestsByPath src/lib/source/data-model/__tests__/contract-depth-demo-slice.test.ts 'src/app/(maestro)/source/preview/workspace/__tests__/portfolioAdapter.ecl.test.ts' --runInBand`.
- pass: `npx eslint` on touched Source data-model, API route, workspace, and loader files.
- pass: `npm run validate:context-corpus -- manifests`.
- pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`.
- pass: `npm run release:check`.
- pass: repo-owned ACA main deploy workflow for merge commit `1309ec47970a7f34ab97a58dcda7b00e4036570e`;
  runtime invariant passed for digest
  `acrabarvalab001.azurecr.io/abarva/web@sha256:a37124b455f5f1c779445163fe539c7407cad75fc76d3c30ac81b669f7ccd35b`.
- pass: ACA Job dry-run and apply run using the same digest-pinned image; apply readback returned
  12 consumption rows, 12 performance rows, 3 service-credit rows, 1 optimization opportunity,
  and `$43,000.02` unclaimed credit for the scoped contract.
- pass: focused post-apply UI tests added for monthly SLA rendering without the legacy aggregate
  summary and actual-spend fallback from monthly rows:
  `npm test -- --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/ContractCanvas.executive-story.test.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/buildViewModel.numeric.test.ts' src/lib/source/data-model/__tests__/contract-depth-demo-slice.test.ts --runInBand`.
- pass: scoped `npx eslint` on the post-apply UI/model test changes.
- pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false --skipLibCheck --project tsconfig.json`.
- partial: signed-in production proof showed the scoped contract loads cleanly without tenant
  leakage and the optimization opportunity is legible. It also found that monthly SLA rows and
  actual annual spend need the post-apply UI follow-up in this release record before final live
  screenshot proof.

## Rollout Plan

1. Merge through a PR to the protected main branch.
2. Let the repo-owned ACA main deploy workflow build and deploy the exact main SHA.
3. Run the operator job with `npm run ops:aca-job -- --image <approved digest> --script source:contract-depth-demo:load`
   and explicit tenant scope, contract id, idempotency key, run id, apply approval env, and proof
   output directory.
4. Inspect the emitted proof bundle and quality gate before using the data in product narration.
5. Run signed-in proof on the affected Contract 360 tabs and workspace proof layers.

## Deployment Authority

- Repo-owned deploy workflow: required for the web image that contains the new job and UI read path.
- Shared runtime mutators: none from this PR; the data mutation is a separate scoped ACA Job run.
- Approved image digest: required before the ACA Job apply run.
- ACA runtime invariant: required after the web deploy and before live proof claims.
- Worker image invariant: required if the operator job image differs from the deployed web digest.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, for the affected contract tabs and workspace proof-layer panel.

## Rollback Plan

If the web change causes a regression, revert the PR and allow the repo-owned ACA deploy workflow to
restore the previous product behavior. If the data job must be rolled back, run a scoped cleanup using
the same dataset version and idempotency key to remove only the rows inserted by this slice, then
rebuild/read back the affected Source projections.

## Audit Evidence

- PR #6905 merged to `main`; merge commit `1309ec47970a7f34ab97a58dcda7b00e4036570e`.
- GitHub ACA main deploy run: `33143809110`.
- ACA Job dry-run proof bundle:
  `/tmp/source-contract-depth-ctr0002-dryrun-20260828T052300Z/proof/source-contract-depth-20260828T052244Z`.
- ACA Job apply proof bundle:
  `/tmp/source-contract-depth-ctr0002-apply-20260828T052900Z/proof/source-contract-depth-20260828T052655Z`.
- Signed-in production screenshot/proof folder:
  `/Users/anand/Projects/nexus-worktrees/source-ctr0002-depth/proof/source-ctr0002-depth-live-proof-20260828`.
- Quality gate JSON from the operator job:
  `/tmp/source-contract-depth-ctr0002-apply-20260828T052900Z/proof/source-contract-depth-20260828T052655Z/quality-gate.json`.

## Known Gaps

The job creates demonstration-grade SLA/spend/opportunity evidence for one scoped contract. It does
not claim finance-confirmed realized value, broad portfolio opportunity discovery, or production
client completeness.
