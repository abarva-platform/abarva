# TEN3 - Dedicated Tenant Deployment Blueprint

Slice ID: TEN3
Slice name: Dedicated Tenant Deployment Blueprint
Status: code_complete
Authored: 2026-04-26
Primary agent: Lane E (controlled multi-agent build)
Depends on: TEN1, TEN2

## Purpose

TEN3 lands the **deterministic, file-pure read model** that
documents the canonical deployment shape for an AbarVa Tier 2
(Enterprise SaaS / Dedicated Tenant) onboarding, plus the
companion architecture document that names the dedicated database,
storage, vector and graph namespaces, per-tenant model gateway
policy, audit log boundary, customer SSO posture, tenant admin
separation, onboarding sequence, upgrade strategy, backup /
retention, and cost / ops considerations.

TEN3 is the **shape contract** for dedicated-tenant deployment.
It is the read-only complement to:

- [TEN1](../../architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md) —
  the SaaS tenancy architecture contract that names the four
  canonical tiers, the four canonical runtime planes, the three
  canonical isolation modes, the tenant registry, and the tenant
  data namespace.
- [TEN2](../../../src/lib/architecture/tenant-isolation-boundary.ts)
  — the tenant isolation enforcement read model that documents
  the canonical isolation envelope across persistence, vector
  indexes, graph stores, the Model Gateway, and unified audit
  events. TEN3 references TEN2's isolation level ladder via a
  type-only import; TEN3 does not duplicate the TEN2 boundary
  catalog.

TEN3 is documentation-only. It does **not** provision
infrastructure, **not** authenticate, **not** run RLS, **not**
migrate, and **not** call any vendor SDK. It exists so reviewers,
founders, and future provisioning code can agree on the same
dedicated-tenant deployment envelope before any tenant graduates
from Tier 1 (shared) to Tier 2 (dedicated).

TEN3 does **not** promote any production-readiness component, does
**not** change `production_deployment` status, and does **not**
claim a deployed environment exists. It records that the
**blueprint** has landed and that real Tier 2 tenant onboarding is
still deferred behind a production-grade data evidence plane and
the matching TEN2 (isolation enforcement), CLOUD1 (deployment
topology), TRUST1 (data trust posture), TRUST2 (agent data access
policy matrix), CLOUD1 (private deployment strategy), and CLOUD2
(Azure VNet reference lab) slices.

## What Changed

- New module
  [`src/lib/architecture/dedicated-tenant-blueprint.ts`](../../../src/lib/architecture/dedicated-tenant-blueprint.ts)
  exposing:
  - Canonical tuples: `DEDICATED_TENANT_READINESS_STATES`,
    `DEDICATED_TENANT_STORE_KINDS`,
    `DEDICATED_TENANT_ONBOARDING_STEP_KINDS`,
    `DEDICATED_TENANT_OPERATIONAL_SURFACES`,
    `DEDICATED_TENANT_CHECKLIST_CATEGORIES`.
  - Types: `DedicatedTenantDeploymentModel`,
    `DedicatedTenantDataStore`,
    `DedicatedTenantIsolationControl`,
    `DedicatedTenantOnboardingStep`,
    `DedicatedTenantOperationalResponsibility`,
    `DedicatedTenantReadinessChecklist`,
    `DedicatedTenantReadinessChecklistItem`,
    `DedicatedTenantBlueprintFinding`,
    `DedicatedTenantReadinessSummary`.
  - Helpers: `buildDedicatedTenantBlueprint()`,
    `summarizeDedicatedTenantReadiness(blueprint)`,
    `validateDedicatedTenantBlueprint(blueprint)`, plus
    list-helpers for every canonical tuple.
  - Type-only reference to `TenantIsolationLevel` from
    `@/lib/architecture/tenant-isolation-boundary` (TEN2). No
    runtime dependency on TEN2; TEN3 only borrows the level vocabulary.
- New companion suite
  [`src/__tests__/integration/architecture/dedicated-tenant-blueprint.test.ts`](../../../src/__tests__/integration/architecture/dedicated-tenant-blueprint.test.ts)
  asserting:
  - Determinism (byte-equal blueprint, checklist, and summary across
    repeated calls).
  - Canonical tuples are exact and ordered.
  - All required boundaries are present (database, storage, vector,
    graph, model_gateway, audit) on both data stores and isolation
    controls; every canonical onboarding step kind appears in
    contiguous sequence; every canonical operational surface is
    covered; every canonical checklist category is covered.
  - Validator detects missing store kinds, non-contiguous onboarding
    sequences, unknown isolation control storeKind values, missing
    operational surfaces, missing blockers on sub-pilot checklist
    items, and wrong `createdFrom` tags.
  - Summary reconciles totals byKind / byReadiness / byCategory.
  - Module hygiene: no auth / supabase / source / sentinel / atlas /
    nexus / agent imports; no `Date.now`, `Math.random`, `new Date(`,
    `fetch(`; no anthropic / openai / cohere / databricks / pinecone
    references; no React state hooks; no placeholder language; no
    fabricated dollar amounts; no `production_ready` substring in
    serialized output.
- New architecture document
  [`docs/architecture/TEN3_DEDICATED_TENANT_DEPLOYMENT_BLUEPRINT.md`](../../architecture/TEN3_DEDICATED_TENANT_DEPLOYMENT_BLUEPRINT.md)
  covering the full deployment blueprint — dedicated DB options
  (Postgres flexible per-tenant or schema-per-tenant fallback),
  dedicated storage (per-tenant blob containers / S3 buckets), vector
  and graph namespaces, per-tenant model gateway policy, audit log
  boundary, customer SSO, tenant admin, onboarding sequence, upgrade
  strategy, backup / retention, cost / ops considerations, and
  cross-references to TEN1, TEN2, TRUST1, TRUST2, CLOUD1, CLOUD2.
- `docs/build/build-slices.json` appends a TEN3 entry with this
  slice's allowedFiles, forbiddenFiles, validationCommands, dependsOn
  (TEN1, TEN2), status `code_complete`, risk `low`, ownerAgent
  `Lane E`, and `lastUpdated 2026-04-26`.
- `docs/build/production-readiness.json` updates
  `production_deployment` and `admin_setup` notes / nextAction
  conservatively (UNION; no promotions; no false production-ready
  claim) and bumps top-level `lastUpdated` to `2026-04-26`.

## What Is Out of Scope

- No application code outside the new module.
- No runtime, no auth, no Supabase, no migrations, no provisioning
  automation, no Infrastructure-as-Code, no live cloud calls, no
  model calls, no browser automation.
- No promotion of any production-readiness component status. TEN3
  is contract-only and `production_deployment` remains `blocked`.

## Why This Is Safe

- The TEN3 module imports only the `TenantIsolationLevel` *type*
  from TEN2 — no runtime symbols cross the boundary.
- The seed data is a frozen literal; `buildDedicatedTenantBlueprint`
  returns the same reference on every call, so determinism is
  structural.
- The validator rejects non-contiguous onboarding sequences,
  unknown store kinds, and missing canonical surfaces — every
  later slice that wires Tier 2 provisioning can re-use the same
  validator without re-deriving the canonical vocabulary.
- The test suite asserts the file does not import auth, supabase,
  source, sentinel, atlas, nexus, or agent runtime, and that the
  serialized output never contains `production_ready` or a vendor
  model name.

## How To Re-Run

```bash
cd <worktree-root>
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/dedicated-tenant-blueprint.test.ts
npm run build
node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"
```

## Production Readiness Impact

`production_deployment` status is preserved at `blocked`. TEN3 is a
documentation + read-model slice and adds **no** deployment, route
smoke, DNS, observability, or compliance certification. Tier 2
(dedicated) onboarding remains deferred behind:

- A production-grade data evidence plane (TEN1 §I.2 V1 milestone).
- Live tenant isolation enforcement (TEN2 successor slice).
- Live data trust posture (TRUST1) and agent data access policy
  matrix wiring (TRUST2 successor slice).
- The deployment topology contract (CLOUD1) and the Azure VNet
  reference lab (CLOUD2), plus the GCP VPC reference lab (CLOUD3,
  named in CLOUD1).

`admin_setup` status is preserved at `code_complete`. TEN3 names
the dedicated-tenant deployment shape that the Steward control
plane will surface against once Tier 2 provisioning is implemented;
no admin runtime is added by this slice.

## Cross-References

- [TEN1 — SaaS Tenancy Architecture](../../architecture/TEN1_SAAS_TENANCY_ARCHITECTURE.md)
- [TEN2 — Tenant Isolation Data Boundary Model](../../../src/lib/architecture/tenant-isolation-boundary.ts)
- [TRUST1 — Dataset Trust Model + Data Sharing Levels](./TRUST1_DATASET_TRUST_MODEL.md)
- [TRUST2 — Agent Data Access Policy Matrix](./TRUST2_AGENT_DATA_ACCESS_POLICY_MATRIX.md)
- [CLOUD1 — Enterprise Private Deployment Strategy](../../architecture/CLOUD1_ENTERPRISE_DEPLOYMENT_MODELS.md)
- [CLOUD2 — Azure VNet Reference Lab](../../architecture/CLOUD2_AZURE_VNET_REFERENCE_LAB.md)
- [ARCH1 — Agentic Platform Architecture Contract](../../architecture/ARCH1_AGENTIC_PLATFORM_ARCHITECTURE_CONTRACT.md)
- [MG2 — Model Gateway Stub](./MG2_MODEL_GATEWAY_STUB.md)
- [AUD2 — Unified Audit Event Read Model](./AUD2_UNIFIED_AUDIT_EVENT_READ_MODEL.md)

## Status

`code_complete`. Pending integration agent merge.
