# Phase 1 — Reasoning Spine: File-Level Build Plan

**Source:** AbarVa Source Intelligence OS spec, Vol 2 Ch5 + Vol 4 §16.2 · **Reviewed:** 2026-06-19 (see `SOURCE_INTELLIGENCE_OS_REVIEW_NOTE.md`)
**Goal:** Insert a reasoning layer (`Context → Analysis → Recommendation → Deliverable`) into the live generation path, with all reasoning carried in a canonical **Reasoning Envelope** — **without destabilizing the one path that works.**

> **The one path that works** is `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts` — the route that binds context, builds the prompt, and streams Claude. (The sibling `…/artifacts/generate/route.ts` is a **persistence-only** endpoint that stores agent-supplied markdown; it is *not* the pipeline — the spec conflates the two, corrected in the review note.) It is a **single streamed Sonnet pass, no quality gate**. Phase 1 is **additive and flag-gated**; the legacy single-pass path stays as the fallback until the envelope path is live-proven on the ACA private DB against a real event.

## The seam (exact)

In `generate-from-claude/route.ts`, lines **181–185**, between "context fully bound" and "prompt built":

```ts
const upstreamBound = collectUpstreamBodies(ctx, [...upstreamRequired, ...upstreamOptional]); // ← context bound
//  ⟶ INSERT: analysis + recommendation → ReasoningEnvelope (flag-gated)
const userMessage = template.buildUserMessage(ctx, upstreamBound);                            // ← prompt built
```

Additive contract: widen `buildUserMessage(ctx, upstreamBound, envelope?)` with an **optional** third arg. The existing 3 templates ignore it → behavior-preserving. When the flag is on and an envelope exists, the route passes it; the system prompt collapses the model's job from *reason + write* to *write*.

**Integration crux (from the audit):** the frameworks (`should-cost`, `delivery-model-gate`, `proposal-normalization`, `category-classifier`) run today only inside `source-answer-engine.ts` (the chat path) and consume a `SourceAgentContextBundle`. The generate path has only `SourceGenerationContext`. **The connective tissue Phase 1 must add is an adapter** — Slice 1.2.

---

## Slices (strict order — each is independently mergeable; ✦ = touches the live route)

### Slice 1.0 — Reasoning Envelope contract + types *(no behavior, no wiring)*
**Files (new):**
- `src/lib/source/reasoning/reasoning-envelope.ts` — the `ReasoningEnvelope` type + `Claim`, `EvidenceRef`, `Assumption`, `ConfidenceBand`, `Caveat`, `TraceStep`, `RefusalRecord` (shapes per Vol2 §5.3). Extend, don't fork, `agent-mission-report.ts` + `multi-agent-types.ts` (they already carry `primaryFinding`/`confidence`/`risks`/`evidenceNotes`).
- `src/lib/source/reasoning/types.ts` — `AnalysisResult`, `FrameworkParams`, `Framework = (input, params) => AnalysisResult`.
- `src/lib/source/reasoning/envelope-gate.ts` — the **keystone validator**: `validateEnvelope(env) → {ok, failures[]}`, where **a `Claim` with empty `supportedBy` is a failure, not a warning**; also flags leaked internal terms. Pure, unit-tested.
- `src/lib/source/reasoning/__tests__/envelope-gate.test.ts`.

**Additive-safety:** pure types + a pure validator; nothing imports it yet. **Lane:** `global-control-lane`. **Success:** validator rejects an unsupported claim in a test; types compile. **Release record:** yes (foundational contract).

### Slice 1.1 — Classify at intake (the forcing function) ✦(event-create, not generate)
**Files:**
- `src/lib/source/queries.ts` `createSourcingEvent(...)` — call `classifySourcingEvent` (`classifier/category-classifier.ts`) and persist `archetype` + `SourceRigorLevel` onto the `source_events` row.
- Migration `supabase/migrations/NNNN_source_events_archetype_rigor.sql` — add `archetype text`, `rigor text` if absent (verify: `types.ts` already exposes `event.archetype`/`event.rigor`, so columns may exist — check first; no-op migration if so).
- Tests: classification persists on create; existing events backfill is a separate ops job (not this slice).

**Additive-safety:** new columns + a classify call at create; does not touch generation. Spec calls this "small, low-risk, unblocks everything." **Lane:** `global-control-lane` (+ schema). **Success:** 100% of newly created events carry archetype + rigor. **Release record:** yes.

### Slice 1.2 — Framework registry + context adapter *(pure, no route change)*
**Files (new):**
- `src/lib/source/reasoning/framework-registry.ts` — seed library wrapping the **existing** modules as `Framework` pure-fns ("one definition, two callers"):
  | Framework key | Wraps |
  |---|---|
  | `should_cost_baseline` | `should-cost/should-cost-model.ts:buildShouldCostEstimate` (+ `estimateEventShouldCost`) |
  | `delivery_model_gate` | `delivery-model/delivery-model-gate.ts:runDeliveryModelGate` |
  | `proposal_normalization` | `proposal-normalization/proposal-normalization.ts:buildProposalNormalizationMatrix` |
  | `archetype_method_set` | `classifier/category-classifier.ts:classifySourcingEvent` |
- `src/lib/source/reasoning/context-adapter.ts` — `toFrameworkInputs(ctx: SourceGenerationContext)` → the `SourceAgentContextBundle`-shaped inputs the frameworks need (derive should-cost role-mix/value-at-stake from `ctx.event`; vendor proposals come from substrate once parsed — empty until d13/d15 land in Phase 2). **This is the single most important file in Phase 1.**
- Tests: each wrapped framework returns a well-formed `AnalysisResult` from a fixture `SourceGenerationContext`.

**Additive-safety:** pure functions; reuses shipped logic; no route change. **Lane:** `global-control-lane`. **Success:** should-cost + delivery-model produce `AnalysisResult`s off a real event context in a test. **Release record:** yes.

### Slice 1.3 — Analysis stage *(pure, no route change)*
**Files (new):**
- `src/lib/source/reasoning/analysis-stage.ts` — `runAnalysisStage(ctx, archetype, rigor) → AnalysisResult[]`. Selects frameworks via the resolver (1.4), runs each, attaches confidence + evidence refs. **Authors no prose.**
- Tests: deterministic framework selection per archetype/rigor; rigor modulates depth.

**Additive-safety:** new module, no callers on the route yet. **Lane:** `global-control-lane`. **Success:** analysis stage emits the expected framework set for a strategic AMS event. **Release record:** folded into 1.6 (ships when wired).

### Slice 1.4 — Archetype resolver *(pure; must NOT be conflated with `source-shape-resolver.ts`)*
**Files (new):**
- `src/lib/source/reasoning/archetype-resolver.ts` — `resolve(archetype, rigor, stage) → { frameworks: string[], evidenceThresholds }` (two-axis archetype × estate, Vol2 §5.6). Header comment must state it is the **analytical** resolver, distinct from the UI `WorkingPaneShapeResolver` in `source-shape-resolver.ts`.
- Tests: ordering + thresholds per archetype.

**Lane:** `global-control-lane`. **Success:** stable framework ordering + thresholds. **Release record:** folded into 1.6.

### Slice 1.5 — Recommendation stage *(pure, no route change)*
**Files (new):**
- `src/lib/source/reasoning/recommendation-stage.ts` — `runRecommendationStage(analysis: AnalysisResult[], ctx) → ReasoningEnvelope`. Enumerates + ranks options, runs the **challenge model** (`challenge(rec) → {steelman_against, fragile_claims[], assumption_flips[], verdict}`; `does_not_hold` forces revision/confidence downgrade), attaches the risk model (`impact × probability × (1 − mitigability)`, promoting `commercial-risk-detection.ts:RISK_PATTERNS`), computes the multi-factor `ConfidenceBand`. Emits **exactly one** envelope.
- Tests: a `does_not_hold` challenge downgrades confidence; risk scores compute; envelope passes `validateEnvelope` only when every claim is supported.

**Lane:** `global-control-lane`. **Success:** envelope from a real analysis set passes the gate validator. **Release record:** folded into 1.6.

### Slice 1.6 — Wire the spine into the live route, flag-gated ✦
**Files:**
- `src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/generate-from-claude/route.ts` — at the seam (181–185), **if `isFeatureEnabled(flagScope, 'source_reasoning_spine')`**: `analysis = runAnalysisStage(...)` → `envelope = runRecommendationStage(...)` → `validateEnvelope(envelope)` (fail ⇒ fall back to legacy + log) → pass envelope to `buildUserMessage(ctx, upstreamBound, envelope)`. Persist the envelope as JSON in `SourceArtifactBodyGenerationMetadata` (before the dedicated table lands).
- `src/lib/source/agent-generation/prompt-registry.ts` — widen `buildUserMessage` signature with optional `envelope?`; for d01/d05/d09, when an envelope is bound, switch the system prompt from "analyze and write…" to **"render this reasoning into board-grade prose — assert nothing the envelope does not support, cite its evidence, surface its caveats."** Keep the existing prompt when no envelope (legacy/fallback).
- `src/lib/source/agent-generation/types.ts` — `SourceArtifactBodyGenerationMetadata` gains an optional `reasoningEnvelope?` / `reasoningEnvelopeId?`.
- New flag `source_reasoning_spine` in `src/lib/features/registry.ts` (tenant-scoped, default off).
- Tests: flag-off ⇒ byte-identical legacy behavior; flag-on ⇒ envelope bound + prose constrained.

**Additive-safety:** the entire reasoning path is behind a default-off tenant flag with a validate-or-fallback guard; flag-off reproduces today's output exactly. **Lane:** `global-control-lane` + `experimental` (flag-gated). **Success (live, not fixture):** on a real First Capital event with the flag on, d01 regenerates from a bound envelope; flag-off produces the legacy output; reasoning-trace coverage 0%→100% for d01/d05/d09. **Release record:** yes — the first shippable increment.

### Slice 1.7 — Grounded refusal + envelope gate on the live path ✦ *(highest care)*
**Files:**
- `recommendation-stage.ts` — emit `RefusalRecord` when `requiredEvidence(stage, archetype).anyBelow('Usable Evidence')` for a **gate-defining** claim (promotion-only ladder: `Not Requested → Loaded → Parsed → Available → Usable Evidence`; `Stale`/`Low Confidence` rank below `Not Requested`, disqualifying).
- prompt-registry — when `envelope.refusal` is present, render the refusal + **minimum-data request**, never a fabricated recommendation.
- `src/lib/source/source-governance-enforcement.ts` — the gate model reads the refusal and **holds** the stage (Steward voice). (Read-only in P1; enforcement tightens in P4.)
- **Must be live-proven on the ACA private DB against a real under-evidenced event before trusted.** Calibrate against sponsor override to avoid over-triggering.

**Additive-safety:** still behind `source_reasoning_spine`; refusal only changes output for under-evidenced events. **Lane:** `global-control-lane`. **Success:** a real under-evidenced event yields an auditable refusal + minimum-data request instead of a fabricated rec; demonstrably declines vs the legacy path. **Release record:** yes.

### Slice 1.8 — Reasoning persistence + observability
**Files:**
- Migration `supabase/migrations/NNNN_reasoning_envelopes.sql` — `reasoning_envelopes` + `reasoning_traces` (tenant-scoped, RLS; FK to `source_events`). Move the envelope from `body_generation_metadata` JSON to the dedicated table.
- `src/lib/data-plane/write-adapters/sourceWriteAdapter.ts` — persist/read envelopes through the data-plane seam (no direct Supabase).
- Observability: reasoning-trace coverage metric surfaced (per Vol4 §16.9).

**Additive-safety:** envelope already persisted in metadata since 1.6; this migrates it durably. **Lane:** `global-control-lane` + `client-data-lane` (per-event envelope rows carry tenant evidence). **Success:** envelopes persist + are queryable per event with tenant isolation. **Release record:** yes (client-data-lane — needs the audit-evidence bundle per the ingestion truth standard).

---

## Dependency graph & merge order

```
1.0 contract ─┬─> 1.2 registry+adapter ─> 1.3 analysis ─┐
1.1 classify ─┘                          1.4 resolver ──┼─> 1.5 recommendation ─> 1.6 wire(flag) ─> 1.7 refusal ─> 1.8 persist
```
1.0 and 1.1 are parallel and low-risk (ship first). 1.2 is the integration crux. 1.6 is the first live-route touch — guarded by flag + validate-or-fallback. 1.7 is highest-care (live-proof required). 1.8 makes it durable.

## Guardrails honored
- **Additive only**; the legacy single-pass path is the untouched fallback (flag default-off).
- **No new legacy deps** (Supabase/Neo4j/Pinecone); all persistence through the Azure/Postgres data-plane adapters.
- **Tenant isolation, human approval gates, evidence-or-refuse, audit trail** are first-class: the envelope carries the audit trace; refusal feeds the Steward gate; envelopes are tenant-scoped/RLS.
- **Proof bar (Vol4 §16.1):** no slice is "done" on fixtures — 1.6/1.7/1.8 exit only on a live ACA-private-DB run against a real event with the gate enforced and a release record filed.

## Release records to file (this phase)
`global-control-lane`: 1.0, 1.1 (+schema), 1.2, 1.6 (+experimental flag), 1.7. `client-data-lane`: 1.8 (per-event envelope rows; audit-evidence bundle required).
