import {
  detectRawIdLeak,
  detectForeignTenantLeak,
  countSourceBuckets,
  scoreDeterministic,
  normalizeJudgeScore,
  computeOverall,
  SCORE_DIMENSIONS,
  type ScoreSource,
} from "../scoring";

describe("detectRawIdLeak", () => {
  it("flags Meridian change-record codes", () => {
    expect(detectRawIdLeak("See change CHG-MH-00034 for details.")).toBe(true);
    expect(detectRawIdLeak("CHG-MH-1")).toBe(true);
  });

  it("flags bare UUIDs and uuid prefixes", () => {
    expect(detectRawIdLeak("tenant 6e419b6e-950d-4d34-a4fc-06c3e451a6c4")).toBe(
      true,
    );
    expect(detectRawIdLeak("node 6e419b6e-950d-")).toBe(true);
  });

  it("flags /tmp paths and internal table names", () => {
    expect(detectRawIdLeak("written to /tmp/smoke.ts")).toBe(true);
    expect(detectRawIdLeak("row in enterprise_context_facts")).toBe(true);
  });

  it("does not flag clean executive prose", () => {
    expect(
      detectRawIdLeak(
        "Meridian should prioritize ambient documentation with HITL review and a denial baseline.",
      ),
    ).toBe(false);
  });
});

describe("detectForeignTenantLeak", () => {
  it("flags other tenant names", () => {
    expect(detectForeignTenantLeak("similar to Apex Retail")).toBe(true);
    expect(detectForeignTenantLeak("as seen at Lakeshore")).toBe(true);
    expect(detectForeignTenantLeak("FirstCapital benchmarks")).toBe(true);
  });

  it("does not flag Meridian-only answers", () => {
    expect(detectForeignTenantLeak("Meridian Health serves 1.4M lives.")).toBe(
      false,
    );
  });
});

describe("countSourceBuckets", () => {
  it("classifies tenant vs pattern vs inference", () => {
    const sources: ScoreSource[] = [
      { type: "TENANT", name: "Exec roster" },
      { type: "GRAPH", name: "Vendor edge" },
      { type: "PATTERN", name: "Ambient AI pattern" },
      { type: "BENCHMARK", name: "HEDIS bench" },
      { type: "GENERAL", name: "domain knowledge" },
      { type: "SURFACE", name: "page facts" },
    ];
    expect(countSourceBuckets(sources)).toEqual({
      tenant: 2,
      pattern: 2,
      inference: 2,
    });
  });

  it("is case-insensitive on type", () => {
    expect(countSourceBuckets([{ type: "tenant", name: "x" }])).toEqual({
      tenant: 1,
      pattern: 0,
      inference: 0,
    });
  });
});

describe("scoreDeterministic", () => {
  it("citation_presence respects sourceCount", () => {
    expect(
      scoreDeterministic({ answer: "x", sources: [] }).citation_presence,
    ).toBe(0);
    expect(
      scoreDeterministic({
        answer: "x",
        sources: [{ type: "PATTERN", name: "p" }],
      }).citation_presence,
    ).toBe(5);
  });

  it("rewards tenant context and healthcare corpus usage", () => {
    const s = scoreDeterministic({
      answer: "clean answer",
      sources: [
        { type: "TENANT", name: "roster" },
        { type: "PATTERN", name: "p1" },
        { type: "PATTERN", name: "p2" },
      ],
    });
    expect(s.meridian_context_usage).toBe(5);
    expect(s.healthcare_corpus_usage).toBe(5);
  });

  it("gives partial credit for inference-only context and single pattern", () => {
    const s = scoreDeterministic({
      answer: "clean",
      sources: [
        { type: "GENERAL", name: "g" },
        { type: "PATTERN", name: "p1" },
      ],
    });
    expect(s.meridian_context_usage).toBe(2);
    expect(s.healthcare_corpus_usage).toBe(3);
  });

  it("zeroes leakage dimensions when ids/tenants leak", () => {
    const s = scoreDeterministic({
      answer: "CHG-MH-00034 was loaded; compare to Apex Retail.",
      sources: [{ type: "TENANT", name: "r" }],
    });
    expect(s.no_raw_id_leakage).toBe(0);
    expect(s.no_cross_tenant_leakage).toBe(0);
  });

  it("full marks on leakage dims for clean prose", () => {
    const s = scoreDeterministic({
      answer: "Meridian should fund ambient AI with HITL controls.",
      sources: [{ type: "TENANT", name: "r" }],
    });
    expect(s.no_raw_id_leakage).toBe(5);
    expect(s.no_cross_tenant_leakage).toBe(5);
  });

  it("citation_correctness reflects renderable cite ratio", () => {
    const s = scoreDeterministic({
      answer: "clean",
      sources: [
        { type: "PATTERN", name: "named" },
        { type: "PATTERN", name: "" },
      ],
    });
    // 1 of 2 renderable => round(0.5*5) = 3 (Math.round rounds .5 up)
    expect(s.citation_correctness).toBe(3);
    expect(
      scoreDeterministic({ answer: "x", sources: [] }).citation_correctness,
    ).toBe(0);
  });
});

describe("normalizeJudgeScore", () => {
  it("clamps and rounds into 0-5", () => {
    expect(normalizeJudgeScore(4.6)).toBe(5);
    expect(normalizeJudgeScore(-3)).toBe(0);
    expect(normalizeJudgeScore(9)).toBe(5);
    expect(normalizeJudgeScore("3")).toBe(3);
    expect(normalizeJudgeScore("garbage")).toBe(0);
    expect(normalizeJudgeScore(undefined)).toBe(0);
  });
});

describe("computeOverall", () => {
  it("averages across all 12 dimensions, missing treated as 0", () => {
    const all5 = Object.fromEntries(SCORE_DIMENSIONS.map((d) => [d, 5]));
    expect(computeOverall(all5)).toBe(5);
    expect(computeOverall({})).toBe(0);
    expect(computeOverall({ specificity: 5 })).toBe(
      Math.round((5 / 12) * 100) / 100,
    );
  });
});
