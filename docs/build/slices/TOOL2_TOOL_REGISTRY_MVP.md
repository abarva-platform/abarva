# TOOL2 - Tool Registry MVP

Slice ID: TOOL2
Slice name: Tool Registry MVP
Status: code_complete
Authored: 2026-04-25
Primary agent: Steward

## Purpose

TOOL2 lands the deterministic, file-pure registry that names every
canonical tool the agent runtime is allowed to invoke. It gives Nexus,
Sentinel, Atlas, and Steward a typed surface to ask three deterministic
questions without ever dispatching a tool:

- Which tools exist, and what category does each belong to?
- For a given agent, which tools are allowed and what inputs do they
  require?
- For a given invocation request, is the call shape valid - tenant
  scoped, agent permitted, inputs complete, and not violating any
  declared `forbiddenWhen` precondition?

TOOL2 is the read-only companion to the (yet-unwritten) TOOL1 Tool
Registry contract. Because TOOL1 does not yet exist on `main`, the
contract concepts are summarized inline below so this slice is self
contained.

TOOL2 is part of Lane E in the parallel build pack. It does not call
the Model Gateway, does not dispatch any tool, does not retrieve from
any persistence layer, and does not touch a network.

## TOOL1 Contract Concepts (Inline Summary)

The TOOL1 contract that TOOL2 implements treats the agent tool surface
as a closed set of named capabilities, each with the following
properties:

- A canonical category drawn from a fixed 16-element tuple.
- A read/write/export/audit-only mode that determines audit and
  governance handling.
- An explicit `allowedAgents` list - no agent may invoke a tool not
  named in this list.
- A `tenantScopeRequired` flag - tenant-scoped tools must refuse calls
  that are not bound to a tenant key.
- An `auditRequired` flag - tools that mutate, export, or surface
  sensitive content must always emit an audit event.
- A `productionStatus` of `stub | mvp | beta | live`. No tool is
  `live` until the Model Gateway and audit ledger are wired.
- A list of `requiredInputs` - the validator refuses a call missing
  any of these.
- A list of `forbiddenWhen` preconditions - declarative reasons the
  tool must refuse, paired with a remedy.
- A non-empty `outputContract` - what callers may rely on, and what
  they must not assume.

TOOL2 enforces these properties at the metadata level so that any
future TOOL3 (live dispatcher) can refuse malformed requests before
provider boundary.

## What Changed

- New module
  [src/lib/architecture/tool-registry-mvp.ts](../../../src/lib/architecture/tool-registry-mvp.ts):
  - Canonical category tuple
    `TOOL_REGISTRY_CATEGORIES = ['search_vector', 'traverse_graph',
    'read_artifact', 'read_evidence', 'read_program_state',
    'write_program_action', 'create_deliverable_draft',
    'export_artifact', 'update_gate_status', 'record_audit_event',
    'fetch_dataset_summary', 'get_solution_archetype',
    'get_pattern_content', 'build_context_pack',
    'evaluate_readiness', 'create_agent_mission']`.
  - Public types: `ToolCategory`, `ToolReadWriteMode`,
    `ToolProductionStatus`, `ToolAgent`, `ToolRequiredInput`,
    `ToolForbiddenWhen`, `ToolMetadata`, `ToolInvocationRequest`,
    `ToolInvocationValidationResult`, `ToolRegistrySummary`.
  - Public helpers: `listAgentTools`, `getAgentTool`,
    `listToolsForAgent`, `summarizeToolRegistry`,
    `validateToolInvocationRequest`.
  - Sixteen deterministic seed tools, exactly one per canonical
    category, each carrying allowed agents, mode, scope, audit,
    production status, required inputs, forbidden-when conditions,
    and an output contract.

- New tests
  [src/__tests__/integration/architecture/tool-registry-mvp.test.ts](../../../src/__tests__/integration/architecture/tool-registry-mvp.test.ts):
  - Determinism: byte-equal serialized output across repeated calls.
  - Category coverage: exactly 16 tools, one per canonical category,
    canonical id shape `tool.<category>.v<n>`.
  - Tenant scope invariant: every tool requires tenant scope except
    `get_pattern_content` and `get_solution_archetype`.
  - Audit invariant: every write or export tool has
    `auditRequired: true`; `record_audit_event` is `audit_only` and
    `auditRequired: true`.
  - Production status: every tool is `mvp` except `record_audit_event`
    which is `stub`. No tool is `live`.
  - Per-agent visibility: each of `nexus | sentinel | atlas | steward`
    has at least three allowed tools.
  - Validator: blocks unknown tool ids, blocks empty tenant key when
    required, allows empty tenant key for canonical content tools,
    blocks unknown agents, blocks known but disallowed agents,
    blocks missing required inputs, blocks empty-string required
    inputs, blocks requests that include a `forbiddenWhen` trigger
    key in `inputs`.
  - Validator passes well-formed read and write calls.
  - Registry summary: `liveCount === 0`, `byCategory` totals to 1
    per category, `byAgent` reconciles with `listToolsForAgent`.
  - Module hygiene: no imports from
    `@/lib/sentinel|atlas|nexus|agent|source|auth` or supabase; no
    `Date.now`, `Math.random`, `new Date(`, `fetch(`, anthropic,
    openai, useState, useEffect, "Coming soon", "TBD", or "Lorem
    ipsum". No `await`, no shell, no fs writes - the registry is
    pure synchronous metadata.

- Updated `docs/build/build-slices.json` with TOOL2 set to
  `code_complete`, depending on TOOL1, with `risk: low` and the
  five-file allowlist.

- Updated `docs/build/production-readiness.json` to acknowledge the
  TOOL2 registry MVP under `agent_runtime` and `model_gateway`,
  while preserving every other field exactly. Live tool dispatch,
  Model Gateway, and audit ledger remain explicitly deferred.

## Sixteen Canonical Tools

Read tools (10):

1. `tool.search_vector.v1` - tenant-scoped semantic search.
2. `tool.traverse_graph.v1` - tenant-scoped knowledge-graph traversal.
3. `tool.read_artifact.v1` - read a single tenant artifact (audited).
4. `tool.read_evidence.v1` - read a single evidence ledger entry
   (audited).
5. `tool.read_program_state.v1` - read program canonical view
   (audited).
6. `tool.fetch_dataset_summary.v1` - read a dataset domain summary
   (audited).
7. `tool.get_solution_archetype.v1` - canonical (tenant-agnostic)
   archetype content.
8. `tool.get_pattern_content.v1` - canonical (tenant-agnostic) pattern
   content.
9. `tool.build_context_pack.v1` - build the CTX2 twelve-section pack.
10. `tool.evaluate_readiness.v1` - evaluate MW2 / PF2 readiness gates.

Write tools (4):

11. `tool.write_program_action.v1` - append a structured program
    action (audited).
12. `tool.create_deliverable_draft.v1` - create a deliverable draft
    with citation hooks (audited).
13. `tool.update_gate_status.v1` - steward-only gate transition
    (audited).
14. `tool.create_agent_mission.v1` - atlas/steward typed mission
    (audited).

Export tool (1):

15. `tool.export_artifact.v1` - export an artifact bundle (audited).

Audit-only tool (1):

16. `tool.record_audit_event.v1` - append to the (stubbed) audit
    ledger.

## Validation Rules

`validateToolInvocationRequest(request)` returns a structured
`ToolInvocationValidationResult` with `isValid`, `reasons`, and
`warnings`. The rules are:

- The `toolId` must be registered.
- The `agentKey` must be one of `nexus | sentinel | atlas | steward`,
  and must appear in the tool's `allowedAgents`.
- If `tool.tenantScopeRequired === true`, `tenantKey` must be a
  non-empty string.
- Every required input named in `tool.requiredInputs` must be present
  on `request.inputs` (or, for `tenantKey`-typed inputs, on
  `request.tenantKey`). Empty strings are not accepted.
- A request must not include any of the tool's `forbiddenWhen`
  conditions as a key in `inputs` - that is treated as a deliberate
  attempt to embed a forbidden runtime trigger and is refused.
- For audited writes/exports, missing `auditEventId` is currently a
  warning rather than a hard block, because the audit ledger is a
  stub today. Once the ledger is live, this becomes a hard refusal.

`isValid === true` only when there are zero `reasons`. `warnings`
never block but always surface.

## What Is Deterministic Today

- The seed tool set is module-level and frozen by `readonly` types.
  Repeated calls return byte-equal JSON.
- `summarizeToolRegistry` is pure: byCategory totals reconcile to the
  total tool count and `liveCount === 0` until a tool is promoted.
- `validateToolInvocationRequest` is pure: same input -> same output.
- `getAgentTool` is a constant-time lookup against an immutable map.

## What Is Honest About This Slice

- The module is a deterministic registry, not a live tool runtime.
  No tool is dispatched.
- No `Date.now`, `new Date(`, `Math.random`, or `fetch(` is used.
- No model provider (`anthropic`, `openai`) is referenced.
- No `await`, no shell exec, no fs writes - the source is pure
  synchronous metadata.
- No imports from `@/lib/sentinel/`, `@/lib/atlas/`, `@/lib/nexus/`,
  `@/lib/agent/`, `@/lib/source/`, `@/lib/auth/`, or supabase.
- `productionStatus: 'stub'` is recorded honestly for
  `record_audit_event` because the audit ledger is not yet live.

## What Is Deferred

- Live tool dispatcher / runtime - not implemented by TOOL2.
- Model Gateway provider boundary, cost accounting, and routing -
  deferred.
- Live audit ledger persistence and replay - deferred.
- Live evidence retrieval inside `read_evidence` and live citation
  resolution - deferred (TOOL2 references the EVID2 read model only
  by shape).
- UI surfaces that render registry contents inside Tower or Admin -
  deferred.
- Wiring of TOOL2 into Sentinel detections, Atlas brief, or Nexus
  retrieval - deferred until a future TOOL3 slice implements the
  runtime dispatcher.

## How TOOL2 Affects Production Readiness

TOOL2 raises the visibility of the agent tool surface without
claiming production readiness. The `agent_runtime` and
`model_gateway` components in `production-readiness.json` are noted
as having a deterministic, seed-only tool registry and continue to
carry their existing critical / high blockers around live runtime,
gateway, and audit ledger work. The next action for `agent_runtime`
explicitly mentions runtime tool-dispatcher integration as deferred.

## Validation

Required validation for this slice:

- `npx tsc --noEmit --pretty false` - pass
- `npx jest src/__tests__/integration/architecture/tool-registry-mvp.test.ts` - pass
- `npm run build` - pass
- `python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"` - pass

## Status

Code complete. Pending founder review. TOOL2 does not push, merge, or
deploy.
