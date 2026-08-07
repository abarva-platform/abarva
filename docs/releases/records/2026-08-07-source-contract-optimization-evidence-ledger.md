# 2026-08-07-source-contract-optimization-evidence-ledger — Source contract optimization evidence ledger

## Release ID

`2026-08-07-source-contract-optimization-evidence-ledger`

## Status

`candidate`

## Plain-English Summary

This release turns the Source contract Optimization tab from static scenario framing into a governed evidence cockpit for incumbent contract optimization. The page now separates four decision ledgers: recoverable leakage, avoided cost, negotiated improvement, and realized value. Amounts render only when deterministic evidence exists; otherwise the page shows the missing evidence and the next action needed before a claim can be made.

It also adds a Source workspace bridge that starts or continues a Door 1 `contract_optimization` event from a selected contract. New events get the sourcing motion explicitly at creation time and are seeded with only defensible baseline facts already consumed by Door 1.

Follow-up hardening makes the capability tenant-agnostic: SkyHarbor remains the canary dataset, but tenant aliasing comes from the shared tenant resolver, not from Source-specific branches, and the ledger service now emits a shared decision record for Door 1, Tower, aVa, and Vendor/Contract 360.

## Layer Impact

- `global-control-lane`: updates the shared Source workspace contract Optimization tab and Source workspace view model.
- `client-data-lane`: adds a tenant-scoped API route that can create or reuse a Source event and write cited baseline rows into existing `source_event_facts`.

## Client Applicability

- All clients: yes, for tenants using the Source V4 workspace and Source event creation permissions.
- Specific clients: canonical SkyHarbor is the immediate proof target.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/data-model/contract-optimization-ledger.ts`: new deterministic four-ledger classifier for recoverable leakage, avoided cost, negotiated improvement, and realized value.
- `src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts`: regression tests for the four-ledger honesty rules.
- `src/app/(maestro)/source/preview/workspace/buildViewModel.ts`: exposes the evidence ledger and Door 1 launch state to the contract canvas.
- `src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx`: renders the four-ledger evidence cockpit and workflow CTA.
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx` and `viewModel.tsx`: add launch state and the POST action.
- `src/app/api/source/workspace/contract/[contractId]/optimization/route.ts`: creates or reuses a `contract_optimization` event and persists cited baseline facts.
- `scripts/source/audit-contract-optimization-evidence-readiness.mjs` and `package.json`: add a read-only evidence-readiness audit for the four ledgers.
- `scripts/source/audit-contract-optimization-evidence-readiness.mjs`: hardens the audit with the same shared tenant alias resolver and RLS tenant context used by the Source read adapters, so workflow facts are not undercounted when app-era and canonical tenant keys differ.
- `src/lib/source/data-model/read-adapter.ts`, `source-v4-workspace-snapshot.ts`, and `scripts/source/audit-contract-optimization-evidence-readiness.mjs`: replace Source-local tenant alias lists with the shared tenant alias resolver.
- `src/lib/source/data-model/contract-optimization-ledger.ts`: exposes the common tenant-neutral decision record with tenant key, dataset version, contract/vendor IDs, four value ledgers, evidence status, evidence refs, confidence, owner, next action, Door 1 event ID, and Tower claim refs.
- `package.json`: runs the evidence audit through `tsx` so it can use shared runtime tenant resolution.

## QA / Validation

- PASS: `npx jest --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts --runInBand`.
- PASS: `npx eslint src/lib/source/data-model/contract-optimization-ledger.ts src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts 'src/app/(maestro)/source/preview/workspace/viewModel.tsx' 'src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx' 'src/app/(maestro)/source/preview/workspace/buildViewModel.ts' 'src/app/(maestro)/source/preview/workspace/canvases/ContractCanvas.tsx' 'src/app/api/source/workspace/contract/[contractId]/optimization/route.ts'`.
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- PASS: `npm run release:check`.
- PASS: `node --check scripts/source/audit-contract-optimization-evidence-readiness.mjs`.
- PASS: `npx eslint scripts/source/audit-contract-optimization-evidence-readiness.mjs`.
- PASS: `npx jest --runTestsByPath src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/read-adapter.test.ts --runInBand`.
- PASS: `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit --pretty false`.
- BLOCKED locally: `source:contract-optimization:evidence-audit --env-file=/Users/anand/Projects/nexus/.env.local` could not reach the private Azure Postgres DNS name from this machine. Run it through the ACA operator or from a VNet-attached shell for live DB proof.

## Rollout Plan

Merge through PR to `main`; `aca-main-deploy` builds and deploys automatically. No schema migration is required because this uses existing `source_events` and `source_event_facts` structures.

Post-deploy proof should open `/source/preview/workspace`, select a material contract, open `Optimization`, confirm the four-ledger cockpit renders, click `Start / continue Door 1 workflow`, and confirm a `contract_optimization` event opens at the human approval gate.

Data proof should also run `npm run source:contract-optimization:evidence-audit -- --tenant=skyharbor_global --out-dir=/tmp/source-contract-optimization-evidence-readiness` inside the private VNet / ACA operator runtime.

## Deployment Authority

- Repo-owned deploy workflow: `aca-main-deploy.yml`.
- Shared runtime mutators: none.
- Approved image digest: assigned by the deploy workflow on merge.
- ACA runtime invariant: standard post-deploy check applies.
- Worker image invariant: not applicable.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes.

## Rollback Plan

Revert the PR and redeploy through the ACA main workflow. No schema rollback is required; the endpoint writes only existing `source_events` and `source_event_facts` rows.

## Audit Evidence

- PR diff for the files listed above.
- Local QA commands in this record.
- Post-deploy signed-in screenshots and network/console proof for the Source workspace Optimization tab and the Door 1 event approval gate.
- Operator output from `source:contract-optimization:evidence-audit` proving the four-ledger data readiness counts.

## Known Gaps

The implementation deliberately does not convert exposure into savings. Annual-to-actual variance remains workflow-required until classified. Realized value remains not established unless Tower carries an accepted or finance-cleared claim. Invoice-line leakage, duplicate charges, off-contract billing, rate-card variance, renewal-uplift avoidance, shelfware removal, and signed concessions remain explicit evidence gaps until their system-of-record extracts are loaded.
