# Next Slice Plan - Commercial Convergence Contract

Date: 2026-04-26
Scope: Source deterministic commercial layer convergence
Status: planned

## 1. Purpose

Converge existing Source commercial modules and Wave-14 commercial intelligence into one canonical commercial signal contract so Executive Decision Summary and Vendor Selection Readiness can consume a single, deterministic source of commercial truth.

This slice is a convergence and adapter effort. It is not a net-new commercial logic build.

## 2. Duplicate / Overlap Map

### BAFO overlap

- Existing active module:
  - `src/lib/source/bafo-negotiation.ts`
- Wave-14 parallel module:
  - `src/lib/source/bafo-negotiation-model.ts`
- Overlap:
  - both emit deterministic BAFO constructs (asks, opportunities, risks, recommendations)
  - both describe negotiation levers

### Pricing overlap

- Existing active module:
  - `src/lib/source/pricing-normalization.ts`
- Wave-14 parallel module:
  - `src/lib/source/pricing-normalization-model.ts`
- Overlap:
  - both compute normalized vendor pricing and cross-vendor comparison outputs

### Risk overlap

- Existing risk/trap signaling path:
  - `pricing-normalization.ts` and `bafo-negotiation.ts` expose trap/risk cues
- Wave-14 dedicated risk module:
  - `src/lib/source/commercial-risk-detection.ts`
- Overlap:
  - both represent commercial exception/risk posture

### Mission overlap

- Existing Source mission system:
  - `src/lib/source/agent-missions.ts`
- Wave-14 commercial queue:
  - `src/lib/source/commercial-mission-queue.ts`
- Overlap:
  - both define prioritized mission-like actions and ownership semantics

### UI overlap (out of scope for this slice)

- Existing active workflow panels:
  - Scope / RFP / Vendor response / BAFO / Executive decision panels in event canvas
- Wave-14 presentational components:
  - `SourceCommercialSummaryPanel.tsx`
  - `VendorPricingComparison.tsx`
- Overlap:
  - Wave-14 components represent commercial summaries already implied by active workflow data
  - no panel wiring in this slice

## 3. Canonical Commercial Signal Contract

Canonical contract module target:

- `src/lib/source/commercial-signal-types.ts`
- `src/lib/source/commercial-signals.ts`

Contract responsibilities:

- aggregate pricing, BAFO, and risk outputs from existing modules
- report blockers, tradeoffs, commercial readiness, and executive implications
- annotate source provenance (`sourceModulesUsed`) for deterministic traceability

Canonical output (initial):

- `eventId`
- `generatedAt`
- `pricingSignals`
- `bafoSignals`
- `riskSignals`
- `vendorTradeoffs`
- `commercialReadiness`
- `executiveImplications`
- `blockers`
- `recommendedNextAction`
- `sourceModulesUsed`

## 4. BAFO / Pricing / Risk Convergence Strategy

Convergence rule:

- prefer reuse + adaptation over reimplementation
- do not remove existing modules in this phase

Adapter strategy:

1. Build BAFO adapter:
   - read from existing `bafo-negotiation.ts`
   - augment with Wave-14 `bafo-negotiation-model.ts` where fields are additive
2. Build pricing adapter:
   - read from existing `pricing-normalization.ts`
   - augment with Wave-14 `pricing-normalization-model.ts` tower/line granularity
3. Build risk adapter:
   - consume `commercial-risk-detection.ts` as canonical risk exception feed
   - map existing trap signals into normalized risk signal shape

## 5. Executive Decision Summary Consumption

Executive Decision Summary should remain the decision surface owner.

Consumption path:

- `executive-decision-summary.ts` consumes canonical commercial signals (not direct parallel BAFO/pricing model pairs)
- executive posture derives from one consolidated commercial package
- no second decision stack introduced

## 6. Vendor Selection Readiness Consumption

Vendor Selection Readiness should consume the same canonical commercial signals to avoid divergence.

Consumption goals:

- deterministic gate input for comparability and commercial readiness
- consistent blocker semantics with executive decision summary
- shared provenance through `sourceModulesUsed`

## 7. Commercial Mission Queue to Agent Missions Mapping

Mapping principle:

- `commercial-mission-queue.ts` remains a commercial planning feed
- `agent-missions.ts` remains canonical Source mission authority for runtime surfaces

Planned mapping:

- map queue items into agent mission fields:
  - owner -> agent name
  - priority -> mission priority
  - blockedBy -> blockerReason/handoff semantics
  - objective/recommended action -> mission summary/action

No dual mission generation runtime should be introduced.

## 8. Deprecate vs Retain

Retain now:

- `bafo-negotiation.ts`
- `pricing-normalization.ts`
- `commercial-risk-detection.ts`
- `bafo-negotiation-model.ts`
- `pricing-normalization-model.ts`
- `commercial-mission-queue.ts`

Deprecation posture now:

- no immediate module deletion
- no API/UI rewiring in this planning slice
- deprecation decisions deferred until adapter-based integration tests prove parity

## 9. Implementation Sequence

1. Land this convergence plan (docs-only).
2. Build commercial signal adapter (no UI changes).
3. Add deterministic tests validating converged signal shape/provenance.
4. Plan mission adapter to prevent dual mission authorities.
5. In later slice, wire canonical commercial signals into existing executive decision summary path.
6. In later slice, wire canonical signals into vendor-selection readiness path.

## 10. Acceptance Criteria

- overlap map is explicit for BAFO/pricing/risk/mission paths
- canonical commercial signal contract is defined and bounded
- executive and selection consumers are defined to use one commercial feed
- deprecate/retain posture is explicit and conservative
- implementation sequence is deterministic and test-first
- no model calls, upload/parsing, workflow engine, or approval engine is introduced

## 11. What Not to Build

- no new commercial business logic from scratch
- no duplicate BAFO/pricing/risk model families
- no Source UI panel changes
- no runtime workflow/approval engine behavior
- no upload/parsing
- no model-assisted generation
- no `/programs`, `/preview`, `/demo` work
