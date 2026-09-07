# 2026-09-07-managed-services-contract-depth — Managed Services Contract Depth Package

## Release ID

`2026-09-07-managed-services-contract-depth`

## Status

`deployed-data-substrate`

## Plain-English Summary

Adds one fully evidenced synthetic managed-services contract package for the composite reference tenant. The package is designed to support an end-to-end Source 360 and Optimize story with contract terms, monthly spend, SLA performance, ticket volume, application scope, change-order evidence, document page text, extracted clauses, and quantified candidate actions that remain finance-gated.

## Layer Impact

Layer 1 client intake: adds governed synthetic source files in the established 12-file contract-depth package shape.

Layer 2 source adapters: extends the contract-depth adapter path so package validation follows the dataset version declared inside the package, while still requiring one tenant and one dataset version per package.

Layer 3 canonical model: the ACA apply writes canonical contract, vendor, terms, scope, consumption, performance, service-credit, optimization, calculation, evidence, snapshot, and fact-assertion rows.

Layer 4 products: Source 360, Contract 360, Optimize, and downstream product projections can read the package as governed product substrate. No realized savings are created.

Layer 4 quality gates now use the package version to select exact expected counts, so the existing five-contract depth package and this one-contract managed-services package are both reconciled against their own shapes instead of sharing one hard-coded expectation set.

Tower bridge support now projects the managed-services Source contract-depth opportunities into Tower as their own `source_contract_depth:` rows, metric definitions, and cube slices. This keeps infrastructure managed-services findings separate from cloud-consumption findings while allowing Tower to narrate the same evidence-backed action spine.

Release lane: `client-data-lane` for synthetic reference data and Source/Tower projections.

## Client Applicability

- All clients: No.
- Specific clients: Composite reference tenant only.
- Internal only: Yes, for demo/reference data operations.
- Public/demo only: Yes.
- Feature flag: Existing Source/Tower product routing only; no new feature flag.

## Changes Included

- `datasets/source/contract-depth/meridian-managed-services-depth-v1-20260907/source-files/*`
- `docs/governance/dataset-manifests/meridian-managed-services-depth-v1-20260907.json`
- `src/lib/source/contract-depth-package/adapter.ts`
- `scripts/tower/apply-source-cloud-tower-bridge.mjs`
- ACA job sequence after merge: contract-depth package Layer 2 apply, Layer 3 apply, document evidence apply, Layer 4 apply, verification jobs.

## QA / Validation

Candidate validation status: `pass` for local source-shape, arithmetic, focused test validation, Azure Layer 2/3/4 mutation proof, and Source product-substrate readback. Signed-in product proof remains separate.

- `pass` — `npx tsx scripts/source/load-contract-depth-package.ts --mode=plan --package-dir=datasets/source/contract-depth/meridian-managed-services-depth-v1-20260907 --dataset-version=meridian-managed-services-depth-v1-20260907 --tenant-key=meridian-health`
- `pass` — `node scripts/source/load-contract-depth-document-evidence.mjs --package-dir=datasets/source/contract-depth/meridian-managed-services-depth-v1-20260907 --dataset-version=meridian-managed-services-depth-v1-20260907 --tenant-key=meridian-health --contract-id=MER-TECH-IMS-001`
- `pass` — package arithmetic reconciliation: 12 monthly spend rows total `$12.546M`, committed base totals `$11.88M`, invoice variance totals `$666K`, 5 SLA misses total `$99K`, recurring change orders total `$900K`, and candidate opportunity rows total `$490.5K`.
- `pass` — `npm test -- scripts/source/__tests__/load-contract-depth-package.test.ts --runInBand`
- `pass` — `npm run release:check`
- `pass` — `git diff --check`

Runtime validation required after deploy:

- `pass` — Layer 2 ACA apply and readback proof: 117 adapter rows across contract, clause, page-text, app-scope, spend, ticket, performance, opportunity, document, and change-order adapters.
- `pass` — Layer 3 ACA apply and readback proof: 1 contract, 8 terms, 5 scope rows, 12 spend observations, 12 performance observations, 5 service-credit rows, 3 opportunities, 20 opportunity evidence links, 3 calculation runs, and `$490.5K` candidate opportunity amount, all not finance-confirmed.
- `pass` — Document-evidence ACA apply proof with 6 `doc.file`, 12 `doc.page`, 8 `doc.span`, and 8 `doc.extraction` rows for the new contract.
- `pass` — Layer 4 ACA apply and verify proof: 1 contract row, 1 financial exposure row, 1 operational performance row, 5 app-scope rows, 12 spend rows, 12 SLA rows, 3 opportunity rows, 3 action candidates, 3 claim cards, 5 storyline rows, and 3 aVa grounding rows, with `$99K` unclaimed credit and `$490.5K` total candidate opportunity amount.
- `pass` — local Tower bridge plan for the managed-services package proves the package will project 3 opportunities into 15 Tower projection entries, 3 rows per Tower lens, and 6 cube slices before any Azure write.
- Contract API proof showing non-empty evidence facets for the new contract.
- Signed-in product proof for Source 360, Contract 360, Optimize, and aVa grounded response.

## Rollout Plan

Merge via PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image. Data activation is manual and explicit through digest-pinned ACA Jobs using the existing contract-depth package scripts, the Tower contract-depth bridge script, and the package-specific environment overrides.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: None outside repo-owned ACA deploy workflow.
- Approved image digest: Captured after ACA main deploy.
- ACA runtime invariant: Required before running data jobs.
- Worker image invariant: Required before running data jobs.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

If the package fails validation before product proof, stop before Layer 4 or remove only rows matching the package dataset version/load run with a follow-up controlled ACA cleanup job. If a product regression appears after deploy, roll back the web image through the repo-owned ACA deployment lane and leave data rows inert until a cleanup job is reviewed.

## Audit Evidence

- Layer 2 apply proof: `/tmp/source-managed-services-layer2-20260907T1835Z/proof/source-contract-depth-package-apply-layer2-20260907T183202Z/result.json`
- Layer 3 apply proof: `/tmp/source-managed-services-layer3-retry-20260907T1850Z/proof/source-contract-depth-package-apply-layer3-20260907T185033Z/result.json`
- Document evidence proof: `/tmp/source-managed-services-doc-evidence-20260907T1855Z/summary.json`
- Source Layer 4 apply proof: `/tmp/source-managed-services-layer4-apply-after-shape-fix-20260907T1918Z/proof/source-contract-depth-package-layer4-apply-20260907T191742Z/summary.json`
- Source Layer 4 verify proof: `/tmp/source-managed-services-layer4-verify-after-shape-fix-20260907T1920Z/proof/source-contract-depth-package-layer4-verify-20260907T191940Z/summary.json`
- Tower bridge proof: to be filled after managed-services bridge apply/verify.
- Signed-in product proof screenshots or DOM JSON and aVa proof transcript: to be filled after product proof.

## Known Gaps

Tower managed-services bridge apply/verify and live signed-in product proof remain open. Values are candidate opportunities only and must not be narrated as realized savings.
