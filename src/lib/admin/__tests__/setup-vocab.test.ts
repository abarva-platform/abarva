/**
 * setup-vocab translation tests.
 *
 * Locks in the substrate-vocab ↔ catalog-vocab mapping centralized
 * for the Setup Redesign Package.
 */

import {
  CANONICAL_SEGMENT_UNLOCKS_PREVIEW,
  agentLevelFromReadiness,
  blockedCapabilityTrackCount,
  bucketHealthFromStates,
  buildPlainLanguageBuckets,
  depthFromHealth,
  impactFromScore,
  industryPhraseForClient,
  readinessPercent,
  trustRungFromHealth,
  unlocksPreview,
  type HealthState,
} from "../setup-vocab";

import type { InventorySegmentRollup } from "../setup-acts-registry";

function seg(
  familyNumber: number,
  state: HealthState,
  recordCount = 10,
): InventorySegmentRollup {
  return {
    segmentId: `seg_${familyNumber}`,
    segmentName: `Segment ${familyNumber}`,
    familyNumber,
    recordCount,
    coverageScore: 0,
    staleCount: 0,
    missingCount: 0,
    healthState: state,
    lastReviewedAt: null,
    lastIngestedAt: null,
  };
}

describe("depthFromHealth", () => {
  it.each([
    ["complete", "deep"],
    ["partial", "partial"],
    ["sparse", "thin"],
    ["attention", "thin"],
    ["critical", "empty"],
    ["not_started", "empty"],
  ] as const)("%s → %s", (state, expected) => {
    expect(depthFromHealth(state)).toBe(expected);
  });
});

describe("trustRungFromHealth", () => {
  it("complete → Decision-grade", () => {
    expect(trustRungFromHealth("complete", 50)).toBe("Decision-grade");
  });
  it("partial → Usable evidence", () => {
    expect(trustRungFromHealth("partial", 50)).toBe("Usable evidence");
  });
  it("sparse with records → Available", () => {
    expect(trustRungFromHealth("sparse", 5)).toBe("Available");
  });
  it("sparse with no records → Loaded", () => {
    expect(trustRungFromHealth("sparse", 0)).toBe("Loaded");
  });
  it("critical → Empty", () => {
    expect(trustRungFromHealth("critical", 0)).toBe("Empty");
  });
});

describe("readinessPercent", () => {
  it("returns 0 for empty segment list", () => {
    expect(readinessPercent([])).toBe(0);
  });
  it("all complete on 14 segments → 100%", () => {
    const fourteen = Array.from({ length: 14 }, (_, i) =>
      seg(i + 1, "complete"),
    );
    expect(readinessPercent(fourteen)).toBe(100);
  });
  it("half partial → ~25%", () => {
    const fourteen = Array.from({ length: 14 }, () => seg(1, "partial"));
    expect(readinessPercent(fourteen)).toBe(50);
  });
});

describe("blockedCapabilityTrackCount", () => {
  it("all empty → 6 blocked", () => {
    expect(blockedCapabilityTrackCount([])).toBe(6);
  });
  it("some segments loaded → some tracks unblock", () => {
    const ss = [
      seg(1, "complete"),
      seg(2, "complete"),
      seg(3, "complete"),
      seg(9, "partial"),
      seg(12, "complete"),
    ];
    expect(blockedCapabilityTrackCount(ss)).toBeLessThan(6);
  });
});

describe("agentLevelFromReadiness", () => {
  it.each([
    [85, "decision-grade"],
    [60, "partial"],
    [20, "thin"],
    [0, "blank"],
  ] as const)("%i → %s", (pct, level) => {
    expect(agentLevelFromReadiness(pct)).toBe(level);
  });
});

describe("bucketHealthFromStates", () => {
  it("empty → red", () => {
    expect(bucketHealthFromStates([])).toBe("red");
  });
  it("all complete/partial → green", () => {
    expect(bucketHealthFromStates(["complete", "partial", "complete"])).toBe(
      "green",
    );
  });
  it("mixed sparse/complete → amber", () => {
    expect(bucketHealthFromStates(["complete", "sparse"])).toBe("amber");
  });
  it("all critical/not_started → red", () => {
    expect(bucketHealthFromStates(["critical", "not_started"])).toBe("red");
  });
});

describe("buildPlainLanguageBuckets", () => {
  it("produces 5 buckets per redesign-package wireframe", () => {
    const ss = [
      seg(1, "complete"),
      seg(3, "partial"),
      seg(12, "partial"),
      seg(5, "not_started"),
      seg(6, "sparse"),
    ];
    const buckets = buildPlainLanguageBuckets(ss);
    expect(buckets.map((b) => b.id)).toEqual([
      "who-you-are",
      "what-you-run-on",
      "what-rules-apply",
      "how-you-measure",
      "in-flight",
    ]);
  });
});

describe("industryPhraseForClient", () => {
  it.each([
    ["FINSERV", "a regulated financial-services bank"],
    ["RETAIL", "a national specialty retailer"],
    ["HEALTHCARE_IDN", "a healthcare integrated delivery network"],
    ["ENERGY", "an integrated energy holding company"],
    ["DIVERSIFIED", "a diversified private holding company"],
  ])("%s → %s", (code, phrase) => {
    expect(industryPhraseForClient({ industryCode: code })).toBe(phrase);
  });
  it("unknown code → null", () => {
    expect(industryPhraseForClient({ industryCode: "UNKNOWN" })).toBeNull();
  });
});

describe("impactFromScore", () => {
  it.each([
    [100, "high"],
    [80, "medium"],
    [60, "low"],
  ] as const)("%i → %s", (score, label) => {
    expect(impactFromScore(score)).toBe(label);
  });
});

describe("unlocksPreview (Wave 3 PR 2 schema)", () => {
  it("every canonical segment (1..14) has an unlock preview", () => {
    for (let f = 1; f <= 14; f += 1) {
      const preview = CANONICAL_SEGMENT_UNLOCKS_PREVIEW[f];
      expect(preview).toBeDefined();
      expect(preview.question).toBeTruthy();
      expect(preview.citationExample).toBeTruthy();
      expect(preview.citationExample).not.toMatch(/\bApex\b|Apex Retail/i);
    }
  });

  it("question reads as a question (operator-facing)", () => {
    for (let f = 1; f <= 14; f += 1) {
      const { question } = CANONICAL_SEGMENT_UNLOCKS_PREVIEW[f];
      // A question must end with a "?" so the italic block reads
      // naturally on the page.
      expect(question.endsWith("?")).toBe(true);
      expect(question.length).toBeGreaterThan(10);
    }
  });

  it("citation example is concrete (not boilerplate)", () => {
    for (let f = 1; f <= 14; f += 1) {
      const { citationExample } = CANONICAL_SEGMENT_UNLOCKS_PREVIEW[f];
      // Concrete citation must contain a colon — the "Doc §X: detail"
      // shape used in the data-trust spec.
      expect(citationExample).toContain(":");
      expect(citationExample.length).toBeGreaterThan(10);
    }
  });

  it("every preview names an agent so the UI label is grounded", () => {
    for (let f = 1; f <= 14; f += 1) {
      const { agent } = CANONICAL_SEGMENT_UNLOCKS_PREVIEW[f];
      expect(agent).toBeDefined();
      expect(["sentinel", "atlas", "nexus", "steward"]).toContain(agent);
    }
  });

  it("unlocksPreview() resolves a known family to its canonical entry", () => {
    const preview = unlocksPreview(5, "KPI dictionary");
    expect(preview.question).toMatch(/comp/i);
    expect(preview.citationExample).toMatch(/KPI/i);
  });

  it("unlocksPreview() falls back gracefully for unknown families", () => {
    const preview = unlocksPreview(99, "Custom segment");
    expect(preview.question).toContain("Custom segment");
    expect(preview.citationExample).toContain("Custom segment");
  });
});
