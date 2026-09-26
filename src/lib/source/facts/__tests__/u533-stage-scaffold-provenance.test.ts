/**
 * Item U-533 — `SOURCE_BACKLOG_MASTER.md` §F9, wave 2.
 *
 * UPDATED BY U-534 AND THEN BY U-535, which between them shipped part of the
 * slice this suite deliberately deferred: TWO stages' (`bafo`, then `evaluation`)
 * intake beats are now derived from the event's facts and its resolved
 * archetype, and eight still carry.
 *
 * U-535 also SPLIT A VERDICT, because the measurement was wrong about the second
 * stage in a way it could not have been about the first. See `verdictFor`: a
 * derived value that is EMPTY -- `evaluation` derives `gate.generates` from an
 * archetype that declares no deliverable there -- differs from the exemplar and
 * moves with neither reading, so it landed on `derived_from_neither`, the verdict
 * reserved for a hand-written replacement, and tripped the guard that exists to
 * catch one. `derived_empty` now carries that case and the guard still catches
 * every non-empty replacement.
 *
 * ORIGINAL U-534 NOTE, kept and re-counted: the cases below were the known
 * positives U-534 was supposed to turn red, and five of them did; U-535 turned
 * four more red, including one in U-534's own suite. They are UPDATED rather than
 * deleted or relaxed — the per-stage measurement now records eight carried stages
 * and two derived ones — and each case that named a stage by hand now SEARCHES
 * for one, or runs `it.each` over the set the builder reports, so the next stage
 * to flip cannot leave a case green against a stage it no longer describes.
 *
 * The measurement also gained a third reading, because U-534's acceptance says a
 * hand-written alternative to a fixture is still a fixture: `movesWithFacts` per
 * field, measured by rebuilding the same stage from a DIFFERENT fact bag. Two
 * readings (agrees / follows-the-caller) could not tell a derived beat from a
 * typed-out one; three can.
 *
 * `buildLiveStageView` composes a LIVE value waterfall and a LIVE intel beat
 * from an event's committed facts, and then carries the stage exemplar's `tasks`
 * and `gate` through verbatim so the page renders. Three reachable consumers
 * take that view: the mounted event route, the chat agent route, and
 * `ava-grounding-context.ts` — so exemplar task titles and an exemplar
 * approver's name reach a reader AND the model's prompt.
 *
 * THIS SUITE IS THE SLICE THE ITEM'S ACCEPTANCE SEPARATES OUT, and it is worth
 * being precise about which half:
 *
 *   • (1) the per-stage, per-field measurement of what is fact-derived and what
 *     is carried — committed as `docs/architecture/u533-stage-scaffold-provenance.json`
 *     rather than asserted in a PR body;
 *   • (2) the known positives, so the eventual replacement has something real to
 *     go red against;
 *   • the boundary LABELLING the item calls "the governance defect, separate
 *     from the content gap": the carried beats are now declared at the boundary
 *     that builds them and disclosed to the model;
 *   • (4) mutation proof by RE-SPELLING, not only by deletion.
 *
 * DELIBERATELY NOT DONE HERE, and released back to the backlog: (3) replacing one
 * stage's `tasks`/`gate` with fact-derived values. Nothing in this change makes a
 * beat derived. What it changes is that a carried beat now SAYS it is carried —
 * measured here as "both beats scaffold on all ten exemplars", which is the
 * honest before-state a later slice flips one stage of.
 *
 * (5) NO SIGNED-IN CLAIM is made or implied. Every case here is an in-process
 * function call; none of them authenticates, reads a tenant, or renders a route.
 *
 * WHY THE MEASUREMENT COMPARES OBJECT IDENTITY, not just equality. `tasks:
 * scaffold.tasks` hands out the exemplar's own array — the same reference — and
 * `gate.confirms` / `gate.generates` survive the gate's spread as the same
 * references too. Deep equality would also be satisfied by a builder that
 * happened to compute an identical value, so identity is the stronger reading
 * and is recorded separately from equality.
 */

import fs from "node:fs";
import path from "node:path";

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
import { SOURCE_STAGE_LABELS } from "@/lib/source/constants";
import type { FactSourceCitation } from "@/lib/source/facts/fact-types";
import type { StageAnalyticsView } from "@/components/source/canvas/analytics/view-model";
import {
  SAMPLE_SCOPE_STAGE,
  SAMPLE_RFP_STAGE,
  SAMPLE_BAFO_STAGE,
  SAMPLE_SELECTION_STAGE,
  SAMPLE_RESPONSES_STAGE,
  SAMPLE_EVALUATION_STAGE,
  SAMPLE_PRICING_STAGE,
  SAMPLE_EXECUTIVE_DECISION_STAGE,
  SAMPLE_TRANSITION_STAGE,
  SAMPLE_VALUE_STAGE,
} from "@/components/source/canvas/analytics/sample-view-model";

const REPO_ROOT = process.cwd();
const RECORD_REL = "docs/architecture/u533-stage-scaffold-provenance.json";
const RECORD_PATH = path.join(REPO_ROOT, RECORD_REL);
const UPDATE = process.env.ABARVA_UPDATE_U533_PROVENANCE === "1";

const ARCHETYPE_ID = "AMS_MANAGED_SERVICES";

/** Facts that quantify one AMS lever, so the builder returns a live view at all. */
const LIVE_INPUTS = {
  annual_change_order_spend: 1_000_000,
  recurring_avoidable_pct: 20,
  term_years: 3,
};

const LIVE_CITATIONS: Record<string, FactSourceCitation | null> = {
  annual_change_order_spend: { doc: "Incumbent AMS contract", locator: "Exhibit C" },
  recurring_avoidable_pct: { doc: "ServiceNow export", locator: "recurring share" },
  term_years: { doc: "Vendor proposal", locator: "term" },
};

/**
 * A SECOND fact bag that quantifies one MORE lever than `LIVE_INPUTS`, for the
 * third reading U-534 added: does a field move when the FACTS move?
 *
 * The keys are read off the archetype's own second lever rule rather than typed.
 * Typing them was tried in U-534's suite and produced keys that belong to no rule,
 * so the "richer" bag quantified nothing extra and a movement case failed for a
 * reason unrelated to the code under test.
 */
/**
 * The archetypes that can reach this builder at all: `buildLiveStageView` returns
 * null unless a value lever computes, so an archetype with no `valueLeverRules`
 * never produces a view to measure. Item U-535 reads the per-stage deliverable
 * rule off this set rather than off the whole registry, for the same reason.
 */
const RULE_BEARING_ARCHETYPES = listSourceArchetypes().filter(
  (archetype) => (archetype.valueLeverRules?.length ?? 0) > 0,
);

const OTHER_ARCHETYPE_ID = (() => {
  const other = listSourceArchetypes().find(
    (archetype) =>
      archetype.id !== ARCHETYPE_ID &&
      (archetype.valueLeverRules?.length ?? 0) > 0,
  );
  if (!other) throw new Error("no second rule-bearing archetype to perturb with");
  return other.id;
})();

/** That archetype's own first lever rule's facts, read off the rule, not typed. */
const OTHER_ARCHETYPE_INPUTS: Record<string, number> = (() => {
  const rules = getSourceArchetype(OTHER_ARCHETYPE_ID)!.valueLeverRules ?? [];
  const bag: Record<string, number> = {};
  for (const spec of rules[0]?.computation.inputs ?? []) {
    bag[spec.key] =
      spec.unit === "pct" ? 20 : spec.unit === "count" ? 3 : 1_000_000;
  }
  return bag;
})();

const RICHER_INPUTS: Record<string, number> = (() => {
  const rules = getSourceArchetype(ARCHETYPE_ID)!.valueLeverRules ?? [];
  const bag: Record<string, number> = { ...LIVE_INPUTS };
  for (const spec of rules[1]?.computation.inputs ?? []) {
    bag[spec.key] =
      spec.unit === "pct" ? 20 : spec.unit === "count" ? 3 : 1_000_000;
  }
  return bag;
})();

/**
 * The exemplar constants BY NAME, so the name table in the builder can be proved
 * against the switch by object identity rather than by re-reading the source.
 */
const EXEMPLARS_BY_NAME: Readonly<Record<string, StageAnalyticsView>> = {
  SAMPLE_SCOPE_STAGE,
  SAMPLE_RFP_STAGE,
  SAMPLE_RESPONSES_STAGE,
  SAMPLE_EVALUATION_STAGE,
  SAMPLE_PRICING_STAGE,
  SAMPLE_BAFO_STAGE,
  SAMPLE_EXECUTIVE_DECISION_STAGE,
  SAMPLE_SELECTION_STAGE,
  SAMPLE_TRANSITION_STAGE,
  SAMPLE_VALUE_STAGE,
};

/** The nine keys with their own switch arm, plus `scope`, which is also the default. */
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

/** Every key the canonical label table declares, armed and legacy alike. */
const ALL_DECLARED_STAGE_KEYS = Object.keys(SOURCE_STAGE_LABELS).sort();


function buildFor(stageKey: string): StageAnalyticsView {
  const view = buildLiveStageView({
    inputs: LIVE_INPUTS,
    citations: LIVE_CITATIONS,
    archetypeId: ARCHETYPE_ID,
    baselineLabel: "Value at stake (event estimate)",
    baselineAmount: 14_000_000,
    stageKey,
  });
  if (!view) throw new Error(`no live view for stage ${stageKey}`);
  return view;
}

/**
 * The stage U-534 flipped, and the nine that still carry.
 *
 * `DERIVED_STAGE_KEYS` is read off the BUILDER -- the set of armed stages whose
 * built view declares a derived intake beat -- rather than typed. A constant list
 * would have to be edited in lockstep with the builder by whoever flips the next
 * stage, and the failure mode of forgetting is a case that passes about a stage it
 * no longer describes.
 */
const DERIVED_STAGE_KEYS = ARMED_STAGE_KEYS.filter((stageKey) => {
  const declared = buildFor(stageKey).beatProvenance;
  return declared?.tasks === "fact_derived" || declared?.gate === "fact_derived";
});

const CARRIED_STAGE_KEYS = ARMED_STAGE_KEYS.filter(
  (stageKey) => !(DERIVED_STAGE_KEYS as readonly string[]).includes(stageKey),
);

type Verdict =
  | "fact_derived"
  | "archetype_derived"
  | "derived_empty"
  | "derived_from_neither"
  | "scaffold_carried_by_reference"
  | "scaffold_carried_by_value"
  | "from_input"
  | "computed_agrees_with_exemplar"
  | "computed_differs_from_exemplar"
  | "declared_provenance"
  | "absent";

/**
 * AGREEMENT IS NOT PROVENANCE, and conflating the two is how this measurement
 * was wrong on its first run.
 *
 * `gate.nextStageName` is computed by the builder for EVERY stage, from the
 * canonical stage order — yet on nine of the ten exemplars the computed label
 * equals the exemplar's own, because the exemplars were authored to match that
 * order. Read by equality alone, nine of ten came back "carried by reference"
 * and only `value` (the final stage, where the computed answer is null) showed
 * as computed. Two facts had cancelled into agreement.
 *
 * So each field carries TWO readings: whether it agrees with the exemplar, and
 * whether it MOVES when the thing that would drive it changes. `carriage` is
 * concluded only from a field that agrees AND does not move.
 */
function verdictFor(
  built: unknown,
  carried: unknown,
  moves: "does_not_move" | "follows_input" | "follows_stage_order",
  derivation?: { withFacts: boolean; withArchetype: boolean },
): Verdict {
  if (built === undefined) return "absent";
  const agrees =
    built === carried || JSON.stringify(built) === JSON.stringify(carried);

  if (moves === "follows_input") return "from_input";
  if (moves === "follows_stage_order") {
    return agrees
      ? "computed_agrees_with_exemplar"
      : "computed_differs_from_exemplar";
  }
  if (built === carried) return "scaffold_carried_by_reference";
  if (agrees) return "scaffold_carried_by_value";

  /**
   * ITEM U-534 SPLIT THIS RETURN, and the split was forced by a measurement, not
   * by taste. Before it, "differs from the exemplar and does not follow the
   * caller" returned `fact_derived` — and when the first stage was flipped, that
   * concluded `fact_derived` for `gate.approver` and `gate.generates`, both of
   * which provably do NOT move when the facts move. They move when the ARCHETYPE
   * moves, which is a different provenance and a weaker claim about the event.
   *
   * `derived_from_neither` is the verdict a hand-written replacement for a fixture
   * earns: different from the exemplar, following nothing. The item's acceptance
   * calls that out by name — "a hand-written alternative to a fixture is still a
   * fixture" — and a case below asserts no field holds it.
   */
  if (derivation) {
    if (derivation.withFacts) return "fact_derived";
    if (derivation.withArchetype) return "archetype_derived";
    /**
     * ITEM U-535 SPLIT THIS RETURN A SECOND TIME, and again a measurement forced
     * it rather than taste. `evaluation` derives `gate.generates` from the
     * archetype's `deliverablePack` at that stage, and NO rule-bearing archetype
     * declares one there -- so the derived list is legitimately EMPTY. Empty
     * differs from the exemplar and moves with neither reading, which sent it to
     * `derived_from_neither` and tripped the guard below that exists to catch a
     * fixture swapped for a fixture.
     *
     * An empty derivation and a hand-written replacement are not the same
     * provenance. The first is the faithful reading of an archetype that declares
     * nothing; the second is content a person typed. Conflating them would have
     * left exactly two options, both bad: weaken the guard to allow the verdict,
     * or backfill the exemplar's deliverable to keep the list full.
     *
     * `isEmptyDerivation` fires ONLY on a value carrying no content at all, so a
     * hand-written replacement -- non-empty by construction, since it is content
     * someone wrote -- still earns `derived_from_neither`. A case below mutates a
     * non-empty value through this branch and asserts it does not reach here.
     */
    if (isEmptyDerivation(built)) return "derived_empty";
    return "derived_from_neither";
  }
  return "fact_derived";
}

/**
 * A derived value carrying no content: an empty array, an empty/whitespace
 * string, or nothing at all. Deliberately NOT "falsy" -- `0` and `false` are
 * content, and a field legitimately derived to zero must not be excused from the
 * hand-written-fixture guard by an accident of JavaScript truthiness.
 */
function isEmptyDerivation(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim().length === 0;
  return false;
}

/**
 * A title that exists in the exemplar and NOWHERE in the fact inputs, so it can
 * only have arrived by carriage. Read off the exemplar rather than typed here, so
 * re-spelling the exemplar's title cannot leave this suite green against a
 * string the builder no longer emits.
 *
 * It must be a `provide` task: the evidence-readiness block enumerates only those,
 * so a `confirm` title would be absent from that block for a reason that has
 * nothing to do with carriage, and the known positive would be measuring the
 * wrong thing. (It was, on the first run of this suite.)
 */
const SCOPE_EXEMPLAR_TASK_TITLE = SAMPLE_SCOPE_STAGE.tasks.find(
  (task) => task.type === "provide",
)!.title;

/**
 * An exemplar approver that is a PERSON'S NAME rather than a role label.
 *
 * Found by searching the ten exemplars rather than asserted of one: the first
 * draft of this suite named `SAMPLE_RFP_STAGE` and was wrong -- that exemplar's
 * approver is the role "Decision owner". Six of the ten are role labels, and a
 * suite that had happened to pick one of those would have proved nothing while
 * passing. The population is asserted before the property.
 */
const PERSON_NAME_APPROVER = /^[A-Z]\.\s\S/;

const NAMED_APPROVER_STAGES = ARMED_STAGE_KEYS.filter((stageKey) =>
  PERSON_NAME_APPROVER.test(liveStageScaffoldFor(stageKey).gate.approver),
);

const NAMED_APPROVER_STAGE = NAMED_APPROVER_STAGES[0]!;

// ─────────────────────────────────────────────────────────────────────────────
// 1. The measurement.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The same stage built with a DIFFERENT caller-supplied name, so a field that
 * follows the caller can be told apart from one that carries the exemplar's.
 */
const PERTURBED_STAGE_NAME = "Caller-supplied stage name (probe)";

function measureStage(stageKey: string) {
  const view = buildFor(stageKey);
  const scaffold = liveStageScaffoldFor(stageKey);

  const perturbed = buildLiveStageView({
    inputs: LIVE_INPUTS,
    citations: LIVE_CITATIONS,
    archetypeId: ARCHETYPE_ID,
    baselineLabel: "Value at stake (event estimate)",
    baselineAmount: 14_000_000,
    stageKey,
    stageName: PERTURBED_STAGE_NAME,
  })!;

  const follows = (
    read: (v: StageAnalyticsView) => unknown,
  ): "does_not_move" | "follows_input" =>
    JSON.stringify(read(perturbed)) === JSON.stringify(read(view))
      ? "does_not_move"
      : "follows_input";

  /**
   * THE THIRD READING, added by U-534. The same stage rebuilt from a fact bag that
   * quantifies one more lever. A field that MOVES here is derived from the event's
   * facts; a field that does not is either carried or computed from something other
   * than the facts, and the two readings above say which.
   *
   * This is the reading that separates "fact-derived" from "hand-written instead of
   * the exemplar" -- a typed-out replacement for a fixture passes every other
   * reading in this file and fails only this one.
   */
  const factPerturbed = buildLiveStageView({
    inputs: RICHER_INPUTS,
    citations: LIVE_CITATIONS,
    archetypeId: ARCHETYPE_ID,
    baselineLabel: "Value at stake (event estimate)",
    baselineAmount: 14_000_000,
    stageKey,
  })!;

  const movesWithFacts = (read: (v: StageAnalyticsView) => unknown): boolean =>
    JSON.stringify(read(factPerturbed)) !== JSON.stringify(read(view));

  /**
   * THE FOURTH READING, also added by U-534, and the one that caught an over-claim
   * this suite was about to commit. A field can differ from the exemplar, ignore
   * the caller, and still not move with the facts — because it follows the resolved
   * ARCHETYPE instead. That is derived content, but it is a weaker claim about this
   * event than "computed from its facts", and the artifact now says which.
   *
   * Built from a DIFFERENT archetype with that archetype's OWN first lever rule's
   * facts, because the AMS bag would leave it unable to compute and the builder
   * would return null.
   */
  const archetypePerturbed = buildLiveStageView({
    inputs: OTHER_ARCHETYPE_INPUTS,
    citations: LIVE_CITATIONS,
    archetypeId: OTHER_ARCHETYPE_ID,
    baselineLabel: "Value at stake (event estimate)",
    baselineAmount: 14_000_000,
    stageKey,
  })!;

  const movesWithArchetype = (
    read: (v: StageAnalyticsView) => unknown,
  ): boolean =>
    JSON.stringify(read(archetypePerturbed)) !== JSON.stringify(read(view));

  const derivation = (read: (v: StageAnalyticsView) => unknown) => ({
    withFacts: movesWithFacts(read),
    withArchetype: movesWithArchetype(read),
  });

  return {
    stageKey,
    exemplar: liveStageScaffoldSourceFor(stageKey),
    exemplarOwnStageKey: scaffold.stageKey,
    fields: {
      // `stageKey` came from the caller. It agrees with the exemplar's own key on
      // the nine matching arms, which is agreement, not carriage.
      stageKey: "from_input",
      stageName: verdictFor(
        view.stageName,
        scaffold.stageName,
        follows((v) => v.stageName),
      ),
      purpose: verdictFor(
        view.purpose,
        scaffold.purpose,
        follows((v) => v.purpose),
        derivation((v) => v.purpose),
      ),
      intel: verdictFor(view.intel, scaffold.intel, "does_not_move"),
      tasks: verdictFor(
        view.tasks,
        scaffold.tasks,
        follows((v) => v.tasks),
        derivation((v) => v.tasks),
      ),
      "gate.approver": verdictFor(
        view.gate.approver,
        scaffold.gate.approver,
        follows((v) => v.gate.approver),
        derivation((v) => v.gate.approver),
      ),
      "gate.confirms": verdictFor(
        view.gate.confirms,
        scaffold.gate.confirms,
        follows((v) => v.gate.confirms),
        derivation((v) => v.gate.confirms),
      ),
      "gate.generates": verdictFor(
        view.gate.generates,
        scaffold.gate.generates,
        follows((v) => v.gate.generates),
        derivation((v) => v.gate.generates),
      ),
      "gate.nextStageName": verdictFor(
        view.gate.nextStageName,
        scaffold.gate.nextStageName,
        "follows_stage_order",
      ),
      "gate.action": verdictFor(
        view.gate.action,
        scaffold.gate.action,
        "does_not_move",
      ),
      waterfall: verdictFor(view.waterfall, scaffold.waterfall, "does_not_move"),
      stepInsight: verdictFor(
        view.stepInsight,
        scaffold.stepInsight,
        "does_not_move",
      ),
      beatProvenance: view.beatProvenance ? "declared_provenance" : "absent",
    } satisfies Record<string, Verdict>,
    /**
     * Per-field: did it move when the FACTS moved? Recorded beside `fields` rather
     * than folded into the verdict, so a reader can see the two readings disagree
     * if they ever do.
     */
    movesWithFacts: {
      purpose: movesWithFacts((v) => v.purpose),
      intel: movesWithFacts((v) => v.intel),
      tasks: movesWithFacts((v) => v.tasks),
      "gate.approver": movesWithFacts((v) => v.gate.approver),
      "gate.confirms": movesWithFacts((v) => v.gate.confirms),
      "gate.generates": movesWithFacts((v) => v.gate.generates),
      "gate.nextStageName": movesWithFacts((v) => v.gate.nextStageName),
      waterfall: movesWithFacts((v) => v.waterfall),
    },
    /** The same fields, read against a DIFFERENT resolved archetype. */
    movesWithArchetype: {
      purpose: movesWithArchetype((v) => v.purpose),
      intel: movesWithArchetype((v) => v.intel),
      tasks: movesWithArchetype((v) => v.tasks),
      "gate.approver": movesWithArchetype((v) => v.gate.approver),
      "gate.confirms": movesWithArchetype((v) => v.gate.confirms),
      "gate.generates": movesWithArchetype((v) => v.gate.generates),
      "gate.nextStageName": movesWithArchetype((v) => v.gate.nextStageName),
      waterfall: movesWithArchetype((v) => v.waterfall),
    },
    declared: view.beatProvenance ?? null,
    gateTaskTitles: view.tasks.map((task) => task.title),
    gateApprover: view.gate.approver,
    gateConfirmLabels: view.gate.confirms.map((c) => c.label),
    // The intel beat states its OWN provenance; recorded so the artifact shows
    // which beats already declared one before this item and which did not.
    intelProvenance: view.intel.provenance,
    waterfallProvenance: view.waterfall?.provenance ?? null,
  };
}

function buildMeasurement() {
  const stages = ARMED_STAGE_KEYS.map((key) => measureStage(key));

  const legacyResolution = ALL_DECLARED_STAGE_KEYS.filter(
    (key) => !(ARMED_STAGE_KEYS as readonly string[]).includes(key),
  ).map((key) => ({
    stageKey: key,
    resolvesTo: liveStageScaffoldSourceFor(key),
    isDefaultArm: liveStageScaffoldFor(key) === SAMPLE_SCOPE_STAGE,
  }));

  /**
   * `gate.nextStageName` is computed, proved on a key where the computed answer
   * and the exemplar's DISAGREE. `sourcing_strategy` is a legacy alias: it falls
   * to the Scope default arm, so the exemplar offers Scope's next stage, while
   * the canonical order normalizes the key first and offers a different one.
   * Without a disagreeing case, "computed" would rest on the `value` stage alone.
   */
  const nextStageNameProbeKey = "sourcing_strategy";
  const nextStageNameProbe = {
    stageKey: nextStageNameProbeKey,
    exemplar: liveStageScaffoldSourceFor(nextStageNameProbeKey),
    exemplarNextStageName:
      liveStageScaffoldFor(nextStageNameProbeKey).gate.nextStageName,
    builtNextStageName: buildFor(nextStageNameProbeKey).gate.nextStageName,
  };

  const derivedFieldNames = new Set<string>();
  const archetypeDerivedFieldNames = new Set<string>();
  const emptyDerivedFieldNames = new Set<string>();
  const neitherFieldNames = new Set<string>();
  const carriedFieldNames = new Set<string>();
  for (const stage of stages) {
    for (const [field, verdict] of Object.entries(stage.fields)) {
      if (verdict === "fact_derived") derivedFieldNames.add(field);
      if (verdict === "archetype_derived") archetypeDerivedFieldNames.add(field);
      if (verdict === "derived_empty") emptyDerivedFieldNames.add(field);
      if (verdict === "derived_from_neither") neitherFieldNames.add(field);
      if (
        verdict === "scaffold_carried_by_reference" ||
        verdict === "scaffold_carried_by_value"
      ) {
        carriedFieldNames.add(field);
      }
    }
  }

  return {
    item: "U-533",
    generatedBy: "src/lib/source/facts/__tests__/u533-stage-scaffold-provenance.test.ts",
    regenerateWith:
      "ABARVA_UPDATE_U533_PROVENANCE=1 npx jest --runTestsByPath src/lib/source/facts/__tests__/u533-stage-scaffold-provenance.test.ts",
    subject: {
      builder: "src/lib/source/facts/view/stage-analytics-builder.ts",
      builderFunction: "buildLiveStageView",
      scaffoldSwitch: "liveStageScaffoldFor",
      exemplarModule: "src/components/source/canvas/analytics/sample-view-model.ts",
    },
    consumers: [
      "src/app/(maestro)/source/events/[eventId]/page.tsx",
      "src/app/api/chat/agent/route.ts",
      "src/lib/source/facts/view/ava-grounding-context.ts",
    ],
    scope: {
      inSlice: [
        "per-stage per-field provenance measurement",
        "known positives on the render path and the grounding path",
        "boundary declaration (StageAnalyticsView.beatProvenance)",
        "grounding-block disclosure of exemplar content",
      ],
      deferred: [
        // Item U-535. This read "replace ONE stage's tasks/gate ..." and was
        // stale the moment a second stage flipped -- a deferred entry naming work
        // that is partly done reads as though none of it is. Stated as a
        // remainder rather than a task, and the two counts above are the
        // machine-checkable half of it.
        "derive tasks/gate for the eight stages still carrying an exemplar (U-533 acceptance 3, continued)",
      ],
      signedInProofPerformed: false,
    },
    summary: {
      armedStageCount: stages.length,
      declaredStageKeyCount: ALL_DECLARED_STAGE_KEYS.length,
      factDerivedFields: [...derivedFieldNames].sort(),
      /**
       * Item U-534. Fields that differ from the exemplar and move with the resolved
       * ARCHETYPE but NOT with the facts. Recorded apart from `factDerivedFields`
       * because "derived" is a weaker claim about this event than "computed from
       * its facts", and the first draft of U-534 called both of these fact-derived.
       */
      archetypeDerivedFields: [...archetypeDerivedFieldNames].sort(),
      /**
       * Item U-535. Fields whose derived value is EMPTY because the archetype
       * declares nothing to derive from at that stage. A faithful reading of an
       * absence, recorded apart from both the derived sets and from the
       * hand-written-fixture set below, because it is neither.
       */
      emptyDerivedFields: [...emptyDerivedFieldNames].sort(),
      /**
       * Fields that differ from the exemplar and follow NOTHING — the shape a
       * hand-written replacement for a fixture takes. Expected empty; a case below
       * asserts it, which is the guard against swapping one fixture for another.
       */
      derivedFromNeitherFields: [...neitherFieldNames].sort(),
      scaffoldCarriedFields: [...carriedFieldNames].sort(),
      stagesWithScaffoldTasks: stages.filter(
        (s) => s.declared?.tasks === "scaffold",
      ).length,
      stagesWithScaffoldGate: stages.filter((s) => s.declared?.gate === "scaffold")
        .length,
      // Item U-534. The flipped stage, recorded as a count and by key so the
      // before/after of this artifact is one diff rather than a re-reading.
      stagesWithDerivedTasks: stages.filter(
        (s) => s.declared?.tasks === "fact_derived",
      ).length,
      stagesWithDerivedGate: stages.filter(
        (s) => s.declared?.gate === "fact_derived",
      ).length,
      derivedStages: stages
        .filter(
          (s) =>
            s.declared?.tasks === "fact_derived" ||
            s.declared?.gate === "fact_derived",
        )
        .map((s) => s.stageKey),
      // Which BUILT views still hand a person's name downstream. Distinct from
      // `stagesWithPersonNamedApprover` below, which is about the EXEMPLARS: a
      // stage can have a person-named exemplar and no longer expose it.
      stagesExposingPersonNamedApprover: stages
        .filter((s) => PERSON_NAME_APPROVER.test(s.gateApprover))
        .map((s) => s.stageKey),
      distinctGateApprovers: [
        ...new Set(stages.map((s) => s.gateApprover)),
      ].sort(),
      // Exemplar approvers that read as a person rather than a role. These are
      // the ones the grounding block introduced by name with no caveat.
      stagesWithPersonNamedApprover: NAMED_APPROVER_STAGES.slice(),
    },
    nextStageNameProbe,
    /**
     * The two reachable read paths leak DIFFERENT carried fields, measured rather
     * than assumed. `tasks` reaches both. `gate.approver` reaches the prompt only:
     * the sole component that renders it is `ScopeGate`, whose sole mounter
     * `ScopeAnalyticsStage` is imported by no route. Proved on the render side by
     * `src/components/source/canvas/analytics/__tests__/SourceAnalyticsCanvas.u533ScaffoldProvenance.test.tsx`.
     */
    carriedFieldReach: {
      tasks: ["rendered_canvas", "model_prompt"],
      "gate.approver": ["model_prompt"],
      "gate.confirms": ["model_prompt"],
      "gate.generates": ["model_prompt"],
    },
    stages,
    legacyResolution,
  };
}

const measurement = buildMeasurement();

if (UPDATE) {
  fs.writeFileSync(
    RECORD_PATH,
    `${JSON.stringify(measurement, null, 2)}\n`,
    "utf8",
  );
}

describe("U-533 · the measurement is committed and does not drift", () => {
  /**
   * WHERE THIS SUITE LIVES, AND WHY IT IS NOT IN `src/__tests__/behaviors`.
   *
   * It was, and it broke the `Behavior coverage floor` gate with all 140 suites
   * and 1399 tests GREEN: `lines 89.16 / statements 89.16` against a floor of 90.
   * Measured rather than inferred -- the same gate with this one file removed
   * returned `91.12 / 91.12 / 70.69 / 70.78` and exit 0, so this suite was the
   * entire cause.
   *
   * The mechanism is the gate's shape, not this suite's thinness. That gate
   * thresholds an AGGREGATE over every file the behaviours directory touches.
   * Driving `buildModeGrounding` pulls all 1657 lines of `mode-grounding.ts`
   * into the denominator while only the two modes under test enter the
   * numerator, so the gate cannot tell "this test covers little" from "this test
   * reaches code nothing else reaches" -- and the cheapest way to keep it green
   * is to test only what is already tested.
   *
   * So the suite moved to the code it drives, in a directory CI already runs
   * unconditionally, rather than the floor moving to admit it. The case below
   * proves that placement against the workflow instead of asserting it in prose.
   */
  it("sits in a directory a pull-request workflow runs unconditionally", () => {
    const relative = path
      .relative(REPO_ROOT, __filename)
      .split(path.sep)
      .join("/");

    const workflow = fs.readFileSync(
      path.join(REPO_ROOT, ".github/workflows/unit-suites.yml"),
      "utf8",
    );

    // Resolve what the command would RUN, rather than grepping for this
    // directory's name: a bare jest path argument is a REGEX against the full
    // test path, so the honest question is whether any step's pattern matches
    // this file. A step carrying an ignore list is not counted, because a
    // pattern that matches says nothing about a file the step then excludes.
    const jestPaths = [
      ...workflow.matchAll(/^\s*run:\s*npx jest ([^\s]+) --no-coverage --ci\s*$/gm),
    ].map((match) => match[1]!);
    expect(jestPaths.length).toBeGreaterThan(0);

    const matching = jestPaths.filter((pattern) => {
      try {
        return new RegExp(pattern).test(relative);
      } catch {
        return false;
      }
    });
    expect(matching.length).toBeGreaterThan(0);
    expect(matching).toContain("src/lib/source/facts");
  });

  it("matches the committed artifact field for field", () => {
    expect(fs.existsSync(RECORD_PATH)).toBe(true);
    const committed = JSON.parse(fs.readFileSync(RECORD_PATH, "utf8"));
    expect(committed).toEqual(measurement);
  });

  it("proves `gate.nextStageName` is computed on a case where it DISAGREES", () => {
    // Without a disagreeing case, "computed" would rest on the `value` stage
    // alone, and on nine of ten stages the computed label coincides with the
    // exemplar's. This is the case that separates agreement from provenance.
    const probe = measurement.nextStageNameProbe;
    expect(probe.exemplar).toBe("SAMPLE_SCOPE_STAGE");
    expect(probe.exemplarNextStageName).not.toBeNull();
    expect(probe.builtNextStageName).not.toBe(probe.exemplarNextStageName);

    // And the nine agreeing stages are recorded as agreement, not as carriage.
    const agreeing = measurement.stages.filter(
      (stage) =>
        stage.fields["gate.nextStageName"] === "computed_agrees_with_exemplar",
    );
    expect(agreeing.length).toBeGreaterThan(0);
    for (const stage of measurement.stages) {
      expect(stage.fields["gate.nextStageName"]).not.toBe(
        "scaffold_carried_by_reference",
      );
    }
  });

  it("measures all ten armed stages and every declared stage key", () => {
    // Population before property: a measurement over zero stages must fail.
    expect(measurement.stages).toHaveLength(10);
    expect(measurement.summary.declaredStageKeyCount).toBe(
      ALL_DECLARED_STAGE_KEYS.length,
    );
    expect(ALL_DECLARED_STAGE_KEYS.length).toBeGreaterThan(10);
  });
});

describe("U-533 · what is carried, and what only agrees", () => {
  it("records the five carried fields, and the four the flips moved off the list", () => {
    // `purpose` is carried on ALL TEN, including the flipped stages -- U-534 and
    // U-535 both scoped to the two intake beats. The other four are carried on
    // the eight and derived on the two, so they appear in BOTH lists, and that is
    // the honest reading of a per-stage measurement rolled up across stages.
    expect(measurement.summary.scaffoldCarriedFields).toEqual([
      "gate.approver",
      "gate.confirms",
      "gate.generates",
      "purpose",
      "tasks",
    ]);
    expect(measurement.summary.factDerivedFields).toEqual([
      "gate.confirms",
      "intel",
      "tasks",
      "waterfall",
    ]);
    // MEASURED, and it corrected what this case first asserted. The flipped
    // stage's approver role and its generates-on-approval list come from the
    // resolved archetype, and provably do NOT move when the facts move — so
    // listing them as fact-derived was an over-claim of exactly the kind this
    // item exists against.
    expect(measurement.summary.archetypeDerivedFields).toEqual([
      "gate.approver",
      "gate.generates",
    ]);
    /**
     * Item U-535. `gate.generates` appears in `archetypeDerivedFields` above AND
     * here, for the same reason `tasks` appears in two lists: this is a per-stage
     * measurement rolled up across stages, and the two flipped stages derive that
     * field to different KINDS of answer. `bafo` derives a declared deliverable,
     * which moves with the archetype. `evaluation` derives an absence, because no
     * rule-bearing archetype declares one there. Recording the absence as its own
     * verdict is what keeps the hand-written-fixture guard below meaningful.
     */
    expect(measurement.summary.emptyDerivedFields).toEqual(["gate.generates"]);
    expect(measurement.summary.stagesWithScaffoldTasks).toBe(8);
    expect(measurement.summary.stagesWithScaffoldGate).toBe(8);
    expect(measurement.summary.stagesWithDerivedTasks).toBe(2);
    expect(measurement.summary.stagesWithDerivedGate).toBe(2);
  });

  it("finds NO field that differs from the exemplar and follows nothing", () => {
    // The hand-written-fixture guard. U-534's acceptance names the failure mode:
    // "a hand-written alternative to a fixture is still a fixture". A field that
    // disagrees with the exemplar while moving with neither the facts nor the
    // archetype is exactly that, and it would land here.
    expect(measurement.summary.derivedFromNeitherFields).toEqual([]);
  });

  it("keeps that guard live after U-535 split an EMPTY derivation out of it", () => {
    /**
     * The split is only safe if the new verdict cannot absorb the old one, and
     * asserting the guard's list is empty does not show that -- it is empty both
     * when the guard works and when it has been defeated. So this drives the
     * predicate the split turns on, over a value of each shape.
     *
     * A hand-written replacement is CONTENT someone typed and is therefore
     * non-empty by construction; an absence-of-declaration derives to `[]`. The
     * cases below pin both directions, including the two JavaScript-truthiness
     * traps that would have made this excuse a real derivation: `0` and `false`
     * are content, not absence.
     */
    for (const empty of [[], "", "   ", null, undefined]) {
      expect(isEmptyDerivation(empty)).toBe(true);
    }
    for (const content of [
      [{ label: "Should-cost evaluation summary" }],
      "Should-cost evaluation summary",
      0,
      false,
      {},
    ]) {
      expect(isEmptyDerivation(content)).toBe(false);
    }

    // And end to end through the verdict, which is what the summary reads: a
    // non-empty value following neither reading is still `derived_from_neither`.
    const followsNothing = { withFacts: false, withArchetype: false };
    expect(
      verdictFor(
        [{ label: "A deliverable nobody declared" }],
        [{ label: "Should-cost evaluation summary" }],
        "does_not_move",
        followsNothing,
      ),
    ).toBe("derived_from_neither");
    expect(
      verdictFor(
        [],
        [{ label: "Should-cost evaluation summary" }],
        "does_not_move",
        followsNothing,
      ),
    ).toBe("derived_empty");
  });

  it.each(DERIVED_STAGE_KEYS)(
    "records %s's gate as a MIX of provenances, not as one",
    (stageKey) => {
      const flipped = measurement.stages.find(
        (stage: { stageKey: string }) => stage.stageKey === stageKey,
      )!;
      // Population: there is a flipped stage to read.
      expect(flipped).toBeDefined();
      expect(flipped.fields["gate.confirms"]).toBe("fact_derived");
      expect(flipped.fields["gate.approver"]).toBe("archetype_derived");

      /**
       * Item U-535 made this a RULE rather than a constant. `gate.generates` is
       * the archetype's deliverables at this stage, so its verdict follows
       * whether the archetype declares one -- `archetype_derived` where it does,
       * `derived_empty` where it does not. The expectation is READ from the
       * registry for that reason: typing `archetype_derived` was correct while
       * `bafo` was the only flipped stage and became wrong the moment a stage
       * with no declared deliverable was flipped, which is the class of case that
       * lets a suite keep passing about a stage it no longer describes.
       */
      const declaresDeliverable = RULE_BEARING_ARCHETYPES.some((archetype) =>
        archetype.deliverablePack.some((d) => d.stage === stageKey),
      );
      expect(flipped.fields["gate.generates"]).toBe(
        declaresDeliverable ? "archetype_derived" : "derived_empty",
      );

      // And the two readings that separate them, recorded rather than inferred.
      expect(flipped.movesWithFacts["gate.confirms"]).toBe(true);
      expect(flipped.movesWithFacts["gate.approver"]).toBe(false);
      expect(flipped.movesWithArchetype["gate.approver"]).toBe(true);
    },
  );

  it("covers BOTH kinds of generates verdict across the flipped stages", () => {
    // Otherwise the rule above could be satisfied by two stages of the same kind
    // and the branch it added would never be exercised.
    const verdicts = DERIVED_STAGE_KEYS.map(
      (stageKey) =>
        measurement.stages.find((s: { stageKey: string }) => s.stageKey === stageKey)!
          .fields["gate.generates"],
    );
    expect(new Set(verdicts)).toEqual(
      new Set(["archetype_derived", "derived_empty"]),
    );
  });

  it.each(DERIVED_STAGE_KEYS)(
    "stops exposing a person-named approver on %s",
    (stageKey) => {
      // The exemplar it replaced carried one, so this is a real before/after and
      // not a property the stage always had. Both flipped stages happen to
      // qualify; the `toContain` is what proves it for each rather than assuming.
      expect(measurement.summary.stagesWithPersonNamedApprover).toContain(
        stageKey,
      );
      expect(
        measurement.summary.stagesExposingPersonNamedApprover,
      ).not.toContain(stageKey);
    },
  );

  it("still finds carried stages exposing one, so the measurement kept looking", () => {
    expect(
      measurement.summary.stagesExposingPersonNamedApprover.length,
    ).toBeGreaterThan(0);
  });

  it("records the carried gate fields as reaching the prompt, `tasks` as reaching both", () => {
    expect(measurement.carriedFieldReach.tasks).toEqual([
      "rendered_canvas",
      "model_prompt",
    ]);
    expect(measurement.carriedFieldReach["gate.approver"]).toEqual([
      "model_prompt",
    ]);
  });

  it("finds four exemplars whose approver reads as a person, not a role", () => {
    expect(measurement.summary.stagesWithPersonNamedApprover).toEqual([
      "responses",
      "evaluation",
      "bafo",
      "value",
    ]);
    expect(measurement.summary.distinctGateApprovers).toContain(
      liveStageScaffoldFor("bafo").gate.approver,
    );
  });
});

describe("U-533 · the exemplar name table agrees with the switch, arm for arm", () => {
  it.each(ARMED_STAGE_KEYS)(
    "%s resolves to the exemplar the name table claims",
    (stageKey) => {
      const named = EXEMPLARS_BY_NAME[liveStageScaffoldSourceFor(stageKey)];
      expect(named).toBeDefined();
      // Identity, not equality: the table must name the object the switch returns.
      expect(liveStageScaffoldFor(stageKey)).toBe(named);
    },
  );

  it("names an exemplar for every key the canonical label table declares", () => {
    for (const stageKey of ALL_DECLARED_STAGE_KEYS) {
      const named = EXEMPLARS_BY_NAME[liveStageScaffoldSourceFor(stageKey)];
      expect(named).toBeDefined();
      expect(liveStageScaffoldFor(stageKey)).toBe(named);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. The known positives — scaffold-only content reaching each consumer.
// ─────────────────────────────────────────────────────────────────────────────


describe("U-533 · known positive: exemplar content reaches the built view", () => {
  it("hands the event canvas the exemplar's own task array, by reference", () => {
    const view = buildFor("scope");
    expect(view.tasks.length).toBeGreaterThan(0);
    expect(view.tasks).toBe(SAMPLE_SCOPE_STAGE.tasks);
    expect(view.tasks.map((t) => t.title)).toContain(SCOPE_EXEMPLAR_TASK_TITLE);
  });

  it("carries an exemplar approver who is a fixture name, not an event record", () => {
    // Population first: if no exemplar carried a personal name there would be no
    // defect of this shape to prove, and this case must fail rather than pass.
    expect(NAMED_APPROVER_STAGES.length).toBeGreaterThan(0);

    const view = buildFor(NAMED_APPROVER_STAGE);
    const exemplarApprover =
      liveStageScaffoldFor(NAMED_APPROVER_STAGE).gate.approver;
    expect(view.gate.approver).toBe(exemplarApprover);
    // The point of the known positive: this is a person's NAME, reaching a
    // consumer that introduces it as this stage's approver.
    expect(exemplarApprover).toMatch(PERSON_NAME_APPROVER);
  });
});

describe("U-533 · known positive: exemplar content reaches the model's prompt", () => {
  function groundingFor(mode: "evidence_readiness" | "stage_gate", stageKey: string) {
    const view = buildFor(stageKey);
    return buildModeGrounding({
      mode,
      event: {
        code: "EVT-1",
        name: "Managed services renewal",
        currentStageKey: stageKey,
        blocker: null,
        nextAction: null,
      },
      viewStageKey: stageKey,
      stageView: view,
      factInputs: LIVE_INPUTS,
      artifacts: [],
      question: "what evidence is still open on this stage?",
    });
  }

  it("puts an exemplar task title into the evidence-readiness block", () => {
    const { block } = groundingFor("evidence_readiness", "scope");
    expect(block).toContain(SCOPE_EXEMPLAR_TASK_TITLE);
  });

  it("puts the exemplar approver's name into the stage-gate block", () => {
    const { block } = groundingFor("stage_gate", NAMED_APPROVER_STAGE);
    expect(block).toContain(
      `Approver: ${liveStageScaffoldFor(NAMED_APPROVER_STAGE).gate.approver}.`,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. The boundary declaration and the disclosure it drives.
// ─────────────────────────────────────────────────────────────────────────────

describe("U-533 · the boundary declares which beats are carried", () => {
  it("still has eight carried stages and two derived ones", () => {
    // Population before property, and the acceptance clause U-534 carried and
    // U-535 keeps: the label must not disappear from the rest because another
    // stage stopped needing it. A case over an empty CARRIED set would assert
    // that vacuously, and the two numbers are written out rather than summed so
    // a stage silently dropped from the armed set cannot keep this green.
    expect(CARRIED_STAGE_KEYS).toHaveLength(8);
    expect(DERIVED_STAGE_KEYS).toHaveLength(2);
  });

  it.each(CARRIED_STAGE_KEYS)("%s declares both intake beats as scaffold", (stageKey) => {
    const view = buildFor(stageKey);
    expect(view.beatProvenance).toEqual({
      tasks: "scaffold",
      gate: "scaffold",
      scaffoldSource: liveStageScaffoldSourceFor(stageKey),
    });
  });

  it.each(DERIVED_STAGE_KEYS)(
    "%s declares both intake beats fact-derived and names no exemplar",
    (stageKey) => {
      // The case U-534 flipped. It was `it.each(ARMED_STAGE_KEYS)` asserting
      // scaffold on all ten; the assertion is not relaxed, it is split.
      expect(buildFor(stageKey).beatProvenance).toEqual({
        tasks: "fact_derived",
        gate: "fact_derived",
        scaffoldSource: null,
      });
    },
  );

  it("names the exemplar the view was actually built from", () => {
    // Searched rather than named: this case said `bafo` and went red when `bafo`
    // was the stage that stopped carrying. Taking the first stage that STILL
    // carries means flipping the next one moves this case instead of breaking it.
    const stageKey = CARRIED_STAGE_KEYS[0]!;
    const view = buildFor(stageKey);
    const exemplarName = liveStageScaffoldSourceFor(stageKey);
    expect(view.beatProvenance?.scaffoldSource).toBe(exemplarName);
    // And that name really is the object the switch returns, by identity.
    expect(liveStageScaffoldFor(stageKey)).toBe(EXEMPLARS_BY_NAME[exemplarName]);
  });

  it("leaves the beats that already declared their own provenance alone", () => {
    const view = buildFor("scope");
    expect(view.intel.provenance).toBe("live");
    expect(view.waterfall?.provenance).toBe("live");
  });
});

/**
 * The disclosure marker, anchored to the START of its own line.
 *
 * `toContain("SCAFFOLD CONTENT")` is NOT enough and this is not theoretical:
 * mutating the marker to `SCAFFOLD CONTENTS` left all 42 cases green, because the
 * shorter string is a prefix of the longer one. A substring assertion on a marker
 * cannot tell a marker from a word that merely begins with it.
 */
const DISCLOSURE_MARKER = /^SCAFFOLD CONTENT -- /m;

describe("U-533 · the grounding blocks disclose carried content to the model", () => {
  function block(mode: "evidence_readiness" | "stage_gate", view: StageAnalyticsView) {
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

  it("marks the task list as scaffold content and names the exemplar", () => {
    const text = block("evidence_readiness", buildFor("scope"));
    expect(text).toMatch(DISCLOSURE_MARKER);
    expect(text).toContain("SAMPLE_SCOPE_STAGE");
    expect(text).toContain("not derived from this event's facts");
  });

  it("tells the model not to name the exemplar approver as a person", () => {
    const approver = liveStageScaffoldFor(NAMED_APPROVER_STAGE).gate.approver;
    const text = block("stage_gate", buildFor(NAMED_APPROVER_STAGE));
    expect(text).toMatch(DISCLOSURE_MARKER);
    expect(text).toContain(liveStageScaffoldSourceFor(NAMED_APPROVER_STAGE));
    expect(text).toContain("do NOT name them");
    // The disclosure must precede the line that prints the name, or a model
    // reading top-to-bottom meets the fixture before the caveat.
    const markerAt = text.search(DISCLOSURE_MARKER);
    expect(markerAt).toBeGreaterThanOrEqual(0);
    expect(markerAt).toBeLessThan(text.indexOf(`Approver: ${approver}`));
  });

  it("keeps the real verdicts in the block — the disclosure is additive", () => {
    const text = block("evidence_readiness", buildFor("scope"));
    expect(text).toContain("Missing (no persisted fact/artifact yet)");
    expect(text).toContain(SCOPE_EXEMPLAR_TASK_TITLE);
  });

  it("FAILS CLOSED on a view that declares nothing", () => {
    const undeclared: StageAnalyticsView = {
      ...buildFor("scope"),
      beatProvenance: undefined,
    };
    expect(block("evidence_readiness", undeclared)).toMatch(DISCLOSURE_MARKER);
    expect(block("stage_gate", undeclared)).toMatch(DISCLOSURE_MARKER);
  });

  it("STOPS disclosing once a beat is genuinely fact-derived", () => {
    // This is the case the deferred slice flips. Asserted now so the disclosure
    // is proved to be driven by the declaration rather than printed always --
    // a disclosure that cannot be switched off is indistinguishable from a
    // string literal, which is the defect this whole item is about.
    const base = buildFor("scope");
    const derivedTasks: StageAnalyticsView = {
      ...base,
      beatProvenance: { tasks: "fact_derived", gate: "scaffold", scaffoldSource: null },
    };
    expect(block("evidence_readiness", derivedTasks)).not.toMatch(DISCLOSURE_MARKER);
    // The gate half is independent: still scaffold, still disclosed.
    expect(block("stage_gate", derivedTasks)).toMatch(DISCLOSURE_MARKER);

    const derivedGate: StageAnalyticsView = {
      ...base,
      beatProvenance: { tasks: "scaffold", gate: "fact_derived", scaffoldSource: null },
    };
    expect(block("stage_gate", derivedGate)).not.toMatch(DISCLOSURE_MARKER);
    expect(block("evidence_readiness", derivedGate)).toMatch(DISCLOSURE_MARKER);
  });
});
