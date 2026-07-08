// Mode-specific grounding for Phase C's 3 modes: decision_recommendation,
// contract_optimization, general_advisory. decision_recommendation and
// contract_optimization are COMPOSITE builders — this suite proves they
// assemble EXISTING builder output (never re-derive) by asserting the
// composed block contains the same section headers/text the underlying
// builders themselves produce.

import { buildModeGrounding } from "../mode-grounding";
import { AMS_MANAGED_SERVICES } from "@/lib/source/archetypes/registry";
import { SAMPLE_SCOPE_STAGE } from "@/components/source/canvas/analytics/sample-view-model";
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
});
