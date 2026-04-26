# 60 Source Commercial Convergence Audit

Date: 2026-04-26
Scope: deterministic contract audit only (no runtime/UI/API behavior changes)

## 1. Current Commercial Module Graph

Executive decision path today:

1. `src/lib/source/executive-decision-summary.ts`
2. consumes `buildSourceCommercialSignals(...)` from `src/lib/source/commercial-signals.ts`
3. consumes `buildSourceCommercialAgentMissions(...)` from `src/lib/source/commercial-mission-adapter.ts` when `unifiedMissions` are not provided by caller
4. synthesizes deterministic posture/tradeoffs/blockers/options for panel rendering

Commercial-signal composition path:

1. `src/lib/source/commercial-signals.ts`
2. consumes `buildSourcePricingNormalization(...)` from `src/lib/source/pricing-normalization.ts`
3. consumes `buildSourceBafoNegotiationPlan(...)` from `src/lib/source/bafo-negotiation.ts`
4. consumes `detectCommercialRisks(...)` from `src/lib/source/commercial-risk-detection.ts`
5. emits canonical `SourceCommercialSignals` contract

Commercial-mission composition path:

1. `src/lib/source/commercial-mission-adapter.ts`
2. consumes `buildCommercialMissionQueue(...)` from `src/lib/source/commercial-mission-queue.ts`
3. maps commercial missions into canonical `SourceAgentMission` contract (`agent-mission-types.ts`)

## 2. Canonical Modules (Current Contract of Record)

- `src/lib/source/commercial-signals.ts`
- `src/lib/source/commercial-signal-types.ts`
- `src/lib/source/commercial-mission-adapter.ts`
- `src/lib/source/commercial-mission-adapter-types.ts`
- `src/lib/source/executive-decision-summary.ts`
- `src/lib/source/executive-decision-types.ts`

These modules currently define the intended convergence contract for Source executive decision synthesis.

## 3. Legacy / Earlier Stack Modules

- `src/lib/source/pricing-normalization.ts`
- `src/lib/source/bafo-negotiation.ts`
- `src/lib/source/vendor-response-completeness.ts`
- `src/lib/source/agent-missions.ts`

These remain active inputs and are still used by canonical adapters. They are not dead code.

## 4. Wave-14 Stack Modules

- `src/lib/source/pricing-normalization-model.ts`
- `src/lib/source/bafo-negotiation-model.ts`
- `src/lib/source/commercial-risk-detection.ts`
- `src/lib/source/commercial-mission-queue.ts`
- `src/components/source/SourceCommercialSummaryPanel.tsx`
- `src/components/source/VendorPricingComparison.tsx`

Wave-14 introduced parallel model variants and additional commercial surfaces. In the current executive-decision path, `commercial-risk-detection.ts` and `commercial-mission-queue.ts` are actively used through canonical adapters; `*-model.ts` variants are not directly consumed by `executive-decision-summary.ts`.

## 5. How `commercial-signals` Bridges Stacks

`commercial-signals.ts` is the key bridge:

- consolidates pricing (`pricing-normalization.ts`), BAFO (`bafo-negotiation.ts`), and risk (`commercial-risk-detection.ts`) into one `SourceCommercialSignals` output
- emits deterministic readiness/blockers/tradeoffs/executive implications used downstream
- prevents direct executive-decision dependency on raw pricing/BAFO/risk internals

## 6. How `commercial-mission-adapter` Bridges Missions

`commercial-mission-adapter.ts` bridges Wave-14-style commercial mission queue output into canonical `SourceAgentMission` records used by Source agent surfaces:

- owner mapping: Nexus/Sentinel/Atlas/Steward
- deterministic priority/state/trigger mapping
- duplicate suppression against existing canonical missions

## 7. How `executive-decision-summary` Consumes Contracts

Confirmed:

- imports canonical `buildSourceCommercialSignals(...)`
- imports canonical `buildSourceCommercialAgentMissions(...)`
- does not directly import `pricing-normalization-model.ts` or `bafo-negotiation-model.ts`
- panel consumption is bounded via `SourceExecutiveDecisionSummaryPanel` and deterministic summary contract

Current caveat:

- if `unifiedMissions` is provided in `SourceExecutiveDecisionInput`, executive summary uses provided missions and bypasses adapter generation in that execution path

## 8. Remaining Duplicate Risks

1. Parallel BAFO/pricing model variants exist (`*-model.ts` vs non-model files), increasing drift risk.
2. Executive summary accepts externally provided `unifiedMissions`; this allows non-adapter mission payloads unless caller discipline is strict.
3. `sourceModulesUsed` in executive summary is static and does not declare whether adapted missions were generated or injected.

## 9. Recommended Safe Tightening

Safe, in-scope tightening for next slice:

1. Keep executive summary contract centered on canonical adapters.
2. Make mission provenance explicit in summary output (`sourceModulesUsed`) so adapter usage vs provided mission path is visible.
3. Preserve deterministic behavior and avoid introducing any new pricing/BAFO/risk logic.
4. Keep UI unchanged; tighten at model + tests only.

## 10. What Not to Change in This Follow-through

- Do not rewrite pricing or BAFO engines.
- Do not remove Wave-14 modules in this slice.
- Do not add new UI panels.
- Do not add runtime API/model/upload/persistence behavior.
- Do not introduce workflow/approval/final-selection automation.
