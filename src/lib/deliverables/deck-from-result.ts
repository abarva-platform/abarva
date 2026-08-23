// Live bridge: a generated RenderableDeliverable → an exhibit-led deck.
//
// The orchestrator already produces a governed, cited RenderableDeliverable (recommendation +
// sections + source register). This maps THAT into a MoveDecisionModel, runs it through the Story
// Director + Visual Director, and renders the executive deck — so the flag-gated live path can emit
// a deck from the SAME governed generation, without a parallel generator.
//
// Honest scope today: the rich structured exhibits (architecture diagrams, the estimate-twice
// economics) need the architecture adapters (PR4 gaps) and the Workforce Economics engine, which
// aren't wired yet — so this bridge yields an answer-first deck (recommendation cover, conclusion
// headlines, evidence footers, a decision scorecard, claim/issue trees) with honest gap-cards where
// a rich exhibit isn't available. It is a structural live proof; richness arrives as those land.

import type { RenderableDeliverable } from "@/lib/deliverables/orchestrator/types";
import type {
  MoveDecisionModel,
  DecisionClaim,
} from "@/lib/deliverables/decision-model/types";
import { assembleMoveDecisionModel } from "@/lib/deliverables/decision-model/build-decision-model";
import { archetypeForOrchestratorType } from "@/lib/deliverables/story/archetype-blueprints";
import { buildStory } from "@/lib/deliverables/story/story-director";
import { renderStoryExhibits } from "@/lib/deliverables/visual-director";
import { renderExecutiveDeck } from "@/lib/deliverables/deck-renderer";
import { humanizeSourceFamily } from "@/lib/deliverables/orchestrator/source-register";

const SUMMARY_TITLE_RE = /^(executive summary|recommendation|decision)/i;

export function decisionModelFromRenderable(args: {
  doc: RenderableDeliverable;
  moveId: string;
  decisionContext?: string;
  nowIso: string;
}): MoveDecisionModel {
  const { doc } = args;

  const governedEvidence = doc.sourceRegister.map((r) => ({
    citationNumber: r.citationNumber,
    label: r.label,
    statement: r.label,
    evidenceFamily: humanizeSourceFamily(r.evidenceFamily),
    confidence: r.confidence,
    ...(r.asOf ? { asOf: r.asOf } : {}),
    disclosureTier: "internal_only" as const,
    provenanceRef: `cite-${r.citationNumber}`,
  }));

  // Each non-summary section becomes a claim, carrying the citations it actually used.
  const claims: DecisionClaim[] = doc.generatedSections
    .filter((s) => !SUMMARY_TITLE_RE.test(s.title))
    .map((s, i) => ({
      id: `s${i}`,
      statement: s.title,
      supportingEvidence: s.citationsUsed,
      contradictingEvidence: [],
      confidence: "medium" as const,
    }));

  return assembleMoveDecisionModel({
    moveId: args.moveId,
    clientDisplayName: doc.clientDisplayName,
    initiativeDisplayName: doc.initiativeDisplayName,
    governedEvidence,
    nowIso: args.nowIso,
    draft: {
      governingDecision: args.decisionContext?.trim() || doc.title,
      answerFirstRecommendation: doc.recommendation,
      claims,
      contradictoryEvidence: [],
      risks: [],
      dependencies: [],
      openQuestions: [],
      // A weak value thesis from prose (no structured estimate-twice yet → value exhibits gap-card).
      valueThesis: doc.recommendation,
      requiredDecisions: [
        {
          id: "d1",
          decision: doc.title,
          options: [
            {
              id: "proceed",
              label: "Proceed as recommended",
              pros: [],
              cons: [],
            },
          ],
          recommendedOptionId: "proceed",
          rationale: doc.recommendation,
        },
      ],
    },
  });
}

/**
 * Build the executive-deck HTML for a generated deliverable, or null when the deliverable type has
 * no narrative archetype (caller falls back to the prose render). Pure + deterministic given nowIso.
 */
export function buildDeckHtmlFromDocument(args: {
  doc: RenderableDeliverable;
  deliverableType: string;
  moveId: string;
  decisionContext?: string;
  nowIso: string;
  tenantLabel?: string;
  tenantKey?: string;
}): string | null {
  const archetype = archetypeForOrchestratorType(args.deliverableType);
  if (!archetype) return null;

  const model = decisionModelFromRenderable({
    doc: args.doc,
    moveId: args.moveId,
    ...(args.decisionContext ? { decisionContext: args.decisionContext } : {}),
    nowIso: args.nowIso,
  });
  const story = buildStory(model, archetype);
  const exhibits = renderStoryExhibits(story, model);
  return renderExecutiveDeck(story, model, exhibits, {
    generatedOnIso: args.nowIso,
    ...(args.tenantLabel ? { tenantLabel: args.tenantLabel } : {}),
    ...(args.tenantKey ? { tenantKey: args.tenantKey } : {}),
  });
}
