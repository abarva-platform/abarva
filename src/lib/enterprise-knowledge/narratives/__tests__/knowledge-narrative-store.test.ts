import {
  MERIDIAN_CLAUDE_HOME_INSIGHTS,
  MERIDIAN_CLAUDE_DIMENSION_NARRATIVES,
} from "@/data/enterprise-knowledge/narratives/generated/meridian-claude-approved";
import { MERIDIAN_CLAUDE_HOME_VISUAL_BLOCKS } from "@/data/enterprise-knowledge/narratives/generated/meridian-claude-visual-blocks-approved";
import {
  validateHomeInsightSummary,
  validateDimensionNarrative,
  validateHomeVisualBlocks,
  validateCxoNarrativeStructure,
  getStoredKnowledgeHomeInsightSummary,
  getStoredKnowledgeDimensionNarratives,
} from "../knowledge-narrative-store";

// Regression coverage for the class of bug where a Claude-generated
// narrative passes its own "validation_status: passed" field but fails the
// runtime structural validator (validateHomeInsightSummary /
// validateDimensionNarrative) — which silently falls back to the older,
// narrower MERIDIAN_SEEDED_* content with no visible error anywhere. See
// MERIDIAN_RUNTIME_HOME_BASE / MERIDIAN_KNOWLEDGE_DIMENSION_NARRATIVES.
describe("Meridian approved narrative content passes runtime validation", () => {
  it("MERIDIAN_CLAUDE_HOME_INSIGHTS passes validateHomeInsightSummary with zero failures", () => {
    const failures = validateHomeInsightSummary(MERIDIAN_CLAUDE_HOME_INSIGHTS);
    expect(failures).toEqual([]);
  });

  it("every MERIDIAN_CLAUDE_DIMENSION_NARRATIVES entry passes validateDimensionNarrative", () => {
    const failuresByDimension = MERIDIAN_CLAUDE_DIMENSION_NARRATIVES.map(
      (narrative) => ({
        dimension: narrative.dimension_key,
        failures: validateDimensionNarrative(narrative),
      }),
    ).filter((entry) => entry.failures.length > 0);
    expect(failuresByDimension).toEqual([]);
  });

  it("MERIDIAN_CLAUDE_HOME_VISUAL_BLOCKS passes validateHomeVisualBlocks", () => {
    const failures = validateHomeVisualBlocks(
      MERIDIAN_CLAUDE_HOME_VISUAL_BLOCKS,
    );
    expect(failures).toEqual([]);
  });

  it("runtime lookups actually resolve to the Claude-generated content, not the seeded fallback", () => {
    const homeInsights =
      getStoredKnowledgeHomeInsightSummary("meridian-health");
    expect(homeInsights?.executive_summary).toBe(
      MERIDIAN_CLAUDE_HOME_INSIGHTS.executive_summary,
    );

    const dimensionNarratives =
      getStoredKnowledgeDimensionNarratives("meridian-health");
    expect(dimensionNarratives).toHaveLength(
      MERIDIAN_CLAUDE_DIMENSION_NARRATIVES.length,
    );
    expect(dimensionNarratives[0]?.generated_by).toBe("claude");
  });
});

describe("validateCxoNarrativeStructure", () => {
  it("rejects prose that talks about the narrative instead of the business situation", () => {
    const failures = validateCxoNarrativeStructure(
      "test",
      "This narrative is built on synthetic context. The story it tells is deliberate: the enterprise context layer is the hero.",
    );
    expect(failures.length).toBeGreaterThan(0);
  });

  it("accepts prose that opens with the business situation directly", () => {
    const failures = validateCxoNarrativeStructure(
      "test",
      "Acme Health runs a fragmented current-state estate across clinical, claims, and reporting systems.",
    );
    expect(failures).toEqual([]);
  });

  it("rejects raw implementation terms like source record", () => {
    const failures = validateCxoNarrativeStructure(
      "test",
      "All 85 source records were skipped pending validation.",
    );
    expect(failures.some((f) => f.includes("source record"))).toBe(true);
  });
});
