# Airline All-Module Data-Plane Certification — 2026-07-29

## Executive Status

Airline Knowledge activation is complete and immutable. This report is the next gate: it certifies which product modules are actually bound to the governed Airline data plane and which still require migration or runtime proof.

- Tenant: `airline-demo-new`
- Active baseline: `airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1`
- Baseline hash: `135d860b9b104b2a2891fd108ea57286dc28bc057327498c63934c6552425549`
- Enterprise brief projection: `consumption.enterprise_brief_v1`
- Projection contract: `phase3c2d-consumption-contracts-v1.0.0`

## Data Flow Status

| Stage |Status |Evidence / note |
| --- | --- | --- |
| Frozen source release | Complete | Approved Airline corpus is frozen; no further source mutation in this lane. |
| Governed review decisions | Complete | 112,201 accepted and 152,029 deferred; no replay permitted. |
| Immutable domain publication | Complete | Accepted candidates were published into immutable Knowledge domains. |
| Active Knowledge Baseline | Complete | airline-demo-new-source-corpus-v1.0.0:knowledge-baseline-v1 |
| Consumption projections | Complete | Enterprise brief projection is live-proven available; projection contract is pinned. |
| Knowledge API activation | Complete | Signed-in /enterprise-brief canary returned 200 against the governed baseline. |
| aVa baseline binding | Complete | Foundation tenant aVa packets are server-bound to the active consumption envelope; signed-in chat proof remains in the module gate. |
| All-module migration | Open | Several modules still require runtime DB/provider certification and legacy-fallback removal. |
| Cube/Superset/Observable runtime | Open | Contracts/presentation exist; governed runtime and identity proof remain. |

## Module Certification Matrix

| Module |% |Classification |Baseline binding |Fixture dependency |Legacy dependency |Next action |
| --- | --- | --- | --- | --- | --- | --- |
| Home / Knowledge | 90% | migrated_and_proven | Required and live-proven | Admin fixture preview only; real foundation tenant HTTP path prohibits fixture namespace use | No SkyHarbor fallback on the live-proven canary path | Keep provider active; add same signed-in proof to normal tenant-user path after Clerk mapping. |
| aVa / Knowledge | 70% | partially_migrated_runtime_proof_pending | Enforced in this PR for foundation preview tenants | Deterministic provider remains model-unavailable fallback, not fixture data authority | No baseline identity accepted from browser for foundation tenants after this PR | Run signed-in aVa proof for Airline and capture baseline identity in the answer audit payload. |
| Intelligence | 45% | legacy_context_fenced_runtime_certification_pending | Not certified | Legacy broker fixtures are blocked for foundation tenants; static tenant-specific/context code remains for older demos | Requires proof that Airline cannot retrieve legacy V6/V7/SkyHarbor context | Add signed-in Airline Intelligence proof with legacy fixtures and Supabase unavailable. |
| Moves | 35% | partially_migrated_legacy_operational_risk | Required only when consuming enterprise context; not certified | Reference-mode fallbacks exist when moveId is absent/inaccessible | Program write seam is tenant-guarded; read/runtime route proof remains incomplete | Certify Moves runtime routes and disable reference-mode fallbacks for governed Airline routes. |
| Source | 40% | partially_migrated_legacy_operational_risk | Required for Knowledge handoff; not certified end-to-end | Source fixture views and event-instance fixtures remain in code | Source write seams are tenant-guarded; old SkyHarbor-specific routes remain disabled/unavailable for Airline until certified | Certify Source runtime routes and prove old fixture/default routes fail explicitly for Airline. |
| Tower | 40% | partially_migrated_legacy_operational_risk | Required for governed enterprise context; metrics remain Tower-owned operational projections | Static seeded vendor/portfolio and deterministic views remain | Aggregate/enterprise-summary seams are tenant-guarded; seeded deterministic Tower views remain to be disabled or proven unavailable for Airline | Certify Tower runtime routes and disable or prove unavailable any seeded deterministic Tower views for Airline. |
| Admin / Platform | 25% | partially_migrated_needs_sunset_controls | Only applicable where enterprise context is consumed | Admin preview fixtures remain intentionally available to platform admins | Needs controls preventing legacy tenant access and fixture tenant creation | Add CI/runtime controls for governed tenant legacy/fallback access. |
| Cube | 65% | contract_ready_runtime_proof_pending | Metric definitions and projection version required | No fixture use allowed in governed model | Validator prohibits raw source/working/publication/operations tables | Rerun Cube-to-PostgreSQL parity in the deployed Airline closure bundle. |
| Superset | 20% | presentation_ready_runtime_provisioning_pending | Required in dataset/dashboard metadata | Not certified | Not certified | Provision read-only governed identity and certify dashboard dataset identity. |
| Observable | 20% | presentation_ready_runtime_payload_pending | Required in payload identity | Not certified | Not certified | Verify Observable payload carries the same baseline/projection/metric identity. |

## Evidence Checks

### Home / Knowledge

- PASS — `src/lib/knowledge/consumption-server/db.ts` contains `refusing shared DATABASE_URL fallback`: Tenant-scoped consumption DB resolver fails closed instead of reading shared/old database.
- PASS — `src/app/api/knowledge/consumption/_shared.ts` contains `const ADMIN_HTTP_CANARY_TENANTS = new Set(["airline-demo-new"])`: Consumption endpoint resolves tenant server-side and restricts admin canary tenant override.
- PASS — `src/app/(maestro)/knowledge-preview/page.tsx` contains `const ADMIN_HTTP_CANARY_TENANT = "airline-demo-new"`: Signed-in preview route only permits the Airline HTTP canary tenant.

### aVa / Knowledge

- PASS — `src/app/api/knowledge/ava/route.ts` contains `bindAvaPacketToActiveConsumptionEnvelope`: Route overwrites browser-supplied baseline identity with active server envelope.
- PASS — `src/lib/knowledge/consumption-server/ava-packet-binding.ts` contains `ava_baseline_unavailable`: aVa fails closed when the active foundation baseline/projection is unavailable.

### Intelligence

- PASS — `src/app/api/intelligence/ask/route.ts` contains `governed_knowledge_consumption_required`: Legacy Home-tab Intelligence path fails closed for governed foundation tenants instead of using V6 Home fallback.
- PASS — `src/lib/knowledge/agent-context-broker.ts` contains `governed_consumption_required`: Enterprise context broker blocks foundation tenants from fixture and tenant-data fallback paths.
- PASS — `src/lib/tenant/foundation-tenants.ts` contains `airline-demo-new`: Foundation tenant allowlist is shared by auth/session and legacy-context fence code.
- PASS — `src/app/api/intelligence/ask/route.ts` contains `buildHomeKnowAgentAnswer`: Route still contains the old Home answer branch for non-foundation tenants; signed-in Airline proof must show it is fenced.
- PASS — `src/app/api/intelligence/ask/route.ts` contains `SkyHarbor`: Static tenant-specific logic remains and must be runtime-fenced from Airline Demo New.

### Moves

- PASS — `src/lib/data-plane/write-adapters/programsWriteAdapter.ts` contains `resolveDataPlaneForTenant`: Programs/Moves write seam now fails closed for governed tenants unless Azure/PostgreSQL is selected.
- PASS — `src/app/api/v1/moves/board-grade-master-dossier/route.ts` contains `REFERENCE MODE`: Board-grade routes retain reference/fallback behavior that must be disabled or certified for Airline.

### Source

- PASS — `src/lib/data-plane/write-adapters/sourceWriteAdapter.ts` contains `resolveDataPlaneForTenant`: Source write seam now fails closed for governed tenants unless Azure/PostgreSQL is selected.
- PASS — `src/app/api/v1/source/[eventId]/contract-optimization/brief/route.ts` contains `skyharbor-air`: A Source route still has an explicit SkyHarbor fallback and must not serve governed Airline.

### Tower

- PASS — `src/lib/data-plane/read-adapters/towerAggregateReadAdapter.ts` contains `resolveDataPlaneForTenant`: Tower aggregate adapter is tenant-aware and fails closed for governed tenants forced to Supabase.
- PASS — `src/lib/data-plane/read-adapters/enterpriseSummaryReadAdapter.ts` contains `resolveDataPlaneForTenant`: Tower enterprise-summary adapter is tenant-aware and fails closed for governed tenants forced to Supabase.
- PASS — `src/lib/tower/v7-tower-projection.ts` contains `V7`: Legacy V7 projection path remains and needs migration/sunset proof for Airline.

### Admin / Platform

- PASS — `src/lib/knowledge/consumption-client/factory.ts` contains `assertFixtureNamespace`: Fixture namespace guard exists for Knowledge preview, but platform-wide controls remain open.

### Cube

- PASS — `scripts/knowledge/validate-phase3c2e-executable-data-layer.mjs` contains `source_boundary: consumption_only`: Executable data-layer validator enforces Cube consumption-only source boundary.
- PASS — `clients/shared/21-phase3c2e-executable-data-layer/cube/knowledge_consumption_model.yml` contains `source_boundary: consumption_only`: Cube model declares the governed consumption-only boundary.

### Superset

- PASS — `clients/shared/20-phase3c2d-consumption-contracts/MODULE_CONSUMPTION_MAPPING.xlsx.inspect.ndjson` contains `Superset`: Presentation contract names the standard dashboard path, but runtime proof remains open.

### Observable

- PASS — `clients/shared/20-phase3c2d-consumption-contracts/MODULE_CONSUMPTION_MAPPING.xlsx.inspect.ndjson` contains `Observable`: Contract names the Observable story payload; runtime proof remains open.

## Decision

Static evidence checks passed. Airline is not fully migrated yet: Home/Knowledge is proven, aVa binding is fixed in this PR, and the remaining modules need runtime provider/DB proof or migration/sunset work.
