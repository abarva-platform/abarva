// Story Director — turn a MoveDecisionModel + an archetype into a realized Story (spec §5).
//
// PR2 scope: a DETERMINISTIC director. It selects the archetype blueprint and binds the decision
// model's content into each page (evidence, the answer-first conclusion where the model supplies
// one, the decision relevance). The conclusion-headline authoring pass (spec §6) replaces the
// remaining intent slots in a later PR; PR2 marks which pages still need it.

import type { MoveDecisionModel } from "@/lib/deliverables/decision-model/types";
import type {
  ArchetypeBlueprint,
  ArchetypeKey,
  ExhibitType,
  ModelSource,
  Story,
  StoryPage,
  StoryValidationIssue,
} from "./types";
import { getArchetypeBlueprint } from "./archetype-blueprints";

const ANSWER_FIRST_ROLES = new Set([
  "decision_snapshot",
  "recommendation",
  "executive_finding",
  "value_thesis",
]);

function uniq(ns: number[]): number[] {
  return Array.from(new Set(ns)).sort((a, b) => a - b);
}

/** Evidence citation numbers that back a page, drawn from the model part the page is bound to. */
function evidenceFor(model: MoveDecisionModel, source: ModelSource): number[] {
  switch (source) {
    case "claims":
      return uniq(model.claims.flatMap((c) => c.supportingEvidence));
    case "risks":
      return uniq(model.risks.flatMap((r) => r.evidence));
    case "evidenceBundle":
      return uniq(model.evidenceBundle.map((e) => e.citationNumber));
    case "valueModel":
      return uniq((model.valueModel?.valuePools ?? []).flatMap((v) => v.evidence));
    case "architectureModel":
      return uniq([
        ...(model.architectureModel?.nodes ?? []).flatMap((n) => n.evidence ?? []),
        ...(model.architectureModel?.controls ?? []).flatMap((c) => c.evidence ?? []),
      ]);
    default:
      return [];
  }
}

/** A model-derived conclusion for the page, or null when the page keeps its intent slot. */
function conclusionFor(model: MoveDecisionModel, source: ModelSource): string | null {
  switch (source) {
    case "answerFirstRecommendation":
      return model.answerFirstRecommendation.trim() || null;
    case "valueModel":
      return model.valueModel?.valueThesis?.trim() || null;
    case "claims":
      return model.claims[0]?.statement?.trim() || null;
    case "requiredDecisions": {
      const d = model.requiredDecisions[0];
      return d ? `Decision: ${d.decision}` : null;
    }
    default:
      return null;
  }
}

/** True when the model has substantive content for the bound source (else the page is a content gap). */
function modelHasContent(model: MoveDecisionModel, source: ModelSource): boolean {
  switch (source) {
    case "governingDecision":
      return Boolean(model.governingDecision.trim());
    case "answerFirstRecommendation":
      return Boolean(model.answerFirstRecommendation.trim());
    case "claims":
      return model.claims.length > 0;
    case "risks":
      return model.risks.length > 0;
    case "dependencies":
      return model.dependencies.length > 0;
    case "openQuestions":
      return model.openQuestions.length > 0;
    case "architectureModel":
      return Boolean(model.architectureModel);
    case "operatingModel":
      return Boolean(model.operatingModel);
    case "valueModel":
      return Boolean(model.valueModel);
    case "requiredDecisions":
      return model.requiredDecisions.length > 0;
    case "evidenceBundle":
      return model.evidenceBundle.length > 0;
    case "missingEvidence":
      return model.missingEvidence.length > 0;
    default:
      return false;
  }
}

export function buildStory(model: MoveDecisionModel, archetypeKey: ArchetypeKey): Story {
  const blueprint = getArchetypeBlueprint(archetypeKey);
  if (!blueprint) {
    throw new Error(`Unknown archetype: ${archetypeKey}`);
  }

  const pages: StoryPage[] = blueprint.executivePages.map((bp, i) => {
    const conclusion = conclusionFor(model, bp.sourceFromModel);
    return {
      pageNo: i + 1,
      headline: conclusion ?? bp.headlineIntent,
      roleInStory: bp.roleInStory,
      exhibitType: bp.exhibitType,
      supportingEvidence: evidenceFor(model, bp.sourceFromModel),
      implication: "", // filled by the authoring pass (spec §11 "one implication")
      decisionRelevance: `Bears on: ${model.governingDecision}`,
      sourceFromModel: bp.sourceFromModel,
      headlineIsConclusion: conclusion !== null,
    };
  });

  const exhibitPlan: ExhibitType[] = [];
  for (const pg of pages) {
    if (!exhibitPlan.includes(pg.exhibitType)) exhibitPlan.push(pg.exhibitType);
  }

  return {
    moveId: model.moveId,
    archetypeKey,
    governingQuestion: model.governingDecision,
    answerFirstRecommendation: model.answerFirstRecommendation,
    pages,
    appendixSections: blueprint.appendixSections,
    exhibitPlan,
  };
}

export function validateStory(
  story: Story,
  blueprint: ArchetypeBlueprint,
  model?: MoveDecisionModel,
): StoryValidationIssue[] {
  const issues: StoryValidationIssue[] = [];

  // Every mandatory exhibit must appear (spec §9/§14 hard fail).
  for (const ex of blueprint.mandatoryExhibits) {
    if (!story.exhibitPlan.includes(ex)) {
      issues.push({
        code: "missing_mandatory_exhibit",
        severity: "error",
        detail: `archetype ${story.archetypeKey} requires a ${ex} exhibit, which no page carries.`,
      });
    }
  }

  // There must be an explicit decision page (spec §9/§14).
  if (!story.pages.some((p) => p.roleInStory === "decision")) {
    issues.push({
      code: "no_decision_page",
      severity: "error",
      detail: `archetype ${story.archetypeKey} has no decision page.`,
    });
  }

  // Answer-first within the first two pages (spec §6/§17). WARNING — surfaces the §9 Charter
  // tension without overriding the founder-confirmed sequence.
  const firstTwo = story.pages.slice(0, 2);
  if (!firstTwo.some((p) => ANSWER_FIRST_ROLES.has(p.roleInStory))) {
    issues.push({
      code: "no_answer_first_in_first_two_pages",
      severity: "warning",
      detail: `archetype ${story.archetypeKey} does not put an answer-first page in the first two pages.`,
    });
  }

  // Pages still on their intent slot need the authoring pass (WARNING, expected pre-authoring).
  for (const pg of story.pages) {
    if (!pg.headlineIsConclusion) {
      issues.push({
        code: "topic_headline",
        severity: "warning",
        detail: `page ${pg.pageNo} (${pg.roleInStory}) still has an intent headline; the authoring pass must turn it into a conclusion.`,
      });
    }
  }

  // Content-gap check when a model is supplied: a page bound to an empty model part (WARNING).
  if (model) {
    for (const pg of story.pages) {
      if (!modelHasContent(model, pg.sourceFromModel)) {
        issues.push({
          code: "page_without_model_binding",
          severity: "warning",
          detail: `page ${pg.pageNo} (${pg.roleInStory}) is bound to '${pg.sourceFromModel}', which the model has no content for.`,
        });
      }
    }
  }

  return issues;
}
