import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type {
  HomeKnowFact,
  HomeKnowGap,
  HomeKnowIntent,
} from "@/lib/home/know/home-know-contract";

const HOME_KNOW_SYNTHESIS_MODEL = "claude-opus-4-8";

const SYSTEM_PROMPT = `You are AbarVa's enterprise librarian. Answer the question ONLY from the FACTS and
GAPS below. Write 2-5 sentences of executive prose: lead with the business conclusion,
then the key implication, then name the specific missing evidence from GAPS.
Rules: never lead with a count or "I found N ..."; never put internal IDs, table/view
names, or system language in the prose; state gaps as the specific missing field,
never "no data"; do not recommend, summon experts, or frame a decision. Return ONLY
the prose - no preamble, no JSON, no headings.`;

const ROW_COUNT_LEAD =
  /^\s*((i|home|we)\s+found|there\s+(are|were)|we\s+have|loaded)\b|^\s*\d[\d,]*\s+(rows|records|teams|apps|applications|vendors|data\s+products|systems)\b/i;
const RAW_ID =
  /\b(SHA-[A-Z]{2,}-\d+|APP-\d{4,}|DP-\d{4,}|CON-\d{4,}|NODE-\d+|EDGE-\d+)\b/;
const DEBUG_LANGUAGE =
  /\b(local env|read path|pattern family|enterprise_context_|mv_home_|Current-state read|Evidence points|Evidence and exhibits)\b|^\s*(Read|Evidence):/i;

export async function synthesizeHomeKnowProse(args: {
  tenantKey: string;
  question: string;
  intent: HomeKnowIntent;
  facts: HomeKnowFact[];
  gaps: HomeKnowGap[];
}): Promise<string | null> {
  try {
    const user = buildUserPrompt(args);
    const prompt = [SYSTEM_PROMPT, user].join("\n\n");
    const { client } = await getAuditedAnthropicClient({
      tenantId: args.tenantKey,
      workflow: "home-know-synthesis",
      model: HOME_KNOW_SYNTHESIS_MODEL,
      dataClass: "confidential",
      prompt,
      metadata: {
        intent: args.intent,
        factCount: args.facts.length,
        gapCount: args.gaps.length,
      },
    });

    const result = await client.messages.create({
      model: HOME_KNOW_SYNTHESIS_MODEL,
      max_tokens: 700,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: user }],
    });

    const text = result.content
      .filter((item) => item.type === "text")
      .map((item) => item.text)
      .join("\n")
      .trim();

    return validateSynthesizedProse(text) ? text : null;
  } catch {
    return null;
  }
}

function buildUserPrompt(args: {
  question: string;
  facts: HomeKnowFact[];
  gaps: HomeKnowGap[];
}): string {
  return [
    `QUESTION:\n${args.question}`,
    `FACTS:\n${serializeFacts(args.facts)}`,
    `GAPS:\n${serializeGaps(args.gaps)}`,
  ].join("\n\n");
}

function serializeFacts(facts: HomeKnowFact[]): string {
  if (facts.length === 0) return "- No source-backed facts were available.";
  return facts
    .slice(0, 30)
    .map((fact) => `- ${fact.label}: ${formatFactValue(fact.value)}`)
    .join("\n");
}

function serializeGaps(gaps: HomeKnowGap[]): string {
  if (gaps.length === 0) return "- No specific gaps were returned.";
  return gaps
    .slice(0, 20)
    .map(
      (gap) => `- ${gap.displayLabel} (${gap.expectedField}): ${gap.message}`,
    )
    .join("\n");
}

function formatFactValue(value: HomeKnowFact["value"]): string {
  if (value === null || value === undefined || value === "") {
    return "not loaded";
  }
  return String(value);
}

function validateSynthesizedProse(text: string): boolean {
  const prose = text.trim();
  if (!prose) return false;
  if (ROW_COUNT_LEAD.test(firstSentence(prose))) return false;
  if (RAW_ID.test(prose)) return false;
  if (DEBUG_LANGUAGE.test(prose)) return false;
  if (sentenceCount(prose) > 6) return false;
  return true;
}

function firstSentence(text: string): string {
  return text.split(/(?<=[.!?])\s/)[0] ?? text;
}

function sentenceCount(text: string): number {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
}
