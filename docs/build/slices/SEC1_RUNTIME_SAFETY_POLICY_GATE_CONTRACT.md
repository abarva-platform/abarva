# SEC1 - Runtime Safety / Policy Gate Contract

Slice ID: SEC1
Slice name: Runtime Safety / Policy Gate Contract
Status: code_complete
Authored: 2026-04-26
Primary agent: Steward

## Purpose

SEC1 lands the deterministic, file-pure contract that names the
safety / policy checks the runtime must apply BEFORE any tool call,
model call, evidence use, dataset access, export, or cross-agent
handoff. It gives Nexus, Sentinel, Atlas, and Steward (and any future
runtime tool dispatcher / Model Gateway) a typed YES / NO / WAIVER /
REVIEW gate to consult before either ever fires.

SEC1 is the safety perimeter that wraps TOOL2 / TOOL3 / MG2 / EVID2 /
TRUST1 / TRUST2 / AUD2. Where TOOL2 names which tools exist and
validates a call shape, and TOOL3 names the audit shape every
dispatcher must emit, SEC1 names the gate decision the dispatcher
must consult before the tool fires and before the audit row is
written. Every PolicyCheckResult records the canonical decision, a
human-readable rationale, and the policyBasis the future runtime
registry will resolve.

SEC1 does not call the Model Gateway, does not dispatch any tool,
does not retrieve from any persistence layer, and does not touch a
network. It is a typed envelope plus pure helpers.

## Contract Concepts (Inline Summary)

The policy gate that SEC1 implements treats every prospective runtime
side-effect as a typed check with the following properties:

- A canonical `kind` drawn from the closed seven-element tuple
  `(tenant_scope, tool_use, model_gateway_use, evidence_use,
  dataset_trust, export_download, agent_handoff)`.
- A canonical `decision` drawn from the closed four-element tuple
  `(allow, deny, require_waiver, require_review)`.
- A `rationale` that names, in human-readable terms, why the decision
  was reached. Always non-empty.
- A `policyBasis` of shape `runtime_policy_gate.v1.<kind>` that the
  future runtime registry will resolve into the live policy text.
- An optional `denyReason` drawn from a closed nine-element tuple,
  required when `decision === 'deny'` and meaningful for waiver
  paths (e.g. `export_requires_approval`).
- An optional `reviewerRole` drawn from a closed four-element tuple
  `(steward, admin, governance_reviewer, tenant_admin)`, required
  when the decision is `require_waiver` or `require_review`.
- A `createdFrom` sentinel of `deterministic_runtime_policy_gate_seed`.

Per-kind contract:

- `tenant_scope`: deny when `tenantKey` is empty, deny when
  `subjectTenantKey` differs from `tenantKey` and neither is
  `platform`, allow otherwise.
- `tool_use`: deny when `toolRegistered === false`, deny when
  `toolActorAllowed === false`, allow otherwise.
- `model_gateway_use`: require_review unless `modelGatewayLive ===
  true` (MG2 is contract-only on `main`; MG3 is the live wiring).
- `evidence_use`: deny when `evidenceTrust === 'unusable'`,
  require_review when `evidenceTrust === 'unknown'` or undefined,
  allow when `usable`.
- `dataset_trust`: deny L4 sensitive without `explicit_approved`,
  deny `revoked` / `expired` approvals at any level, require_waiver
  for L3 without `explicit_approved`, allow otherwise.
- `export_download`: require_waiver unless `approvalState ===
  'explicit_approved'`; nothing leaves the tenant boundary without
  governance review.
- `agent_handoff`: deny when `handoffAuthorized === false`,
  require_review when undefined, allow when authorized.

## What Changed

- New module
  [src/lib/architecture/runtime-policy-gate.ts](../../../src/lib/architecture/runtime-policy-gate.ts):
  - Canonical check-kind tuple
    `POLICY_CHECK_KINDS = ['tenant_scope', 'tool_use',
    'model_gateway_use', 'evidence_use', 'dataset_trust',
    'export_download', 'agent_handoff']`.
  - Canonical decision tuple
    `POLICY_DECISIONS = ['allow', 'deny', 'require_waiver',
    'require_review']`.
  - Canonical deny-reason tuple `POLICY_DENY_REASONS` and reviewer
    role tuple `POLICY_REVIEWER_ROLES`.
  - Public types: `PolicyCheckKind`, `PolicyDecision`,
    `PolicyDenyReason`, `PolicyReviewerRole`, `PolicyCheckRequest`,
    `PolicyCheckResult`, `PolicyGateSummary`.
  - Public helpers: `evaluatePolicyCheck`,
    `summarizePolicyChecks`, `getDenyReasons`.
  - Per-kind deterministic evaluators with frozen results.

- New test
  [src/__tests__/integration/architecture/runtime-policy-gate.test.ts](../../../src/__tests__/integration/architecture/runtime-policy-gate.test.ts):
  - All 7 check kinds produce a canonical result.
  - All 4 decisions are reachable.
  - tenant_scope mismatch -> deny.
  - export_download without approval -> require_waiver.
  - Byte-equal JSON determinism over a fixed input vector.
  - Module hygiene (no banned imports, no `Date.now`, no
    `Math.random`, no `new Date(`, no `fetch(`, no SDK, no React
    hooks, no shell exec, no fs writes).
  - Per-kind deny / waiver / review behavior, summary
    reconciliation, and reviewer-role closed-set coverage.

- Manifest update [docs/build/build-slices.json](../build-slices.json):
  appends the SEC1 slice with category `SEC`, status `code_complete`,
  allowedFiles list, acceptance criteria, validation commands, and
  notes.

- Manifest update
  [docs/build/production-readiness.json](../production-readiness.json):
  UNION-appends a conservative note to `agent_runtime`,
  `audit_governance`, and `validation_qa` recording that SEC1 lands
  the runtime safety / policy gate contract only and that live
  enforcement at the dispatcher boundary remains deferred.

## What Was NOT Done

- No live dispatcher integration - SEC1 names the gate; the
  dispatcher will consult it in a future slice.
- No live audit-ledger persistence - SEC1 does not write any row.
- No live Model Gateway wiring - the gateway remains contract-only
  (MG2) and SEC1 explicitly returns `require_review` for
  `model_gateway_use` until `modelGatewayLive === true`.
- No Atlas brief / Sentinel pattern / Nexus next-action wiring -
  those land in later slices.
- No Tower / Programs / Admin UI surface - SEC1 is a pure read-model
  contract, consumed only by tests in this slice.

## Files Touched

- `src/lib/architecture/runtime-policy-gate.ts`
- `src/__tests__/integration/architecture/runtime-policy-gate.test.ts`
- `docs/build/slices/SEC1_RUNTIME_SAFETY_POLICY_GATE_CONTRACT.md`
- `docs/build/build-slices.json`
- `docs/build/production-readiness.json`

## Validation Commands

```
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/runtime-policy-gate.test.ts
npx eslint src/lib/architecture/runtime-policy-gate.ts src/__tests__/integration/architecture/runtime-policy-gate.test.ts --max-warnings=0
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

## Honest Limitations

- The contract is shape-only; no live enforcement is wired. The
  future dispatcher will call `evaluatePolicyCheck` before any tool
  fires, and the future audit ledger will record the result.
- `policyBasis` uses a frozen `runtime_policy_gate.v1.<kind>` key.
  There is no live policy registry on `main`; the reference is a
  string the dispatcher will resolve.
- The gate is intentionally conservative: when authorization is
  unknown (e.g. `handoffAuthorized` undefined), the gate emits
  `require_review` rather than allow. This matches the no-fabrication
  posture of the runtime.
- `export_download` always requires explicit approval. There is no
  silent path out of the tenant boundary.
- Cross-tenant calls are rejected unless one side is `platform`. This
  mirrors the TEN2 tenant-isolation boundary contract.

## Forbidden Patterns Confirmed Absent

The module hygiene tests scan the source and confirm the absence of:

- Banned imports: `@/lib/sentinel/`, `@/lib/atlas/`, `@/lib/nexus/`,
  `@/lib/agent/`, `@/lib/source/`, `@/lib/auth/`, supabase paths.
- Banned runtime calls: `Date.now`, `Math.random`, `new Date(`,
  `fetch(`.
- Banned SDKs: `anthropic`, `openai`.
- Banned React state hooks: `useState`, `useEffect`.
- Banned placeholder language: `Coming soon`, `TBD`, `Lorem ipsum`.
- Banned execution: `await`, `writeFile`, `appendFile`,
  `createWriteStream`, `child_process`, `spawn(`, `exec(`,
  `execSync`.

## Downstream Lanes

- TOOL4 (future): live tool dispatcher that consults SEC1 before
  every dispatch and emits TOOL3-shaped audit records via the AUD2
  audit ledger and MG3 live Model Gateway.
- AUD2 (future): live audit ledger persistence; SEC1 deny / waiver /
  review decisions become first-class audit events.
- TRUST3 (future): Steward-setup TRUST surface that surfaces SEC1
  waiver / review queues to the tenant_admin and governance_reviewer
  roles.
