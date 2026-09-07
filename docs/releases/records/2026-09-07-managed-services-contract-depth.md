# 2026-09-07-managed-services-contract-depth — Managed Services Contract Depth Package

## Release ID

`2026-09-07-managed-services-contract-depth`

## Status

`candidate`

## Plain-English Summary

Adds one fully evidenced synthetic managed-services contract package for the composite reference tenant. The package is designed to support an end-to-end Source 360 and Optimize story with contract terms, monthly spend, SLA performance, ticket volume, application scope, change-order evidence, document page text, extracted clauses, and quantified candidate actions that remain finance-gated.

## Layer Impact

Layer 1 client intake: adds governed synthetic source files in the established 12-file contract-depth package shape.

Layer 2 source adapters: extends the contract-depth adapter path so package validation follows the dataset version declared inside the package, while still requiring one tenant and one dataset version per package.

Layer 3 canonical model: after ACA apply, the package will write canonical contract, vendor, terms, scope, consumption, performance, service-credit, optimization, calculation, evidence, snapshot, and fact-assertion rows.

Layer 4 products: after the existing contract-depth Layer 4 job runs, Source 360, Contract 360, Optimize, and downstream product projections can read the package as governed product substrate. No realized savings are created.

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
- ACA job sequence after merge: contract-depth package Layer 2 apply, Layer 3 apply, document evidence apply, Layer 4 apply, verification jobs.

## QA / Validation

Candidate validation status: `pass` for local source-shape, arithmetic, and focused test validation; `not-run` for Azure mutation and live signed-in product proof until the PR is merged and deployed.

- `pass` — `npx tsx scripts/source/load-contract-depth-package.ts --mode=plan --package-dir=datasets/source/contract-depth/meridian-managed-services-depth-v1-20260907 --dataset-version=meridian-managed-services-depth-v1-20260907 --tenant-key=meridian-health`
- `pass` — `node scripts/source/load-contract-depth-document-evidence.mjs --package-dir=datasets/source/contract-depth/meridian-managed-services-depth-v1-20260907 --dataset-version=meridian-managed-services-depth-v1-20260907 --tenant-key=meridian-health --contract-id=MER-TECH-IMS-001`
- `pass` — package arithmetic reconciliation: 12 monthly spend rows total `$12.546M`, committed base totals `$11.88M`, invoice variance totals `$666K`, 5 SLA misses total `$99K`, recurring change orders total `$900K`, and candidate opportunity rows total `$490.5K`.
- `pass` — `npm test -- scripts/source/__tests__/load-contract-depth-package.test.ts --runInBand`
- `pass` — `npm run release:check`
- `pass` — `git diff --check`

Runtime validation required after deploy:

- Layer 2 ACA apply and readback proof.
- Layer 3 ACA apply and readback proof.
- Document-evidence ACA apply proof with non-empty `doc.file`, `doc.page`, `doc.span`, and `doc.extraction` counts for the new contract.
- Layer 4 ACA apply and verify proof.
- Contract API proof showing non-empty evidence facets for the new contract.
- Signed-in product proof for Source 360, Contract 360, Optimize, and aVa grounded response.

## Rollout Plan

Merge via PR. The repo-owned Azure Container Apps main deploy workflow builds and deploys the approved image. Data activation is manual and explicit through digest-pinned ACA Jobs using the existing contract-depth package scripts and the package-specific environment overrides.

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

To be filled after execution: PR URL, merge SHA, ACA deploy run, digest, ACA data-build proof folders, contract API proof, signed-in product proof screenshots or DOM JSON, and aVa proof transcript.

## Known Gaps

Candidate state until ACA jobs and live product proof complete. Values are candidate opportunities only and must not be narrated as realized savings.
