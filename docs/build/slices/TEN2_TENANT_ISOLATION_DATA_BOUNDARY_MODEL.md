# TEN2 - Tenant Isolation Data Boundary Model

Slice ID: TEN2
Slice name: Tenant Isolation Data Boundary Model
Status: code_complete
Authored: 2026-04-26
Primary agent: Steward
Lane: B (parallel build pack)

## Purpose

TEN2 lands the deterministic, file-pure read model that documents the
canonical tenant isolation boundary stack across persistence (Postgres
row + schema), vector indexes, graph stores, the Model Gateway, and
unified audit events. It is the read-only complement to S7 (tenant
isolation decision probes) and the AUD2 / EVID2 / ADM3 read models.

TEN2 makes the *shape* of the tenant isolation envelope visible as a
typed object so reviewers, production-readiness checklists, and future
enforcement code can agree on the same structural model. It is not a
production tenant isolation runtime; it does not authenticate, run
RLS, migrate, or rewrite any guard helper.

## Scope

- In scope:
  - Canonical isolation level ladder
    `TenantIsolationLevel = 'logical_row_level' | 'schema_isolated' |
    'database_isolated' | 'environment_isolated' |
    'customer_private_data_plane'`.
  - Public types `TenantDataBoundary`, `TenantStorageBoundary`,
    `TenantVectorBoundary`, `TenantGraphBoundary`,
    `TenantModelGatewayBoundary`, `TenantAuditBoundary`,
    `TenantIsolationFinding`, `TenantIsolationSummary`.
  - Deterministic boundary seed across all five `kind` values
    (storage, vector, graph, model_gateway, audit).
  - Helpers: `listTenantIsolationLevels`,
    `buildTenantDataBoundaryModel`, `validateTenantBoundary`,
    `summarizeTenantIsolationBoundaries`.
  - Every boundary defines a non-empty `risk`, `mitigation`, and
    `auditRequirement`.

- Out of scope (deferred):
  - Any change to `src/lib/auth/**` decision functions.
  - Any RLS policy creation or migration.
  - Any binding to a live tenant runtime, evidence ledger, vector
    index, or graph store.
  - Any promotion of `production_deployment` or
    `data_evidence_knowledge_fabric` to `production_ready`.

## What Changed

- New module
  [src/lib/architecture/tenant-isolation-boundary.ts](../../../src/lib/architecture/tenant-isolation-boundary.ts):
  - Canonical isolation level tuple
    `TENANT_ISOLATION_LEVELS = ['logical_row_level',
    'schema_isolated', 'database_isolated', 'environment_isolated',
    'customer_private_data_plane']`.
  - Public types: `TenantIsolationLevel`,
    `TenantBoundaryStatus`, `TenantIsolationBoundaryBase`,
    `TenantStorageBoundary`, `TenantVectorBoundary`,
    `TenantGraphBoundary`, `TenantModelGatewayBoundary`,
    `TenantAuditBoundary`, `TenantDataBoundary`,
    `TenantIsolationFinding`, `TenantIsolationSummary`.
  - Public helpers: `listTenantIsolationLevels`,
    `buildTenantDataBoundaryModel`, `validateTenantBoundary`,
    `summarizeTenantIsolationBoundaries`.
  - Deterministic boundary seed covering:
    - `storage` (Postgres tenant rows, tenant config schema,
      customer-private warm cache).
    - `vector` (evidence vector index).
    - `graph` (knowledge fabric graph store).
    - `model_gateway` (gateway tenant binding).
    - `audit` (tenant-scoped audit event coverage).
  - Every boundary carries `risk`, `mitigation`, and
    `auditRequirement` strings, plus
    `createdFrom: 'deterministic_tenant_isolation_seed'`.

- New tests
  [src/__tests__/integration/architecture/tenant-isolation-boundary.test.ts](../../../src/__tests__/integration/architecture/tenant-isolation-boundary.test.ts):
  - Determinism: byte-equal serialized output across repeated calls.
  - Coverage: every kind appears, every isolation level appears,
    every boundary defines `risk`, `mitigation`, and
    `auditRequirement`.
  - Validation: rejects boundaries missing risk, mitigation, audit
    requirement, isolation level, or kind-specific fields; rejects a
    model_gateway boundary that does not require `tenantKey`; rejects
    an audit boundary with no tenant-scoped event types.
  - Summary reconciliation: `byKind`, `byIsolationLevel`, and
    `byStatus` all reconcile to `totalBoundaries`.
  - Module hygiene: the source must not import
    `@/lib/auth/**`, `@/lib/source/**`, `@/lib/sentinel/**`,
    `@/lib/atlas/**`, `@/lib/nexus/**`, `@/lib/agent/**`, supabase
    runtime, or supabase migrations; must not call `Date.now`,
    `Math.random`, `new Date(`, or `fetch(`; must not include vendor
    model names; must not include placeholder language; must not
    claim production tenant isolation is complete.

- Manifest update
  [docs/build/build-slices.json](../build-slices.json): TEN2 entry
  appended with allowedFiles, forbiddenFiles, validationCommands,
  acceptanceCriteria, dependsOn = `S7`, status `code_complete`, risk
  `low`, ownerAgent `Lane B`. Top-level `lastUpdated` bumped to
  2026-04-26.

- Manifest update
  [docs/build/production-readiness.json](../production-readiness.json):
  notes appended (UNION) on `production_deployment`, `admin_setup`,
  and `data_evidence_knowledge_fabric` to acknowledge TEN2 read
  model; `nextAction` UNIONed conservatively on the same three
  components without overwriting prior wording. No status promotion
  on any component. Top-level `lastUpdated` bumped to 2026-04-26.

## Why this is safe

- Server-only TypeScript. No client component, no React hook, no
  route handler.
- No auth implementation changes. S7 decision functions remain
  unchanged.
- No RLS, no migration, no schema mutation.
- No false claim that production isolation is complete: the test
  suite asserts the serialized model does not contain phrases like
  "production tenant isolation is complete" or "production_ready" and
  the readiness manifest does not promote any component.
- No vendor SDK invocation; the test suite asserts neither
  `anthropic` nor `openai` appears in the serialized model.

## How to re-run

```bash
cd /Users/anand/Projects/nexus-big-ten2
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/tenant-isolation-boundary.test.ts
npm run build
```

If `npm run build` panics on a Turbopack symlink (known harness
issue), replace the symlink temporarily, re-run, and restore.

## Readiness impact

- `validation_qa`: deterministic integration suite is added for the
  isolation boundary read model. No promotion.
- `production_deployment`: tracker note acknowledges TEN2 documents
  the isolation envelope; the component remains `blocked` because
  TEN2 does not deploy and does not exercise live tenant runtime.
- `admin_setup`: tracker note acknowledges TEN2 documents the
  envelope reused by admin surfaces; the component status is
  preserved.
- `data_evidence_knowledge_fabric`: tracker note acknowledges TEN2
  surfaces the storage / vector / graph / model gateway / audit
  isolation contract that future evidence ledger ingest must respect;
  the component remains `scaffolded`.
- `nextAction`: UNIONed on the three components above without
  overwriting prior wording.

## Out-of-scope guardrails

- No changes to `src/lib/auth/**`, `supabase/**`, `src/lib/source/**`,
  `src/lib/sentinel/**`, `src/lib/atlas/**`, `src/lib/nexus/**`,
  `src/lib/agent/**`.
- No new package added to `package.json` or `package-lock.json`.
- No CYCLE_STATE.md mutation.
- No platform-design canon mutation.
