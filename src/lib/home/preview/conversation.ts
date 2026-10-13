import { z } from "zod";

import type { AvaAnswerPacket } from "@/lib/ava-answer/contract";
import { homeRecordSourceLabel } from "./record-source";
import type { HomeRecordRenderSource } from "./types";

export const homeConversationSchema = z
  .array(
    z
      .object({
        question: z.string().trim().min(1).max(1200),
        citedClaimTags: z.array(z.string().max(80)).max(12),
      })
      .strict(),
  )
  .max(4);

export type HomeConversationTurn = z.infer<
  typeof homeConversationSchema
>[number];

/** Only question intent and claim references travel back; prior assistant text is not evidence. */
export function homeFollowUpQuestions(answer: AvaAnswerPacket): string[] {
  const normalize = (question: string) =>
    question
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  const asked = normalize(answer.question);
  const candidates = [
    ...followUpCandidates(answer),
    "What should leadership prioritize first, and why?",
    "Which business outcomes are most affected?",
    "What evidence should we verify before acting?",
    "Which assumptions need validation before deciding?",
  ];
  const seen = new Set([asked]);
  return candidates
    .filter((question) => {
      const key = normalize(question);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 3);
}

function followUpCandidates(answer: AvaAnswerPacket): string[] {
  if (answer.status === "no_data") {
    return [
      "What can the available record tell us?",
      "Which missing evidence would answer my question?",
      "What should leadership verify before acting?",
    ];
  }
  const focus = `${answer.question} ${answer.directAnswer}`;
  if (/\b(data|analytics|reporting|databricks|data trust)\b/i.test(focus)) {
    return [
      "Which data and analytics gaps matter most to business outcomes?",
      "What should the CFO prioritize in data and analytics, and why?",
      "What evidence would show that data trust and analytics value are improving?",
    ];
  }
  if (/\b(vendor|contract|supplier|commercial)\b/i.test(focus)) {
    return [
      "Which commercial exposures deserve leadership attention first?",
      "How do these vendor dependencies affect critical business capabilities?",
      "What contract evidence should we verify before making a decision?",
    ];
  }
  if (/\b(program|transformation|strategy|initiative)\b/i.test(focus)) {
    return [
      "Which strategic priorities are most exposed to delivery gaps?",
      "What should leadership address first to improve execution?",
      "What evidence supports the expected business value?",
    ];
  }
  if (/\b(risk|control|security|compliance)\b/i.test(focus)) {
    return [
      "Which of these risks matters most to business continuity?",
      "What does the record say about risk ownership and controls?",
      "What should leadership verify before deciding on the response?",
    ];
  }
  if (
    /\b(business|revenue|operating|organization|organisation)\b/i.test(focus)
  ) {
    return [
      "How does this business model shape our priorities?",
      "Which operating dependencies deserve leadership attention?",
      "What do we know about ownership, and what is still missing?",
    ];
  }
  return [
    "What should leadership prioritize first, and why?",
    "Which business outcomes are most affected?",
    "What evidence should we verify before acting?",
  ];
}

export function formatHomeAdvisorAnswer(
  answer: AvaAnswerPacket,
  source: HomeRecordRenderSource,
  declaredSyntheticDemo?: boolean,
): AvaAnswerPacket {
  const direct = answer.directAnswer.trim();
  let detail = answer.prose?.trim() ?? "";
  if (detail.startsWith(direct)) detail = detail.slice(direct.length).trim();
  const paragraphs = detail.split(/\n\s*\n/).filter(Boolean);
  // Preserve already structured output and every supporting statement; do not invent or truncate.
  const structured =
    /(^|\n)(?:[-*] |#{1,3} |\*\*(?:Key points|Implication|Next step))/i.test(
      detail,
    )
      ? detail
      : paragraphs.map((paragraph) => `- ${paragraph}`).join("\n\n");
  const latest = source.contextVersion?.sourceDateCoverage?.latest;
  const basis = `Record basis: ${homeRecordSourceLabel(source)}. ${declaredSyntheticDemo === true ? "Synthetic reference, not client-attested. " : ""}${latest ? `Source files dated through ${latest}. ` : ""}Data currency is not independently attested.`;
  const referenceLimit = answer.caveats?.find(
    (caveat) => caveat.id === "home-original-reference-limit",
  )?.detail;
  return {
    ...answer,
    prose: [
      `**Bottom line**\n\n${direct}`,
      structured ? `**Key points**\n\n${structured}` : "",
      `*${basis}*`,
      referenceLimit && !detail.includes(referenceLimit)
        ? `*${referenceLimit}*`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
}
