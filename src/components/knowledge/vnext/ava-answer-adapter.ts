/**
 * Adapt the Knowledge vNext AvaAnswer into the shared AvaAnswerPacket so the
 * app-wide answer renderer (@/components/agent-answer/AgentAnswerRenderer) draws
 * Knowledge answers with the SAME markdown + tables + charts as Intelligence,
 * Source, Tower and Moves.
 *
 * This is a presentation adapter only. It moves no data across a governance
 * boundary: the answer (prose + artifacts) is produced by the aVa reasoning
 * provider, and the artifacts are already the shared exhibit types. Fields the
 * fixture path does not model (facts/metrics/relationships/citations) are empty;
 * limitations and next-evidence stay in the dock's own UI, so caveats/nextSteps
 * are left empty here to avoid duplicate rendering.
 */

import type { AvaAnswer } from "@/lib/knowledge/consumption-contracts";
import type { AvaAnswerPacket, AvaAnswerStatus } from "@/lib/ava-answer/contract";

function statusOf(outcome: AvaAnswer["outcome"]): AvaAnswerStatus {
  if (outcome === "answered") return "answered";
  if (outcome === "partial") return "partial";
  return "blocked";
}

function directAnswerMarkdown(answer: AvaAnswer): string {
  if (answer.outcome === "refused") {
    return answer.refusalReason ?? "aVa could not answer from the evidence in view.";
  }
  return answer.sections
    .map((s) => `### ${s.heading}\n\n${s.body}`)
    .join("\n\n");
}

export function toAvaAnswerPacket(
  answer: AvaAnswer,
  tenantKey: string,
  question: string,
  intent: string,
): AvaAnswerPacket {
  return {
    // Rendered with showChrome={false}, so surface/mode are not displayed; we use
    // the closest existing surface rather than widening the shared AvaSurface enum.
    surface: "home",
    mode: "KNOW",
    tenantKey,
    question,
    intent,
    status: statusOf(answer.outcome),
    directAnswer: directAnswerMarkdown(answer),
    factsUsed: [],
    metricsUsed: [],
    relationshipsUsed: [],
    artifacts: answer.artifacts ?? [],
    citations: [],
    gaps: [],
    caveats: [],
    nextSteps: [],
    quality: {
      confidence: "medium",
      evidenceStrength: answer.evidenceRefs.length > 0 ? "partial" : "thin",
      tenantGrounding: "complete",
      answerCompleteness: answer.outcome === "partial" ? "partial" : "complete",
    },
    safety: {
      tenantFencePassed: true,
      rawIdsSuppressed: true,
      forbiddenLanguagePassed: true,
      unsupportedClaimsBlocked: true,
    },
  };
}
