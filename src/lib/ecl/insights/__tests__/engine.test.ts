import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { buildIntegratedInsightPlan, canonicalJson, insightHash, insightUuid } from "../engine";
import type { InsightInput } from "../types";

const packet = (): InsightInput => ({ tenantKey: CANONICAL_TENANT_KEYS[0], assessmentId: "test-assessment",
  asOf: "2026-10-11", objects: [], relationships: [], measures: [], sources: [],
  metricDefinitions: [], cubeManifests: [], cubeMeasureLinks: [] });

describe("integrated canonical insight foundation", () => {
  it("reports an unavailable record as not assessable, not clear", () => {
    const plan = buildIntegratedInsightPlan(packet());
    expect(plan.findings).toEqual([]);
    expect(plan.evaluations.every((rule) => rule.state === "not_assessable")).toBe(true);
  });
  it("refuses undeclared tenants", () => {
    expect(() => buildIntegratedInsightPlan({ ...packet(), tenantKey: "not-a-tenant" })).toThrow();
  });
  it("pins deterministic inputs, rule version and output together", () => {
    const plan = buildIntegratedInsightPlan(packet());
    expect(plan.loadVersionHash).toBe(insightHash({ sourceSetHash: plan.sourceSetHash,
      ruleSetHash: plan.ruleSetHash, resultHash: plan.resultHash }));
    expect(buildIntegratedInsightPlan(packet())).toEqual(plan);
  });
  it("changes the release when its as-of date changes", () => {
    expect(buildIntegratedInsightPlan({ ...packet(), asOf: "2026-10-12" }).releaseId)
      .not.toBe(buildIntegratedInsightPlan(packet()).releaseId);
  });
  it("canonicalizes nested property order", () => {
    expect(canonicalJson({ b: { y: 2, x: 1 }, a: 0 })).toBe(canonicalJson({ a: 0, b: { x: 1, y: 2 } }));
  });
  it("emits valid stable UUIDs", () => {
    expect(insightUuid("fixture")).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
