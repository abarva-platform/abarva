/**
 * Item U-534 — the remaining acceptance (3) of `U-533` (`SOURCE_BACKLOG_MASTER.md`
 * §F9, wave 2): replace ONE stage's `tasks`/`gate` with fact-derived values.
 *
 * `U-533` measured the before-state and committed it: on all ten armed stages
 * `tasks`, `purpose`, `gate.approver`, `gate.confirms` and `gate.generates` were
 * carried verbatim from a `SAMPLE_*_STAGE` exemplar, and only `intel` and
 * `waterfall` were computed. This suite is the one stage flipping — `bafo` — and
 * the nine that must stay labelled while it does.
 *
 * WHY `bafo`, MEASURED RATHER THAN PREFERRED. `buildLiveStageView` returns null
 * unless at least one value lever computes, so only an archetype carrying
 * `valueLeverRules` ever reaches this code. Across those archetypes:
 *
 *   • NO archetype declares a `gateCriteria`, a `deliverablePack` entry or a
 *     `stageModel` row at stage `value` — so a value-stage gate derived from the
 *     archetype would have to render an EMPTY generates list. The obvious first
 *     pick is the one stage the archetype has nothing to say about.
 *   • `bafo` has a deliverable on every rule-bearing archetype, a DIFFERENT one
 *     per archetype, and every lever rule carries a `bafoAsk` and a
 *     `commercialRisk` — which is what a BAFO task list should be made of.
 *
 * Both of those are asserted below rather than left in this comment, because a
 * stage choice justified only in prose is a stage choice nothing re-checks.
 *
 * THE TWO-READING METHOD, KEPT. `U-533`'s measurement perturbs the caller's
 * `stageName` only, which can tell "follows the caller" from "does not move" but
 * CANNOT tell a fact-derived beat from a hand-written one that merely disagrees
 * with the exemplar — and the item says so explicitly: "a hand-written
 * alternative to a fixture is still a fixture". So every derived-beat case here
 * perturbs the FACTS and asserts the beat MOVED.
 *
 * (5) NO SIGNED-IN CLAIM is made or implied. Every case is an in-process function
 * call; none authenticates, reads a tenant, or renders a route.
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
import { SAMPLE_BAFO_STAGE } from "@/components/source/canvas/analytics/sample-view-model";

/** The stage this item flips. Everything else must stay as `U-533` left it. */
const DERIVED_STAGE = "bafo";

const ARCHETYPE_ID = "AMS_MANAGED_SERVICES";

/**
 * A fact bag that satisfies exactly the first `count` lever rules of an archetype,
 * BUILT FROM THE RULES rather than typed.
 *
 * Typing the keys was the first draft here and it was wrong twice: the fact keys
 * I reached for (`offshore_shift_pct`, `rate_delta_pct`) belong to no rule in this
 * registry, so the "richer" bag quantified nothing extra and the movement case
 * failed for a reason that had nothing to do with the code under test. Reading the
 * keys off `rule.computation.inputs` means a rule renamed or re-inputted upstream
 * cannot leave these fixtures silently measuring the wrong thing.
 *
 * Values come from the declared UNIT, so a percentage is a percentage.
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

/** A citation for every key in a bag, so a cited-document row has something to read. */
function citationsFor(
  bag: Record<string, number>,
): Record<string, FactSourceCitation | null> {
  return Object.fromEntries(
    Object.keys(bag).map((key) => [
      key,
      { doc: "Incumbent contract record", locator: key },
    ]),
  );
}

/**
 * Facts that quantify exactly ONE of the AMS levers, so the view goes live while
 * the rest stay `insufficient_evidence`. Both halves of the derived task list
 * therefore have a non-empty population — a fixture that quantified every lever
 * would leave the evidence-request half unproven and passing.
 */
const LIVE_INPUTS = factsForFirstRules(ARCHETYPE_ID, 1);

const LIVE_CITATIONS = citationsFor(LIVE_INPUTS);

/** Two rules' worth of facts, so a second reading quantifies strictly more. */
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
 * The stages that still carry, READ OFF THE BUILDER rather than computed as "all
 * but mine".
 *
 * Item U-535 changed this, and the reason is the failure mode `U-533` warns about
 * in the same words. As written, this was `ARMED_STAGE_KEYS.filter(key => key !==
 * DERIVED_STAGE)` — a set defined by this suite's own subject, which silently
 * claimed every other stage was scaffold. When `U-535` flipped `evaluation`, four
 * cases here failed asserting that a derived stage still carried its exemplar.
 * That was the right failure and it is not the point: the same shape, inverted,
 * is a case that keeps PASSING about a stage it no longer describes. Reading the
 * set off `beatProvenance` means the next flip moves these cases instead of
 * breaking them.
 */
const STILL_SCAFFOLD_STAGES = ARMED_STAGE_KEYS.filter(
  (key) => buildFor(key).beatProvenance?.tasks !== "fact_derived",
);

/** The rule-bearing archetypes — the only ones that can reach this builder. */
const RULE_BEARING = listSourceArchetypes().filter(
  (archetype) => (archetype.valueLeverRules?.length ?? 0) > 0,
);

// ─────────────────────────────────────────────────────────────────────────────
// 0. The stage choice, re-checkable.
// ─────────────────────────────────────────────────────────────────────────────

describe("U-534 · the stage choice is a measurement, not a preference", () => {
  it("has a non-empty population of rule-bearing archetypes", () => {
    expect(RULE_BEARING.length).toBeGreaterThan(1);
  });

  it("finds a deliverable for the chosen stage on every rule-bearing archetype", () => {
    for (const archetype of RULE_BEARING) {
      const atStage = archetype.deliverablePack.filter(
        (deliverable) => deliverable.stage === DERIVED_STAGE,
      );
      expect(atStage.length).toBeGreaterThan(0);
    }
    // And a DIFFERENT one per archetype, which is what makes it move.
    const labels = RULE_BEARING.map(
      (archetype) =>
        archetype.deliverablePack.find((d) => d.stage === DERIVED_STAGE)!.label,
    );
    expect(new Set(labels).size).toBe(labels.length);
  });

  it("finds NO archetype authoring anything at stage `value`", () => {
    // The finding that ruled out the obvious first pick. If this ever becomes
    // false, the value stage is the better next candidate and this case says so.
    for (const archetype of RULE_BEARING) {
      expect(
        archetype.deliverablePack.filter((d) => d.stage === "value"),
      ).toHaveLength(0);
      expect(
        archetype.gateCriteria.filter((g) => g.fromStage === "value"),
      ).toHaveLength(0);
    }
  });

  it("finds a bafoAsk on every lever rule, and a commercialRisk on only some", () => {
    const rules = getSourceArchetype(ARCHETYPE_ID)!.valueLeverRules ?? [];
    expect(rules.length).toBeGreaterThan(1);
    for (const rule of rules) {
      expect(rule.bafoAsk.length).toBeGreaterThan(0);
    }
    // `commercialRisk` is OPTIONAL on the rule type, and measuring it corrected
    // this case: two of the six AMS rules omit it. So the derived guide has a
    // fallback branch, and BOTH branches are reachable from this registry --
    // which is why the fallback is not dead code and why this case does not
    // assert the field onto every rule.
    const withRisk = rules.filter((rule) => Boolean(rule.commercialRisk));
    expect(withRisk.length).toBeGreaterThan(0);
    expect(withRisk.length).toBeLessThan(rules.length);
  });

  it("splits the fixture's levers into BOTH halves, so neither is vacuous", () => {
    const archetype = getSourceArchetype(ARCHETYPE_ID)!;
    const results = evaluateValueLevers(archetype, LIVE_INPUTS);
    const computed = results.filter((r) => !r.insufficientEvidence);
    const insufficient = results.filter((r) => r.insufficientEvidence);
    expect(computed.length).toBeGreaterThan(0);
    expect(insufficient.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. The boundary declaration flips for one stage and stays for the nine.
// ─────────────────────────────────────────────────────────────────────────────

describe("U-534 · the boundary declares the flipped stage derived", () => {
  it("declares both intake beats fact-derived on the chosen stage", () => {
    expect(buildFor(DERIVED_STAGE).beatProvenance).toEqual({
      tasks: "fact_derived",
      gate: "fact_derived",
      scaffoldSource: null,
    });
  });

  it.each(STILL_SCAFFOLD_STAGES)(
    "%s still declares both intake beats as scaffold, and names its exemplar",
    (stageKey) => {
      expect(buildFor(stageKey).beatProvenance).toEqual({
        tasks: "scaffold",
        gate: "scaffold",
        scaffoldSource: liveStageScaffoldSourceFor(stageKey),
      });
    },
  );

  it("has a non-empty set of still-scaffold stages, and excludes this one", () => {
    // Acceptance (6): the label must not disappear because a stage stopped
    // needing it. A case over an empty set would assert that vacuously.
    //
    // Item U-535 flipped a second stage, so this is 8 rather than 9. The second
    // assertion is what the count alone never said: the set is built by reading
    // provenance, so this suite's OWN stage must be absent from it, and a builder
    // that stopped deriving `bafo` would fail here rather than quietly widening
    // the set back to nine.
    expect(STILL_SCAFFOLD_STAGES.length).toBeGreaterThan(0);
    expect(STILL_SCAFFOLD_STAGES.length).toBeLessThan(ARMED_STAGE_KEYS.length);
    expect(STILL_SCAFFOLD_STAGES).not.toContain(DERIVED_STAGE);
  });

  it("still carries `purpose` on the flipped stage, and says so nowhere else", () => {
    // `beatProvenance` declares the two INTAKE beats only. `purpose` is still
    // exemplar copy on this stage, and `scaffoldSource: null` above does not say
    // so -- the per-field record in docs/architecture/u533-stage-scaffold-provenance.json
    // is where that stays visible. Pinned here so the gap is deliberate.
    expect(buildFor(DERIVED_STAGE).purpose).toBe(SAMPLE_BAFO_STAGE.purpose);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. The derived tasks: they differ from the exemplar AND they move.
// ─────────────────────────────────────────────────────────────────────────────

describe("U-534 · the derived task list is not the exemplar's", () => {
  it("shares no title with the exemplar it replaced", () => {
    const exemplarTitles = new Set(
      SAMPLE_BAFO_STAGE.tasks.map((task) => task.title),
    );
    expect(exemplarTitles.size).toBeGreaterThan(0);

    const built = buildFor(DERIVED_STAGE);
    expect(built.tasks).not.toBe(SAMPLE_BAFO_STAGE.tasks);
    expect(built.tasks.length).toBeGreaterThan(0);
    for (const task of built.tasks) {
      expect(exemplarTitles.has(task.title)).toBe(false);
    }
  });

  it("names every lever the archetype declares, computed or not", () => {
    const archetype = getSourceArchetype(ARCHETYPE_ID)!;
    const results = evaluateValueLevers(archetype, LIVE_INPUTS);
    const built = buildFor(DERIVED_STAGE);

    // One task per lever, and the lever's own name is on it. Read off the
    // evaluator rather than typed, so renaming a rule cannot leave this green.
    for (const result of results) {
      const match = built.tasks.find((task) => task.title.includes(result.name));
      expect(match).toBeDefined();
    }
    expect(built.tasks.length).toBeGreaterThanOrEqual(results.length);
  });

  it("asks for evidence on the levers that could not compute, by fact key", () => {
    const archetype = getSourceArchetype(ARCHETYPE_ID)!;
    const insufficient = evaluateValueLevers(archetype, LIVE_INPUTS).filter(
      (result) => result.insufficientEvidence,
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

  it("carries the computed range and the cited fact on a quantified lever", () => {
    const archetype = getSourceArchetype(ARCHETYPE_ID)!;
    const computed = evaluateValueLevers(archetype, LIVE_INPUTS).filter(
      (result) => !result.insufficientEvidence,
    );
    expect(computed.length).toBeGreaterThan(0);

    const built = buildFor(DERIVED_STAGE);
    for (const result of computed) {
      const task = built.tasks.find((t) => t.title.includes(result.name))!;
      expect(task.type).toBe("confirm");
      const rowValues = (task.rows ?? []).map((row) => row.value).join(" | ");
      // The band's own low/high, formatted -- not a rounded restatement.
      expect(rowValues).toContain(Math.round(result.low).toLocaleString("en-US"));
      expect(rowValues).toContain(Math.round(result.high).toLocaleString("en-US"));
      // And the document a consumed fact was cited from.
      const citedDocs = result.evidenceRefs
        .map((ref) => LIVE_CITATIONS[ref.factKey]?.doc)
        .filter((doc): doc is string => Boolean(doc));
      expect(citedDocs.length).toBeGreaterThan(0);
      expect(rowValues).toContain(citedDocs[0]!);
    }
  });

  it("MOVES when the facts move — the reading a hand-written list would fail", () => {
    // This is the case that separates fact-derived from merely-different. A
    // hand-written replacement for the exemplar would pass every case above and
    // fail this one.
    const richer = buildFor(DERIVED_STAGE, RICHER_INPUTS);
    const thinner = buildFor(DERIVED_STAGE, LIVE_INPUTS);

    const confirmCount = (view: StageAnalyticsView) =>
      view.tasks.filter((task) => task.type === "confirm").length;

    expect(confirmCount(richer)).toBeGreaterThan(confirmCount(thinner));
    expect(JSON.stringify(richer.tasks)).not.toBe(JSON.stringify(thinner.tasks));
  });

  it("MOVES when the archetype moves, so it is not keyed to one archetype", () => {
    const other = RULE_BEARING.find(
      (archetype) => archetype.id !== ARCHETYPE_ID,
    )!;
    // The other archetype's OWN first rule's facts -- the AMS bag would leave it
    // unable to compute anything and the builder would return null, which is a
    // different finding from the one this case is making.
    const otherInputs = factsForFirstRules(other.id, 1);
    const view = buildLiveStageView({
      inputs: otherInputs,
      citations: citationsFor(otherInputs),
      archetypeId: other.id,
      stageKey: DERIVED_STAGE,
    });
    // Only assert the movement when the other archetype can go live at all;
    // the population case above already proves more than one rule-bearing
    // archetype exists, and a null here would be a different finding.
    expect(view).not.toBeNull();
    const titles = view!.tasks.map((task) => task.title).join(" | ");
    const mine = buildFor(DERIVED_STAGE, RICHER_INPUTS)
      .tasks.map((task) => task.title)
      .join(" | ");
    expect(titles).not.toBe(mine);
  });

  it("leaves every still-carrying stage holding the exemplar's own array", () => {
    for (const stageKey of STILL_SCAFFOLD_STAGES) {
      expect(buildFor(stageKey).tasks).toBe(liveStageScaffoldFor(stageKey).tasks);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. The derived gate.
// ─────────────────────────────────────────────────────────────────────────────

/** A person's name, as `U-533` learned to detect one. */
const PERSON_NAME_APPROVER = /^[A-Z]\.\s\S/;

describe("U-534 · the derived gate", () => {
  it("drops the exemplar's person-named approver for an archetype role", () => {
    const exemplarApprover = SAMPLE_BAFO_STAGE.gate.approver;
    // Population: the exemplar really did carry a person's name here.
    expect(exemplarApprover).toMatch(PERSON_NAME_APPROVER);

    const built = buildFor(DERIVED_STAGE);
    expect(built.gate.approver).not.toBe(exemplarApprover);
    expect(built.gate.approver).not.toMatch(PERSON_NAME_APPROVER);
    expect(getSourceArchetype(ARCHETYPE_ID)!.requiredStakeholders).toContain(
      built.gate.approver,
    );
  });

  it("generates what the archetype declares at this stage, not the exemplar's", () => {
    const archetype = getSourceArchetype(ARCHETYPE_ID)!;
    const declared = archetype.deliverablePack.filter(
      (deliverable) => deliverable.stage === DERIVED_STAGE,
    );
    expect(declared.length).toBeGreaterThan(0);

    const built = buildFor(DERIVED_STAGE);
    expect(built.gate.generates.map((g) => g.label)).toEqual(
      declared.map((d) => d.label),
    );
    expect(built.gate.generates).not.toBe(SAMPLE_BAFO_STAGE.gate.generates);
    // No builder vocabulary on a client surface: the spec KEY is not a code a
    // reader should see, so no `code` chip is emitted from it.
    for (const deliverable of built.gate.generates) {
      expect(deliverable.code).toBeUndefined();
    }
  });

  it("states the computed / needs-evidence split, and MOVES with it", () => {
    const archetype = getSourceArchetype(ARCHETYPE_ID)!;
    const lean = evaluateValueLevers(archetype, LIVE_INPUTS);
    const leanComputed = lean.filter((r) => !r.insufficientEvidence).length;

    const built = buildFor(DERIVED_STAGE);
    const labels = built.gate.confirms.map((c) => c.label).join(" | ");
    expect(labels).toContain(String(leanComputed));
    expect(labels).toContain(String(lean.length));

    const richer = buildFor(DERIVED_STAGE, RICHER_INPUTS);
    expect(richer.gate.confirms.map((c) => c.label).join(" | ")).not.toBe(labels);
  });

  it("keeps the computed next-stage label the builder already produced", () => {
    // `gate.nextStageName` was never carried -- `U-533` proved it computed. A
    // derived gate must not regress that to null or to the exemplar's.
    expect(buildFor(DERIVED_STAGE).gate.nextStageName).toBe(
      SAMPLE_BAFO_STAGE.gate.nextStageName,
    );
  });

  it("leaves every still-carrying gate holding the exemplar's own confirm array", () => {
    for (const stageKey of STILL_SCAFFOLD_STAGES) {
      expect(buildFor(stageKey).gate.confirms).toBe(
        liveStageScaffoldFor(stageKey).gate.confirms,
      );
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. The disclosure switches off for this stage and stays on for the nine.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Anchored to the START of its own line, per `U-533`: mutating the marker to
 * `SCAFFOLD CONTENTS` left 42 cases green under `toContain`, because the shorter
 * string is a prefix of the longer one.
 */
const DISCLOSURE_MARKER = /^SCAFFOLD CONTENT -- /m;

describe("U-534 · the grounding disclosure follows the declaration", () => {
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

  it("names no exemplar constant in the flipped stage's blocks", () => {
    const view = buildFor(DERIVED_STAGE);
    for (const mode of ["evidence_readiness", "stage_gate"] as const) {
      expect(block(mode, view)).not.toContain("SAMPLE_BAFO_STAGE");
    }
  });

  it("puts the derived lever names into the evidence-readiness block", () => {
    // The replacement is only worth making if what replaced it reaches the same
    // consumer the exemplar's titles reached.
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

  it("no longer prints the exemplar approver on this stage's gate block", () => {
    expect(block("stage_gate", buildFor(DERIVED_STAGE))).not.toContain(
      SAMPLE_BAFO_STAGE.gate.approver,
    );
  });
});
