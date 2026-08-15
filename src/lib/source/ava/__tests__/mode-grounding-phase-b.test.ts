// Mode-specific grounding for Phase B's 8 vendor/value/commercial answer modes.
// Each builder must reuse `buildStepInsight` for the relevant stage (the SAME
// per-step insight the "✦ Intelligence" tab renders) and never re-derive a
// number — this suite fixtures known lever/vendor/BAFO/committed/realized data
// and asserts the grounding block reflects it, including the value-type
// classification every row carries.

import { buildModeGrounding } from "../mode-grounding";
import { AMS_MANAGED_SERVICES } from "@/lib/source/archetypes/registry";
import type { EventFactMap } from "@/lib/source/facts/evaluators/orchestrator";
import type { VendorResponseProfile } from "@/lib/source/proposal-intelligence/types";

const EVENT = {
  code: "SRC-AMS-2026-001",
  name: "Lakeshore AMS Consolidation",
  currentStageKey: "pricing",
  blocker: null,
  nextAction: null,
};

// Quantifies AMS.ENHANCEMENT_LEAKAGE (protected) and AMS.VOLUME_BAND_PRICING
// (incremental_negotiated) so the value-pool / value-bridge insights go LIVE
// with more than one value-type represented.
const FACTS_TWO_LEVERS: EventFactMap = {
  annual_change_order_spend: 4_000_000,
  recurring_avoidable_pct: 0.35,
  annual_run_cost: 20_000_000,
  projected_volume_decline_pct: 0.15,
  variable_cost_share_pct: 0.55,
  term_years: 3,
};

describe("buildModeGrounding — value_at_stake (Phase B)", () => {
  it("grounds the value bridge headline + value-type classification when facts quantify", () => {
    const result = buildModeGrounding({
      mode: "value_at_stake",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      baselineAmount: 30_000_000,
    });
    expect(result.block).toContain("VALUE-AT-STAKE GROUNDING");
    expect(result.block).toContain("LIVE");
    expect(result.block).toContain("VALUE-TYPE CLASSIFICATION");
    expect(result.quotableFacts.valueBridgeProvenance).toBe("live");
  });

  it("returns an empty result when no archetype is resolved", () => {
    const result = buildModeGrounding({
      mode: "value_at_stake",
      event: EVENT,
      archetype: null,
    });
    expect(result.block).toBe("");
  });
});

describe("buildModeGrounding — vendor_comparison (Phase B)", () => {
  it("grounds BOTH response-coverage and should-cost facets when both signals exist", () => {
    const result = buildModeGrounding({
      mode: "vendor_comparison",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      vendorResponses: {
        statusByVendorLever: new Map([
          [
            "vendor_a",
            new Map([
              ["AMS.ENHANCEMENT_LEAKAGE", "addressed" as const],
              ["AMS.VOLUME_BAND_PRICING", "dodged" as const],
            ]),
          ],
        ]),
        vendors: ["vendor_a"],
      },
      vendorBids: {
        bids: [
          { vendorId: "vendor_a", headlineBid: 21_900_000, retainedFteDelta: 14, slaCreditCapPct: 8 },
          { vendorId: "vendor_b", headlineBid: 24_800_000, retainedFteDelta: 4, slaCreditCapPct: 15 },
        ],
        vendors: ["vendor_a", "vendor_b"],
      },
    });
    expect(result.block).toContain("VENDOR COMPARISON GROUNDING");
    expect(result.block).toContain("Response coverage [LIVE]");
    expect(result.block).toContain("vendor_a");
    expect(result.block).toContain("Should-cost normalization [LIVE]");
    expect(result.block).toContain("VALUE-TYPE CLASSIFICATION");
    expect(result.quotableFacts.responseCoverageIsModel).toBe("false");
    expect(result.quotableFacts.shouldCostIsModel).toBe("false");
  });

  it("uses visible response profiles instead of ambient vendor rows for Responses-stage unsupported-claim asks", () => {
    const result = buildModeGrounding({
      mode: "vendor_comparison",
      event: EVENT,
      viewStageKey: "responses",
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      vendorResponseProfiles: [
        {
          vendorName: "Vendor A — incumbent operations profile",
          readyForEvaluation: "conditional",
          unsupportedClaims: ["Automation savings require stronger evidence"],
          responseCompleteness: {
            percent: 82,
            missingSections: [],
            partialSections: ["Productivity commitment"],
          },
          clarificationQuestions: ["Ask Vendor A to evidence the productivity baseline."],
        },
        {
          vendorName: "Vendor B — scale transformation profile",
          readyForEvaluation: "no",
          unsupportedClaims: ["Staffing model does not reconcile to 24x7 coverage"],
          responseCompleteness: {
            percent: 71,
            missingSections: ["Staffing and location"],
            partialSections: [],
          },
          clarificationQuestions: ["Ask Vendor B for the shift/location roster."],
        },
        {
          vendorName: "Vendor C — specialist service profile",
          readyForEvaluation: "conditional",
          unsupportedClaims: [],
          responseCompleteness: {
            percent: 88,
            missingSections: [],
            partialSections: ["Transition plan"],
          },
          clarificationQuestions: ["Ask Vendor C to confirm transition dates."],
        },
      ] as unknown as readonly VendorResponseProfile[],
      vendorResponses: {
        statusByVendorLever: new Map([
          [
            "Amadeus",
            new Map([
              ["AMS.ENHANCEMENT_LEAKAGE", "addressed" as const],
              ["AMS.VOLUME_BAND_PRICING", "partial" as const],
            ]),
          ],
        ]),
        vendors: ["Amadeus"],
      },
    });

    expect(result.block).toContain("VISIBLE RESPONSE PROFILES");
    expect(result.block).toContain("Vendor A — incumbent operations profile");
    expect(result.block).toContain("Vendor B — scale transformation profile");
    expect(result.block).toContain("Vendor C — specialist service profile");
    expect(result.block).not.toContain("Amadeus");
    expect(result.quotableFacts.responseCoverageIsModel).toBe("false");
  });

  it("keeps visible response profiles authoritative after an event has advanced beyond Responses", () => {
    const result = buildModeGrounding({
      mode: "vendor_comparison",
      event: {
        ...EVENT,
        currentStageKey: "value",
      },
      viewStageKey: "value",
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      vendorResponseProfiles: [
        {
          vendorName: "Vendor A — incumbent operations profile",
          readyForEvaluation: "conditional",
          unsupportedClaims: ["Automation savings require stronger evidence"],
          responseCompleteness: {
            percent: 82,
            missingSections: [],
            partialSections: ["Productivity commitment"],
          },
          clarificationQuestions: ["Ask Vendor A to evidence the productivity baseline."],
        },
        {
          vendorName: "Vendor B — scale transformation profile",
          readyForEvaluation: "no",
          unsupportedClaims: ["Staffing model does not reconcile to 24x7 coverage"],
          responseCompleteness: {
            percent: 71,
            missingSections: ["Staffing and location"],
            partialSections: [],
          },
          clarificationQuestions: ["Ask Vendor B for the shift/location roster."],
        },
      ] as unknown as readonly VendorResponseProfile[],
      vendorResponses: {
        statusByVendorLever: new Map([
          [
            "Amadeus",
            new Map([
              ["AMS.ENHANCEMENT_LEAKAGE", "addressed" as const],
              ["AMS.VOLUME_BAND_PRICING", "partial" as const],
            ]),
          ],
        ]),
        vendors: ["Amadeus"],
      },
    });

    expect(result.block).toContain("VISIBLE RESPONSE PROFILES");
    expect(result.block).toContain("Vendor A — incumbent operations profile");
    expect(result.block).toContain("Vendor B — scale transformation profile");
    expect(result.block).not.toContain("Amadeus");
    expect(result.quotableFacts.responseCoverageIsModel).toBe("false");
  });

  it("grounds what exists and honestly labels the other facet as model/pending when only one signal exists", () => {
    const result = buildModeGrounding({
      mode: "vendor_comparison",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      // No vendorResponses, no vendorBids provided → both facets are MODEL.
    });
    expect(result.block).toContain("Response coverage [MODEL");
    expect(result.block).toContain("Should-cost normalization [MODEL");
    expect(result.quotableFacts.responseCoverageIsModel).toBe("true");
    expect(result.quotableFacts.shouldCostIsModel).toBe("true");
  });
});

describe("buildModeGrounding — should_cost (Phase B)", () => {
  it("grounds per-vendor headline vs normalized TCO and flags the trap when the ranking flips", () => {
    const result = buildModeGrounding({
      mode: "should_cost",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      vendorBids: {
        bids: [
          { vendorId: "vendor_a", headlineBid: 21_900_000, retainedFteDelta: 14, slaCreditCapPct: 8 },
          { vendorId: "vendor_b", headlineBid: 24_800_000, retainedFteDelta: 4, slaCreditCapPct: 15 },
        ],
        vendors: ["vendor_a", "vendor_b"],
      },
    });
    expect(result.block).toContain("SHOULD-COST GROUNDING");
    expect(result.block).toContain("LIVE — normalized from the vendor bids provided");
    expect(result.block).toContain("cheapest on headline");
    expect(result.quotableFacts.headlineWinnerKey).toBeDefined();
    expect(result.quotableFacts.normalizedWinnerKey).toBeDefined();
  });

  it("is honest MODEL with illustrative vendors when no vendor-bid signal exists", () => {
    const result = buildModeGrounding({
      mode: "should_cost",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(result.block).toContain("MODEL — illustrative vendors, not real bids");
    expect(result.quotableFacts.shouldCostIsModel).toBe("true");
  });

  it("shows a bid missing an input as needs-evidence, never ranked as the winner", () => {
    const result = buildModeGrounding({
      mode: "should_cost",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      vendorBids: {
        bids: [
          { vendorId: "vendor_incomplete", headlineBid: 10_000_000 },
          { vendorId: "vendor_complete", headlineBid: 21_900_000, retainedFteDelta: 14, slaCreditCapPct: 8 },
        ],
        vendors: ["vendor_incomplete", "vendor_complete"],
      },
    });
    expect(result.block).toContain("needs evidence");
    expect(result.quotableFacts.normalizedWinnerKey).toBe("vendor_complete");
  });
});

describe("buildModeGrounding — risk_exposure (Phase B)", () => {
  it("grounds each lever's declared commercialRisk + confidence from the archetype playbook", () => {
    const result = buildModeGrounding({
      mode: "risk_exposure",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(result.block).toContain("RISK EXPOSURE GROUNDING");
    // AMS.ENHANCEMENT_LEAKAGE declares a commercialRisk in the registry.
    expect(result.block).toContain("Commercial risk:");
    expect(result.block).toContain("VALUE-TYPE CLASSIFICATION");
  });

  it("names a lever with no declared commercialRisk honestly rather than inventing one", () => {
    // AMS.TRANSITION_RISK has no commercialRisk field declared in the registry.
    const result = buildModeGrounding({
      mode: "risk_exposure",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: {}, // no facts → sample bars from every rule, including TRANSITION_RISK
    });
    expect(result.block).toContain("no commercial-risk note is declared");
  });
});

describe("buildModeGrounding — clause_coverage (Phase B)", () => {
  it("grounds protected vs exposed levers LIVE when an RFP-clause signal exists", () => {
    const result = buildModeGrounding({
      mode: "clause_coverage",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      rfpClausePresentLeverKeys: new Set(["AMS.ENHANCEMENT_LEAKAGE"]),
    });
    expect(result.block).toContain("CLAUSE COVERAGE GROUNDING");
    expect(result.block).toContain("LIVE — read from the RFP clause checklist facts");
    expect(result.block).toContain("PROTECTED");
    expect(result.block).toContain("EXPOSED");
    expect(result.quotableFacts.clauseCoverageIsModel).toBe("false");
  });

  it("is a MODEL (every lever exposed / to require) when no RFP-clause signal exists", () => {
    const result = buildModeGrounding({
      mode: "clause_coverage",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(result.block).toContain("MODEL — no RFP-clause signal yet");
    expect(result.quotableFacts.clauseCoverageIsModel).toBe("true");
  });
});

describe("buildModeGrounding — bafo_strategy (Phase B)", () => {
  it("grounds captured-vs-target per lever and the specific bafoAsk for each open lever", () => {
    const result = buildModeGrounding({
      mode: "bafo_strategy",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      bafoConcessionByLeverKey: new Map([["AMS.ENHANCEMENT_LEAKAGE", 500_000]]),
    });
    expect(result.block).toContain("BAFO STRATEGY GROUNDING");
    expect(result.block).toContain("LIVE — read from the BAFO concession actuals provided");
    expect(result.block).toContain("Captured so far:");
    expect(result.block).toContain("Still open");
    // Every still-open lever must carry its own bafoAsk text (not invented).
    expect(result.block).toMatch(/ask —/);
    expect(result.quotableFacts.bafoOpenLeverCount).toBeDefined();
  });

  it("is a MODEL with every lever still-open (0 captured) when no BAFO concession signal exists", () => {
    const result = buildModeGrounding({
      mode: "bafo_strategy",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(result.block).toContain("MODEL — no BAFO concession signal yet");
    expect(result.block).not.toContain("Captured so far:");
    expect(result.quotableFacts.bafoProgressIsModel).toBe("true");
  });
});

describe("buildModeGrounding — committed_value (Phase B)", () => {
  it("grounds committed-vs-target per lever and names levers awaiting award confirmation honestly", () => {
    const result = buildModeGrounding({
      mode: "committed_value",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      committedValueByLeverKey: new Map([["AMS.ENHANCEMENT_LEAKAGE", 3_000_000]]),
    });
    expect(result.block).toContain("COMMITTED VALUE GROUNDING");
    expect(result.block).toContain("LIVE — read from the award commitments provided");
    expect(result.block).toContain("Committed by the executed award:");
    expect(result.block).toContain("Still awaiting award confirmation");
    expect(result.quotableFacts.committedAwaitingCount).toBeDefined();
  });

  it("is a MODEL (target roll-up) when no award signal exists", () => {
    const result = buildModeGrounding({
      mode: "committed_value",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(result.block).toContain("MODEL — no award signal yet");
    expect(result.quotableFacts.committedValueIsModel).toBe("true");
  });
});

describe("buildModeGrounding — value_realization (Phase B)", () => {
  it("grounds realized-to-date vs committed per lever when a realized signal exists", () => {
    const result = buildModeGrounding({
      mode: "value_realization",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
      realizedValueByLeverKey: new Map([["AMS.ENHANCEMENT_LEAKAGE", 1_000_000]]),
    });
    expect(result.block).toContain("VALUE REALIZATION GROUNDING");
    expect(result.block).toContain("LIVE (snapshot)");
    expect(result.block).toContain("realized to date");
    expect(result.block).toContain("VALUE-TYPE CLASSIFICATION");
    expect(result.quotableFacts.valueRealizationIsModel).toBe("false");
  });

  it("is a MODEL (realization pending) when no realized signal exists", () => {
    const result = buildModeGrounding({
      mode: "value_realization",
      event: EVENT,
      archetype: AMS_MANAGED_SERVICES,
      factInputs: FACTS_TWO_LEVERS,
    });
    expect(result.block).toContain("MODEL — no realized-value signal yet");
    expect(result.quotableFacts.valueRealizationIsModel).toBe("true");
  });
});

describe("buildModeGrounding — Phase B modes return empty without an archetype", () => {
  it.each([
    "value_at_stake",
    "vendor_comparison",
    "should_cost",
    "risk_exposure",
    "clause_coverage",
    "bafo_strategy",
    "committed_value",
    "value_realization",
  ] as const)("%s returns an empty block when archetype is null", (mode) => {
    const result = buildModeGrounding({
      mode,
      event: EVENT,
      archetype: null,
    });
    expect(result.block).toBe("");
    expect(result.quotableFacts).toEqual({});
  });
});
