# Gate Lifecycle Contract

Why this contract matters: phase advancement, charter creation, opener injection, and outcome-fee invoicing are not handled in one place. The current lifecycle spans the legacy engage turn route, engagement DB helpers, and `phaseOpenerFor()`. Builders need one accurate map before touching any of it.

## Source of truth

- `src/lib/nexus/gateLifecycle.ts`
- `src/lib/db/engagement.ts`
- `src/app/api/engage/[engagementId]/turn/route.ts`

## Current architecture boundary

Two different layers exist today:

- `src/lib/nexus/gateLifecycle.ts`
  - defines `PHASE_OPENERS`
  - exports `phaseOpenerFor()`
  - exports `applyGateSignal()`
- `src/app/api/engage/[engagementId]/turn/route.ts`
  - currently performs the live phase transition work in production
  - parses gate approval blocks
  - records approvals
  - fires deliverable generation
  - appends the opener turn
  - emits the `phase_opener` event

Important: the new `/api/v1/nexus/query` route does not currently drive this lifecycle.

## `PHASE_OPENERS` contract

Verbatim shipped openers:

```text
1: "Now that we have the charter locked, let's start the diagnostic. What category, region, or decision type would give the business the fastest felt result? Aim for a first-win scope we can pressure-test in 2-3 weeks."
2: "Diagnostic is approved. Time to design. Let's put the solution shape on paper — architecture sketch, vendor shortlist with tradeoffs, and the one decision we can't punt past this phase."
3: "Design's signed off. Execute phase starts now. Break this into work items, name owners, and lock the first milestone. What's the 30-day target?"
4: "Execute is complete. Outcome verification phase — baseline vs actual, attested savings, and what we'd do differently. Who's the attestor, and what's their bar?"
```

`phaseOpenerFor(phase)` returns the matching string or `null`.

## `applyGateSignal()` contract

`applyGateSignal(input)` accepts:

- `signal`
- `engagementId`
- `actorUserId`

Supported signals:

- `gate_approval`
- `phase_transition`

Behavior:

- resolves `fromPhase` / `toPhase` from signal payload when present
- otherwise reads `engagements.current_phase` and advances by `+1`
- updates `engagements.current_phase`
- inserts a `module_state_log` row with:
  - `module_key: phase_${fromPhase}_gate`
  - `previous_state: pending_gate`
  - `new_state: completed`
  - `notes: Gate approval · advance phase X → Y`
  - `context_jsonb` containing signal payload
- when entering Phase 1:
  - upserts `deliverable_types.type_key = 'charter'`
  - ensures a `deliverables_v2` charter row exists
  - inserts version 1 draft markdown if the deliverable is new

Return shape:

- `applied`
- `fromPhase`
- `toPhase`
- `phase1Prompt?`
- `deliverableId?`

## Actual shipped phase transition path

In `src/app/api/engage/[engagementId]/turn/route.ts`, the lifecycle runs as:

1. Agent stream completes and full text is accumulated.
2. `parseGateApprovalBlock(agentFullText)` is evaluated.
3. If a gate block exists:
   - approver fallback is `sponsor -> maestro -> null`
4. `recordGateApproval()` is called with:
   - `engagementId`
   - `phase`
   - `approvedByPersonId`
   - `approvalText`
   - `summary`
5. `recordGateApproval()`:
   - reads `engagements.gates_passed` and `current_phase`
   - short-circuits if the phase is already approved
   - appends/updates one approved gate record
   - advances `engagements.current_phase` to `min(4, phase + 1)`
6. `logAudit()` writes `engagement.gate_approved`.
7. Route emits:
   - `gate_approved`
   - payload `{ phase, new_phase }`
8. `generateDeliverableForPhase(engagement.id, gateApproval.phase)` fires in the background.
9. `phaseOpenerFor(updated.current_phase)` is called.
10. If an opener exists and the phase actually advanced:
   - opener is persisted as a new agent turn
   - route emits `phase_opener` with `{ phase, turnId, text }`
11. If the approved phase is `4`, `engagement.outcome_fee_usd > 0`, and Stripe is configured:
   - `createOutcomeFeeInvoice()` fires in the background

The route finally emits `done`.

## Other side-channel lifecycle events in the engage route

The same route also parses and persists:

- decisions via `parseDecisionBlocks()` -> `appendDecision()`
- actual metrics via `parseActualMetricsBlock()` -> `updateActualMetrics()`
- outcome fee proposals via `parseOutcomeFeeBlock()` -> `proposeOutcomeFee()`

These are related to gate progression because they typically accumulate during later phases, but they are not themselves gate signals.

## Event contract from the legacy engage route

This route is newline-delimited JSON, not SSE. Relevant lifecycle events are:

- `gate_approved`
- `phase_opener`
- `done`
- `error`

It also emits `decisions_logged`, `actual_metrics_captured`, and `outcome_fee_proposed`.

## Change safety notes

- If phase advancement migrates from the legacy engage route to `/api/v1/nexus/query`, move both the persistence step and the opener emission together.
- Do not change `PHASE_OPENERS` text casually; Playwright and demo flows assert exact opener copy.
- `recordGateApproval()` and `applyGateSignal()` do similar work in different layers today. Treat that overlap as active architecture debt, not as evidence both are currently invoked in the same flow.

## Changelog

- 2026-04-21: Initial contract doc authored from shipped source
