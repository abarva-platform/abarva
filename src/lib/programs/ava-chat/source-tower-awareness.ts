// Moves aVa chat hardening — Source/Tower awareness.
//
// Deterministic keyword scan of the user's question text. When vendor,
// contract, or commercial terms are mentioned, Moves aVa should point to
// Source for validation. When value/metric/adoption terms are mentioned, it
// should point to Tower for the measurement contract. Pure and testable —
// no DB access, no LLM call.

import type { MovesAvaTopicAwareness } from "./types";

const SOURCE_KEYWORDS: readonly string[] = [
  "vendor",
  "contract",
  "renewal",
  "rfp",
  "sourcing",
  "procurement",
  "bafo",
  "pricing",
  "commercial leverage",
  "supplier",
  "license",
  "licensing",
  "spend",
];

const TOWER_KEYWORDS: readonly string[] = [
  "business case",
  "value",
  "roi",
  "adoption",
  "realized benefit",
  "realised benefit",
  "kpi",
  "metric",
  "executive council",
  "funding gate",
  "roadmap",
];

function findMatches(text: string, keywords: readonly string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => lower.includes(keyword));
}

export function detectSourceAwareness(questionText: string): MovesAvaTopicAwareness {
  const matchedKeywords = findMatches(questionText, SOURCE_KEYWORDS);
  if (matchedKeywords.length === 0) {
    return { relevant: false, matchedKeywords: [], suggestion: null };
  }
  return {
    relevant: true,
    matchedKeywords,
    suggestion:
      "This should create a Source workstream to validate renewal leverage, pricing, vendor modules, and contract implications.",
  };
}

export function detectTowerAwareness(questionText: string): MovesAvaTopicAwareness {
  const matchedKeywords = findMatches(questionText, TOWER_KEYWORDS);
  if (matchedKeywords.length === 0) {
    return { relevant: false, matchedKeywords: [], suggestion: null };
  }
  return {
    relevant: true,
    matchedKeywords,
    suggestion:
      "This should produce a Tower metric contract with baseline, target, owner, cadence, and escalation threshold.",
  };
}
