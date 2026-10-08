// The per-section word budget has to reconcile with the floor over the sections
// the document WILL CONTAIN, not over the ones the brief declared.
//
// `planSectionWordBudgets` holds INV2 — the repair targets total at least the
// floor, so writing every section to its target clears the quality gate — and
// that is what makes the budget satisfiable at all. It was stated over
// `brief.recommendedStructure`; the document is written from the architect
// pass's `plan.sectionPlan`. Nothing requires one to cover the other:
//
//   • a DECLARED section the plan omits takes its share of the floor into the
//     total and puts no words in the document;
//   • a planned section keyed OFF-BRIEF is covered by no declaration, so it
//     takes the shared fallback cap, unrelated to the share the section it
//     displaced was carrying; and
//   • `validateGenerationPlan` stops neither. A declared key the plan does not
//     name is a WARNING on purpose, and the thin-plan guard compares a COUNT,
//     so a plan of the right size with the wrong keys passes it.
//
// `sanitizeGenerationPlan` does not close it either, which is why this reaches
// `fixedStructure` briefs and not only the two that declare none: it orders and
// filters the plan against the declared keys with
// `requiredOrder.map(byKey.get).filter(Boolean)`, which DROPS a declared key the
// plan omitted rather than adding it back.
//
// Measured before the repair, over every registry key any phase can request on
// any route: with ONE declared section missing, all 18 keys that carry a budget
// fell below their own required total — `execution_roadmap` by 750 words, which
// no remaining section could absorb because each is also told to stay under its
// own cap. The consequence is the one the reconciliation exists for: P3 enqueues
// its documents as a SEQUENTIAL chain and `blockRunsWithFailedDependencies`
// cascades from a blocked parent, so one document stuck below its floor holds
// every later document, the gate, and the phase.
//
// So the invariants are asserted here over REALIZED section sets — the declared
// one, one with sections omitted, one with sections keyed off-brief at the same
// count the thin-plan guard accepts, and one with a key repeated — for every
// generatable key, plus the two callers through a real orchestration run.

import {
  PHASE_CANONICAL_KEYS,
  phaseCanonicalKeysForRoute,
} from "@/lib/programs/deliverable-registry";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";
import { getArtifactBrief } from "@/lib/deliverables/orchestrator/artifact-brief-registry";
import { resolveQualityBar } from "@/lib/deliverables/orchestrator/quality-bar-registry";
import { sectionWordBudgetPlanFor } from "@/lib/deliverables/orchestrator/prompt-builder";
import { sectionRepairTargetWithin } from "@/lib/deliverables/orchestrator/section-word-budget-plan";
import { planRealizedSectionWordBudgets } from "@/lib/deliverables/orchestrator/realized-section-word-budget";
import { sanitizeGenerationPlan } from "@/lib/deliverables/orchestrator/generation-plan";
import { sectionShareOfFloor } from "@/lib/deliverables/shared/body-word-count";
import {
  runDeliverableOrchestration,
  type ModelCaller,
} from "@/lib/deliverables/orchestrator/orchestrator";
import { amsRfpRequest } from "@/lib/deliverables/orchestrator/__fixtures__/ams-rfp";
import type {
  DeliverableGenerationPlan,
  DeliverableIntelligenceRequest,
} from "@/lib/deliverables/orchestrator/types";
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

/**
 * The realizations an architect pass can actually hand back, derived from the
 * declared keys rather than listed per deliverable.
 *
 * `substitute` keeps the section COUNT, which is the shape the thin-plan guard
 * accepts: it compares `sectionPlan.length` against the required count, so a
 * plan of the right size whose keys are the architect's own wording passes.
 */
function realizationsOf(declaredKeys: readonly string[]): Array<{
  label: string;
  keys: string[];
}> {
  const shapes: Array<{ label: string; keys: string[] }> = [
    { label: "as declared", keys: [...declaredKeys] },
  ];
  for (const drop of [1, 2]) {
    if (declaredKeys.length <= drop) continue;
    const kept = declaredKeys.slice(0, declaredKeys.length - drop);
    shapes.push({ label: `omits ${drop}`, keys: [...kept] });
    shapes.push({
      label: `substitutes ${drop}`,
      keys: [
        ...kept,
        ...Array.from({ length: drop }, (_, i) => `architect_wording_${i}`),
      ],
    });
  }
  if (declaredKeys.length > 0) {
    shapes.push({
      label: "repeats a key",
      keys: [...declaredKeys, declaredKeys[0]!],
    });
  }
  return shapes;
}

describe("every realization of a generatable Moves deliverable can reach its own word floor", () => {
  const keys = everyGeneratableKey();

  it("covers every phase's build set on every route", () => {
    // Guards the enumeration: a key list that silently shrank would make every
    // case below vacuous.
    expect(keys.length).toBeGreaterThanOrEqual(20);
    expect(keys).toContain("solution_design");
    expect(keys).toContain("execution_roadmap");
  });

  it.each(everyGeneratableKey())(
    "%s: the invariants hold for every section set the architect can return",
    (registryKey) => {
      const req = requestFor(orchestratorDeliverableType(registryKey));
      const brief = getArtifactBrief(req);
      const declaredKeys = brief.recommendedStructure.map((s) => s.key);

      // Null means this type states no per-section cap, so there is no cap for
      // a target to contradict and nothing to reconcile.
      if (!sectionWordBudgetPlanFor(req, brief)) return;

      const qb = req.qualityBar;
      const shapes = realizationsOf(declaredKeys);
      // Guards the shapes: a deliverable with too few declared sections to
      // omit any would exercise only "as declared".
      expect(shapes.length).toBeGreaterThan(1);

      for (const shape of shapes) {
        const plan = sectionWordBudgetPlanFor(req, brief, shape.keys)!;
        expect(plan).not.toBeNull();
        expect(plan.basis).not.toBe("floor_exceeds_ceiling");
        // The budget covers the realized document, section for section —
        // including a repeated key, which is two sections in the output.
        expect(plan.sections.map((s) => s.key)).toEqual(shape.keys);

        // INV1, per section: one section asked for more than its own cap is one
        // contradictory prompt, whatever the totals do.
        for (const section of plan.sections) {
          expect(section.repairTarget).toBeLessThanOrEqual(section.cap);
          expect(section.repairTarget).toBeGreaterThan(0);
        }

        // INV2, over the REALIZED set and through the helper the orchestrator
        // actually calls — the defect this suite exists for. The even share is
        // computed over the drafted sections exactly as the repair loop does.
        const evenShare = sectionShareOfFloor(
          qb.minBodyWords,
          shape.keys.length,
        );
        const targetTotal = shape.keys.reduce(
          (sum, key) => sum + sectionRepairTargetWithin(plan, key, evenShare),
          0,
        );
        expect(targetTotal).toBeGreaterThanOrEqual(qb.minBodyWords);
        expect(targetTotal).toBeGreaterThanOrEqual(plan.requiredTotal);

        // ...and still aimed at the floor rather than at the caps, so the fix
        // does not trade the too-short blocker for the too-long one.
        expect(targetTotal).toBeLessThanOrEqual(
          plan.requiredTotal + shape.keys.length,
        );

        // INV3 — obeying every cap cannot breach the ceiling the gate blocks on.
        expect(plan.capTotal).toBeLessThanOrEqual(
          qb.advisoryBandMax ?? qb.targetBodyWordsMax ?? 0,
        );
      }
    },
  );

  it("is inert when the architect returns exactly the declared structure", () => {
    // The other half: a realized set equal to the declared one must produce the
    // budget the declared reading produced, or every document in the product is
    // silently re-budgeted.
    let compared = 0;
    for (const registryKey of everyGeneratableKey()) {
      const req = requestFor(orchestratorDeliverableType(registryKey));
      const brief = getArtifactBrief(req);
      const declared = sectionWordBudgetPlanFor(req, brief);
      if (!declared) continue;
      const realized = sectionWordBudgetPlanFor(
        req,
        brief,
        brief.recommendedStructure.map((s) => s.key),
      );
      expect(realized).toEqual(declared);
      compared += 1;
    }
    expect(compared).toBeGreaterThanOrEqual(15);
  });

  it("falls back to the declared structure when the realized set is not known", () => {
    // An empty realized set is "the architect has not run", not "a document
    // with no sections" — budgeting against it would hand every section the
    // fallback cap.
    const req = requestFor("solution_design");
    const brief = getArtifactBrief(req);
    expect(sectionWordBudgetPlanFor(req, brief, [])).toEqual(
      sectionWordBudgetPlanFor(req, brief),
    );
  });

  it("states the defect it repairs: the declared reading under-serves a realized set", () => {
    // Stated as the shortfall rather than as today's arithmetic. The declared
    // plan's targets, summed over a realized set missing one section, fall under
    // the floor; the realized plan's do not. If a future change makes the
    // declared reading sufficient on its own this case says so by failing, and
    // the invariant cases above still hold the contract.
    const short: string[] = [];
    for (const registryKey of everyGeneratableKey()) {
      const req = requestFor(orchestratorDeliverableType(registryKey));
      const brief = getArtifactBrief(req);
      const declared = sectionWordBudgetPlanFor(req, brief);
      if (!declared || brief.recommendedStructure.length < 2) continue;
      const realizedKeys = brief.recommendedStructure
        .slice(0, -1)
        .map((s) => s.key);
      const evenShare = sectionShareOfFloor(
        req.qualityBar.minBodyWords,
        realizedKeys.length,
      );
      const asDeclared = realizedKeys.reduce(
        (sum, key) => sum + sectionRepairTargetWithin(declared, key, evenShare),
        0,
      );
      if (asDeclared < declared.requiredTotal) short.push(registryKey);
    }
    // Every deliverable that carries a budget, not a couple of examples.
    expect(short.length).toBeGreaterThanOrEqual(15);
    expect(short).toContain("solution_design");
    expect(short).toContain("execution_roadmap");
  });
});

describe("planRealizedSectionWordBudgets", () => {
  const declared = [
    { key: "a", declaredCap: 300 },
    { key: "b", declaredCap: 150 },
    { key: "c", declaredCap: 150 },
  ];
  const bar = { fallbackCap: 200, minBodyWords: 600, blockingCeiling: 4_000 };

  it("raises the surviving caps to cover the floor when a declared section is omitted", () => {
    const plan = planRealizedSectionWordBudgets({
      declared,
      realizedKeys: ["a", "b"],
      ...bar,
    });
    expect(plan.sections.map((s) => s.key)).toEqual(["a", "b"]);
    expect(plan.basis).toBe("declared_caps_raised_to_reach_floor");
    // Proportional, so "a" still carries twice "b" — the editorial judgement
    // about where the weight belongs survives the raise.
    const [a, b] = plan.sections;
    expect(a!.cap / b!.cap).toBeCloseTo(2, 1);
    expect(plan.capTotal).toBeGreaterThanOrEqual(plan.requiredTotal);
  });

  it("gives a section the architect keyed off-brief the shared fallback", () => {
    const plan = planRealizedSectionWordBudgets({
      declared,
      realizedKeys: ["a", "architect_wording"],
      ...bar,
      minBodyWords: 400,
    });
    expect(plan.sections.map((s) => s.declaredCap)).toEqual([300, null]);
    // 300 + the 200 fallback already clears the 400 floor's required total, so
    // nothing is raised and the fallback is visible as itself.
    expect(plan.sections.map((s) => s.cap)).toEqual([300, 200]);
  });

  it("budgets a repeated key twice, because it is two sections in the document", () => {
    const plan = planRealizedSectionWordBudgets({
      declared,
      realizedKeys: ["a", "a", "b"],
      ...bar,
      minBodyWords: 400,
    });
    expect(plan.sections.map((s) => s.key)).toEqual(["a", "a", "b"]);
    expect(plan.declaredTotal).toBe(750);
    // `sectionWordBudgetFor` resolves by key, so both occurrences read the same
    // cap — which is the cap the total above counted for each of them.
    expect(plan.sections[0]!.cap).toBe(plan.sections[1]!.cap);
  });

  it("resolves one cap for a structure that declares the same key twice", () => {
    // First declaration wins, so the answer does not depend on iteration order.
    const plan = planRealizedSectionWordBudgets({
      declared: [
        { key: "a", declaredCap: 300 },
        { key: "a", declaredCap: 90 },
      ],
      realizedKeys: ["a"],
      ...bar,
      minBodyWords: 200,
    });
    expect(plan.sections.map((s) => s.declaredCap)).toEqual([300]);
  });

  it("uses the declared structure when the realized set is empty", () => {
    const plan = planRealizedSectionWordBudgets({
      declared,
      realizedKeys: [],
      ...bar,
    });
    expect(plan.sections.map((s) => s.key)).toEqual(["a", "b", "c"]);
    expect(plan.sections.map((s) => s.declaredCap)).toEqual([300, 150, 150]);
  });

  it("still reports a floor it cannot cover without breaching the ceiling", () => {
    // Feasibility must not move with the section count: `requiredTotal` and
    // `permittedTotal` are both independent of it, so a bar that was
    // unsatisfiable stays unsatisfiable and is reported rather than hidden.
    const plan = planRealizedSectionWordBudgets({
      declared,
      realizedKeys: ["a"],
      fallbackCap: 200,
      minBodyWords: 3_000,
      blockingCeiling: 1_000,
    });
    expect(plan.basis).toBe("floor_exceeds_ceiling");
    expect(plan.sections.map((s) => s.cap)).toEqual([300]);
  });
});

describe("sanitizeGenerationPlan does not restore an omitted declared section", () => {
  // Why the defect reaches `fixedStructure` briefs too, which is what makes it
  // 18 deliverables rather than the two that declare no fixed structure.
  it("drops a declared key the architect's plan does not name", () => {
    const req = requestFor("solution_design");
    const brief = getArtifactBrief(req);
    const declaredKeys = brief.recommendedStructure.map((s) => s.key);
    expect(brief.fixedStructure).toBe(true);
    expect(declaredKeys.length).toBeGreaterThan(2);

    const plan = {
      sectionPlan: declaredKeys.slice(0, -1).map((key) => ({
        key,
        title: key,
        groundingMode: "expert_template",
        evidenceCitations: [],
        assumptionsUsed: ["scope"],
        placeholders: [],
        rationale: key,
      })),
      evidenceMapping: [],
      missingEvidenceHandling: [],
      artifactEnhancementSuggestions: [],
      tableAndExhibitPlan: [],
      clientCompletePlan: [],
      outputPackagePlan: [],
    } as unknown as DeliverableGenerationPlan;

    const sanitized = sanitizeGenerationPlan(
      plan,
      { ...req, governedEvidenceBundle: [] } as DeliverableIntelligenceRequest,
      brief,
    );
    expect(sanitized.sectionPlan.map((s) => s.key)).toEqual(
      declaredKeys.slice(0, -1),
    );
    expect(sanitized.sectionPlan.map((s) => s.key)).not.toContain(
      declaredKeys.at(-1),
    );
  });
});

// ── The wiring, through a real orchestration run ──────────────────────────────
//
// A correct plan nothing reads changes nothing. `prompt-builder` states the cap
// to the model and `orchestrator` asks the repair pass for the target, and both
// have to be reading the same realized set — so these drive
// `runDeliverableOrchestration` with a stub model whose architect pass omits a
// declared section, and assert against the prompt the model would receive.

/** Deliberately far below every floor, so every section needs repair. */
const SHORT_SECTION = JSON.stringify({
  key: "section",
  title: "Section",
  bodyMarkdown: "## Detail\nWe recommend proceeding on the approved route [1].",
  groundingMode: "mixed",
  citationsUsed: [1],
});

/**
 * @param registryKey a REGISTRY key, resolved to the orchestrator spelling
 *   here. The two spaces differ for five canonical keys — `execution_roadmap`
 *   is `roadmap` to the orchestrator — and a request built on the registry
 *   spelling resolves a different quality bar and brief, which is how a case
 *   like this one ends up asserting against a prompt that carries no cap line.
 */
function movesRequest(registryKey: string): DeliverableIntelligenceRequest {
  const deliverableType = orchestratorDeliverableType(registryKey);
  return amsRfpRequest({
    module: "moves",
    useCaseArchetype: "governed_data_foundation",
    deliverableType,
    qualityBar: resolveQualityBar("moves", deliverableType),
    // The fixture's own gaps/outputs are cleared rather than mirrored into the
    // plan below: plan validation refuses an unplaced client-to-complete item
    // and the run then stops before any section is drafted.
    missingEvidence: [],
    clientCompleteItems: [],
    outputFormats: ["docx"],
  });
}

interface RepairAsk {
  key: string;
  target: number;
  cap: number;
}

/**
 * Run the real orchestration and collect what the repair prompt asks of each
 * section.
 *
 * @param sectionKeysOf chooses the architect pass's section keys from the
 *   brief's declared ones, so a case can omit one.
 */
async function repairAsks(
  registryKey: string,
  sectionKeysOf: (declaredKeys: string[]) => string[],
): Promise<RepairAsk[]> {
  const req = movesRequest(registryKey);
  const brief = getArtifactBrief(req);
  const sectionKeys = sectionKeysOf(
    brief.recommendedStructure.map((s) => s.key),
  );
  const asks: RepairAsk[] = [];
  let current = "";
  const caller: ModelCaller = async (prompt) => {
    if (prompt.pass === "architect") {
      return {
        text: JSON.stringify({
          sectionPlan: sectionKeys.map((key) => ({
            key,
            title: key,
            groundingMode: "mixed",
            evidenceCitations: [1],
            assumptionsUsed: [],
            placeholders: [],
            rationale: key,
          })),
          evidenceMapping: [
            { citationNumber: 1, usedInSections: sectionKeys, supportsClaim: "scope" },
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
        }),
      };
    }
    if (prompt.pass === "section_repair") {
      current =
        prompt.user.match(/REPAIR ONLY THIS SECTION: "([^"]*)"/)?.[1] ?? "";
      asks.push({
        key: current,
        target: Number(prompt.user.match(/at least (\d+) prose words/)?.[1]),
        cap: Number(
          prompt.user.match(/Hard cap for this section: (\d+) body words/)?.[1],
        ),
      });
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

describe("both callers budget against the sections the run will actually write", () => {
  it("solution_design: the caps rise when the architect omits a declared section", async () => {
    const full = await repairAsks("solution_design", (keys) => keys);
    const omitted = await repairAsks("solution_design", (keys) =>
      keys.slice(0, -1),
    );
    // Guards the cases: no repair prompts would make the assertions vacuous.
    expect(full.length).toBeGreaterThan(0);
    expect(omitted.length).toBeGreaterThan(0);
    expect(omitted.length).toBeLessThan(full.length);

    for (const ask of [...full, ...omitted]) {
      expect(Number.isFinite(ask.target)).toBe(true);
      expect(Number.isFinite(ask.cap)).toBe(true);
      // INV1 in the prompt itself: the repair pass asks for the target "while
      // staying under the hard cap above".
      expect(ask.target).toBeLessThanOrEqual(ask.cap);
    }

    // The targets the run asks for still total the floor with a section gone —
    // which is only possible because the caps stated in the same prompts rose.
    const asked = omitted.reduce((sum, ask) => sum + ask.target, 0);
    expect(asked).toBeGreaterThanOrEqual(
      movesRequest("solution_design").qualityBar.minBodyWords,
    );
    const capsFull = full.reduce((sum, ask) => sum + ask.cap, 0);
    const capsOmitted = omitted.reduce((sum, ask) => sum + ask.cap, 0);
    expect(capsOmitted).toBeGreaterThanOrEqual(capsFull - 1);
  });

  it("execution_roadmap: a section the architect keyed off-brief is budgeted too", async () => {
    const asks = await repairAsks("execution_roadmap", (keys) => [
      ...keys.slice(0, -1),
      "architect_wording",
    ]);
    expect(asks.length).toBeGreaterThan(0);
    for (const ask of asks) {
      expect(ask.target).toBeLessThanOrEqual(ask.cap);
      expect(ask.cap).toBeGreaterThan(0);
    }
    const asked = asks.reduce((sum, ask) => sum + ask.target, 0);
    expect(asked).toBeGreaterThanOrEqual(
      movesRequest("execution_roadmap").qualityBar.minBodyWords,
    );
  });
});
