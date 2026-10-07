// A deliverable a Moves phase can generate must not be given a per-section
// word budget whose total cannot reach its own word floor.
//
// Two declarations meet in the generation prompt. The document FLOOR comes from
// the quality bar (quality-bar-registry.ts → artifact-contracts.ts) and is a
// blocking check: below it the run is quarantined `document too short`. The
// per-section HARD CAP is parsed out of each section's editorial
// `expertLatitude` prose and rendered as `Hard cap for this section: N body
// words.` Nothing reconciled them, and two deliverables in the default P3 build
// set did not reconcile — solution_design's six caps totalled 2,700 against a
// 2,800 floor, sourcing_strategy's five totalled 1,780 against 1,800. Obeying
// every cap could not clear the gate.
//
// It matters past those two documents because P3 enqueues its six as a
// SEQUENTIAL chain and `blockRunsWithFailedDependencies` cascades from a
// blocked parent: one document stuck below its floor holds every later P3
// document, the P3 gate, and the phase.
//
// So this is a totality guard over every key any phase can request on any
// route, not a pair of examples — the arithmetic is in two files that are
// edited for unrelated reasons (tightening a section's editorial guidance;
// recalibrating a word band) and neither edit looks like it touches the other.
//
// It asserts the three invariants the reconciliation exists to hold, named in
// section-word-budget-plan.ts:
//
//   INV1  every section's repair target is at or below its own cap — the repair
//         prompt asks for the target "while staying under the hard cap above",
//         so a target above the cap is a contradiction in one prompt;
//   INV2  the targets TOTAL at least the floor — writing every section to its
//         target clears the gate; and
//   INV3  the caps total no more than the ceiling — obeying them cannot breach
//         the blocking maximum instead.

import {
  PHASE_CANONICAL_KEYS,
  phaseCanonicalKeysForRoute,
} from "@/lib/programs/deliverable-registry";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";
import { resolveQualityBar } from "@/lib/deliverables/orchestrator/quality-bar-registry";
import { sectionWordBudgetPlanFor } from "@/lib/deliverables/orchestrator/prompt-builder";
import {
  planSectionWordBudgets,
  requiredCapTotalForFloor,
  sectionWordBudgetFor,
} from "@/lib/deliverables/orchestrator/section-word-budget-plan";
import {
  runDeliverableOrchestration,
  type ModelCaller,
} from "@/lib/deliverables/orchestrator/orchestrator";
import { amsRfpRequest } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";
import type { DeliverableIntelligenceRequest } from "@/lib/deliverables/orchestrator/types";
import type { ConfirmedSolutionRoute } from "@/lib/programs/solution-route-assessment";

type ChangeImpact = ConfirmedSolutionRoute["workflowChange"];

const CHANGE_IMPACTS: ChangeImpact[] = ["material", "limited", "none"];

/** Every route shape the build-set resolver branches on, not just the default. */
function everyRouteShape(): Array<ConfirmedSolutionRoute | null> {
  const shapes: Array<ConfirmedSolutionRoute | null> = [null];
  for (const route of ["technical_product", "process_change"] as const) {
    for (const workflowChange of CHANGE_IMPACTS) {
      for (const roleAccountabilityChange of CHANGE_IMPACTS) {
        shapes.push({
          route,
          workflowChange,
          roleAccountabilityChange,
        } as ConfirmedSolutionRoute);
      }
    }
  }
  return shapes;
}

/** Union of every registry key any phase can request, on any route. */
function everyGeneratableKey(): string[] {
  const keys = new Set<string>();
  for (const phase of Object.keys(PHASE_CANONICAL_KEYS).map(Number)) {
    for (const key of PHASE_CANONICAL_KEYS[phase] ?? []) keys.add(key);
    for (const route of everyRouteShape()) {
      for (const key of phaseCanonicalKeysForRoute(phase, route)) {
        keys.add(key);
      }
    }
  }
  return [...keys].sort();
}

/**
 * The request shape the plan reads. Only the quality bar and the brief matter,
 * and both are resolved from the shipped registries rather than invented here —
 * an expectation read off the thing under test cannot see a drift in it.
 */
function requestFor(orchestratorType: string): DeliverableIntelligenceRequest {
  return {
    module: "moves",
    useCaseArchetype: "governed_data_foundation",
    deliverableType: orchestratorType,
    clientDisplayName: "Northwind Group",
    initiativeDisplayName: "Reference Move",
    audience: ["Executive sponsor"],
    contextSummary: "Reference context for budget resolution.",
    sourceArtifactRef: "move-reference",
    qualityBar: resolveQualityBar("moves", orchestratorType),
  } as unknown as DeliverableIntelligenceRequest;
}

describe("every generatable Moves deliverable can reach its own word floor", () => {
  const keys = everyGeneratableKey();

  it("covers every phase's build set on every route", () => {
    // Guards the enumeration itself: a key list that silently shrank would make
    // every case below vacuous.
    expect(keys.length).toBeGreaterThanOrEqual(20);
    expect(keys).toContain("solution_design");
    expect(keys).toContain("sourcing_strategy");
    expect(keys).toContain("process_change_estimate_brief");
  });

  it.each(everyGeneratableKey())(
    "%s: section caps and repair targets reconcile with the quality bar",
    (registryKey) => {
      const orchestratorType = orchestratorDeliverableType(registryKey);
      const req = requestFor(orchestratorType);
      const brief = getArtifactBrief(req);
      const plan = sectionWordBudgetPlanFor(req, brief);

      // Null means this type states no per-section cap, so there is no cap for
      // a target to contradict and nothing to reconcile.
      if (!plan) return;

      const qb = req.qualityBar;
      expect(plan.basis).not.toBe("floor_exceeds_ceiling");
      expect(plan.sections).toHaveLength(brief.recommendedStructure.length);

      // INV1 — per section, not just in aggregate: one section asked for more
      // than its own cap is one contradictory prompt, whatever the totals do.
      for (const section of plan.sections) {
        expect(section.repairTarget).toBeLessThanOrEqual(section.cap);
        expect(section.repairTarget).toBeGreaterThan(0);
      }

      // INV2 — writing every section to its target clears the floor.
      const targetTotal = plan.sections.reduce(
        (sum, section) => sum + section.repairTarget,
        0,
      );
      expect(targetTotal).toBeGreaterThanOrEqual(qb.minBodyWords);

      // ...and the targets aim at the FLOOR, not at the caps. Repairing every
      // section to its own maximum would satisfy INV1 and INV2 and still be
      // wrong: it trades the too-short blocker for the too-long one. Slack of
      // one word per section is the per-section round-up.
      expect(targetTotal).toBeLessThanOrEqual(
        plan.requiredTotal + plan.sections.length,
      );

      // INV3 — and obeying every cap cannot breach the ceiling the gate blocks
      // on. That is `advisoryBandMax ?? targetBodyWordsMax`: between the two the
      // validator warns and serves the document.
      expect(plan.capTotal).toBeLessThanOrEqual(
        qb.advisoryBandMax ?? qb.targetBodyWordsMax ?? 0,
      );
    },
  );

  it("raises the two P3 documents whose declared caps fell below their floor", () => {
    // The regression itself, pinned by name. Stated as declared-total vs floor
    // so it reads as the defect rather than as today's arithmetic: if a future
    // edit makes the declared caps sufficient on their own, this case says so
    // by failing, and the invariant cases above still hold the real contract.
    const raised: string[] = [];
    for (const registryKey of everyGeneratableKey()) {
      const orchestratorType = orchestratorDeliverableType(registryKey);
      const req = requestFor(orchestratorType);
      const plan = sectionWordBudgetPlanFor(req, getArtifactBrief(req));
      if (!plan) continue;
      if (plan.basis === "declared_caps_raised_to_reach_floor") {
        expect(plan.declaredTotal).toBeLessThan(req.qualityBar.minBodyWords);
        expect(plan.capTotal).toBeGreaterThanOrEqual(plan.requiredTotal);
        raised.push(registryKey);
      }
    }
    expect(raised.sort()).toEqual(["solution_design", "sourcing_strategy"]);
  });

  it("brings the P5 contract's caps inside the ceiling the gate blocks on", () => {
    // The mismatch in the other direction, found by INV3: seven caps totalling
    // 4,800 against a 4,200 blocking ceiling. Weaker than the floor cases — a
    // cap is a maximum — but the stated budget still permitted a document the
    // gate refuses.
    const lowered: string[] = [];
    for (const registryKey of everyGeneratableKey()) {
      const req = requestFor(orchestratorDeliverableType(registryKey));
      const plan = sectionWordBudgetPlanFor(req, getArtifactBrief(req));
      if (!plan) continue;
      if (plan.basis === "declared_caps_lowered_to_fit_ceiling") {
        expect(plan.declaredTotal).toBeGreaterThan(plan.permittedTotal);
        expect(plan.capTotal).toBeLessThanOrEqual(plan.permittedTotal);
        expect(plan.capTotal).toBeGreaterThanOrEqual(plan.requiredTotal);
        lowered.push(registryKey);
      }
    }
    expect(lowered.sort()).toEqual(["value_measurement_contract"]);
  });

  it("leaves a deliverable whose declared caps already fit the band untouched", () => {
    // The other half: the fix must be inert where there was no contradiction,
    // or it silently re-budgets every document in the product.
    const req = requestFor("charter");
    const brief = getArtifactBrief(req);
    const plan = sectionWordBudgetPlanFor(req, brief);
    expect(plan?.basis).toBe("declared_caps_fit_the_band");
    for (const section of plan?.sections ?? []) {
      expect(section.cap).toBe(section.declaredCap);
    }
  });
});

describe("planSectionWordBudgets", () => {
  const sections = [
    { key: "a", declaredCap: 300 },
    { key: "b", declaredCap: 150 },
  ];

  it("returns the declared caps unchanged when they already cover the floor", () => {
    const plan = planSectionWordBudgets({
      sections,
      fallbackCap: 200,
      minBodyWords: 400,
      blockingCeiling: 2_000,
    });
    expect(plan.basis).toBe("declared_caps_fit_the_band");
    expect(plan.sections.map((s) => s.cap)).toEqual([300, 150]);
    expect(plan.capTotal).toBe(450);
  });

  it("raises the caps proportionally when their total cannot reach the floor", () => {
    const plan = planSectionWordBudgets({
      sections,
      fallbackCap: 200,
      minBodyWords: 900,
      blockingCeiling: 2_000,
    });
    expect(plan.basis).toBe("declared_caps_raised_to_reach_floor");
    expect(plan.declaredTotal).toBe(450);
    expect(plan.requiredTotal).toBe(requiredCapTotalForFloor(900));
    expect(plan.capTotal).toBeGreaterThanOrEqual(plan.requiredTotal);
    // Proportional, not flattened to an even share: "a" declared twice "b" and
    // must still be about twice "b" afterwards. An even share would make the
    // editorial judgement about where the weight belongs disappear.
    const [a, b] = plan.sections;
    expect(a!.cap).toBeGreaterThan(b!.cap);
    expect(a!.cap / b!.cap).toBeCloseTo(2, 1);
  });

  it("aims the repair targets at the floor, not at the caps", () => {
    const plan = planSectionWordBudgets({
      sections,
      fallbackCap: 200,
      minBodyWords: 200,
      blockingCeiling: 2_000,
    });
    // Caps of 300+150 against a 200 floor: there is room to ask for all 450,
    // and asking for it would drive the document toward the ceiling instead of
    // just clearing the floor.
    const targetTotal = plan.sections.reduce(
      (sum, section) => sum + section.repairTarget,
      0,
    );
    expect(plan.capTotal).toBe(450);
    expect(targetTotal).toBeGreaterThanOrEqual(200);
    expect(targetTotal).toBeLessThan(plan.capTotal);
  });

  it("keeps every repair target under its own cap even after a raise", () => {
    const plan = planSectionWordBudgets({
      sections: [
        { key: "tiny", declaredCap: 80 },
        { key: "large", declaredCap: 900 },
      ],
      fallbackCap: 200,
      minBodyWords: 1_500,
      blockingCeiling: 4_000,
    });
    for (const section of plan.sections) {
      expect(section.repairTarget).toBeLessThanOrEqual(section.cap);
    }
    const total = plan.sections.reduce((sum, s) => sum + s.repairTarget, 0);
    expect(total).toBeGreaterThanOrEqual(1_500);
  });

  it("applies the fallback to a section that declared no cap of its own", () => {
    const plan = planSectionWordBudgets({
      sections: [
        { key: "declared", declaredCap: 400 },
        { key: "undeclared", declaredCap: null },
      ],
      fallbackCap: 250,
      minBodyWords: 500,
      blockingCeiling: 2_000,
    });
    expect(plan.sections.map((s) => s.cap)).toEqual([400, 250]);
    expect(plan.sections[1]!.declaredCap).toBeNull();
  });

  it("reports a floor it cannot cover without breaching the ceiling, instead of trading one blocker for the other", () => {
    const plan = planSectionWordBudgets({
      sections,
      fallbackCap: 200,
      minBodyWords: 3_000,
      blockingCeiling: 1_000,
    });
    expect(plan.basis).toBe("floor_exceeds_ceiling");
    // Left exactly as declared — raising them would breach the ceiling check.
    expect(plan.sections.map((s) => s.cap)).toEqual([300, 150]);
    expect(plan.capTotal).toBeLessThanOrEqual(1_000);
  });

  it("has nothing to reconcile for a document with no sections", () => {
    const plan = planSectionWordBudgets({
      sections: [],
      fallbackCap: 200,
      minBodyWords: 900,
      blockingCeiling: 2_000,
    });
    expect(plan.sections).toEqual([]);
    expect(plan.basis).toBe("declared_caps_fit_the_band");
  });

  it("resolves a section by key and refuses one it does not carry", () => {
    const plan = planSectionWordBudgets({
      sections,
      fallbackCap: 200,
      minBodyWords: 400,
      blockingCeiling: 2_000,
    });
    expect(sectionWordBudgetFor(plan, "a")?.cap).toBe(300);
    expect(sectionWordBudgetFor(plan, "absent")).toBeNull();
    expect(sectionWordBudgetFor(plan, undefined)).toBeNull();
  });

  it("derives the required cap total from the same margin the repair pass budgets with", () => {
    // Two independent literals once. If this stops agreeing, a document can be
    // repaired to its targets and still land under the floor.
    expect(requiredCapTotalForFloor(2_800)).toBe(Math.ceil(2_800 * 1.05));
  });
});

// ── The wiring, through the real orchestration run ────────────────────────────
//
// The cases above exercise the plan. These exercise the two CALLERS, because a
// correct plan nothing reads changes nothing: `prompt-builder` states the cap to
// the model and `orchestrator` asks the repair pass for the target, and they
// were separate readings of separate declarations. Driven through
// `runDeliverableOrchestration` with a stub model so the assertion is made
// against the prompt the model would actually receive.
describe("the repair prompt never asks a section for more than it permits", () => {
  /** Deliberately far below every floor, so every section needs repair. */
  const SHORT_SECTION = JSON.stringify({
    key: "section",
    title: "Section",
    bodyMarkdown: "## Detail\nWe recommend proceeding on the approved route [1].",
    groundingMode: "mixed",
    citationsUsed: [1],
  });

  function movesRequest(
    deliverableType: string,
  ): DeliverableIntelligenceRequest {
    return amsRfpRequest({
      module: "moves",
      useCaseArchetype: "governed_data_foundation",
      deliverableType,
      qualityBar: resolveQualityBar("moves", deliverableType),
      // The plan below is the shipped structure's sections and nothing else, so
      // the fixture's own gaps/outputs are cleared rather than mirrored into it
      // — plan validation refuses an unplaced client-to-complete item and the
      // run then stops before any section is drafted.
      missingEvidence: [],
      clientCompleteItems: [],
      outputFormats: ["docx"],
    });
  }

  /** A plan whose sections are exactly the shipped structure's, so the real caps apply. */
  function planFromBrief(req: DeliverableIntelligenceRequest) {
    const brief = getArtifactBrief(req);
    return {
      sectionPlan: brief.recommendedStructure.map((section) => ({
        key: section.key,
        title: section.title,
        groundingMode: "mixed",
        evidenceCitations: [1],
        assumptionsUsed: [],
        placeholders: [],
        rationale: section.title,
      })),
      evidenceMapping: [
        {
          citationNumber: 1,
          usedInSections: brief.recommendedStructure.map((s) => s.key),
          supportsClaim: "scope",
        },
      ],
      missingEvidenceHandling: [],
      artifactEnhancementSuggestions: [],
      tableAndExhibitPlan: [
        {
          key: "risk_register",
          title: "Risks, Issues & Dependencies",
          kind: "table",
          targetFormat: "docx",
          groundingMode: "mixed",
        },
      ],
      clientCompletePlan: [],
      outputPackagePlan: [{ format: "docx", contents: "Main document." }],
    };
  }

  async function repairAsks(
    deliverableType: string,
  ): Promise<Array<{ target: number; cap: number }>> {
    const req = movesRequest(deliverableType);
    const asks: Array<{ target: number; cap: number }> = [];
    const caller: ModelCaller = async (prompt) => {
      if (prompt.pass === "architect") {
        return { text: JSON.stringify(planFromBrief(req)) };
      }
      if (prompt.pass === "section_repair") {
        const target = Number(
          prompt.user.match(/at least (\d+) prose words/)?.[1],
        );
        const cap = Number(
          prompt.user.match(/Hard cap for this section: (\d+) body words/)?.[1],
        );
        asks.push({ target, cap });
        return { text: SHORT_SECTION };
      }
      if (prompt.pass === "section_draft") return { text: SHORT_SECTION };
      return {
        text: JSON.stringify({
          recommendation: "We recommend proceeding on the approved route.",
          nextActions: ["Confirm the control owners."],
          executiveSummary: "The approved route is specified and traceable.",
          tables: [],
        }),
      };
    };
    await runDeliverableOrchestration(req, caller);
    return asks;
  }

  it("solution_design: every repair ask fits under the cap stated in the same prompt", async () => {
    const asks = await repairAsks("solution_design");
    // Guards the case itself: no repair prompts would make the assertion vacuous.
    expect(asks.length).toBeGreaterThan(0);
    for (const ask of asks) {
      expect(Number.isFinite(ask.target)).toBe(true);
      expect(Number.isFinite(ask.cap)).toBe(true);
      expect(ask.target).toBeLessThanOrEqual(ask.cap);
    }
    // And the caps the model is given are the RECONCILED ones, not the declared
    // 300/450/700/650/450/150 that could not total the 2,800 floor.
    expect(asks.reduce((max, ask) => Math.max(max, ask.cap), 0)).toBeGreaterThan(
      700,
    );
  });

  it("sourcing_strategy: every repair ask fits under the cap stated in the same prompt", async () => {
    const asks = await repairAsks("sourcing_strategy");
    expect(asks.length).toBeGreaterThan(0);
    for (const ask of asks) {
      expect(ask.target).toBeLessThanOrEqual(ask.cap);
    }
  });
});

describe("sectionWordBudgetPlanFor reads the ceiling the gate blocks on", () => {
  /**
   * Between `targetBodyWordsMax` and `advisoryBandMax` the validator WARNS and
   * serves the document. A band that carries an advisory margin carries it on
   * purpose, so budgeting against the target instead of the blocking ceiling
   * would tighten every one of them. No shipped type's caps sit in that gap
   * today, which is exactly why this is stated here rather than left to the
   * totality guard above to notice later.
   */
  const brief = {
    recommendedStructure: [
      { key: "a", title: "A", expertLatitude: "Keep under 900 words." },
      { key: "b", title: "B", expertLatitude: "Keep under 900 words." },
    ],
  } as unknown as Parameters<typeof sectionWordBudgetPlanFor>[1];

  function planWith(bar: {
    minBodyWords: number;
    targetBodyWordsMax: number;
    advisoryBandMax?: number;
  }) {
    return sectionWordBudgetPlanFor(
      {
        qualityBar: { ...bar, enforceMaxAsBlocker: true },
      } as unknown as DeliverableIntelligenceRequest,
      brief,
    );
  }

  it("leaves caps inside the advisory band alone", () => {
    const plan = planWith({
      minBodyWords: 1_000,
      targetBodyWordsMax: 1_500,
      advisoryBandMax: 2_000,
    });
    expect(plan?.basis).toBe("declared_caps_fit_the_band");
    expect(plan?.capTotal).toBe(1_800);
  });

  it("lowers them when there is no advisory margin to sit in", () => {
    const plan = planWith({ minBodyWords: 1_000, targetBodyWordsMax: 1_500 });
    expect(plan?.basis).toBe("declared_caps_lowered_to_fit_ceiling");
    expect(plan?.capTotal).toBeLessThanOrEqual(1_500);
  });
});
