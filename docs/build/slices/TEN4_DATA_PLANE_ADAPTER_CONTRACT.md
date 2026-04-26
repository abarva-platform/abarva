# TEN4 - Data Plane Adapter Contract

Slice ID: TEN4
Slice name: Data Plane Adapter Contract
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane A (Wave3 controlled multi-agent build)
Depends on: TEN1, TEN2, TEN3

## Purpose

TEN4 lands the **deterministic, file-pure read model** that defines
the provider-agnostic interfaces for every component of the AbarVa
data plane. It names the canonical adapter shapes — relational store,
object store, vector search, graph provider, evidence ledger, model
gateway provider, and audit store — so AbarVa can run on shared SaaS,
dedicated tenant, or private (customer-owned) deployments without
changing the runtime contract.

TEN4 is the **shape contract** for every adapter the live runtime will
resolve from the tenant adapter registry. It is the read-only
complement to:

- [TEN1](../../../src/lib/architecture/tenant-isolation-boundary.ts)
  via TEN2 — names the four canonical runtime planes (control,
  tenant-runtime, data-evidence, model-gateway). TEN4 defines the
  shape any adapter inside the data-evidence plane must implement.
- [TEN2](../../../src/lib/architecture/tenant-isolation-boundary.ts)
  — the tenant isolation enforcement read model. TEN4 adapters
  declare safety constraints that the TEN2 boundary catalog already
  names (tenant key required on every call, no cross-tenant read,
  empty tenant key refused, etc.).
- [TEN3](../../../src/lib/architecture/dedicated-tenant-blueprint.ts)
  — the dedicated-tenant deployment blueprint. TEN3 names the
  per-tenant data store envelope; TEN4 names the per-component
  adapter shape used inside any of those envelopes.

TEN4 is documentation- and contract-only. It does **not** provision
infrastructure, **not** authenticate, **not** run RLS, **not**
migrate, **not** invoke any provider SDK, **not** call fetch, **not**
read Date or Math.random, and **not** render any UI. Every export is
a const literal, an interface, or a pure accessor over the const
literals.

TEN4 does **not** promote any production-readiness component, does
**not** change the `production_deployment` status, and does **not**
claim that a live adapter exists. It records that the **adapter shape
contract** has landed and that real adapter implementations are still
deferred behind later slices.

## What Changed

- New module
  [`src/lib/architecture/data-plane-adapter-contract.ts`](../../../src/lib/architecture/data-plane-adapter-contract.ts)
  exposing:
  - Canonical tuples: `DATA_PLANE_ADAPTER_KINDS`,
    `DATA_PLANE_DEPLOYMENT_MODES`.
  - Adapter base shape `DataPlaneAdapterBase` with the four required
    metadata fields (`provider`, `capabilities`, `requiredEnvVars`,
    `safetyConstraints`) plus the canonical `kind` and provenance tag.
  - Per-component adapter interfaces: `RelationalStoreAdapter`,
    `ObjectStoreAdapter`, `VectorSearchAdapter`,
    `GraphProviderAdapter`, `EvidenceLedgerAdapter`,
    `ModelGatewayProviderAdapter`, `AuditStoreAdapter`.
  - Discriminated union `DataPlaneAdapter` covering every canonical
    kind.
  - Helpers: `buildDataPlaneAdapterContractSeed()` returns the
    deterministic seed example with one entry per canonical kind;
    `summarizeDataPlaneAdapters(adapters)` reconciles per-kind
    counts, per-kind providers, total required env vars, and total
    safety constraints; `validateDataPlaneAdapter(adapter)` surfaces
    missing fields and bad provenance tags.
  - Provenance tag: every emitted adapter carries
    `createdFrom: 'deterministic_data_plane_adapter_contract_seed'`.

- New companion suite
  [`src/__tests__/integration/architecture/data-plane-adapter-contract.test.ts`](../../../src/__tests__/integration/architecture/data-plane-adapter-contract.test.ts)
  proving:
  - All seven adapter shapes are representable (one seed entry per
    canonical kind, all required metadata fields populated).
  - Byte-equal determinism (seed and summary stringify identically
    across repeated calls).
  - The validator rejects adapters with empty `provider`,
    `capabilities`, `requiredEnvVars`, `safetyConstraints`, or wrong
    `createdFrom`.
  - The summary reconciles totals against the seed.
  - Module hygiene: no provider SDK imports (openai, anthropic,
    @anthropic-ai/*, @openai/*, aws-sdk, @azure/*, @google-cloud/*,
    pg, pinecone, neo4j-driver); no imports from `@/lib/source/`,
    `@/lib/sentinel/`, `@/lib/atlas/`, `@/lib/nexus/`,
    `@/lib/agent/`, `@/lib/auth/`; no supabase reference; no
    `Date.now`, `Math.random`, `new Date(`, or `fetch(` in code; no
    React state hooks; no placeholder copy.

## Out of Scope

- No live adapter implementation. TEN4 is a **shape** contract; the
  Postgres, Azure Blob, pgvector, pg-graph, AbarVa evidence ledger,
  AbarVa model gateway, and AbarVa audit stream classes land in later
  slices.
- No tenant adapter registry runtime. TEN4 records the shape every
  registry entry must satisfy; the registry resolver is a later slice.
- No provisioning automation, no migrations, no RLS, no live env-var
  loading, no live fetch, no live model invocation.
- No UI surface. The TEN4 contract is consumed by future provisioning
  code, the future tenant adapter registry, and review tooling — not
  by an end-user surface.
- No promotion of `production_deployment` or
  `data_evidence_knowledge_fabric`. Status stays at `blocked` and
  `scaffolded` respectively. The blueprint is contract-only.

## Why Safe

- File-pure module: every export is a const literal, an interface, or
  a pure accessor over the const literals. No runtime side effects.
- No vendor SDK import; no provider name appears as code identifier.
- No `Date.now`, `Math.random`, `new Date(`, or `fetch(` in code.
- Type-only references — TEN4 does not re-export TEN2 runtime
  symbols. The TEN2 boundary catalog is not duplicated.
- Comprehensive integration test (16 cases) including module hygiene
  with a `stripStringLiterals` pass so safety-constraint and env-var
  literals do not produce false positives.

## How to Re-run

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/data-plane-adapter-contract.test.ts
npx eslint --max-warnings=0 \
  src/lib/architecture/data-plane-adapter-contract.ts \
  src/__tests__/integration/architecture/data-plane-adapter-contract.test.ts
```

## Readiness Impact

- `data_evidence_knowledge_fabric` — status preserved at
  `scaffolded`. TEN4 names the per-component adapter shape every
  future evidence-ledger / vector / graph adapter must implement; it
  does NOT promote the component because no live adapter is wired.
- `production_deployment` — status preserved at `blocked`. TEN4 names
  the adapter shape that any future shared / dedicated / private
  deployment must satisfy; it does NOT deploy, NOT poll Vercel, NOT
  certify DNS, and NOT implement production observability.

## Validation Commands

- `npx tsc --noEmit --pretty false`
- `npx jest src/__tests__/integration/architecture/data-plane-adapter-contract.test.ts`
- `npx eslint --max-warnings=0 src/lib/architecture/data-plane-adapter-contract.ts src/__tests__/integration/architecture/data-plane-adapter-contract.test.ts`

## Acceptance Criteria

- `src/lib/architecture/data-plane-adapter-contract.ts` exports the
  seven canonical adapter interfaces (`RelationalStoreAdapter`,
  `ObjectStoreAdapter`, `VectorSearchAdapter`, `GraphProviderAdapter`,
  `EvidenceLedgerAdapter`, `ModelGatewayProviderAdapter`,
  `AuditStoreAdapter`); each declares `provider: string`,
  `capabilities: ReadonlyArray<string>`,
  `requiredEnvVars: ReadonlyArray<string>`, and
  `safetyConstraints: ReadonlyArray<string>`.
- The module exports `buildDataPlaneAdapterContractSeed()`,
  `summarizeDataPlaneAdapters(adapters)`, and
  `validateDataPlaneAdapter(adapter)`.
- Every emitted adapter carries
  `createdFrom: 'deterministic_data_plane_adapter_contract_seed'`.
- The integration test asserts all seven adapter shapes are
  representable, asserts byte-equal determinism, asserts the
  validator catches bad inputs, asserts the summary reconciles
  totals, and asserts module hygiene.
- `docs/build/build-slices.json` appends the TEN4 entry with status
  `code_complete`, risk `low`, and `lastUpdated 2026-04-26`.
- `docs/build/production-readiness.json` UNION-updates the
  `data_evidence_knowledge_fabric` and `production_deployment`
  notes / nextAction without overwriting prior wording, preserves
  every status, and bumps top-level `lastUpdated` to 2026-04-26.
- Read model only; no auth implementation changes, no RLS, no
  migrations, no live runtime claim; only the five allowed files are
  staged.
