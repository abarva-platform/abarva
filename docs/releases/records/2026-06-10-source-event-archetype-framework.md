# 2026-06-10-source-event-archetype-framework — Source Event Archetype Framework + governed reasoning

## Release ID

`2026-06-10-source-event-archetype-framework`

## Status

`candidate`

## Plain-English Summary

AbarVa Source used to treat every sourcing event the same way: one generic RFP
flow whether the buyer was sourcing application managed services, an ERP
implementation partner, an AI/data platform, or renegotiating an existing
contract. A CIO running a multi-million-dollar decision would reject that on
sight, and — more dangerously — the agent reported a hardcoded "high" confidence
regardless of whether the underlying evidence was actually ready or even
belonged to the right client.

This change introduces a **Source Event Archetype Framework** (mirroring the
already-merged Strategic Move Archetype Framework): one universal sourcing spine,
but a different "DNA" per event type — different required evidence, vendor
questions, RFP structure, pricing model, evaluation model, risk model,
negotiation levers, deliverables, and gate criteria. It ships four archetypes
(AMS / managed services, ERP-SI implementation, AI/data platform, contract
renewal), an evidence-readiness model on a promotion-only ladder
(committed ≠ agent-ready), an event-specific RFP generator that flags
evidence-blocked sections instead of fabricating them, archetype-bound pricing
and negotiation analyses that cite their evidence, and — most importantly — a
**governed grounded-answer seam** that routes every Source answer through the
context-corpus governance contract, derives confidence from real agent-ready
evidence coverage, fences cross-tenant data, and refuses when evidence is
insufficient. A SkyHarbor AMS end-to-end scenario proves the whole spine
composes honestly.

This is a self-contained, DB-free library plus its proof. It does NOT yet swap
the live Source answer call-site or run against the private data plane on ACA;
those are stated as remaining runtime wiring.

## Layer Impact

- `global-control-lane`: shared app-tier library under `src/lib/source/archetypes/`.
  New, additive, behind no runtime call-site yet — nothing in the live request
  path changes until the answer-engine swap (separate follow-up).
- Governance: consumes the existing `src/lib/governance` contract
  (`buildValidatedAgentContextBundle`, `evaluateGovernedObject`). No policy change.

## Client Applicability

- All clients: not yet — no runtime path is wired to this framework.
- Specific clients: SkyHarbor used only as the in-code end-to-end proof fixture.
- Internal only: framework + proof artifact (this PR).
- Public/demo only: no.
- Feature flag: none (no runtime exposure yet).

## Changes Included

- `src/lib/source/archetypes/{types,method-library,registry,resolver,index}.ts` — archetype contract, 10-method library, 4 archetypes, two-axis resolver.
- `src/lib/source/archetypes/evidence-readiness.ts` — promotion-only readiness model.
- `src/lib/source/archetypes/rfp-canon.ts` + `deliverable-canon.ts` — event-specific RFP + quality gate.
- `src/lib/source/archetypes/pricing-engine.ts` — should-cost, TCO normalization, switching leverage, negotiation plan.
- `src/lib/source/archetypes/grounded-answer.ts` — governed reasoning seam + GroundedSourceAnswerEnvelope (P0 fix).
- `src/lib/source/archetypes/scenarios/skyharbor-ams.ts` — end-to-end proof scenario.
- `src/lib/source/archetypes/__tests__/*` — 52 tests.
- `docs/source/SOURCE_MODULE_END_TO_END_AUDIT_2026-06-09.md`, `docs/source/SOURCE_MASTER_THOUGHT_LEADERSHIP_REPORT.html`, `docs/source/SOURCE_SKYHARBOR_AMS_PROOF.md`.

## QA / Validation

- `npx jest src/lib/source/archetypes/` → **52 passed, 6 suites**.
- `npx tsc --noEmit` → no errors in the module.
- `npx eslint src/lib/source/archetypes/` → clean.
- `npm run audit:architecture-rules` (changed mode) → **0 violations** (Azure-only; no Supabase/Pinecone/Neo4j/Vercel/OpenAI-reasoning deps introduced).
- Proof artifact regenerated deterministically from `runSkyHarborAmsScenario()`.

## Rollout Plan

Merge `source-thought-leadership` (PR #3374) to `main` via squash. No runtime
rollout in this PR — the library is dormant until a follow-up swaps the Source
answer-engine call-site to `buildGroundedSourceAnswer` and binds the readiness
model to the live `EvidenceStateMap`. No migration, no image redeploy required to
merge.

## Rollback Plan

Revert the squash commit. Because no runtime call-site references the new module
yet, revert is pure code removal with zero data or live-path impact.

## Audit Evidence

- PR #3374 (branch `source-thought-leadership`).
- Jest output (52 passing), architecture-rules JSON (0 violations).
- `docs/source/SOURCE_SKYHARBOR_AMS_PROOF.md` (generated decision narrative: AMS
  archetype, medium confidence, 2 missing required families, 4 evidence-blocked
  RFP sections, NorthOps normalized TCO winner, cross-tenant candidate fenced,
  zero unsupported claims).
- `docs/source/SOURCE_MASTER_THOUGHT_LEADERSHIP_REPORT.html` (war-room).

## Known Gaps

- 4 of 12 archetypes shipped (AMS, ERP-SI, AI/data platform, renewal); 8 remain.
- Live runtime swap of `source-answer-engine.ts` not done (P0 fix proven in code,
  not yet on the request path).
- No live run against the private DB on ACA yet — the SkyHarbor proof is a
  code-level end-to-end composition, explicitly not a live data-plane run
  (truth-standard state separation honored).
