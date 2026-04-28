# ADM3 · Dataset Domain Inventory Read Model

Slice ID: ADM3
Slice name: Dataset Domain Inventory Read Model
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-24
Author: Code (sole)

Adds a deterministic dataset-domain inventory read model that the
future Dataset Explorer UI (ADM4) consumes. Implements the ADM1 §I
(Data Explorer field set) and ADM1 §J (loaded → usable evidence
states) contracts. **No live connector sync, no upload pipeline, no
production evidence registry, no DB persistence, no Steward runtime,
no model calls, no migrations.**

## What changed

- New module
  [src/lib/admin/dataset-domain-inventory.ts](../../../src/lib/admin/dataset-domain-inventory.ts):
  - Public types: `DatasetSourceType`, `DatasetParseStatus`,
    `DatasetFreshnessState`, `DatasetEvidenceUsability`,
    `DatasetAgentUsePermission`, `DatasetDomainKey`,
    `DatasetInventoryItem`, `DatasetDomainInventorySummary`,
    `DatasetDomainInventory`.
  - Public helpers:
    - `buildDatasetDomainInventory()` — full inventory + summary.
    - `buildDatasetDomainInventoryForDomain(domainKey)` — domain-
      scoped subset; `[]` for unknown / not_started keys.
    - `summarizeDatasetDomainInventory(items)` — pure aggregator.
  - Re-exports: `DATASET_DOMAIN_KEYS_IN_ORDER`,
    `DATASET_USABILITY_STATES_IN_ORDER`,
    `DATASET_PARSE_STATES_IN_ORDER`.

- New tests
  [src/__tests__/integration/admin/dataset-domain-inventory.test.ts](../../../src/__tests__/integration/admin/dataset-domain-inventory.test.ts):
  26 deterministic tests across 8 describe blocks covering: read
  model determinism, all 12 canonical domains in summary.byDomain,
  per-domain query (active vs not_started), required ADM1 §I field
  set per item, unique ids, loaded / available / usable distinction,
  honest source / connector / E-id / agent invariants, summary
  reconciliation, no-invented-dollar-values, and module hygiene
  (no imports from Source UI, Nexus / Sentinel / Atlas / Agent
  runtime, legacy /programs, mock.ts, auth, supabase).

## What is deterministic today

- Inventory is byte-equal across repeated calls.
- 8 of 12 canonical domains carry seeded items (Strategy, KPI,
  Architecture, App Portfolio, AI Portfolio, Risk / Compliance,
  Evidence, Org). The remaining 4 (Infrastructure, Vendor,
  AI Tool Adoption, DORA) are honestly empty — they appear in
  `summary.byDomain` with count 0 but emit no items.
- Item ids follow `ds:<domainKey>:<slug>` and are unique.
- Every item carries the full ADM1 §I field set: id, domainKey,
  domainName, name, sourceType, owner, tenantScope, connector,
  parseStatus, freshnessState, recordOrChunkCount, linkedPrograms,
  linkedPatterns, linkedTowerSignals, evidenceUsabilityState,
  agentsAllowedToUse, missingMetadata, stewardGuidance,
  createdFrom.
- Items span the canonical 9-state evidence usability progression
  (loaded → parsed → indexed → classified → scoped → cited →
  quality_checked → usable_as_evidence → blocked).
- Blocked items only allow `steward` in `agentsAllowedToUse` (test
  enforced).
- No item claims `sourceType: 'connector'` or carries a non-null
  `connector` value today (test enforced).
- No item references a real `E-###` evidence citation (test
  enforced).
- No item invents a dollar amount in any string field (test
  enforced).

## How it implements ADM1 §I and §J

The inventory item shape mirrors the ADM1 §I Data Explorer field
contract row-for-row. The `evidenceUsabilityState` column uses the
nine canonical states from ADM1 §J and respects the per-state agent-
usage rules described there (e.g., a `loaded`-only item never
permits Nexus or Atlas to use it as evidence).

The summary's `loadedTotal` / `availableTotal` / `usableTotal` triple
is the surface the Dataset Explorer UI (ADM4) and the Steward Brief
(ADM2) can consume to surface "loaded ≠ available ≠ usable" without
re-deriving from raw items.

## What is NOT yet live

- No live connector sync — every item carries `connector: null`.
- No upload pipeline — every `sourceType` is `upload` / `authored` /
  `generated`, never the runtime upload path.
- No production evidence registry — `linkedPatterns` and
  `linkedTowerSignals` are deterministic projections; no real E-id
  citation is asserted.
- No DB persistence — every call rebuilds from seed.
- No Steward runtime — `stewardGuidance` is authored static text.
- No model calls.

## What is deferred to ADM4 +

- **ADM4 — Dataset Explorer UI** consumes this inventory and renders
  the drillable list + drawer per ADM1 §I.
- **ADM5 / ADM7 / ADM9** drill into per-user, per-agent, and per-
  program views over the same inventory.
- **Connector sync engine** (future) flips `sourceType: 'connector'`
  on for live items; no contract change required here.
- **Upload pipeline** (future) flips per-item `loaded → parsed →
  indexed` automatically; no contract change required here.
- **Evidence registry** (future) populates real `E-###` ids in
  `linkedPatterns` / `linkedTowerSignals`; deferred until the
  registry slice lands.

## Honest fallbacks used

- Not-started domains emit zero items rather than fabricated ones.
- Items with parse failure honestly report `parseStatus: 'failed'`
  and `evidenceUsabilityState: 'blocked'`.
- Orphan items (no owner) report `owner: null` and surface a
  Steward action recommending owner assignment.
- `recordOrChunkCount` is `null` when not yet known (image-only
  artifacts pre-OCR, parse-failed items).
- Steward guidance always names the load-bearing limit without
  inventing a remediation timeline.
- Module imports nothing from Source UI, Nexus / Sentinel / Atlas /
  Agent runtime, legacy `/programs`, mock.ts, auth, or Supabase
  (test enforced).

## Validation

- `npx tsc --noEmit --pretty false` — pass
- `npx jest src/__tests__/integration/admin/dataset-domain-inventory.test.ts` — 26 passed
- Regression suites pass (S7, ADM2).
- `npm run build` — pass.

## Status

Code complete. Pending founder review.
