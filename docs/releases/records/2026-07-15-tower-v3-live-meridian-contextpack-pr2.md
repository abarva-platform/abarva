# 2026-07-15-tower-v3-live-meridian-contextpack-pr2 — Tower V3 Live Meridian ContextPack Proof

## Release ID

`2026-07-15-tower-v3-live-meridian-contextpack-pr2`

## Status

`candidate`

## Plain-English Summary

This release candidate proves that Tower can assemble a Meridian TowerContextPack from active v3 tenant input files for the Tower-relevant dimensions. It does not claim Tower is fully v3-native and does not use `cio_tower` as source truth. Existing `cio_tower` rows remain bridge/read-model rows unless reconciled. Tower may show measurement and readiness context from this proof, but realized-value, proven-savings, or delivered-ROI language remains blocked unless the TowerValueClaim gate passes.

## Layer Impact

- Enterprise knowledge layer: Adds a Meridian TowerContextPack proof builder that reads active v3 tenant input dimensions 08, 09, 11, 14, 17, and 18.
- Tower read-model boundary: Preserves `cio_tower` as bridge-only and not v3-reconciled in this proof.
- Governance and audit: Adds generated proof artifacts showing source-dimension lineage, Tower record evidence, and value-claim gate status.
- Runtime UI: No runtime UI behavior changes.
- Data plane: No production tenant writes, no candidate creation, no candidate promotion, and no Active Tenant Access update.

## Client Applicability

- All clients: The Tower v3 ContextPack proof pattern and source-dimension lineage behavior are shared platform controls.
- Specific clients: The proof fixture reads Meridian Health active v3 tenant input files.
- Internal only: The generated audit reports are internal release evidence.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- `src/lib/enterprise-knowledge/tower/tower-v3-context-pack-from-tenant-inputs.ts`
- `src/lib/enterprise-knowledge/tower/__tests__/tower-v3-context-pack-from-tenant-inputs.test.ts`
- `scripts/audit/build-tower-v3-meridian-context-pack-proof.ts`
- `reports/tower-v3-meridian-context-pack-proof/`
- `package.json` script `audit:tower-v3-meridian-context-pack`
- Tower dimension lineage inference now honors explicit v3 dimension keys embedded in source-backed fact IDs before falling back to generic inference.

## QA / Validation

- Pass: `npx jest --runInBand src/lib/enterprise-knowledge/tower/__tests__/tower-v3-context-pack-from-tenant-inputs.test.ts src/lib/tower/__tests__/value-claim-gate.test.ts src/lib/enterprise-knowledge/assembler/__tests__/tower-context-pack-builder.test.ts`
- Pass: `npm run audit:tower-v3-meridian-context-pack`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Open this as a stacked draft PR after Tower v3 ContextPack PR1. This PR should not be deployed as Tower v3 completion. If merged later, it rolls out as proof tooling and contract-safe projection code only; it does not make Tower UI live v3-native by itself.

## Deployment Authority

- Repo-owned deploy workflow: Required for any future runtime deployment; not used by this PR.
- Shared runtime mutators: None.
- Approved image digest: Not applicable.
- ACA runtime invariant: Not applicable until a runtime deploy exists.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for this proof-only PR, but required before any claim that Tower runtime is live v3-native.

## Rollback Plan

Revert this PR to remove the proof builder, report script, tests, and release evidence. No data migration, production write, candidate promotion, Active Tenant Access update, or runtime flag is involved.

## Audit Evidence

- `reports/tower-v3-meridian-context-pack-proof/summary.json`
- `reports/tower-v3-meridian-context-pack-proof/proof.md`
- `reports/tower-v3-meridian-context-pack-proof/proof.html`
- `reports/tower-v3-meridian-context-pack-proof/source-dimension-lineage.csv`
- `reports/tower-v3-meridian-context-pack-proof/tower-record-lineage.csv`
- `reports/tower-v3-meridian-context-pack-proof/value-claim-gates.csv`

## Known Gaps

- This is live Meridian active v3 input proof, not Azure production runtime proof.
- This does not prove Tower UI is fully v3-native.
- This does not reconcile existing `cio_tower` rows row-by-row to v3 facts, evidence, entity profiles, and relationships.
- This does not add the missing actual-value source adapters needed for realized value claims.
