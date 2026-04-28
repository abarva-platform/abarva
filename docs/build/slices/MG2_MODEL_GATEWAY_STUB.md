# MG2 - Model Gateway Stub

Slice ID: MG2
Slice name: Model Gateway Stub
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)

Adds a deterministic, type-only stub for the Model Gateway chokepoint
named in ARCH1 section 6 ("the single chokepoint for every model
call"). MG2 names the request, response, audit, route, and refusal
contract types and exposes a routing function that NEVER calls a live
provider. **No model call. No SDK import. No network. No Date.now. No
randomness.**

MG2 is intentionally a stub. Live model invocation is deferred to a
future runtime slice. The stub exists so dependent slices (CTX2 ->
gateway, agent runtime -> gateway) can compile against a stable
contract without taking a dependency on a provider SDK or a
non-deterministic call.

## Why a stub before a live gateway

The ARCH1 / MG1 contract is the source of truth for the live model
gateway. On this worktree the standalone MG1 slice doc is not
present; the contract is summarized here so MG2 can compile and ship
without taking a hard dependency on a doc that may or may not have
landed in the source-of-truth main branch:

1. **Single chokepoint.** No other module may import `openai`,
   `anthropic`, or `@anthropic-ai/sdk`. The gateway is the only
   place a provider SDK is allowed - currently nowhere, since live
   invocation is unwired.
2. **Provider-agnostic prompts.** The gateway speaks in typed
   routes (canonical `modelName` + `tier` + `fallbackChain`), not
   raw provider strings.
3. **Audit-by-default.** Every call (including stub `dry_run` and
   `block` decisions) emits a fully populated audit record.
4. **Refusal contract.** Typed reasons, named in audit, surfaceable
   to the canvas as a missing-input chip.
5. **Tenant scope.** Every request is scoped to a `tenantKey`; an
   empty `tenantKey` is a hard block.

## What changed

- New module
  [src/lib/architecture/model-gateway-stub.ts](../../../src/lib/architecture/model-gateway-stub.ts):
  - Public types: `ModelGatewayDecision`, `ModelGatewayBlockedReason`,
    `ModelGatewayTier`, `ModelGatewayPolicy`, `ModelGatewayAgentKey`,
    `ModelGatewayRequest`, `ModelGatewayRoute`,
    `ModelGatewayAuditRecord`, `ModelGatewayResponse`,
    `ModelGatewayForbiddenPattern`.
  - Public functions: `createModelGatewayRequest`,
    `routeModelGatewayRequest`, `blockModelGatewayRequest`,
    `summarizeModelGatewayDecision`.
  - Public constant: `MODEL_GATEWAY_FORBIDDEN_PATTERNS` (string-array
    literal naming the SDK anti-patterns).
  - Imports nothing. The stub is fully self-contained; it does not
    even depend on CTX1 / CTX2 types because the contract is name-
    scoped (`contextPackRef` is a string opaque to the gateway).

- New tests
  [src/__tests__/integration/architecture/model-gateway-stub.test.ts](../../../src/__tests__/integration/architecture/model-gateway-stub.test.ts):
  27 deterministic tests covering byte-equal output, the dry_run /
  block branching, audit-record completeness on both branches, the
  forbidden-pattern constant, and module hygiene.

## Decision flow

```text
ModelGatewayRequest
        │
        ▼
routeModelGatewayRequest
        │
        ├── tenantKey empty?            -> block(tenant_scope_invalid)
        ├── agentKey not canonical?     -> block(tenant_scope_invalid)
        ├── intent empty?               -> block(context_pack_missing)
        ├── contextPackRef empty?       -> block(context_pack_missing)
        ├── redactionRequested?         -> block(redaction_required_but_not_supported)
        ├── modelTier unknown?          -> block(model_tier_unavailable)
        ├── estimatedCost > budget > 0? -> block(cost_budget_exceeded)
        │
        └── otherwise                   -> dry_run + typed route + audit
```

Every branch returns a fully populated `ModelGatewayResponse` whose
`audit` carries a deterministic `requestId`, the gateway version,
the deduped + sorted `policiesApplied`, the per-tier
`estimatedCostCents`, and a `trace.promptHashSeed` derived from the
request fields.

## Decision and reason vocabulary

| Decision            | Meaning                                                              |
|---------------------|----------------------------------------------------------------------|
| `allow`             | Reserved for the live gateway; the stub never returns this.          |
| `block`             | Request is malformed or refused; typed reason names the cause.       |
| `defer`             | Reserved for the live gateway (e.g. queue-and-retry).                |
| `dry_run`           | Stub-only path. Well-formed request; no live call performed.         |
| `route_to_fallback` | Reserved for the live gateway when primary model errors.             |

| Reason                                  | Used by stub |
|-----------------------------------------|--------------|
| `live_gateway_not_implemented`          | reserved (caller-driven block helper)                |
| `context_pack_missing`                  | yes - empty intent or empty contextPackRef           |
| `evidence_unusable`                     | reserved (caller-driven block helper)                |
| `governance_constraint_violation`       | reserved (caller-driven block helper)                |
| `tenant_scope_invalid`                  | yes - empty tenantKey or non-canonical agentKey      |
| `redaction_required_but_not_supported`  | yes - request set redactionRequested = true          |
| `cost_budget_exceeded`                  | yes - estimated cost > explicit positive budget      |
| `model_tier_unavailable`                | yes - unknown modelTier                              |

`blockModelGatewayRequest(request, reason)` is the public helper a
caller (e.g. CTX2 reporting `quality === 'refused'`) uses to record
an explicit block under any of the reserved reasons without ever
calling the routing function.

## Tier table

The stub hardcodes a deterministic per-tier table so audit records
are stable across calls:

| Tier               | Canonical model name              | Base cost (cents) | Fallback chain                                                        |
|--------------------|-----------------------------------|-------------------|-----------------------------------------------------------------------|
| `tier_a_premium`   | `canonical_premium_compose_v1`    | 24                | `canonical_balanced_compose_v1`, `canonical_economy_compose_v1`       |
| `tier_b_balanced`  | `canonical_balanced_compose_v1`   | 8                 | `canonical_economy_compose_v1`                                        |
| `tier_c_economy`   | `canonical_economy_compose_v1`    | 2                 | `canonical_local_rerank_v1`                                           |
| `tier_d_local_only`| `canonical_local_rerank_v1`       | 0                 | (none)                                                                |

The estimate adds `intent.length & 0xff` to the base cost so two
intents of different length yield different (but stable) audit
costs without ever consuming a real token count.

## Audit-record schema

Every response - block or dry_run - carries:

- `requestId` - `'mgw-stub-' + tenantKey + '-' + agentKey + '-' +
  hash12(intent)`. The 12-char hash is a deterministic djb2-style
  fold over `intent`; no `crypto` import.
- `tenantKey`, `agentKey`, `decision`, optional `reason`, optional
  `modelName`.
- `policiesApplied` - the request's `policies` deduped and sorted
  lexicographically for byte-equal determinism.
- `estimatedCostCents` - per the tier table above.
- `trace.gatewayVersion` - hardcoded `'mg2.stub.v1'`.
- `trace.promptHashSeed` - deterministic 12-char hash of
  `tenantKey | agentKey | contextPackRef | intent`.

## Honest note

`response.honestNote` is always present and always reads:

> Live gateway not implemented; this stub returns dry_run or block
> only and references the MG1 model gateway contract for the live
> behavior plan.

A surface that consumes this response cannot pretend a live call
happened: the note must be either rendered or stripped explicitly.

## Forbidden-pattern constant

`MODEL_GATEWAY_FORBIDDEN_PATTERNS` is a `readonly` tuple of five
named anti-patterns, exported so future lint rules and CI scanners
can reference a single source of truth:

```ts
export const MODEL_GATEWAY_FORBIDDEN_PATTERNS = [
  'import_openai_outside_gateway',
  'import_anthropic_outside_gateway',
  'page_level_provider_call',
  'agent_direct_provider_call',
  'unaudited_model_call',
] as const;
```

The strings appear inside a string-array literal only; the module
itself imports zero provider SDKs.

## What is intentionally NOT in MG2

- **Live model invocation.** No call to any provider. No fetch.
  No SDK import. The stub returns `dry_run` and stops. A future
  runtime slice will own the live wiring.
- **Real prompt assembly.** The stub names a `contextPackRef` but
  never reads or composes a CTX2 pack. The live gateway will pull
  the pack via the CTX2 builder and render the canonical prompt.
- **Real cost tracking.** Per-tier base + length seed only. The
  live gateway will use a provider price table and real token
  counts.
- **Real prompt hashing.** Deterministic 12-char fold only. The
  live gateway will use a real cryptographic hash.
- **CI lint rule.** The forbidden-pattern constant exists; the
  static-source check that enforces it across the codebase is a
  separate slice.
- **Persistence.** The audit record is returned in the response; the
  ledger persistence path is a separate slice.

## Hygiene invariants

- No `import OpenAI`, no `import Anthropic`, no
  `from 'openai'`, no `from 'anthropic'`, no
  `from '@anthropic-ai/sdk'`, no `from '@openai/sdk'`.
- No `Date.now`, no `Math.random`, no `new Date(`, no `fetch(`.
- No React state / effect hooks.
- No imports from `@/lib/sentinel`, `@/lib/atlas`, `@/lib/nexus`,
  `@/lib/source`, `@/lib/agent`, `@/lib/auth`, or `supabase`.
- No `Coming soon`, `TBD`, or `Lorem ipsum` placeholder copy.
- All routing / audit logic is pure: same input -> byte-equal output
  across calls.

## Validation commands

```bash
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/model-gateway-stub.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

All four pass on 2026-04-25.

## Future slices that build on MG2

- **MG3 - Live model gateway.** Wire a single provider SDK behind
  the gateway boundary; replace `dry_run` with real allow / route_to_
  fallback decisions. Real cost tracking, real prompt hash, real
  audit-ledger persistence.
- **MG4 - Static source-check.** Codify
  `MODEL_GATEWAY_FORBIDDEN_PATTERNS` as a CI scanner that fails the
  build when any module outside `src/lib/architecture/model-gateway-*`
  imports a provider SDK.
- **MG5 - Gateway -> CTX2 binding.** Read the CTX2 unified context
  pack inside the gateway; refuse on `quality === 'refused'`,
  downgrade on `quality === 'weak'`.

## Acceptance criteria mapping

- Defines the gateway request / response / audit / route /
  refusal contract types and the forbidden-pattern constant - see
  public type list and `MODEL_GATEWAY_FORBIDDEN_PATTERNS`.
- `routeModelGatewayRequest` deterministically returns
  `{ decision: 'dry_run', ... }` for any well-formed request -
  covered by determinism and well-formed test groups.
- Validation gates produce typed `block` decisions for empty
  `tenantKey`, non-canonical `agentKey`, missing `intent`, missing
  `contextPackRef`, redaction request, unknown tier, and budget
  overrun - covered by the malformed test group.
- `blockModelGatewayRequest` records caller-driven blocks - covered
  by the dedicated test.
- Audit record always populated on both branches - covered by the
  block-audit and dry_run-audit assertions.
- Cost estimate is deterministic per `(tier x intent)` - covered by
  the determinism test group.
- `honestNote` mentions "Live gateway not implemented" - covered by
  the well-formed and block-audit assertions.
- No provider SDK imports anywhere in the source - covered by the
  module-hygiene group with `stripStringLiterals` so the
  forbidden-pattern string literals do not produce false positives.
