import {
  buildTenantMetricGapView,
  getAllTenantMetricObservations,
  getTenantMetricObservations,
  summarizeTenantMetricReadiness,
} from "@/lib/intelligence/tenant-metric-fixtures";
import { getMetricRecordById } from "@/lib/intelligence/metric-records";

describe("tenant metric current-state fixtures", () => {
  it("maps every tenant observation to a valid PAT-MET corpus record", () => {
    for (const observation of getAllTenantMetricObservations()) {
      const metric = getMetricRecordById(observation.metricId);
      expect(metric?.name).toBeTruthy();
      expect(metric?.industries).toContain(observation.industry);
    }
  });

  it("loads current-state coverage for all three demo tenants", () => {
    expect(getTenantMetricObservations("apex-retail")).toHaveLength(12);
    expect(getTenantMetricObservations("meridian-health-system")).toHaveLength(
      12,
    );
    expect(getTenantMetricObservations("firstcapital")).toHaveLength(12);
  });

  it("summarizes measured and measurement-gap readiness for demo storytelling", () => {
    expect(summarizeTenantMetricReadiness("apex-retail")).toMatchObject({
      tenantKey: "apex-retail",
      total: 12,
      measured: 11,
      measurementGaps: 1,
      industries: ["specialty_retail"],
      programIds: ["apex-customer-inventory-ai-modernization"],
    });
    expect(summarizeTenantMetricReadiness("meridian-health")).toMatchObject({
      tenantKey: "meridian-health",
      total: 12,
      measured: 11,
      measurementGaps: 1,
      industries: ["healthcare_idn"],
      programIds: ["meridian-healthcare-data-analytics-modernization"],
    });
    expect(summarizeTenantMetricReadiness("first-capital")).toMatchObject({
      tenantKey: "first-capital",
      total: 12,
      measured: 11,
      measurementGaps: 1,
      industries: ["financial_services"],
      programIds: ["firstcapital-digital-banking-risk-modernization"],
    });
  });

  it("creates gap views that can power agent recommendations and demo standing views", () => {
    const apex = buildTenantMetricGapView("apex-retail");
    const meridian = buildTenantMetricGapView("meridian-health");
    const firstCapital = buildTenantMetricGapView("first-capital");

    expect(
      apex.find((view) => view.observation.metricId === "PAT-MET-003")
        ?.gapClass,
    ).toBe("material_gap");
    expect(
      meridian.find((view) => view.observation.metricId === "PAT-MET-201")
        ?.gapClass,
    ).toBe("material_gap");
    expect(
      firstCapital.find((view) => view.observation.metricId === "PAT-MET-403")
        ?.gapSeverity,
    ).toBe(5);
    expect(
      meridian.find((view) => view.observation.metricId === "PAT-MET-274")
        ?.gapClass,
    ).toBe("measurement_gap");
  });
});
