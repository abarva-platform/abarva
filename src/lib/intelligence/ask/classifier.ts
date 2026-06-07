import type { IntentClassification, AskIntent } from "./types";
import {
  createIntelligenceAskAnthropicText,
  INTELLIGENCE_ASK_ANTHROPIC_SMALL_MODEL,
  isIntelligenceAskAnthropicConfigured,
} from "./anthropic-runtime";

const CATEGORIES: AskIntent[] = [
  "vendor_lookup",
  "vendor_comparison",
  "pattern_inquiry",
  "topic_synthesis",
  "research_query",
  "regulation_query",
  "benchmark_query",
  "insight_query",
  "general_synthesis",
];

const CLASSIFIER_PROMPT = (
  q: string,
) => `Classify this user query into ONE intent category. Return JSON only:
{ "intent": "<category>", "entities": ["<extracted entity names>"], "confidence": 0-100 }

Categories: vendor_lookup, vendor_comparison, pattern_inquiry, topic_synthesis,
research_query, regulation_query, benchmark_query, insight_query, general_synthesis

Heuristics:
- vendor_lookup: named vendor, "pricing", "deployment", "market position"
- vendor_comparison: two+ vendors, "vs", "compare", "difference"
- pattern_inquiry: pattern code (F###), "pattern", "trigger", "signal"
- topic_synthesis: topic name, "what do we know about", "overview"
- research_query: "research", "study", "paper", "journal", "what does the data say"
- regulation_query: regulation name (HIPAA, NIST AI RMF, EU AI Act, GDPR, SOC2), "compliance"
- benchmark_query: industry metric, "benchmark", "median", "top quartile"
- insight_query: "what has Nexus noticed", "patterns across engagements", "meta"
- general_synthesis: fallback

Query: ${q}`;

export async function classifyIntent(
  query: string,
  aiContext: { tenantId?: string | null; userId?: string | null } = {},
): Promise<IntentClassification> {
  if (!isIntelligenceAskAnthropicConfigured() || !aiContext.tenantId) {
    return {
      intent: "general_synthesis",
      entities: extractEntitiesHeuristic(query),
      confidence: 40,
    };
  }
  try {
    const prompt = CLASSIFIER_PROMPT(query);
    const text = await createIntelligenceAskAnthropicText({
      tenantId: aiContext.tenantId,
      userId: aiContext.userId ?? undefined,
      workflow: "intelligence-ask-intent-classifier",
      model: INTELLIGENCE_ASK_ANTHROPIC_SMALL_MODEL,
      input: prompt,
      dataClass: "confidential",
      maxOutputTokens: 256,
    });
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return fallback(query);
    const parsed = JSON.parse(match[0]) as {
      intent?: string;
      entities?: unknown;
      confidence?: number;
    };
    const intent: AskIntent = CATEGORIES.includes(parsed.intent as AskIntent)
      ? (parsed.intent as AskIntent)
      : "general_synthesis";
    const entities = Array.isArray(parsed.entities)
      ? (parsed.entities as unknown[]).filter(
          (e): e is string => typeof e === "string",
        )
      : [];
    const confidence =
      typeof parsed.confidence === "number" ? parsed.confidence : 50;
    const effective: AskIntent = confidence < 60 ? "general_synthesis" : intent;
    return { intent: effective, entities, confidence };
  } catch {
    return fallback(query);
  }
}

function fallback(query: string): IntentClassification {
  return {
    intent: "general_synthesis",
    entities: extractEntitiesHeuristic(query),
    confidence: 35,
  };
}

function extractEntitiesHeuristic(query: string): string[] {
  // Naive: capitalized words, pattern codes (F###), known regulations.
  const patterns = Array.from(query.matchAll(/\bF\d{3}\b/g)).map((m) => m[0]);
  const capitalized = Array.from(
    query.matchAll(/\b[A-Z][A-Za-z0-9.]{2,}(?:\s+[A-Z][A-Za-z0-9.]{2,})?/g),
  ).map((m) => m[0]);
  const known = ["HIPAA", "NIST AI RMF", "EU AI Act", "GDPR", "SOC2", "SOC 2"];
  const hits = known.filter((k) =>
    query.toLowerCase().includes(k.toLowerCase()),
  );
  return Array.from(new Set([...patterns, ...capitalized, ...hits]));
}
