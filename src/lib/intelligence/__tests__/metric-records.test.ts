import { loadCorpus } from "@/lib/intelligence/loader";
import {
  METRIC_RECORDS,
  getMetricRecordById,
  getMetricRecordsByIndustryDomain,
  getTier1MetricRecords,
  summarizeMetricCoverage,
  validateMetricRecords,
} from "@/lib/intelligence/metric-records";

describe("PAT-MET metric corpus foundation", () => {
  it("validates the expanded structured metric records", () => {
    expect(() => validateMetricRecords()).not.toThrow();
  });

  it("has broad tier-1 coverage across the three pilot industries and domains", () => {
    const coverage = summarizeMetricCoverage();

    expect(coverage.total).toBe(258);
    expect(coverage.verifiedOrLocked).toBe(258);
    expect(coverage.byIndustry).toEqual({
      specialty_retail: 86,
      healthcare_idn: 86,
      financial_services: 86,
    });
    expect(coverage.byDomain).toEqual({
      front_office: 85,
      middle_office: 86,
      back_office: 87,
    });
  });

  it("uses the reserved PAT-MET id blocks from the authoring brief", () => {
    const retail = getMetricRecordsByIndustryDomain(
      "specialty_retail",
      "middle_office",
    );
    const healthcare = getMetricRecordsByIndustryDomain(
      "healthcare_idn",
      "middle_office",
    );
    const finserv = getMetricRecordsByIndustryDomain(
      "financial_services",
      "middle_office",
    );

    expect(retail.map((record) => record.id).slice(0, 2)).toEqual([
      "PAT-MET-003",
      "PAT-MET-004",
    ]);
    expect(healthcare.map((record) => record.id).slice(0, 2)).toEqual([
      "PAT-MET-203",
      "PAT-MET-204",
    ]);
    expect(finserv.map((record) => record.id).slice(0, 2)).toEqual([
      "PAT-MET-403",
      "PAT-MET-404",
    ]);
    expect(
      retail.every(
        (record) => Number(record.id.replace("PAT-MET-", "")) <= 200,
      ),
    ).toBe(true);
    expect(
      healthcare.every(
        (record) => Number(record.id.replace("PAT-MET-", "")) >= 201,
      ),
    ).toBe(true);
    expect(
      finserv.every(
        (record) => Number(record.id.replace("PAT-MET-", "")) >= 401,
      ),
    ).toBe(true);
  });

  it("keeps metric ids and semantic names unique within each industry", () => {
    const ids = new Set(METRIC_RECORDS.map((record) => record.id));
    const namesByIndustry = new Set(
      METRIC_RECORDS.flatMap((record) =>
        record.industries.map(
          (industry) => `${industry}:${record.name.toLowerCase()}`,
        ),
      ),
    );

    expect(ids.size).toBe(METRIC_RECORDS.length);
    expect(namesByIndustry.size).toBe(METRIC_RECORDS.length);
  });

  it("includes healthcare depth markers for Epic, prior auth, coding, RCM, VBC, and clinical workflow", () => {
    expect(getMetricRecordById("PAT-MET-201")?.theme).toBe(
      "patient_access_prior_auth",
    );
    expect(getMetricRecordById("PAT-MET-203")?.theme).toBe(
      "coding_quality_cdi",
    );
    expect(
      getMetricRecordById("PAT-MET-204")?.vendorLandscape.map(
        (entry) => entry.vendorName,
      ),
    ).toContain("Epic BestPractice Advisories");
    expect(getMetricRecordById("PAT-MET-205")?.theme).toBe(
      "revenue_cycle_denials",
    );
    expect(getMetricRecordById("PAT-MET-212")?.name).toBe(
      "MyChart active patient rate",
    );
    expect(getMetricRecordById("PAT-MET-238")?.name).toBe(
      "All-cause readmission rate",
    );
    expect(getMetricRecordById("PAT-MET-274")?.name).toBe(
      "Model monitoring coverage for clinical AI",
    );
  });

  it("includes retail and financial-services operating depth beyond the foundation records", () => {
    expect(getMetricRecordById("PAT-MET-009")?.name).toBe(
      "Cart abandonment rate",
    );
    expect(getMetricRecordById("PAT-MET-034")?.name).toBe("Inventory turnover");
    expect(getMetricRecordById("PAT-MET-082")?.name).toBe(
      "AI model production count",
    );
    expect(getMetricRecordById("PAT-MET-407")?.name).toBe(
      "Account opening abandonment rate",
    );
    expect(getMetricRecordById("PAT-MET-436")?.name).toBe(
      "AML alert false positive rate",
    );
    expect(getMetricRecordById("PAT-MET-466")?.name).toBe(
      "Model monitoring exception aging",
    );
  });

  it("loads metric records into the canonical corpus index", () => {
    const corpus = loadCorpus({ loadedAt: "2026-05-02T00:00:00.000Z" });

    expect(corpus.metrics).toHaveLength(METRIC_RECORDS.length);
    expect(corpus.metricsById.get("PAT-MET-003")?.name).toBe(
      "Forecast accuracy at SKU-week",
    );
    expect(corpus.metricsById.get("PAT-MET-436")?.name).toBe(
      "AML alert false positive rate",
    );
    expect(corpus.byId.get("PAT-MET-205")?.id).toBe("PAT-MET-205");
  });

  it("marks every expanded metric as tier 1 and retrievable by default maturity", () => {
    const tier1 = getTier1MetricRecords();

    expect(tier1).toHaveLength(METRIC_RECORDS.length);
    expect(tier1.every((record) => record.priorityTier === "tier_1")).toBe(
      true,
    );
    expect(tier1.every((record) => record.maturityStatus === "verified")).toBe(
      true,
    );
  });
});
