# MG3 - Model Gateway Safe Integration Contract

Slice ID: MG3
Slice name: Model Gateway Safe Integration Contract
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Adds a contract-only module describing the safety boundary for the
eventual live Model Gateway runtime. MG3 names the callers, request
classifications, model tiers, redaction policies, audit requirements,
cost caps, fallback chain, and forbidden integration patterns the
live gateway must enforce. **No live gateway runtime. No model call.
No SDK import. No network. No Date.now. No randomness. No agent /
source / sentinel / atlas / auth imports. No UI.**

MG3 is intentionally a contract slice, not a runtime slice. The live
model invocation continues to be deferred. Until the live gateway
ships, MG2 (the deterministic stub) remains the runtime placeholder
every caller compiles against; MG3 specifies WHAT the live runtime
must enforce when it eventually replaces the stub.

## Why a contract before a live gateway

Three prior gateway slices set the boundary; MG3 closes the contract
loop without taking on runtime risk:

1. **MG1** - architecture-level contract (ARCH1 section 6, "the
   single chokepoint for every model call"). Names the live behavior
   plan: single chokepoint, provider-agnostic prompts, audit-by-
   default, typed refusals, tenant scope.
2. **MG2** - deterministic stub
   [src/lib/architecture/model-gateway-stub.ts](../../../src/lib/architecture/model-gateway-stub.ts).
   Returns `decision: 'dry_run'` for well-formed input and
   `decision: 'block'` (with a typed reason) for malformed input.
   Never invokes a provider. Landed in PR #253.
3. **MG3** - this slice. The integration contract: a typed
   description of the callers, classifications, tiers, redaction
   policies, audit requirements, cost caps, fallback chain, and
   forbidden patterns the live gateway must honor.

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
(future) live   wires a single provider behind the gateway boundary
```

The contract module exists so the live gateway implementation slice
(future MG4 / MG5) can be reviewed against a typed, code-checked
specification rather than a prose document. Every constraint is
expressed as a `readonly` constant or a pure accessor, so a static
scan can confirm the live module honors the contract.

## What changed

- New module
  [src/lib/architecture/model-gateway-integration-contract.ts](../../../src/lib/architecture/model-gateway-integration-contract.ts):
  - Public type unions:
    `GatewayCaller`, `GatewayRequestClassification`,
    `GatewayModelTier`, `GatewayRoutingDecision`,
    `GatewaySafetyDecision`, `GatewayForbiddenPattern`.
  - Public interfaces:
    `GatewayCostPolicy`, `GatewayAuditRequirement`,
    `GatewayFallbackPolicy`, `GatewayIntegrationPolicy`,
    `GatewayRequestClassificationMetadata`,
    `GatewayCallerMetadata`.
  - Public constants:
    `GATEWAY_CALLER_KINDS`, `GATEWAY_REQUEST_CLASSIFICATIONS`,
    `GATEWAY_MODEL_TIERS`, `GATEWAY_FORBIDDEN_PATTERNS`,
    `GATEWAY_REQUEST_CLASSIFICATION_METADATA`,
    `GATEWAY_CALLER_METADATA`, `GATEWAY_INTEGRATION_POLICY`.
  - Public accessors:
    `getGatewayCallerMetadata`,
    `getGatewayClassificationMetadata`,
    `summarizeGatewayIntegrationPolicy`.
  - Imports nothing. The contract is fully self-contained. No
    dependency on MG2; the stub is its compatible runtime
    placeholder, but the contract stands alone.

- New tests
  [src/__tests__/integration/architecture/model-gateway-integration-contract.test.ts](../../../src/__tests__/integration/architecture/model-gateway-integration-contract.test.ts):
  29 deterministic tests covering caller / classification / tier /
  audit / cost / fallback / forbidden-pattern coverage, the routing-
  decision union, the pure accessors, the policy summary, and module
  hygiene.

## Caller surface

Six caller kinds are recognized; the live gateway must reject any
caller outside this set:

| Caller     | Description                                                                                               | Default tier        |
|------------|-----------------------------------------------------------------------------------------------------------|---------------------|
| `nexus`    | Founder-facing program intelligence agent. Composes briefs, recommendations, and synthesis.              | `tier_a_premium`    |
| `sentinel` | Pattern-detection agent. Classification / extraction / evidence checks against tenant signals.           | `tier_b_balanced`   |
| `atlas`    | Executive-fidelity synthesis agent. Tenant-scoped synthesis and recommendation calls.                    | `tier_a_premium`    |
| `steward`  | Ops / governance agent. Audit and evaluation calls against gateway responses.                            | `tier_c_economy`    |
| `system`   | Internal scheduled jobs / background workers under a service tenant scope.                               | `tier_c_economy`    |
| `admin`    | Founder / operator control-plane caller. Audit and evaluation only; the only path that reads cross-class audit chains. | `tier_c_economy`    |

Each caller carries a `description`, an `allowedClassifications`
list, a `defaultTier`, and `enforcementNotes` describing the
caller-specific guardrails (tenant isolation, evidence basis,
closed vocabulary, declared sources).

## Request classifications

Seven classifications are recognized:

| Classification    | Default tier         | Redaction | Audit | Notes                                                                          |
|-------------------|----------------------|-----------|-------|--------------------------------------------------------------------------------|
| `recommendation`  | `tier_a_premium`     | yes       | yes   | Rationale + evidence basis required; missing evidence is a hard refusal.       |
| `synthesis`       | `tier_b_balanced`    | yes       | yes   | Output must declare contributing sources; no cross-tenant references.          |
| `classification`  | `tier_b_balanced`    | no        | yes   | Closed vocabulary only; no free-form output.                                   |
| `extraction`      | `tier_b_balanced`    | yes       | yes   | Fixed schema; PII fields redacted before the call leaves the gateway.          |
| `evidence_check`  | `tier_a_premium`     | yes       | yes   | Refuses fabrication; missing or weak evidence is a hard block.                 |
| `audit`           | `tier_c_economy`     | no        | yes   | Audit calls are themselves audited (the audit chain is reconstructable).      |
| `evaluation`      | `tier_d_local_only`  | yes       | yes   | Local-only by default so eval fixtures never leave tenant or process boundary. |

## Model tiers

Four tiers are listed in `GATEWAY_INTEGRATION_POLICY.modelTiersAllowed`:

| Tier                  | Use                                                                                       |
|-----------------------|-------------------------------------------------------------------------------------------|
| `tier_a_premium`      | High-fidelity recommendations / evidence checks where rationale must be defensible.       |
| `tier_b_balanced`     | Standard synthesis / classification / extraction calls.                                   |
| `tier_c_economy`      | Audit / system / scheduled-job calls; cost-sensitive defaults.                            |
| `tier_d_local_only`   | Reserved for redaction-required cases where the redaction pipeline is not yet ready, and for evaluation runs that must never leave tenant or process boundary. |

The fallback chain runs in order
`tier_a_premium -> tier_b_balanced -> tier_c_economy -> tier_d_local_only`.
The chain is triggered by named blocked reasons that should
downgrade rather than refuse - `model_tier_unavailable`,
`cost_budget_exceeded`, `provider_transient_error`,
`live_gateway_not_implemented`. Other blocked reasons (PII leak,
tenant violation, evidence weakness) are hard refusals, not
fallback triggers.

## Redaction policies

Four redaction policies are required on the live gateway:

- `redact_pii` - personally identifying fields are redacted before
  the call leaves the gateway boundary.
- `redact_secrets` - credentials, API keys, and similar tokens are
  removed entirely.
- `redact_evidence_metadata` - evidence-store internal identifiers
  and provenance pointers are redacted.
- `redact_tenant_isolation` - tenant identifiers are scoped to the
  caller's tenant; cross-tenant references are refused.

## Audit requirements

The contract names seven audit requirements; all five spec-required
keys are blocking, plus two additional non-blocking-but-required
entries (`tenant_scope_recorded`, `cost_estimate_recorded`):

| Key                                       | Applies to                          | Blocking |
|-------------------------------------------|-------------------------------------|----------|
| `every_request_audited`                   | all 7 classifications               | yes      |
| `evidence_check_requires_evidence_basis`  | `evidence_check`                    | yes      |
| `recommendation_requires_rationale`       | `recommendation`                    | yes      |
| `write_classifications_require_approval`  | `recommendation`, `synthesis`       | yes      |
| `model_selection_traced`                  | all 7 classifications               | yes      |
| `tenant_scope_recorded`                   | all 7 classifications               | yes      |
| `cost_estimate_recorded`                  | all 7 classifications               | no       |

Every audit record must reconstruct (a) the caller and tenant
scope, (b) the classification, (c) the model selection (canonical
name, tier, fallback chain considered), (d) the rationale or
evidence basis where applicable, and (e) a cost estimate that the
post-call ledger entry reconciles against.

## Cost policy

Three budget caps are enforced (hardcoded conservative defaults):

| Cap                              | Cents | Rationale                                                                |
|----------------------------------|-------|--------------------------------------------------------------------------|
| `perRequestBudgetCentsCap`       | 50    | Per-call ceiling; protects against runaway prompts.                      |
| `perTenantDailyBudgetCentsCap`   | 5000  | Per-tenant per-day ceiling; protects against runaway tenant traffic.     |
| `perAgentBudgetCentsCap`         | 1500  | Per-agent ceiling; protects against a single agent dominating the bill.  |

Both `costEstimateRequired` and `costAuditRequired` are `true` -
every request carries a pre-call estimate and the post-call audit
entry reconciles against it.

## Fallback policy

```text
GatewayFallbackPolicy
  enableFallback: true
  fallbackChainTiers: [
    'tier_a_premium',
    'tier_b_balanced',
    'tier_c_economy',
    'tier_d_local_only',
  ]
  blockedReasonsThatTriggerFallback: [
    'model_tier_unavailable',
    'cost_budget_exceeded',
    'provider_transient_error',
    'live_gateway_not_implemented',
  ]
```

The chain runs strictly in tier order; every step emits a fresh
audit entry naming the reason for the downgrade. Fallback never
crosses tenant scope or weakens redaction.

## Forbidden integration patterns

`GATEWAY_FORBIDDEN_PATTERNS` is a `readonly` tuple of eight named
anti-patterns. Each string is a single source of truth for the
future CI scanner that will reject any module outside the gateway
boundary that matches one of them:

```ts
export const GATEWAY_FORBIDDEN_PATTERNS = [
  'agent_direct_provider_call',
  'page_direct_provider_call',
  'unaudited_model_call',
  'sdk_import_outside_gateway',
  'fetch_to_provider_endpoint',
  'env_secret_exposed_to_browser',
  'unredacted_pii_to_provider',
  'cross_tenant_request',
] as const;
```

The strings appear inside a string-array literal only. The module
itself imports zero provider SDKs and references no provider name
in real code; the hygiene scanner strips string literals before
testing for forbidden tokens, so the array does not produce false
positives.

## Routing-decision and safety-decision unions

`GatewayRoutingDecision` covers `'allow' | 'block' | 'defer' |
'route_to_fallback' | 'dry_run'` - the same vocabulary the MG2
stub already returns, extended only by `'allow'` (reserved for the
live gateway) and `'route_to_fallback'` (also reserved).

`GatewaySafetyDecision` covers
`'safe' | 'block_pii' | 'block_secrets' | 'block_evidence_leak' |
'redact_required' | 'tenant_violation'` - the safety verdict the
live gateway emits before the routing decision.

## What is intentionally NOT in MG3

- **Live model invocation.** MG3 is contract-only. No SDK import,
  no fetch, no provider call. The live runtime slice (future MG4
  / MG5) will own the wiring.
- **Redaction pipeline.** MG3 names the four required redaction
  policies but does not implement them.
- **Audit ledger persistence.** MG3 names the audit requirements
  but does not write to a ledger; persistence remains a separate
  slice.
- **CI lint rule.** `GATEWAY_FORBIDDEN_PATTERNS` is exported; the
  static-source scanner that enforces it across the codebase is a
  separate slice.
- **Provider price table.** Cost caps are policy ceilings; the
  per-call estimate logic remains the live gateway's
  responsibility.
- **Runtime caller authentication.** The contract names the six
  allowed caller kinds; the live gateway must authenticate the
  caller against those kinds before honoring the request.

## Hygiene invariants

- No `import OpenAI`, no `import Anthropic`, no
  `from 'openai'`, no `from 'anthropic'`, no
  `from '@anthropic-ai/sdk'`, no `from '@openai/sdk'`.
- No `Date.now`, no `Math.random`, no `new Date(`, no `fetch(`.
- No React state / effect hooks.
- No imports from `@/lib/sentinel`, `@/lib/atlas`, `@/lib/nexus`,
  `@/lib/source`, `@/lib/agent`, `@/lib/auth`, or `supabase`.
- No `Coming soon`, `TBD`, or `Lorem ipsum` placeholder copy.
- All accessors are pure: same input -> byte-equal output across
  calls.

## Validation commands

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/model-gateway-integration-contract.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

All four pass on 2026-04-25.

## Future slices that build on MG3

- **MG4 - Static source scanner.** Codifies
  `GATEWAY_FORBIDDEN_PATTERNS` as a CI scanner that fails the
  build when any module outside `src/lib/architecture/model-
  gateway-*` matches an anti-pattern.
- **MG5 - Live gateway runtime.** Wires a single provider SDK
  behind the gateway boundary. Replaces MG2's `dry_run` with real
  `allow` / `route_to_fallback` decisions, real cost tracking,
  real prompt hash, real audit-ledger persistence. The runtime
  slice consumes MG3 as its specification.
- **MG6 - Gateway -> CTX2 binding.** Reads the CTX2 unified
  context pack inside the live gateway; refuses on
  `quality === 'refused'`, downgrades on `quality === 'weak'`.

## Acceptance criteria mapping

- All 6 caller kinds covered with metadata - `GATEWAY_CALLER_METADATA`
  + caller-coverage tests.
- All 7 classifications covered with metadata -
  `GATEWAY_REQUEST_CLASSIFICATION_METADATA` + classification-
  coverage tests.
- All 4 tiers in `GATEWAY_INTEGRATION_POLICY.modelTiersAllowed`,
  with `tier_d_local_only` reserved for redaction-required cases -
  tier-coverage test + classification metadata for `evaluation`.
- `liveExecution: false` always - top-level invariant test.
- Cost policy includes per-request, per-tenant-daily, and per-agent
  budget caps - top-level invariant test.
- >= 5 audit requirements covering every-request audit,
  evidence_check evidence basis, recommendation rationale, write-
  classification approval, model selection traced - audit-coverage
  test asserts the canonical keys.
- `GATEWAY_FORBIDDEN_PATTERNS` includes the 8 canonical strings -
  forbidden-pattern coverage test asserts the exact list.
- `GATEWAY_INTEGRATION_POLICY.callersForbidden` lists patterns that
  bypass the gateway (`page_component`, `agent_direct_provider_call`)
  - top-level invariant test.
- Fallback policy lists the standard
  `tier_a -> tier_b -> tier_c -> tier_d` chain - fallback-coverage
  test.
- No actual SDK import statements anywhere - module-hygiene test
  with `stripStringLiterals` so the FORBIDDEN_PATTERNS array does
  not produce false positives.
- Pure accessors return metadata for known input and `null` for
  unknown / empty input - dedicated accessor tests.
- `summarizeGatewayIntegrationPolicy` reconciles the totals - the
  summary test compares against the canonical lists.
