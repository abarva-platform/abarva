# AUD2 - Unified Audit Event Read Model

Slice ID: AUD2
Slice name: Unified Audit Event Read Model
Status: code_complete
Authored: 2026-04-25
Primary agent: Steward
Lane: D (parallel build pack)

## Purpose

AUD2 lands the deterministic, file-pure read model that demonstrates the
canonical shape of a Unified Audit Event across all four agents
(Nexus, Sentinel, Atlas, Steward) and the surfaces they touch:
Programs, Workshops, Intelligence patterns, Tower dimensions, Admin
governance findings, Deliverables, Gates, Tools, the Model Gateway,
and route-smoke / readiness signals.

AUD2 is the read-only companion to the AUD1 contract. It gives
Steward audit surfaces, governance review tooling, and future
replay/integrity checkers a typed surface to bind to before a
production audit ledger exists. AUD2 is explicitly not a production
audit ledger; immutability is a shape-level invariant on the seed,
not a runtime guarantee.

## Scope

- In scope:
  - Canonical event-type tuple (15 entries) and helper subtype
    groupings (evidence-using, decision-bearing, state-change).
  - Public types `UnifiedAuditEvent`, `UnifiedAuditActor`,
    `UnifiedAuditAgent`, `UnifiedAuditEventWorkObject`,
    `UnifiedAuditEventEvidenceBasis`,
    `UnifiedAuditEventBeforeAfter`, `UnifiedAuditSummary`.
  - Deterministic seed of 30 events covering all 15 event types,
    all 3 actor kinds, and all 4 agents.
  - Helpers: `buildUnifiedAuditEventSeed`,
    `summarizeUnifiedAuditEvents`, `getAuditEventsByWorkObject`,
    `getAuditEventsByType`, `getAuditEventsByTrace`,
    `validateAuditEvent`.

- Out of scope (deferred):
  - Persistence, signing, chaining, or replay.
  - Live capture from Nexus / Sentinel / Atlas / Steward runtime.
  - Per-tenant binding, tenant isolation enforcement.
  - Audit UI surfaces (Steward audit log, governance review console).
  - CI gates that ingest these events.

## What Changed

- New module
  [src/lib/architecture/unified-audit-events.ts](../../../src/lib/architecture/unified-audit-events.ts):
  - Canonical event-type tuple
    `UNIFIED_AUDIT_EVENT_TYPES = ['agent_recommendation',
    'agent_handoff', 'evidence_used', 'evidence_blocked',
    'tool_invocation', 'model_gateway_decision', 'gate_check',
    'gate_transition', 'deliverable_generated',
    'deliverable_approved', 'deliverable_superseded',
    'user_action', 'readiness_update', 'route_smoke_result',
    'governance_decision']`.
  - Subtype groupings: `EVIDENCE_USING_EVENT_TYPES`,
    `DECISION_BEARING_EVENT_TYPES`, `STATE_CHANGE_EVENT_TYPES`.
  - Actor enum tuple `UNIFIED_AUDIT_ACTOR_KINDS`
    (`user / agent / system`) and agent enum tuple
    `UNIFIED_AUDIT_AGENTS` (`nexus / sentinel / atlas / steward`).
  - Public types:
    `UnifiedAuditActor`, `UnifiedAuditAgent`,
    `UnifiedAuditEventWorkObject`,
    `UnifiedAuditEventEvidenceBasis`,
    `UnifiedAuditEventBeforeAfter`, `UnifiedAuditEvent`,
    `UnifiedAuditSummary`.
  - Public helpers: `buildUnifiedAuditEventSeed`,
    `summarizeUnifiedAuditEvents`, `getAuditEventsByWorkObject`,
    `getAuditEventsByType`, `getAuditEventsByTrace`,
    `validateAuditEvent`.
  - 30 deterministic seed events. Coverage matrix:
    - All 15 event types covered (agent_recommendation x4,
      agent_handoff x2, evidence_used x2, evidence_blocked x2,
      tool_invocation x2, model_gateway_decision x2,
      gate_check x2, gate_transition x2,
      deliverable_generated x2, deliverable_approved x1,
      deliverable_superseded x1, user_action x3,
      readiness_update x2, route_smoke_result x2,
      governance_decision x2).
    - All 3 actor kinds present (user / agent / system).
    - All 4 agents present (nexus / sentinel / atlas / steward).
    - Tenants: acme, meridian, helios.
    - Trace ids: 11 deterministic `trace-seed-*` ids.
  - Every event id starts with `audit-seed-`, every traceId starts
    with `trace-seed-`, every event carries `immutable: true` and
    `createdFrom: 'deterministic_unified_audit_seed'`.

- New tests
  [src/__tests__/integration/architecture/unified-audit-events.test.ts](../../../src/__tests__/integration/architecture/unified-audit-events.test.ts):
  - Determinism: byte-equal serialized output across repeated calls.
  - Seed has at least 30 events. All 15 event types covered.
  - All 3 actor kinds and all 4 agents represented.
  - Per-event invariants: non-empty `traceId`, `tenantKey`,
    `workObject.id`; `immutable: true`; allowed `timestampSource`.
  - Evidence-using event types have non-null `evidenceBasis`
    with non-empty rationale.
  - Decision-bearing event types have non-null,
    non-empty `decisionRationale`.
  - State-change event types have non-null `beforeAfter`
    with `fieldsChanged.length > 0`.
  - `validateAuditEvent`:
    - Every seed event passes validation.
    - Rejects missing `tenantKey`, missing `traceId`.
    - Rejects evidence-using types with `evidenceBasis = null`.
    - Rejects decision-bearing types with empty
      `decisionRationale`.
    - Rejects state-change types with `beforeAfter = null` or
      empty `fieldsChanged`.
  - `summarizeUnifiedAuditEvents`:
    - `totalEvents` matches input length.
    - `byEventType`, `byActorKind` reconcile to `totalEvents`.
    - `byAgent` only counts events with an agent and never exceeds
      `totalEvents`.
    - All canonical keys exposed on the summary.
    - `uniqueTenants` and `uniqueTraceIds` are sorted and
      deduplicated.
    - `eventsWithEvidenceBasis` and `eventsWithBeforeAfter` reconcile
      to the input.
    - Helper defaults to summarizing the canonical seed.
  - `getAuditEventsByType`, `getAuditEventsByWorkObject`,
    `getAuditEventsByTrace` partition correctly and default to the
    canonical seed.
  - Module hygiene: no Sentinel / Atlas / Nexus / Agent / Source /
    Auth / Supabase imports; no `Date.now`, `Math.random`,
    `new Date(`, `fetch(`; no Anthropic / OpenAI / Cohere /
    Databricks references; no React hooks; no placeholder language;
    no invented dollar amounts.

## Validation

```
cd /Users/anand/Projects/nexus-night-aud2
npx tsc --noEmit --pretty false
npx jest src/__tests__/integration/architecture/unified-audit-events.test.ts
npm run build
python3 -c "import json; json.load(open('docs/build/build-slices.json')); json.load(open('docs/build/production-readiness.json'))"
```

Result: typecheck clean, 44 tests pass in the AUD2 suite, JSON
manifests parse.

## Conservative manifest update

`audit_governance` and `validation_qa` components in
`docs/build/production-readiness.json` are not promoted. AUD2 only
adds notes acknowledging the new deterministic read model. Statuses
remain `scaffolded` and `tested` respectively. AUD1 dependency is
declared in `build-slices.json`; AUD1 itself is not landed by this
slice.

## Why this slice is small / safe

- Pure file-only TypeScript module. No new dependencies.
- No live calls, no model invocation, no migrations, no UI
  changes.
- Conservative manifest update: notes only, no status promotion.
- Append-only `build-slices.json` change.
- Tested deterministically with 44 passing assertions.

## Future slices that bind to AUD2

- AUD3 - Audit log surface in Steward Setup admin (mounts
  the read model behind a tenant-scoped page).
- AUD4 - Replay/integrity test that walks an event chain by
  `traceId` and reconciles before/after deltas.
- AUD5 - Bridge AUD2 events to the EVID2 Evidence Ledger so
  evidence-using events can fan out to ledger entries.
- AUD6 - Persisted audit ledger with monotonic clock and
  signing (production audit_governance promotion path).
