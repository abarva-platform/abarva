# TOOL3 - Tool Invocation Audit Read Model

Slice ID: TOOL3
Slice name: Tool Invocation Audit Read Model
Status: code_complete
Authored: 2026-04-25
Primary agent: Steward

## Purpose

TOOL3 lands the deterministic, file-pure read model that names what
the runtime tool dispatcher would persist for every agent tool
invocation if the dispatcher and audit ledger were live. It gives
Nexus, Sentinel, Atlas, and Steward a typed audit shape to record
seven canonical decisions, six actor roles, three scope tiers, and
four risk levels - without ever dispatching a tool, calling a model,
or persisting an audit row.

TOOL3 is the read-only companion to TOOL2 (the deterministic Tool
Registry MVP, landed in #253). Where TOOL2 names which tools exist
and validates a call shape, TOOL3 names the audit shape that any
future TOOL4-shaped live dispatcher must produce: who decided what,
against which tool, with what evidence basis, at what risk, and
which policy was matched.

TOOL3 does not call the Model Gateway, does not dispatch any tool,
does not retrieve from any persistence layer, and does not touch a
network. It is a typed seed surface plus four pure helpers.

## Contract Concepts (Inline Summary)

The audit shape that TOOL3 implements treats every prospective tool
invocation as an immutable typed record with the following
properties:

- A canonical `id` of shape `tool-audit-seed-{n}`.
- A `toolId` that matches the canonical TOOL2 shape
  `tool.<category>.v<n>` and resolves to a registered tool.
- An `actor` drawn from the closed six-element tuple
  `(nexus, sentinel, atlas, steward, system, admin)`. The first four
  are agent personas; `system` covers automated probes (e.g. health
  checks); `admin` covers founder / operator actions taken outside
  the agent runtime.
- A `tenantKey` that is always non-empty. Tenant-agnostic tools use
  `platform` as the canonical key.
- A `scope` of `platform | tenant | workspace`.
- A `decision` drawn from the canonical seven-element tuple
  `(proposed, allowed, blocked, deferred, completed, failed,
  dismissed)`.
- A `riskLevel` of `low | medium | high | critical`.
- Optional `blockedReason` / `deferredReason` / `failureReason` that
  are required when the decision is `blocked` / `deferred` /
  `failed` respectively.
- An `evidenceBasis` that is required (non-null, non-empty
  evidenceIds) for every write-shaped tool invocation, regardless of
  whether the call was completed, blocked, deferred, or failed.
  Read-shaped and audit-only tools may carry `null`.
- An `auditEventId` of shape `audit-event-seed-{n}` pointing to the
  AUD2 audit event id the dispatcher would emit.
- A `policyMatched` reference of shape
  `tool_registry.v1.<category>.audit_required`.
- A `createdFrom` sentinel of
  `deterministic_tool_invocation_audit_seed`.

TOOL3 enforces these properties at the metadata level so that any
future TOOL4 (live dispatcher) can refuse malformed audit records
before they reach the ledger.

## What Changed

- New module
  [src/lib/architecture/tool-invocation-audit.ts](../../../src/lib/architecture/tool-invocation-audit.ts):
  - Canonical decision tuple
    `TOOL_INVOCATION_DECISIONS = ['proposed', 'allowed',
    'blocked', 'deferred', 'completed', 'failed', 'dismissed']`.
  - Canonical actor tuple
    `TOOL_INVOCATION_ACTORS = ['nexus', 'sentinel', 'atlas',
    'steward', 'system', 'admin']`.
  - Public types: `ToolInvocationDecision`, `ToolInvocationActor`,
    `ToolInvocationScope`, `ToolInvocationRisk`,
    `ToolInvocationEvidenceBasis`, `ToolInvocationAuditRecord`,
    `ToolInvocationAuditSummary`.
  - Public helpers: `buildToolInvocationAuditSeed`,
    `validateToolInvocationAudit`,
    `summarizeToolInvocationAudits`, `getBlockedToolInvocations`,
    `getToolInvocationsByAgent`.
  - 26 deterministic seed audit records covering all 16 canonical
    TOOL2 tool ids, all 7 decisions (>= 2 each), all 6 actors, all
    3 scopes, and all 4 risk levels (with at least 4 records at
    high or critical risk).
- New test
  [src/__tests__/integration/architecture/tool-invocation-audit.test.ts](../../../src/__tests__/integration/architecture/tool-invocation-audit.test.ts):
  - Determinism (byte-equal JSON across calls).
  - Coverage (24+ records, all decisions / actors / tools / scopes
    / risks).
  - Per-record invariants (blocked / deferred / failed reasons,
    write-tool evidence basis, canonical id and policy shapes).
  - Validator behavior (empty tenantKey, missing reasons, missing
    evidence basis on write tools, unknown actor / decision).
  - Summary reconciliation (totals, sorted unique sets).
  - Module hygiene (no banned imports, no `Date.now`,
    no `Math.random`, no `new Date(`, no `fetch(`, no SDK,
    no React hooks, no shell exec, no fs writes).

- Manifest update [docs/build/build-slices.json](../build-slices.json):
  appends the TOOL3 slice with category `TOOL`, `dependsOn`
  `["TOOL2"]`, status `code_complete`, allowedFiles list, acceptance
  criteria, validation commands, and notes.

- Manifest update
  [docs/build/production-readiness.json](../production-readiness.json):
  appends a conservative note to `agent_runtime` and `model_gateway`
  recording that TOOL3 lands the audit-shape read model only and
  that runtime tool dispatcher integration plus live audit-ledger
  persistence remain deferred.

## What Was NOT Done

- No live tool dispatch - TOOL3 records the audit shape; it does not
  invoke any tool.
- No live audit-ledger persistence - the seed records are
  in-memory typed values; no row is written to any store.
- No live Model Gateway integration - the gateway remains a stub
  (MG2) and TOOL3 explicitly carries no provider SDK imports.
- No Atlas brief / Sentinel pattern / Nexus next-action wiring -
  those land in later slices.
- No Tower or Programs UI surface - TOOL3 is a pure read model,
  consumed only by tests in this slice.

## Files Touched

- `src/lib/architecture/tool-invocation-audit.ts`
- `src/__tests__/integration/architecture/tool-invocation-audit.test.ts`
- `docs/build/slices/TOOL3_TOOL_INVOCATION_AUDIT_READ_MODEL.md`
- `docs/build/build-slices.json`
- `docs/build/production-readiness.json`

## Validation Commands

```
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/tool-invocation-audit.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

## Honest Limitations

- The seed is deterministic and intentionally small: 26 records
  across 16 canonical tools is enough to certify the audit shape
  but it is not a representative sample of any real tenant's
  invocation traffic.
- `validateToolInvocationAudit` enforces the audit shape but does
  not cross-check against TOOL2's `validateToolInvocationRequest`.
  Future slices may chain the two to produce an end-to-end refusal
  pipeline.
- `policyMatched` uses the canonical
  `tool_registry.v1.<category>.audit_required` reference key. There
  is no live policy registry on `main`; the reference is a frozen
  string the dispatcher will resolve.
- Write-shaped tools (per TOOL2 metadata: `write` and `export`
  modes) are required to carry an `evidenceBasis`. `audit_only`
  (record_audit_event) and read tools may carry `null`. This is the
  contract surface the live dispatcher will enforce, not a runtime
  gate today.
- The seed includes both successful and unsuccessful decisions on
  the same tool ids (e.g. two write_program_action records: one
  completed with evidence, one failed with evidence and a transient
  adapter_error). This mirrors how a live dispatcher will record
  retries.

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

The only runtime dependency is a read-only import of `getAgentTool`
and `ToolMetadata` from the TOOL2 registry, used to determine
write-shape during validation.

## Downstream Lanes

- TOOL4 (future): live tool dispatcher that emits TOOL3-shaped audit
  records through the AUD2 audit ledger and the MG3 live Model
  Gateway.
- AUD2 (future): live audit ledger persistence; TOOL3
  `auditEventId` becomes a foreign key into the ledger.
- ACT2 / ACT5 (future): Tower surfaces that consume blocked /
  failed / deferred audit records to score governance health.
