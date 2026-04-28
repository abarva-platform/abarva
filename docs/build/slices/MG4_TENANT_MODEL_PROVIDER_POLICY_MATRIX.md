# MG4 - Tenant Model Provider Policy Matrix

Slice ID: MG4
Slice name: Tenant Model Provider Policy Matrix
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Code (sole)

Adds a deterministic, file-pure read model that names the per-tenant
approved / blocked / deferred / requires_review decision for every
canonical model provider kind, together with the policy basis (data
classification, tenant admin decision, security review, governance
review, cost constraint) that produced each decision. **No live
gateway runtime. No model call. No SDK import. No network. No
`Date.now`. No randomness. No agent / source / sentinel / atlas /
auth imports. No UI.**

MG4 is intentionally a contract / read-model slice, not a runtime
slice. The live model invocation continues to be deferred. The
matrix is the source of truth a future runtime tool dispatcher and
the live Model Gateway will consult when a tenant request proposes
to invoke a particular provider for a particular purpose.

## Why a per-tenant policy matrix

The MG2 stub and MG3 contract describe **the gateway boundary**:
who may call, what classifications are allowed, which tiers exist,
which forbidden patterns the gateway must reject. None of those
slices answer the operationally hot question:

> Is **this tenant** allowed to use **this provider** for **this
> purpose**, and what evidence supports the decision?

MG4 closes that loop without taking on runtime risk. Each entry is a
typed decision plus a typed basis plus an honest rationale and (for
non-approved decisions) the next reviewer / step required to revisit.
The live gateway can call `evaluateTenantModelAccess(tenant,
provider, purpose)` and get a deterministic decision back.

The relationship is layered:

```text
ARCH1 / MG1     names the live plan (architecture-level)
    │
    ▼
MG2 stub        compiles the dry_run / block contract (runtime placeholder)
    │
    ▼
MG3 contract    names callers / classifications / audit / cost / fallback
    │
    ▼
MG4 matrix      names per-tenant approved / blocked / deferred / requires_review
                decisions per provider, with policy basis
    │
    ▼
(future) live   wires a single provider behind the gateway boundary
                and consults MG4 + MG3 + tenant audit ledger
```

## What changed

- New module
  [src/lib/architecture/tenant-model-provider-policy.ts](../../../src/lib/architecture/tenant-model-provider-policy.ts):
  - Type unions:
    `ModelProviderKind` (7 generic placeholders),
    `TenantModelPolicyDecision` (4 decisions),
    `TenantModelPolicyBasis` (5 bases),
    `TenantModelPolicyPurpose` (7 purposes mirroring the MG3
    classification vocabulary).
  - Interfaces:
    `TenantModelPolicyEntry`,
    `TenantModelPolicyMatrixSummary`,
    `TenantModelAccessEvaluation`.
  - Constants:
    `MODEL_PROVIDER_KINDS`, `TENANT_MODEL_POLICY_DECISIONS`,
    `TENANT_MODEL_POLICY_BASES`, `TENANT_MODEL_POLICY_PURPOSES`,
    `TENANT_MODEL_POLICY_TENANT_KEYS`.
  - Helpers (pure):
    `buildTenantModelPolicyMatrix()`,
    `evaluateTenantModelAccess(tenant, provider, purpose)`,
    `summarizeTenantModelPolicyMatrix(entries?)`.
- New test
  [src/__tests__/integration/architecture/tenant-model-provider-policy.test.ts](../../../src/__tests__/integration/architecture/tenant-model-provider-policy.test.ts):
  asserts vocabulary order, full decision / basis / provider
  coverage, approved-requires-basis invariant, byte-equal
  determinism, evaluator behavior for empty tenant / unknown pair /
  uncovered purpose, summary reconciliation, and module hygiene.

## Provider kinds (generic placeholders only)

| key                   | role                                            |
| --------------------- | ----------------------------------------------- |
| `provider_alpha`      | premium-tier hosted provider, generic placeholder |
| `provider_beta`       | balanced-tier hosted provider                     |
| `provider_gamma`      | economy-tier hosted provider                      |
| `on_prem_open_weight` | local-only open-weight model running in tenant   |
| `azure_oai`           | Azure-hosted OAI offering                         |
| `vertex_ai`           | Google Cloud Vertex AI offering                   |
| `bedrock`             | AWS Bedrock model offering                        |

The seed never names a real model id. The live gateway translates
canonical kinds into provider model ids inside the gateway boundary.

## Decisions

| decision           | meaning                                                                                  |
| ------------------ | ---------------------------------------------------------------------------------------- |
| `approved`         | Tenant + provider pair is approved for the listed purposes, with a non-empty basis      |
| `blocked`          | Tenant + provider pair is hard blocked; the basis names the policy that produced block  |
| `deferred`         | Decision deferred; a named cost / contract change is required to revisit                |
| `requires_review`  | Decision pending a named reviewer / step; the gateway must refuse until review completes |

## Policy basis values

| basis                    | meaning                                                                  |
| ------------------------ | ------------------------------------------------------------------------ |
| `data_classification`    | Tenant data classification disallows / constrains use of this provider   |
| `tenant_admin_decision`  | Tenant admin explicitly approved or blocked the provider                 |
| `security_review`        | AbarVa security review concluded posture is acceptable / unacceptable    |
| `governance_review`      | Governance lead must record / has recorded a contractual review          |
| `cost_constraint`        | Per-tenant cost envelope constrains use; revisit on renegotiation        |

## Coverage

The seed is dense by construction: every entry in
{ apexretail, meridianhealth, arcturuslogistics } x
{ provider_alpha, provider_beta, provider_gamma, on_prem_open_weight,
azure_oai, vertex_ai, bedrock } is present. The seed exercises:

- All 7 provider kinds at least once.
- All 4 decisions (`approved`, `blocked`, `deferred`,
  `requires_review`) at least once.
- All 5 basis values at least once.
- A healthcare tenant (meridianhealth) where the only approved
  provider is `on_prem_open_weight` (PHI must stay in tenant scope).
- A logistics tenant (arcturuslogistics) where bedrock is blocked on
  `cost_constraint + tenant_admin_decision` basis.

## Evaluator behavior

`evaluateTenantModelAccess(tenantKey, provider, purpose)` returns:

- `decision: 'blocked'` when `tenantKey` is empty (tenant scope is
  required for any decision).
- `decision: 'requires_review'` with `matchedEntryId: null` when no
  policy entry exists for the (tenant, provider) pair.
- `decision: 'requires_review'` with the entry's id when an entry
  exists but does not cover the requested purpose (the live gateway
  must refuse and surface the entry id to the reviewer).
- The matched entry's decision and basis otherwise.

## What is intentionally not in v1

- **No live model invocation.** No provider SDK. No network. No
  cost reconciliation against a real bill. The matrix is read-only
  metadata.
- **No persistence.** The seed is in-memory only. Live tenant policy
  storage, audit-ledger writes, and tenant admin UI are deferred to
  later slices.
- **No promotion of `model_gateway` or `agent_runtime` status.**
  MG4 is a read model the live runtime will consult; its arrival
  does not materially change either component's production
  readiness.

## Hygiene invariants (asserted by the test)

- No import of any provider SDK (`openai`, `anthropic`,
  `@anthropic-ai/sdk`, `@openai/sdk`, `cohere-ai`).
- No `Date.now` / `Math.random` / `new Date(` / `fetch(`.
- No imports from `@/lib/sentinel/`, `@/lib/atlas/`, `@/lib/nexus/`,
  `@/lib/source/`, `@/lib/agent/`, `@/lib/auth/`, or `supabase`.
- No `useState` / `useEffect`. No `Coming soon` / `TBD` /
  `Lorem ipsum` placeholder copy.
- Every entry tagged
  `createdFrom: 'deterministic_tenant_model_provider_policy_seed'`.

## Validation commands

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/tenant-model-provider-policy.test.ts
npx eslint src/lib/architecture/tenant-model-provider-policy.ts \
           src/__tests__/integration/architecture/tenant-model-provider-policy.test.ts \
           --max-warnings=0
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

## Future slices

- **MG5** - live gateway runtime that reads MG3 + MG4 + the tenant
  audit ledger and dispatches a real provider behind the gateway
  boundary. Replaces the MG2 stub.
- **MG6** - tenant policy admin UI / API that persists matrix
  edits to a tenant policy store and emits a `model_gateway_decision`
  audit event for every change.

## Acceptance criteria mapping

- All 7 provider kinds covered: see seed entries (3 tenants x 7
  providers = 21 entries).
- All 4 decisions covered: `approved` (apexretail / provider_alpha),
  `blocked` (meridianhealth / provider_beta),
  `deferred` (apexretail / azure_oai),
  `requires_review` (apexretail / provider_gamma).
- All 5 basis values covered: `data_classification`,
  `tenant_admin_decision`, `security_review`, `governance_review`,
  `cost_constraint`.
- Approved decisions require basis: enforced in seed and asserted by
  test.
- Byte-equal determinism: enforced by frozen seed and asserted by
  test.
- No live model imports: enforced by hygiene scanner on stripped
  source.
- Module hygiene: enforced by hygiene scanner on stripped source.
