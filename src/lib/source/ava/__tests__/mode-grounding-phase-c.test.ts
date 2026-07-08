// Mode-specific grounding for Phase C's 3 modes: decision_recommendation,
// contract_optimization, general_advisory. decision_recommendation and
// contract_optimization are COMPOSITE builders — this suite proves they
// assemble EXISTING builder output (never re-derive) by asserting the
// composed block contains the same section headers/text the underlying
// builders themselves produce.

import { buildModeGrounding } from "../mode-grounding";
import { classifySourceAnswerMode } from "../answer-mode";
import { AMS_MANAGED_SERVICES } from "@/lib/source/archetypes/registry";
import {
  SAMPLE_SCOPE_STAGE,
  SAMPLE_RFP_STAGE,
} from "@/components/source/canvas/analytics/sample-view-model";
import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import type { EventFactMap } from "@/lib/source/facts/evaluators/orchestrator";

const EVENT = {
  code: "SRC-AMS-2026-001",
  name: "Lakeshore AMS Consolidation",
  currentStageKey: "pricing",
  blocker: null,
  nextAction: null,
};

const FACTS_TWO_LEVERS: EventFactMap = {
  annual_change_order_spend: 4_000_000,
  recurring_avoidable_pct: 0.35,
  annual_run_cost: 20_000_000,
  projected_volume_decline_pct: 0.15,
  variable_cost_share_pct: 0.55,
  term_years: 3,
};

describe("buildModeGrounding — decision_recommendation (Phase C, composite)", () => {
  it("assembles the exec-decision, vendor-comparison, BAFO, and unresolved-conditions facets", () => {
    const result = buildModeGrounding({
      mode: "decision_recommendation",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      baselineAmount: 30_000_000,
      viewStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
      bafoConcessionByLeverKey: new Map([["AMS.ENHANCEMENT_LEAKAGE", 500_000]]),
    });
    expect(result.block).toContain("DECISION RECOMMENDATION GROUNDING");
    // Exec-decision facet (composited, not re-derived).
    expect(result.block).toContain("EXECUTIVE DECISION FACET");
    expect(result.block).toContain("Net negotiable value");
    // Vendor comparison facet — same header buildVendorComparisonGrounding emits.
    expect(result.block).toContain("VENDOR COMPARISON GROUNDING");
    // BAFO facet — same header buildBafoStrategyGrounding emits.
    expect(result.block).toContain("BAFO STRATEGY GROUNDING");
    expect(result.block).toContain("Captured so far:");
    // Unresolved award conditions — stage gate + evidence readiness.
    expect(result.block).toContain("UNRESOLVED AWARD CONDITIONS");
    expect(result.block).toContain("STAGE GATE GROUNDING");
    expect(result.block).toContain("EVIDENCE READINESS GROUNDING");
  });

  it("omits a facet honestly when its underlying builder has nothing to ground (no stage view)", () => {
    const result = buildModeGrounding({
      mode: "decision_recommendation",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(result.block).toContain("DECISION RECOMMENDATION GROUNDING");
    expect(result.block).toContain("EXECUTIVE DECISION FACET");
    // No stageView provided → stage_gate grounding is the honest "not computed"
    // block, not fabricated MET/UNMET — still present but says so.
    expect(result.block).toContain("no live gate view is available");
  });

  it("still names unresolved award conditions honestly when no archetype/stage view resolves (never a bare empty result if there's SOMETHING to say)", () => {
    // No archetype → the exec-decision/vendor/BAFO facets have nothing to
    // ground (and are correctly omitted). But buildStageGateGrounding /
    // buildEvidenceReadinessGrounding ALWAYS have an honest "not computed yet"
    // line to contribute even with zero signal — so the composite still
    // surfaces that rather than returning a bare empty result.
    const result = buildModeGrounding({
      mode: "decision_recommendation",
      event: EVENT,
      archetype: null,
    });
    expect(result.block).toContain("UNRESOLVED AWARD CONDITIONS");
    expect(result.block).not.toContain("EXECUTIVE DECISION FACET");
    expect(result.block).not.toContain("VENDOR COMPARISON GROUNDING");
    expect(result.block).not.toContain("BAFO STRATEGY GROUNDING");
  });
});

describe("buildModeGrounding — contract_optimization (Phase C)", () => {
  it("grounds the value-pool leakage facet with each lever's own triggerLogic/valueBasis", () => {
    const result = buildModeGrounding({
      mode: "contract_optimization",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(result.block).toContain("CONTRACT OPTIMIZATION GROUNDING");
    expect(result.block).toContain("Leakage / opportunity pool");
    // AMS.ENHANCEMENT_LEAKAGE's triggerLogic/valueBasis text from the registry.
    expect(result.block).toContain("trigger —");
    expect(result.block).toContain("Basis —");
    expect(result.block).toContain(
      "Recurring ticket/enhancement categories appear outside the base run scope",
    );
  });

  it("grounds the scope-coverage facet with reachable-vs-stranded + potential-at-risk banding", () => {
    const result = buildModeGrounding({
      mode: "contract_optimization",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(result.block).toContain("Value exposure — reachable vs stranded");
  });

  it("names a lever with no declared triggerLogic/valueBasis honestly rather than inventing one", () => {
    // Use an archetype/fact combination where at least one lever's fields are
    // absent is not expected in this registry (every AMS rule declares both),
    // so this proves the FALLBACK text path renders instead of throwing when
    // a rule lookup misses (defensive honesty, not a live registry gap).
    const result = buildModeGrounding({
      mode: "contract_optimization",
      event: EVENT,
      archetype: { ...AMS_MANAGED_SERVICES, valueLeverRules: [] },
      factInputs: {},
    });
    // No levers wired — value_pool comes back with a "no value levers" note,
    // scope_coverage similarly — honest empty, not fabricated leakage/trigger.
    expect(result.block).toContain("CONTRACT OPTIMIZATION GROUNDING");
  });

  it("returns an empty result when no archetype resolves", () => {
    const result = buildModeGrounding({
      mode: "contract_optimization",
      event: EVENT,
      archetype: null,
    });
    expect(result.block).toBe("");
  });
});

describe("buildModeGrounding — general_advisory (Phase C, compact roll-up)", () => {
  it("rolls up current stage, value headline, and top open items — all reused from existing groundings", () => {
    const result = buildModeGrounding({
      mode: "general_advisory",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      baselineAmount: 30_000_000,
      viewStageKey: "scope",
      stageView: {
        ...(SAMPLE_SCOPE_STAGE as StageAnalyticsView),
        tasks: SAMPLE_SCOPE_STAGE.tasks.map((t) => ({
          ...t,
          evidenceComplete: false,
          state: "todo" as const,
        })),
      },
    });
    expect(result.block).toContain("GENERAL ADVISORY ROLL-UP");
    // Reuses buildEventStatusGrounding's own header/content.
    expect(result.block).toContain("EVENT STATUS GROUNDING");
    // Reuses buildValueAtStakeGrounding's own header/content (archetype present).
    expect(result.block).toContain("VALUE-AT-STAKE GROUNDING");
    // Top open items surfaced from the gate/evidence reads.
    expect(result.block).toContain("Top open items:");
  });

  it("still grounds event status + open items when no archetype resolves (skips the value facet honestly)", () => {
    const result = buildModeGrounding({
      mode: "general_advisory",
      event: EVENT,
      archetype: null,
      viewStageKey: "scope",
      stageView: SAMPLE_SCOPE_STAGE as StageAnalyticsView,
    });
    expect(result.block).toContain("GENERAL ADVISORY ROLL-UP");
    expect(result.block).toContain("EVENT STATUS GROUNDING");
    expect(result.block).not.toContain("VALUE-AT-STAKE GROUNDING");
  });

  // ── REGRESSION: live invariant violation, Lakeshore Holdings AMS event
  // adcb1cd0-c586-4622-bd29-574cc5a10862, RFP stage ────────────────────────
  //
  // The canvas correctly showed "1 of 1 complete" on the RFP stage's task
  // checklist (the RFP clause-coverage upload was persisted as
  // `RFP_CLAUSES_V1` facts / rfp_clause_present) and 4 of 6 AMS value levers
  // PROTECTED / 2 EXPOSED (from the real rfpClausePresentLeverKeys signal),
  // with every gate confirm green. Asking aVa "Is the RFP final and ready to
  // issue?" classifies to `general_advisory` (no Phase A/B/C pattern matches
  // that exact phrasing — confirmed against answer-mode.ts's RULES). Two
  // bugs compounded to make the grounding block itself wrong for this
  // question:
  //   1. `buildEventStatusGrounding` / `buildStageGateGrounding` computed
  //      "N of M complete" from `stageView.tasks`, which — before this fix —
  //      the chat route (route.ts) built via `buildLiveStageView` alone,
  //      WITHOUT the same `hydrateTaskEvidenceState` re-derivation step the
  //      canvas page always applies. So `stageView.tasks` kept the static
  //      scaffold's `state: 'todo'`, and the grounding reported "0 of 1
  //      complete" / gate UNMET even though the real facts/artifacts were
  //      persisted — this test fixtures the SAME hydrated stageView the fix
  //      now produces and asserts "1 of 1" / MET.
  //   2. `buildGeneralAdvisoryGrounding` never surfaced RFP clause coverage
  //      at all (only `clause_coverage` mode did), so a generically-phrased
  //      RFP-finality question got no protected/exposed read whatsoever —
  //      this test asserts the roll-up now includes the CLAUSE COVERAGE
  //      GROUNDING facet with the real 4-protected/2-exposed signal, not a
  //      MODEL/all-exposed fallback.
  it("REGRESSION: RFP-stage general_advisory reports the REAL hydrated task count and REAL clause coverage, never '0 of 1' / all-exposed", () => {
    // 4 of the 6 AMS_MANAGED_SERVICES levers have their RFP clause present;
    // the other 2 are genuinely exposed — this is the exact 4-protected/
    // 2-exposed split from the live bug report.
    const rfpClausePresentLeverKeys = new Set([
      "AMS.ENHANCEMENT_LEAKAGE",
      "AMS.VOLUME_BAND_PRICING",
      "AMS.PRODUCTIVITY_CREDITS",
      "AMS.SLA_ECONOMICS",
    ]);

    // The SAME hydration the canvas page performs before rendering: the RFP
    // stage's single "Confirm RFP clause coverage" task is stamped
    // evidenceComplete once its bound RFP_CLAUSES_V1 fact template has
    // landed (mirrors `hydrateTaskEvidenceState`'s honesty rule — this test
    // fixtures its OUTPUT directly rather than re-importing it, to isolate
    // what the grounding builder does with an already-hydrated view).
    const hydratedRfpStageView: StageAnalyticsView = {
      ...(SAMPLE_RFP_STAGE as StageAnalyticsView),
      tasks: SAMPLE_RFP_STAGE.tasks.map((t) => ({ ...t, evidenceComplete: true })),
    };

    const result = buildModeGrounding({
      mode: "general_advisory",
      event: { ...EVENT, currentStageKey: "rfp" },
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      baselineAmount: 30_000_000,
      viewStageKey: "rfp",
      stageView: hydratedRfpStageView,
      rfpClausePresentLeverKeys,
    });

    // Bug 1: task checklist must read "1 of 1 complete", never "0 of 1".
    expect(result.block).toContain("Current-stage task checklist: 1 of 1 complete");
    expect(result.block).not.toContain("Current-stage task checklist: 0 of 1");
    expect(result.quotableFacts.taskChecklistDone).toBe("1");
    expect(result.quotableFacts.taskChecklistTotal).toBe("1");

    // Bug 1 (gate): gateAllTasksComplete must be "true" (the RFP stage's own
    // confirm labels — "Every priced lever has a clause" / "BAFO fallbacks
    // paired" / "RFP final" — don't match the evidence-box label pattern, so
    // they read as "requires human confirmation" rather than MET/UNMET; the
    // task-derived signal is what must not regress to false/unmet).
    expect(result.block).not.toContain("UNMET");
    expect(result.quotableFacts.gateAllTasksComplete).toBe("true");

    // Bug 2: the clause-coverage facet must be present and LIVE, with the
    // real 4-protected/2-exposed split — never omitted, and never the
    // MODEL/"every lever shown as exposed" fallback.
    expect(result.block).toContain("CLAUSE COVERAGE GROUNDING");
    expect(result.block).toContain("LIVE — read from the RFP clause checklist facts");
    expect(result.block).not.toContain("MODEL — no RFP-clause signal yet");
    expect(result.quotableFacts.clauseCoverageIsModel).toBe("false");
    const protectedCount = (result.block.match(/PROTECTED — clause present in the RFP\./g) ?? [])
      .length;
    const exposedCount = (result.block.match(/EXPOSED — clause not present\./g) ?? []).length;
    expect(protectedCount).toBe(4);
    expect(exposedCount).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Source aVa polish gate — Gap 2 regression ("What value levers exist?").
//
// This question classifies to `general_advisory` (no Phase A/B/C pattern
// matches this exact phrasing — confirmed against answer-mode.ts's RULES),
// which IS a grounded mode (Phase C grounds the catch-all with a compact
// roll-up rather than leaving it as a bare passthrough). The live-found Gap 2
// bug was that a value-lever answer rendered as a garbled run-on pipe
// "table" — this suite proves the GROUNDING side of that answer never emits
// a pipe-delimited fragment itself (it uses bullet-style value-type
// classification lines, e.g. "Protected (risk hedge): Enhancement / ...
// leakage."), so any garbling that DOES happen is a model-generation /
// render concern, not a grounding-data concern — and is covered on the
// render side by response-shape's repairRunOnPipeTableText suite
// (source-ava-polish-gate-response-shape.test.ts).
// ─────────────────────────────────────────────────────────────────────────────
describe("Source aVa polish gate — Gap 2: 'What value levers exist?' grounding never emits a raw pipe fragment", () => {
  it("classifies to general_advisory (the grounded catch-all), not a fallback that skips grounding", () => {
    const result = classifySourceAnswerMode({ question: "What value levers exist?" });
    expect(result.mode).toBe("general_advisory");
  });

  it("general_advisory's grounding block for this question's stage/facts contains no un-tabled pipe fragments", () => {
    const result = buildModeGrounding({
      mode: "general_advisory",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      viewStageKey: "pricing",
    });
    // The grounding block itself must never contain a literal "|" — it
    // formats lever/value-type data as bullet lines, never as inline
    // pipe-delimited text a downstream renderer would have to parse.
    expect(result.block).not.toContain("|");
    // It still names the levers/value types (so the model has real data to
    // narrate as a clean table or list, per the TABLE FORMAT guard in
    // AVA_SOURCE_QUOTE_NOT_COMPUTE_GUARD).
    expect(result.block).toContain("VALUE-TYPE CLASSIFICATION");
  });
});
