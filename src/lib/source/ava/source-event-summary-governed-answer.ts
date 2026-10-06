import { composeAvaAnswer } from "@/lib/ava-answer/composeAvaAnswer";
import type {
  AvaAnswerPacket,
  AvaAnswerStatus,
} from "@/lib/ava-answer/contract";
import { looksLikeSelectionDecisionQuestion } from "@/lib/source/ava/selection-decision-governed-answer";
import { looksLikeValueLedgerQuestion } from "@/lib/source/ava/value-ledger-governed-answer";

export function looksLikeSourceEventDecisionAndValueQuestion(
  prompt: string | undefined,
): boolean {
  return (
    looksLikeSelectionDecisionQuestion(prompt) &&
    looksLikeValueLedgerQuestion(prompt)
  );
}

function uniqueById<T extends { id: string }>(items: readonly T[]): T[] {
  return [...new Map(items.map((item) => [item.id, item])).values()];
}

function combinedStatus(
  selection: AvaAnswerPacket,
  value: AvaAnswerPacket,
): AvaAnswerStatus {
  const statuses = [selection.status, value.status];
  if (statuses.includes("blocked")) return "blocked";
  if (statuses.every((status) => status === "answered")) return "answered";
  if (statuses.every((status) => status === "no_data")) return "no_data";
  return "partial";
}

export function combineSourceEventDecisionAndValueAnswers(input: {
  question: string;
  selection: AvaAnswerPacket;
  value: AvaAnswerPacket;
}): AvaAnswerPacket {
  const { question, selection, value } = input;
  const citations = uniqueById([...selection.citations, ...value.citations]);
  const artifacts = uniqueById([...selection.artifacts, ...value.artifacts]);

  return composeAvaAnswer({
    surface: "source",
    mode: "SOURCE",
    tenantKey: selection.tenantKey,
    question,
    intent: "source_event_decision_and_value_summary",
    status: combinedStatus(selection, value),
    tenantFencePassed:
      selection.safety.tenantFencePassed && value.safety.tenantFencePassed,
    directAnswer: `${selection.directAnswer}\n\nValue position: ${value.directAnswer}`,
    businessImplication: [
      selection.businessImplication,
      value.businessImplication,
    ]
      .filter(Boolean)
      .join(" "),
    recommendation: [selection.recommendation, value.recommendation]
      .filter(Boolean)
      .join(" "),
    factsUsed: uniqueById([...selection.factsUsed, ...value.factsUsed]),
    metricsUsed: uniqueById([...selection.metricsUsed, ...value.metricsUsed]),
    relationshipsUsed: uniqueById([
      ...selection.relationshipsUsed,
      ...value.relationshipsUsed,
    ]),
    artifacts,
    citations,
    gaps: uniqueById([...selection.gaps, ...value.gaps]),
    caveats: uniqueById([...selection.caveats, ...value.caveats]),
    nextSteps: uniqueById([...selection.nextSteps, ...value.nextSteps]),
    retrievalSummary: {
      substrate: "module_read_model",
      sourceCount: citations.length,
      factCount: selection.factsUsed.length + value.factsUsed.length,
      metricCount: selection.metricsUsed.length + value.metricsUsed.length,
      relationshipCount:
        selection.relationshipsUsed.length + value.relationshipsUsed.length,
      hasTenantFacts:
        citations.length > 0 ||
        selection.quality.tenantGrounding !== "missing" ||
        value.quality.tenantGrounding !== "missing",
      hasCorpus: false,
      hasExperts: false,
    },
  });
}
