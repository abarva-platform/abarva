// Behavior tests for the golden tenant question suites (PR-2).

import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { buildSentinelTrace, type RawAskSource } from "@/lib/agent-trace/build";
import { hashModelInput } from "@/lib/agent-trace/redaction";
import {
  assertGoldenQuestion,
  buildGoldenSuites,
  GOLDEN_CATEGORIES,
  type GoldenQuestion,
} from "@/lib/agent-golden";

const suites = buildGoldenSuites();

describe("golden suites · structure", () => {
  it("derives exactly one suite per canonical tenant (code, not hand-typed)", () => {
    const suiteKeys = suites.map((s) => s.tenantKey).sort();
    expect(suiteKeys).toEqual([...CANONICAL_TENANT_KEYS].sort());
  });

  it("includes the current active canonical tenants", () => {
    const keys = suites.map((s) => s.tenantKey);
    expect(keys).toContain("meridian-health");
    expect(keys).toContain("skyharbor-air");
  });

  it("gives every tenant 8–12 questions covering all categories", () => {
    for (const suite of suites) {
      expect(suite.questions.length).toBeGreaterThanOrEqual(8);
      expect(suite.questions.length).toBeLessThanOrEqual(12);
      const categories = new Set(suite.questions.map((q) => q.category));
      for (const c of GOLDEN_CATEGORIES) expect(categories.has(c)).toBe(true);
    }
  });

  it("every tenant has a negative/unsupported question and isolation coverage", () => {
    for (const suite of suites) {
      expect(suite.questions.some((q) => q.negativeTest)).toBe(true);
      expect(suite.questions.every((q) => q.tenantIsolationTest)).toBe(true);
    }
  });

  it("question ids are unique and tenant-scoped", () => {
    const ids = suites.flatMap((s) => s.questions.map((q) => q.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});

function traceFor(
  tenantKey: string,
  sources: RawAskSource[],
  citations: string[],
) {
  return buildSentinelTrace({
    questionId: `gq-${tenantKey}`,
    tenantId: tenantKey,
    tenantKey,
    surface: "intelligence",
    userIntent: "general_synthesis",
    modelInputHash: hashModelInput({ system: "s", user: "u" }),
    emittedAt: "2026-06-09T00:00:00.000Z",
    citationObjectsEmitted: citations,
    sources,
  });
}

function questionOf(
  tenantKey: string,
  category: GoldenQuestion["category"],
): GoldenQuestion {
  const suite = suites.find((s) => s.tenantKey === tenantKey)!;
  return suite.questions.find((q) => q.category === category)!;
}

describe("assertGoldenQuestion", () => {
  it("passes a well-grounded leadership answer", () => {
    const q = questionOf("meridian-health", "leadership");
    const trace = traceFor(
      "meridian-health",
      [{ id: "f1", type: "TENANT", name: "Meridian CIO", confidence: 0.8 }],
      ["f1"],
    );
    const result = assertGoldenQuestion(q, {
      trace,
      answerText:
        "Meridian Health is led by its CIO and clinical data leadership team.",
      tenantIsolationOk: true,
    });
    expect(result.passed).toBe(true);
  });

  it("fails when the wrong tenant is resolved", () => {
    const q = questionOf("meridian-health", "leadership");
    const trace = traceFor(
      "skyharbor-air",
      [{ id: "f1", type: "TENANT", name: "x", confidence: 0.8 }],
      ["f1"],
    );
    const result = assertGoldenQuestion(q, {
      trace,
      answerText: "answer",
      tenantIsolationOk: true,
    });
    expect(result.passed).toBe(false);
    expect(result.failures.join(" ")).toMatch(/wrong tenant/);
  });

  it("fails an industry-corpus question when no approved pattern is retrieved", () => {
    const q = questionOf("skyharbor-air", "industry_corpus");
    const trace = traceFor("skyharbor-air", [], []);
    const result = assertGoldenQuestion(q, {
      trace,
      answerText: "Generic answer.",
      tenantIsolationOk: true,
    });
    expect(result.passed).toBe(false);
    expect(result.failures.join(" ")).toMatch(/approved corpus pattern/);
  });

  it("passes a negative/unsupported question only when it caveats missing data", () => {
    const q = questionOf("skyharbor-air", "missing_unsupported");
    const trace = traceFor("skyharbor-air", [], []);
    const withCaveat = assertGoldenQuestion(q, {
      trace,
      answerText:
        "I do not have that figure loaded for this tenant; it is not available to the dollar.",
      tenantIsolationOk: true,
    });
    expect(withCaveat.passed).toBe(true);
    const overclaim = assertGoldenQuestion(q, {
      trace,
      answerText: "Net profit was exactly $12,345,678.",
      tenantIsolationOk: true,
    });
    expect(overclaim.passed).toBe(false);
  });

  it("fails when cross-tenant leakage is reported by the live runner", () => {
    const q = questionOf("skyharbor-air", "company_scale");
    const trace = traceFor(
      "skyharbor-air",
      [{ id: "f1", type: "TENANT", name: "x", confidence: 0.8 }],
      ["f1"],
    );
    const result = assertGoldenQuestion(q, {
      trace,
      answerText: "SkyHarbor is comparable to Meridian Health in scale.",
      tenantIsolationOk: false,
    });
    expect(result.passed).toBe(false);
    expect(result.failures.join(" ")).toMatch(/leakage/);
  });
});
