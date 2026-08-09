import type { TowerAiView } from "@/lib/tower/command-center/types";
import { buildBubblePoints } from "../AiBubbleMatrixChart";

function ai(overrides: Partial<TowerAiView>): TowerAiView {
  return {
    n: 1,
    id: "ai-1",
    name: "AI Initiative",
    originalItemKind: "funded_program",
    kind: "funded",
    displayBucket: "funded",
    displayBucketBasis: "item_kind",
    mappingPolicyVersion: "test",
    category: null,
    vendor: null,
    system: null,
    valueScore: 82,
    readinessScore: 70,
    riskScore: 20,
    aiSpendUsd: 0,
    promisedUsd: 0,
    promisedBenefitLoaded: true,
    financeValidatedUsd: 0,
    posture: "Fund",
    usageHeadline: null,
    usageBars: [],
    note: null,
    sourceFile: null,
    ...overrides,
  };
}

describe("buildBubblePoints", () => {
  it("keeps governed scores but separates visually colliding points", () => {
    const points = buildBubblePoints(
      Array.from({ length: 6 }, (_, index) =>
        ai({
          n: index + 1,
          id: `ai-${index + 1}`,
          name: `AI Initiative ${index + 1}`,
          valueScore: 82,
          readinessScore: 70,
        }),
      ),
      "constant",
    );

    expect(points).toHaveLength(6);
    expect(
      points.every((point) => point.rawX === 70 && point.rawY === 82),
    ).toBe(true);
    expect(new Set(points.map((point) => `${point.x}:${point.y}`)).size).toBe(
      points.length,
    );
  });

  it("does not move isolated points", () => {
    expect(
      buildBubblePoints(
        [
          ai({ n: 1, valueScore: 20, readinessScore: 30 }),
          ai({ n: 2, id: "ai-2", valueScore: 90, readinessScore: 85 }),
        ],
        "constant",
      ).map((point) => [point.x, point.y, point.rawX, point.rawY]),
    ).toEqual([
      [30, 20, 30, 20],
      [85, 90, 85, 90],
    ]);
  });
});
