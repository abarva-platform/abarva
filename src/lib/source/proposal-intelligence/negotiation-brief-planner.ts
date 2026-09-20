import type {
  EvaluationBafoBlocker,
  EvaluationBafoPricingRow,
  EvaluationBafoReadinessView,
} from "./evaluation-bafo-readiness";
import type {
  VendorBafoInstructionPack,
  VendorBafoQuestion,
  VendorEvaluationDecisionView,
} from "./types";

export type Stage07NegotiationBriefState = "candidate" | "refused";

export type Stage07NegotiationEvidenceFamily =
  | "response"
  | "pricing"
  | "evaluator";

export type Stage07NegotiationAcceptedFactCategory =
  | "response_package"
  | "pricing_comparability"
  | "governed_blocker"
  | "bafo_condition"
  | "evaluator_evidence";

export interface Stage07NegotiationAcceptedFact {
  factId: string;
  vendorId: string | null;
  vendorName: string;
  category: Stage07NegotiationAcceptedFactCategory;
  posture: "accepted_fact";
  statement: string;
  citation: string | null;
}

export interface Stage07NegotiationProposedAsk {
  askId: string;
  vendorId: string | null;
  vendorName: string;
  posture: "proposed_ask";
  source: "governed_blocker" | "bafo_condition" | "bafo_question";
  ask: string;
  evidenceBasis: string[];
}

export interface Stage07NegotiationRefusal {
  evidenceFamily: Stage07NegotiationEvidenceFamily;
  vendorId: string | null;
  vendorName: string;
  reason: string;
  nextAction: string;
}

export interface Stage07NegotiationBriefCandidate {
  state: Stage07NegotiationBriefState;
  exportReadiness: "candidate_read_only" | "refused_missing_evidence";
  headline: string;
  acceptedFacts: Stage07NegotiationAcceptedFact[];
  proposedAsks: Stage07NegotiationProposedAsk[];
  refusals: Stage07NegotiationRefusal[];
  guardrails: string[];
}

export function buildStage07NegotiationBriefCandidate(args: {
  readinessView?: EvaluationBafoReadinessView | null;
  bafoInstructionPack?: VendorBafoInstructionPack | null;
  decisionView?: VendorEvaluationDecisionView | null;
}): Stage07NegotiationBriefCandidate {
  const view = args.readinessView;
  const guardrails = [
    "Read-only planner: does not dispatch vendor communications.",
    "Does not create BAFO rounds, lock scores, approve awards, or write tenant data.",
    "Does not invent benchmarks or extrapolate missing economics; it does not claim savings.",
    "Negotiation prompts remain proposed until reviewed and approved by the buying team.",
  ];

  if (!view || view.received.length === 0) {
    return {
      state: "refused",
      exportReadiness: "refused_missing_evidence",
      headline:
        "Negotiation brief candidate refused; governed response evidence is missing.",
      acceptedFacts: [],
      proposedAsks: [],
      refusals: [
        {
          evidenceFamily: "response",
          vendorId: null,
          vendorName: "All vendors",
          reason:
            "No governed response package rows are available for Stage 07 negotiation planning.",
          nextAction:
            "Load normalized vendor response packages before preparing a negotiation brief.",
        },
      ],
      guardrails,
    };
  }

  const refusals = buildRefusals({
    view,
    decisionView: args.decisionView,
  });
  const acceptedFacts = buildAcceptedFacts({
    view,
    bafoInstructionPack: args.bafoInstructionPack,
    decisionView: args.decisionView,
    includeEvaluatorEvidence: !refusals.some(
      (refusal) => refusal.evidenceFamily === "evaluator",
    ),
  });

  if (refusals.length > 0) {
    return {
      state: "refused",
      exportReadiness: "refused_missing_evidence",
      headline:
        "Negotiation brief candidate refused; required Stage 07 evidence is missing.",
      acceptedFacts,
      proposedAsks: [],
      refusals,
      guardrails,
    };
  }

  return {
    state: "candidate",
    exportReadiness: "candidate_read_only",
    headline:
      "Negotiation brief candidate is ready for read-only reviewer export.",
    acceptedFacts,
    proposedAsks: buildProposedAsks({
      view,
      bafoInstructionPack: args.bafoInstructionPack,
    }),
    refusals: [],
    guardrails,
  };
}

function buildRefusals(args: {
  view: EvaluationBafoReadinessView;
  decisionView?: VendorEvaluationDecisionView | null;
}): Stage07NegotiationRefusal[] {
  const refusals: Stage07NegotiationRefusal[] = [];

  for (const row of args.view.received) {
    if (row.exhibitCount > 0 && row.extractionCardCount > 0) continue;
    refusals.push({
      evidenceFamily: "response",
      vendorId: row.vendorId,
      vendorName: row.vendorName,
      reason:
        "Response package evidence is present only as a package row; exhibits and extraction cards are required before a negotiation brief can separate facts from asks.",
      nextAction: `Load cited response exhibits and extraction cards for ${row.vendorName}.`,
    });
  }

  for (const row of args.view.pricing) {
    if (row.comparability !== "blocked") continue;
    refusals.push({
      evidenceFamily: "pricing",
      vendorId: row.vendorId,
      vendorName: row.vendorName,
      reason: row.rationale,
      nextAction: `Load governed pricing comparability evidence for ${row.vendorName} before exporting a negotiation brief.`,
    });
  }

  if (!args.decisionView || args.decisionView.scorecardRows.length === 0) {
    refusals.push({
      evidenceFamily: "evaluator",
      vendorId: null,
      vendorName: "All vendors",
      reason:
        "No scorecard evidence rows are available; advisory scoring cannot be treated as accepted evaluator evidence.",
      nextAction:
        "Load scorecard evidence rows for named evaluator review before preparing a negotiation brief.",
    });
    return dedupeRefusals(refusals);
  }

  for (const row of args.view.received) {
    const evidence = evaluatorEvidenceForVendor(
      args.decisionView,
      row.vendorId,
    );
    if (evidence.length > 0) continue;
    refusals.push({
      evidenceFamily: "evaluator",
      vendorId: row.vendorId,
      vendorName: row.vendorName,
      reason:
        "No cited scorecard evidence is available for this vendor; the planner will not convert advisory scores into accepted facts.",
      nextAction: `Load cited scorecard evidence for ${row.vendorName} before preparing a negotiation brief.`,
    });
  }

  return dedupeRefusals(refusals);
}

function buildAcceptedFacts(args: {
  view: EvaluationBafoReadinessView;
  bafoInstructionPack?: VendorBafoInstructionPack | null;
  decisionView?: VendorEvaluationDecisionView | null;
  includeEvaluatorEvidence: boolean;
}): Stage07NegotiationAcceptedFact[] {
  const facts: Stage07NegotiationAcceptedFact[] = [];

  for (const row of args.view.received) {
    facts.push({
      factId: `${row.vendorId}:response-package`,
      vendorId: row.vendorId,
      vendorName: row.vendorName,
      category: "response_package",
      posture: "accepted_fact",
      statement:
        `${row.vendorName} has ${row.sectionsAnswered}/${row.sectionsTotal} response sections, ` +
        `${row.exhibitCount} exhibits, and ${row.extractionCardCount} extraction cards loaded; status ${row.packageStatus}.`,
      citation: row.readyReason,
    });
  }

  for (const row of args.view.pricing) {
    facts.push(pricingFact(row));
  }

  for (const blocker of args.view.blockers) {
    facts.push({
      factId: `blocker:${blocker.blockerId}`,
      vendorId: blocker.vendorId,
      vendorName: blocker.vendorName,
      category: "governed_blocker",
      posture: "accepted_fact",
      statement: `${blocker.label}: ${blocker.detail}`,
      citation: blocker.nextAction,
    });
  }

  for (const instruction of args.bafoInstructionPack?.vendorInstructions ??
    []) {
    for (const condition of instruction.mustResolveBeforeScoring) {
      facts.push({
        factId: `${instruction.vendorId}:bafo-condition:${stableSuffix(condition)}`,
        vendorId: instruction.vendorId,
        vendorName: instruction.vendorName,
        category: "bafo_condition",
        posture: "accepted_fact",
        statement: condition,
        citation: args.bafoInstructionPack?.roundLabel ?? null,
      });
    }
  }

  if (args.includeEvaluatorEvidence && args.decisionView) {
    for (const row of args.view.received) {
      for (const evidence of evaluatorEvidenceForVendor(
        args.decisionView,
        row.vendorId,
      )) {
        facts.push({
          factId: `${row.vendorId}:evaluator-evidence:${stableSuffix(evidence)}`,
          vendorId: row.vendorId,
          vendorName: row.vendorName,
          category: "evaluator_evidence",
          posture: "accepted_fact",
          statement: `Scorecard evidence available for named evaluator review: ${evidence}.`,
          citation: evidence,
        });
      }
    }
  }

  return dedupeFacts(facts);
}

function pricingFact(
  row: EvaluationBafoPricingRow,
): Stage07NegotiationAcceptedFact {
  return {
    factId: `${row.vendorId}:pricing-comparability`,
    vendorId: row.vendorId,
    vendorName: row.vendorName,
    category: "pricing_comparability",
    posture: "accepted_fact",
    statement:
      `Five-year TCO ${row.fiveYearTcoLabel}; year-one run cost ${row.yearOneRunCostLabel}; ` +
      `transition ${row.transitionCostLabel}; one-time ${row.oneTimeCostLabel}; posture ${row.comparability}. ${row.rationale}`,
    citation: row.pricingBasis,
  };
}

function buildProposedAsks(args: {
  view: EvaluationBafoReadinessView;
  bafoInstructionPack?: VendorBafoInstructionPack | null;
}): Stage07NegotiationProposedAsk[] {
  const asks: Stage07NegotiationProposedAsk[] = [];

  for (const blocker of args.view.blockers) {
    asks.push(blockerToAsk(blocker));
  }

  for (const instruction of args.bafoInstructionPack?.vendorInstructions ??
    []) {
    for (const condition of instruction.mustResolveBeforeScoring) {
      asks.push({
        askId: `${instruction.vendorId}:condition:${stableSuffix(condition)}`,
        vendorId: instruction.vendorId,
        vendorName: instruction.vendorName,
        posture: "proposed_ask",
        source: "bafo_condition",
        ask: condition,
        evidenceBasis: [
          args.bafoInstructionPack?.roundLabel ?? "BAFO instruction pack",
        ],
      });
    }
    for (const question of instruction.questions) {
      asks.push(questionToAsk(question));
    }
  }

  return dedupeAsks(asks);
}

function blockerToAsk(
  blocker: EvaluationBafoBlocker,
): Stage07NegotiationProposedAsk {
  return {
    askId: `blocker:${blocker.blockerId}`,
    vendorId: blocker.vendorId,
    vendorName: blocker.vendorName,
    posture: "proposed_ask",
    source: "governed_blocker",
    ask: blocker.nextAction,
    evidenceBasis: [blocker.detail],
  };
}

function questionToAsk(
  question: VendorBafoQuestion,
): Stage07NegotiationProposedAsk {
  return {
    askId: question.questionId,
    vendorId: question.vendorId,
    vendorName: question.vendorName,
    posture: "proposed_ask",
    source: "bafo_question",
    ask: question.question,
    evidenceBasis: [
      question.evidenceLabel,
      question.buyerRisk,
      question.scoringDisposition,
    ].filter(nonEmpty),
  };
}

function evaluatorEvidenceForVendor(
  decisionView: VendorEvaluationDecisionView,
  vendorId: string,
): string[] {
  return decisionView.scorecardRows
    .flatMap((row) =>
      row.scores
        .filter((score) => score.vendorId === vendorId)
        .map((score) => score.evidenceLabel),
    )
    .filter((label) => {
      const normalized = label.trim();
      return (
        normalized.length > 0 &&
        !/no parsed evidence|not provided|not cited/i.test(normalized)
      );
    })
    .filter(unique)
    .slice(0, 5);
}

function dedupeFacts(
  facts: Stage07NegotiationAcceptedFact[],
): Stage07NegotiationAcceptedFact[] {
  const seen = new Set<string>();
  return facts.filter((fact) => {
    const key = `${fact.factId}|${fact.statement}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeAsks(
  asks: Stage07NegotiationProposedAsk[],
): Stage07NegotiationProposedAsk[] {
  const seen = new Set<string>();
  return asks.filter((ask) => {
    const key = `${ask.vendorId}|${ask.ask}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeRefusals(
  refusals: Stage07NegotiationRefusal[],
): Stage07NegotiationRefusal[] {
  const seen = new Set<string>();
  return refusals.filter((refusal) => {
    const key = `${refusal.evidenceFamily}|${refusal.vendorId}|${refusal.reason}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function stableSuffix(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function nonEmpty(value: string | null | undefined): value is string {
  return Boolean(value?.trim());
}

function unique<T>(value: T, index: number, array: T[]): boolean {
  return array.indexOf(value) === index;
}
