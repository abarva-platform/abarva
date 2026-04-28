# AGRT1 - Model Gateway Contract Plan

Slice ID: AGRT1
Slice name: Model Gateway Contract Plan
Status: code_complete
Authored: 2026-04-28
Author: Codex

AGRT1 is a docs-only contract-plan slice that defines the integration boundary
for a future runtime model gateway implementation. This slice exists to unblock
follow-on implementation while preserving deterministic behavior today.

No runtime code is changed in this slice.

## Scope boundary (hard)

Allowed in AGRT1:
- Contract-plan documentation in `docs/build/slices/**`
- Slice tracking update in `docs/build/build-slices.json`

Explicitly out of scope in AGRT1:
- `src/**` runtime/application changes
- `tests/**` execution or new test files
- package/dependency changes
- infra, deployment, migration, or auth changes

## Contract goals

1. Establish a single gateway boundary for all model-facing calls.
2. Define deterministic request/response contracts before runtime wiring.
3. Define safe fallback behavior when live model execution is unavailable.
4. Enforce no-fabrication and evidence-basis policy hooks.
5. Provide an integration-test plan outline for implementation slices.

## Request contract (planned)

```ts
type GatewayCaller = 'nexus' | 'sentinel' | 'atlas' | 'steward' | 'system' | 'admin';

type GatewayTask =
  | 'synthesis'
  | 'recommendation'
  | 'classification'
  | 'extraction'
  | 'evidence_check'
  | 'audit'
  | 'evaluation';

interface GatewayRequest {
  requestId: string;
  tenantId: string;
  caller: GatewayCaller;
  task: GatewayTask;
  prompt: string;
  evidenceRefs: string[];
  policy: {
    requireEvidenceBasis: boolean;
    noFabrication: true;
    maxOutputTokens?: number;
  };
  trace: {
    sourceLabel: 'deterministic_seed' | 'tenant_evidence' | 'mixed';
    initiatedAtIso: string;
  };
}
```

Contract rules:
- `tenantId`, `caller`, `task`, and `requestId` are required.
- `noFabrication` is always true.
- Requests requiring evidence basis must include non-empty `evidenceRefs`.
- Missing mandatory fields return typed refusal (not best-effort prose).

## Response contract (planned)

```ts
type GatewayDecision =
  | 'allow'
  | 'dry_run'
  | 'route_to_fallback'
  | 'block';

interface GatewayResponse {
  requestId: string;
  decision: GatewayDecision;
  outputText: string;
  confidenceLabel: 'high' | 'medium' | 'low' | 'no_signals';
  sourceLabel: 'deterministic_seed' | 'tenant_evidence' | 'mixed';
  missingInputs: string[];
  policyFlags: {
    noFabricationApplied: boolean;
    evidenceBasisSatisfied: boolean;
  };
  refusal?: {
    code:
      | 'missing_required_field'
      | 'missing_evidence_basis'
      | 'tenant_scope_violation'
      | 'policy_blocked'
      | 'gateway_unavailable';
    message: string;
  };
  audit: {
    traceId: string;
    caller: GatewayCaller;
    task: GatewayTask;
    deterministicFallbackUsed: boolean;
  };
}
```

Contract rules:
- Response always includes `decision`, `sourceLabel`, and `policyFlags`.
- `decision='block'` requires populated `refusal`.
- `noFabricationApplied` must always be true.
- Response must never imply evidence that is absent from `evidenceRefs`.

## Deterministic fallback behavior (planned)

When live gateway execution is unavailable, AGRT1 requires deterministic fallback
instead of fabricated content:

1. Validate request contract.
2. If contract invalid: return `decision='block'` with typed `refusal`.
3. If contract valid but live execution unavailable: return
   `decision='dry_run'` or `decision='route_to_fallback'` and a deterministic
   output pattern with explicit missing inputs.
4. Set `sourceLabel='deterministic_seed'` and
   `audit.deterministicFallbackUsed=true`.
5. Never upgrade confidence above `low` under fallback-only conditions.

## No-fabrication policy hooks (planned)

Required hooks for follow-on implementation slices:
- Evidence-basis gate: block recommendation/evidence_check when required
  evidence refs are missing.
- Tenant-scope gate: block any cross-tenant request composition.
- Honesty gate: output must disclose missing inputs instead of inferring facts.
- Confidence gate: cap confidence when evidence is sparse or deterministic-only.
- Audit gate: every request records caller, task, decision, and fallback status.

## Integration test plan outline (for AGRT2+)

Planned integration test lanes:
1. Contract validation lane
- Reject missing required fields with `missing_required_field`.
- Reject required-evidence tasks without evidence refs.

2. No-fabrication lane
- Assert missing-input disclosure appears when evidence is incomplete.
- Assert output never claims unavailable evidence.

3. Deterministic fallback lane
- Simulate gateway unavailable and assert `dry_run` / typed fallback response.
- Assert `sourceLabel='deterministic_seed'` and confidence cap enforcement.

4. Tenant and policy lane
- Assert cross-tenant attempts are blocked with typed refusal.
- Assert policy flags and audit fields are always present.

5. Backward-compatibility lane
- Assert existing deterministic stub consumers continue to compile.
- Assert no runtime dependency on provider SDKs is introduced in AGRT2 tests.

## Exit criteria for AGRT1

- Contract-plan doc exists and is reviewable.
- Slice manifest includes AGRT1 with explicit docs-only notes.
- No runtime files changed.

## Deferred to follow-on slices

- Runtime model gateway implementation
- Provider routing and retry policies
- Live token/cost accounting integration
- End-to-end runtime integration tests
