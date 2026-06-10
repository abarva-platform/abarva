import { describe, it, expect } from "@jest/globals";
import {
  validateKpiTable,
  isDocumentFamily,
  documentFamilyKeys,
} from "../current-state-doc-ingest";
import { AI_PRODUCT_DEVELOPMENT_LIFECYCLE } from "../archetypes/registry";
import type { EvidenceFamilySpec } from "../archetypes/types";

describe("current-state document path — governance helpers", () => {
  it("isDocumentFamily: structured (with backing) is NOT a document family", () => {
    const dora = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.evidenceFamilies.find(
      (f) => f.key === "eng_performance_dora",
    )!;
    expect(isDocumentFamily(dora)).toBe(false);
  });

  it("isDocumentFamily: qualitative (no backing) IS a document family", () => {
    const stakeholder = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.evidenceFamilies.find(
      (f) => f.key === "stakeholder_map",
    )!;
    expect(isDocumentFamily(stakeholder)).toBe(true);
  });

  it("documentFamilyKeys includes the 3 qualitative AI-PDLC families", () => {
    const keys = documentFamilyKeys(AI_PRODUCT_DEVELOPMENT_LIFECYCLE);
    expect(keys).toEqual(
      expect.arrayContaining([
        "stakeholder_map",
        "product_platform_operating_model",
        "value_kpi_baseline",
      ]),
    );
    // None of the keys may be a backing-table family.
    for (const k of keys) {
      const fam = AI_PRODUCT_DEVELOPMENT_LIFECYCLE.evidenceFamilies.find(
        (f) => f.key === k,
      ) as EvidenceFamilySpec;
      expect(fam.backing).toBeUndefined();
    }
  });

  it("validateKpiTable: accepts a header with metric + baseline columns and data rows", () => {
    const text = [
      "Worksheet: KPI Baseline",
      "KPI | Baseline | Target",
      "Cycle time (days) | 14 | 7",
      "Change-failure rate | 18% | 9%",
    ].join("\n");
    const r = validateKpiTable(text);
    expect(r.valid).toBe(true);
    expect(r.rows).toBeGreaterThanOrEqual(2);
  });

  it("validateKpiTable: rejects a header lacking a value column (no auto-commit)", () => {
    const text = ["KPI | Owner", "Cycle time | Jane"].join("\n");
    expect(validateKpiTable(text).valid).toBe(false);
  });

  it("validateKpiTable: rejects free-form prose (no auto-commit)", () => {
    const text =
      "Our operating model is federated. Teams are funded annually and prioritized by a council.";
    expect(validateKpiTable(text).valid).toBe(false);
  });

  it("validateKpiTable: rejects header-only with no numeric data rows", () => {
    const text = "metric | current value";
    expect(validateKpiTable(text).valid).toBe(false);
  });
});
