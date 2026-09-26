/**
 * Item U-535 — the second stage whose intake beats stop being carried from an
 * exemplar. `U-533` measured the before-state, `U-534` flipped `bafo`, and this
 * suite flips `evaluation` and holds the eight that must stay labelled while it
 * does.
 *
 * WHY `evaluation`, AND WHY THE ITEM'S OWN TWO PREFERENCES CANNOT BOTH BE MET.
 * The item asks for a stage that still exposes a person-named approver
 * (acceptance 4) AND a stage where the archetype declares a deliverable, so the
 * derived `gate.generates` is not empty (acceptance 7). Measured over the three
 * rule-bearing archetypes — the only ones that reach this builder at all, since
 * `buildLiveStageView` returns null without a computed lever — those two ask for
 * disjoint sets:
 *
 *   • `bafo` is the ONLY stage of the ten where every rule-bearing archetype
 *     declares a `deliverablePack` entry, and `U-534` already took it.
 *   • `responses`, `evaluation`, `executive_decision`, `selection`, `transition`
 *     and `value` declare NONE on any of the three. `rfp` declares one on two of
 *     the three. So no remaining stage satisfies acceptance (7) for every
 *     archetype, and `rfp` — the closest — is not one of the three stages that
 *     still expose a person's name.
 *
 * Both halves are asserted below rather than left in this comment. The choice
 * therefore follows acceptance (4), the half the item calls "the highest-value
 * half of the remaining work".
 *
 * AND ACCEPTANCE (7)'s OWN PREMISE IS FALSE TODAY, which two failing cases proved
 * rather than a reading. It calls an empty generates section "a visible
 * regression"; no reader can reach that section, because the only component that
 * draws it is `ScopeGate`, mounted by `ScopeAnalyticsStage`, which no route
 * imports. On the reachable path `mode-grounding.ts` already suppressed the line
 * when the list is empty — pinned by the last case in this file — so the model
 * prompt was honest before this change and is unchanged by it. The renderer was
 * corrected anyway and is covered by mounting that component directly, in
 * `src/components/source/canvas/analytics/__tests__/ScopeGate.u535EmptyGenerates.test.tsx`.
 *
 * WHAT "FACT-DERIVED" MEANS HERE, unchanged from `U-534`: not "differs from the
 * exemplar" — a hand-written alternative to a fixture is still a fixture. Every
 * derived-beat case perturbs the FACTS, or the ARCHETYPE, and asserts the beat
 * moved with the right one of the two.
 *
 * (6) NO SIGNED-IN CLAIM is made or implied. Every case is an in-process call.
 */

import {
  buildLiveStageView,
  liveStageScaffoldFor,
  liveStageScaffoldSourceFor,
} from "@/lib/source/facts/view/stage-analytics-builder";
import { buildModeGrounding } from "@/lib/source/ava/mode-grounding";
import {
  getSourceArchetype,
  listSourceArchetypes,
} from "@/lib/source/archetypes/registry";
import { evaluateValueLevers } from "@/lib/source/facts/evaluators/orchestrator";
import type { FactSourceCitation } from "@/lib/source/facts/fact-types";
import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import { SAMPLE_EVALUATION_STAGE } from "@/components/source/canvas/analytics/sample-view-model";

/** The stage this item flips. */
const DERIVED_STAGE = "evaluation";

/** The stage `U-534` flipped, which must stay derived. */
const ALREADY_DERIVED_STAGE = "bafo";

const ARCHETYPE_ID = "AMS_MANAGED_SERVICES";

/**
 * A fact bag satisfying exactly the first `count` lever rules, BUILT FROM THE
 * RULES rather than typed — `U-534`'s fixture rule, kept for the same reason: a
 * typed key that belongs to no rule makes a "richer" bag quantify nothing extra
 * and fails the movement case for a reason unrelated to the code under test.
 */
function factsForFirstRules(
  archetypeId: string,
  count: number,
): Record<string, number> {
  const rules = getSourceArchetype(archetypeId)!.valueLeverRules ?? [];
  const bag: Record<string, number> = {};
  for (const rule of rules.slice(0, count)) {
    for (const spec of rule.computation.inputs) {
      if (spec.unit === "pct") bag[spec.key] = 20;
      else if (spec.unit === "count") bag[spec.key] = 3;
      else bag[spec.key] = 1_000_000;
    }
  }
  return bag;
}

function citationsFor(
  bag: Record<string, number>,
): Record<string, FactSourceCitation | null> {
  return Object.fromEntries(
    Object.keys(bag).map((key) => [
      key,
      { doc: "Vendor bid tabulation", locator: key },
    ]),
  );
}

/** One lever quantified, the rest short of evidence — both halves non-empty. */
const LIVE_INPUTS = factsForFirstRules(ARCHETYPE_ID, 1);
const LIVE_CITATIONS = citationsFor(LIVE_INPUTS);
/** Two rules' worth, so a second reading quantifies strictly more. */
const RICHER_INPUTS = factsForFirstRules(ARCHETYPE_ID, 2);

function buildFor(
  stageKey: string,
  inputs: Record<string, number> = LIVE_INPUTS,
): StageAnalyticsView {
  const view = buildLiveStageView({
    inputs,
    citations: LIVE_CITATIONS,
    archetypeId: ARCHETYPE_ID,
    baselineLabel: "Value at stake (event estimate)",
    baselineAmount: 14_000_000,
    stageKey,
  });
  if (!view) throw new Error(`no live view for stage ${stageKey}`);
  return view;
}

const ARMED_STAGE_KEYS = [
  "scope",
  "rfp",
  "responses",
  "evaluation",
  "pricing",
  "bafo",
  "executive_decision",
  "selection",
  "transition",
  "value",
] as const;

/**
 * Read OFF THE BUILDER, never typed — `U-533`'s rule. Whoever flips the next
 * stage moves these sets by changing the builder, rather than having to remember
 * to edit a list here; the failure mode of forgetting is a case that passes about
 * a stage it no longer describes.
 */
const DERIVED_STAGE_KEYS = ARMED_STAGE_KEYS.filter(
  (stageKey) => buildFor(stageKey).beatProvenance?.tasks === "fact_derived",
);
const STILL_SCAFFOLD_STAGES = ARMED_STAGE_KEYS.filter(
  (stageKey) => !(DERIVED_STAGE_KEYS as readonly string[]).includes(stageKey),
);

/** The rule-bearing archetypes — the only ones that can reach this builder. */
const RULE_BEARING = listSourceArchetypes().filter(
  (archetype) => (archetype.valueLeverRules?.length ?? 0) > 0,
);

/** A person's name, as `U-533` learned to detect one. */
const PERSON_NAME_APPROVER = /^[A-Z]\.\s\S/;

// ─────────────────────────────────────────────────────────────────────────────
// 0. The stage choice is a measurement, including the part that says the item's
//    two preferences are in conflict.
// ─────────────────────────────────────────────────────────────────────────────

describe("U-535 · the stage choice is a measurement, not a preference", () => {
  it("has a non-empty population of rule-bearing archetypes", () => {
    expect(RULE_BEARING.length).toBeGreaterThan(1);
  });

  it("finds NO rule-bearing archetype declaring a deliverable at this stage", () => {
    // The half of acceptance (7) that cannot be met here, measured rather than
    // asserted. If this ever becomes false the derived generates list stops
    // being empty on its own and the renderer's empty state stops being reached.
    for (const archetype of RULE_BEARING) {
      expect(
        archetype.deliverablePack.filter((d) => d.stage === DERIVED_STAGE),
      ).toHaveLength(0);
    }
  });

  it("finds `bafo` was the ONLY stage where every archetype declares one", () => {
    // Why acceptance (7) cannot be satisfied by picking a different stage: the
    // one stage that satisfied it is the one `U-534` already took.
    const satisfying = ARMED_STAGE_KEYS.filter((stageKey) =>
      RULE_BEARING.every((archetype) =>
        archetype.deliverablePack.some((d) => d.stage === stageKey),
      ),
    );
    expect(satisfying).toEqual([ALREADY_DERIVED_STAGE]);
  });

  it("finds this stage still exposing a person-named approver to replace", () => {
    // Acceptance (4)'s target, and the population check that keeps the approver
    // case below from proving nothing: six of the ten exemplars carry a role.
    expect(SAMPLE_EVALUATION_STAGE.gate.approver).toMatch(PERSON_NAME_APPROVER);
  });

  it("finds an evaluationImpact on every lever rule, and a weighted model", () => {
    // The two archetype declarations this stage derives from. `evaluationImpact`
    // is the structural parallel to the `bafoAsk` that `U-534` derived from.
    for (const archetype of RULE_BEARING) {
      for (const rule of archetype.valueLeverRules ?? []) {
        expect(rule.evaluationImpact.length).toBeGreaterThan(0);
      }
      expect(archetype.evaluationModel.criteria.length).toBeGreaterThan(0);
      for (const criterion of archetype.evaluationModel.criteria) {
        expect(criterion.weight).toBeGreaterThan(0);
      }
    }
  });

  it("splits the fixture's levers into BOTH halves, so neither is vacuous", () => {
    const results = evaluateValueLevers(
      getSourceArchetype(ARCHETYPE_ID)!,
      LIVE_INPUTS,
    );
    expect(results.filter((r) => !r.insufficientEvidence).length).toBeGreaterThan(0);
    expect(results.filter((r) => r.insufficientEvidence).length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. The boundary declaration.
// ─────────────────────────────────────────────────────────────────────────────

describe("U-535 · the boundary declares the flipped stage derived", () => {
  it("declares both intake beats fact-derived on the chosen stage", () => {
    expect(buildFor(DERIVED_STAGE).beatProvenance).toEqual({
      tasks: "fact_derived",
      gate: "fact_derived",
      scaffoldSource: null,
    });
  });

  it("leaves the stage `U-534` flipped still derived", () => {
    // A second arm must not be a replacement for the first.
    expect(buildFor(ALREADY_DERIVED_STAGE).beatProvenance).toEqual({
      tasks: "fact_derived",
      gate: "fact_derived",
      scaffoldSource: null,
    });
  });

  it("now reports exactly two derived stages, and eight still carrying", () => {
    expect([...DERIVED_STAGE_KEYS].sort()).toEqual(
      [ALREADY_DERIVED_STAGE, DERIVED_STAGE].sort(),
    );
    expect(STILL_SCAFFOLD_STAGES).toHaveLength(8);
  });

  it.each(
    ARMED_STAGE_KEYS.filter(
      (k) => k !== DERIVED_STAGE && k !== ALREADY_DERIVED_STAGE,
    ),
  )("%s still declares both intake beats as scaffold", (stageKey) => {
    expect(buildFor(stageKey).beatProvenance).toEqual({
      tasks: "scaffold",
      gate: "scaffold",
      scaffoldSource: liveStageScaffoldSourceFor(stageKey),
    });
  });

  it("still carries `purpose` on the flipped stage", () => {
    // `beatProvenance` covers the two INTAKE beats only; `purpose` is still
    // exemplar copy and the per-field artifact is where that stays visible.
    expect(buildFor(DERIVED_STAGE).purpose).toBe(SAMPLE_EVALUATION_STAGE.purpose);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. The derived tasks.
// ─────────────────────────────────────────────────────────────────────────────

describe("U-535 · the derived task list is not the exemplar's", () => {
  it("shares no title with the exemplar it replaced", () => {
    const exemplarTitles = new Set(
      SAMPLE_EVALUATION_STAGE.tasks.map((task) => task.title),
    );
    expect(exemplarTitles.size).toBeGreaterThan(0);

    const built = buildFor(DERIVED_STAGE);
    expect(built.tasks).not.toBe(SAMPLE_EVALUATION_STAGE.tasks);
    expect(built.tasks.length).toBeGreaterThan(0);
    for (const task of built.tasks) {
      expect(exemplarTitles.has(task.title)).toBe(false);
    }
  });

  it("names every lever the archetype declares, computed or not", () => {
    const results = evaluateValueLevers(
      getSourceArchetype(ARCHETYPE_ID)!,
      LIVE_INPUTS,
    );
    const built = buildFor(DERIVED_STAGE);
    for (const result of results) {
      expect(
        built.tasks.find((task) => task.title.includes(result.name)),
      ).toBeDefined();
    }
  });

  it("carries the rule's evaluationImpact as the guide on a scored lever", () => {
    // The stage-specific half: `U-534` derived the same levers into BAFO asks,
    // and this stage must derive them into the SCORING hook the rule declares,
    // not re-use that ask.
    const archetype = getSourceArchetype(ARCHETYPE_ID)!;
    const rules = new Map(
      (archetype.valueLeverRules ?? []).map((rule) => [rule.key, rule]),
    );
    const computed = evaluateValueLevers(archetype, LIVE_INPUTS).filter(
      (r) => !r.insufficientEvidence,
    );
    expect(computed.length).toBeGreaterThan(0);

    const built = buildFor(DERIVED_STAGE);
    for (const result of computed) {
      const task = built.tasks.find((t) => t.title.includes(result.name))!;
      const rule = rules.get(result.key)!;
      expect(task.guide).toContain(rule.evaluationImpact);
      expect(task.guide).not.toContain(rule.bafoAsk);
    }
  });

  it("carries the computed range and the cited document on a scored lever", () => {
    const archetype = getSourceArchetype(ARCHETYPE_ID)!;
    const computed = evaluateValueLevers(archetype, LIVE_INPUTS).filter(
      (r) => !r.insufficientEvidence,
    );
    const built = buildFor(DERIVED_STAGE);
    for (const result of computed) {
      const task = built.tasks.find((t) => t.title.includes(result.name))!;
      expect(task.type).toBe("confirm");
      const rowValues = (task.rows ?? []).map((row) => row.value).join(" | ");
      expect(rowValues).toContain(Math.round(result.low).toLocaleString("en-US"));
      expect(rowValues).toContain(Math.round(result.high).toLocaleString("en-US"));
      const citedDocs = result.evidenceRefs
        .map((ref) => LIVE_CITATIONS[ref.factKey]?.doc)
        .filter((doc): doc is string => Boolean(doc));
      expect(citedDocs.length).toBeGreaterThan(0);
      expect(rowValues).toContain(citedDocs[0]!);
    }
  });

  it("asks for the missing fact keys on a lever that cannot be scored", () => {
    const archetype = getSourceArchetype(ARCHETYPE_ID)!;
    const insufficient = evaluateValueLevers(archetype, LIVE_INPUTS).filter(
      (r) => r.insufficientEvidence,
    );
    expect(insufficient.length).toBeGreaterThan(0);

    const built = buildFor(DERIVED_STAGE);
    for (const result of insufficient) {
      const task = built.tasks.find((t) => t.title.includes(result.name))!;
      expect(task.type).toBe("provide");
      expect(result.missingEvidence.length).toBeGreaterThan(0);
      const rowValues = (task.rows ?? []).map((row) => row.value).join(" | ");
      for (const key of result.missingEvidence) {
        expect(rowValues).toContain(key);
      }
    }
  });

  it("carries the archetype's weighted criteria and its disqualifiers", () => {
    // The evaluation model is what this stage scores against; it is declared per
    // archetype and nowhere in the exemplar.
    const archetype = getSourceArchetype(ARCHETYPE_ID)!;
    const built = buildFor(DERIVED_STAGE);
    const modelTask = built.tasks.find((task) =>
      task.id.startsWith("evaluation.model."),
    );
    expect(modelTask).toBeDefined();
    const rowText = (modelTask!.rows ?? [])
      .map((row) => `${row.key} ${row.value}`)
      .join(" | ");
    for (const criterion of archetype.evaluationModel.criteria) {
      expect(rowText).toContain(criterion.label);
    }
    for (const disqualifier of archetype.evaluationModel.disqualifiers) {
      expect(modelTask!.guide).toContain(disqualifier);
    }
  });

  it("MOVES when the facts move — the reading a hand-written list would fail", () => {
    const richer = buildFor(DERIVED_STAGE, RICHER_INPUTS);
    const thinner = buildFor(DERIVED_STAGE, LIVE_INPUTS);
    const confirmCount = (view: StageAnalyticsView) =>
      view.tasks.filter((task) => task.type === "confirm").length;
    expect(confirmCount(richer)).toBeGreaterThan(confirmCount(thinner));
    expect(JSON.stringify(richer.tasks)).not.toBe(JSON.stringify(thinner.tasks));
  });

  it("MOVES when the archetype moves, so it is not keyed to one archetype", () => {
    const other = RULE_BEARING.find((a) => a.id !== ARCHETYPE_ID)!;
    const otherInputs = factsForFirstRules(other.id, 1);
    const view = buildLiveStageView({
      inputs: otherInputs,
      citations: citationsFor(otherInputs),
      archetypeId: other.id,
      stageKey: DERIVED_STAGE,
    });
    expect(view).not.toBeNull();
    expect(view!.tasks.map((t) => t.title).join(" | ")).not.toBe(
      buildFor(DERIVED_STAGE, RICHER_INPUTS)
        .tasks.map((t) => t.title)
        .join(" | "),
    );
  });

  it("leaves the eight carried stages holding the exemplar's own array", () => {
    for (const stageKey of STILL_SCAFFOLD_STAGES) {
      expect(buildFor(stageKey).tasks).toBe(liveStageScaffoldFor(stageKey).tasks);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. The derived gate, including the empty-generates case acceptance (7) warns
//    about.
// ─────────────────────────────────────────────────────────────────────────────

describe("U-535 · the derived gate", () => {
  it("drops the exemplar's person-named approver for an archetype role", () => {
    const built = buildFor(DERIVED_STAGE);
    expect(built.gate.approver).not.toBe(SAMPLE_EVALUATION_STAGE.gate.approver);
    expect(built.gate.approver).not.toMatch(PERSON_NAME_APPROVER);
    expect(getSourceArchetype(ARCHETYPE_ID)!.requiredStakeholders).toContain(
      built.gate.approver,
    );
  });

  it("MOVES the approver when the archetype moves", () => {
    const other = RULE_BEARING.find(
      (a) => a.requiredStakeholders[0] !== getSourceArchetype(ARCHETYPE_ID)!.requiredStakeholders[0],
    );
    // Population first: if every rule-bearing archetype named the same first
    // stakeholder this case would prove nothing while passing.
    expect(other).toBeDefined();
    const otherInputs = factsForFirstRules(other!.id, 1);
    const view = buildLiveStageView({
      inputs: otherInputs,
      citations: citationsFor(otherInputs),
      archetypeId: other!.id,
      stageKey: DERIVED_STAGE,
    });
    expect(view).not.toBeNull();
    expect(view!.gate.approver).toBe(other!.requiredStakeholders[0]);
    expect(view!.gate.approver).not.toBe(buildFor(DERIVED_STAGE).gate.approver);
  });

  it("generates EMPTY, because the archetype declares nothing at this stage", () => {
    // The honest derived answer, and the reason the renderer needed an empty
    // state. It must NOT fall back to the exemplar's `Should-cost evaluation
    // summary`, which is a deliverable no archetype declares.
    const built = buildFor(DERIVED_STAGE);
    expect(built.gate.generates).toEqual([]);
    expect(built.gate.generates).not.toBe(SAMPLE_EVALUATION_STAGE.gate.generates);
  });

  it("states the scored / needs-evidence split, and MOVES with it", () => {
    const lean = evaluateValueLevers(
      getSourceArchetype(ARCHETYPE_ID)!,
      LIVE_INPUTS,
    );
    const leanScored = lean.filter((r) => !r.insufficientEvidence).length;
    const labels = buildFor(DERIVED_STAGE)
      .gate.confirms.map((c) => c.label)
      .join(" | ");
    expect(labels).toContain(String(leanScored));
    expect(labels).toContain(String(lean.length));
    expect(
      buildFor(DERIVED_STAGE, RICHER_INPUTS)
        .gate.confirms.map((c) => c.label)
        .join(" | "),
    ).not.toBe(labels);
  });

  it("states the weighted criteria count, which MOVES with the archetype", () => {
    const mine = getSourceArchetype(ARCHETYPE_ID)!;
    const built = buildFor(DERIVED_STAGE);
    const detail = built.gate.confirms.map((c) => c.detail).join(" | ");
    for (const criterion of mine.evaluationModel.criteria) {
      expect(detail).toContain(criterion.label);
    }
  });

  it("keeps the computed next-stage label the builder already produced", () => {
    expect(buildFor(DERIVED_STAGE).gate.nextStageName).toBe(
      SAMPLE_EVALUATION_STAGE.gate.nextStageName,
    );
  });

  it("leaves the eight carried gates holding the exemplar's own confirm array", () => {
    for (const stageKey of STILL_SCAFFOLD_STAGES) {
      expect(buildFor(stageKey).gate.confirms).toBe(
        liveStageScaffoldFor(stageKey).gate.confirms,
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. The disclosure follows the declaration.
// ─────────────────────────────────────────────────────────────────────────────

/** Anchored to the start of its own line, per `U-533`. */
const DISCLOSURE_MARKER = /^SCAFFOLD CONTENT -- /m;

describe("U-535 · the grounding disclosure follows the declaration", () => {
  function block(
    mode: "evidence_readiness" | "stage_gate",
    view: StageAnalyticsView,
  ) {
    return buildModeGrounding({
      mode,
      event: {
        code: "EVT-1",
        name: "Managed services renewal",
        currentStageKey: view.stageKey,
        blocker: null,
        nextAction: null,
      },
      viewStageKey: view.stageKey,
      stageView: view,
      factInputs: LIVE_INPUTS,
      artifacts: [],
      question: "what is the gate state?",
    }).block;
  }

  it("STOPS disclosing on the flipped stage — both modes", () => {
    const view = buildFor(DERIVED_STAGE);
    expect(block("evidence_readiness", view)).not.toMatch(DISCLOSURE_MARKER);
    expect(block("stage_gate", view)).not.toMatch(DISCLOSURE_MARKER);
  });

  it.each(STILL_SCAFFOLD_STAGES)(
    "%s still discloses its carried beats to the model",
    (stageKey) => {
      const view = buildFor(stageKey);
      expect(block("evidence_readiness", view)).toMatch(DISCLOSURE_MARKER);
      expect(block("stage_gate", view)).toMatch(DISCLOSURE_MARKER);
    },
  );

  it("no longer prints the exemplar's person-named approver", () => {
    expect(block("stage_gate", buildFor(DERIVED_STAGE))).not.toContain(
      SAMPLE_EVALUATION_STAGE.gate.approver,
    );
  });

  it("names no exemplar constant in the flipped stage's blocks", () => {
    const view = buildFor(DERIVED_STAGE);
    for (const mode of ["evidence_readiness", "stage_gate"] as const) {
      expect(block(mode, view)).not.toContain("SAMPLE_EVALUATION_STAGE");
    }
  });

  it("puts the derived lever names into the evidence-readiness block", () => {
    const view = buildFor(DERIVED_STAGE);
    const text = block("evidence_readiness", view);
    const provideTitles = view.tasks
      .filter((task) => task.type === "provide")
      .map((task) => task.title);
    expect(provideTitles.length).toBeGreaterThan(0);
    for (const title of provideTitles) {
      expect(text).toContain(title);
    }
  });

  it("prints no generates line, rather than an empty one", () => {
    // `mode-grounding` already guards on length; pinned so the empty derived list
    // cannot start reaching the model as a bare "Generates on approval:".
    expect(block("stage_gate", buildFor(DERIVED_STAGE))).not.toContain(
      "Generates on approval:",
    );
  });
});
