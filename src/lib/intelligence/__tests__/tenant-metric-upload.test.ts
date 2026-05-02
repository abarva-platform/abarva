import {
  looksLikeTenantMetricUpload,
  parseTenantMetricCsv,
} from "@/lib/intelligence/tenant-metric-upload";

describe("tenant metric setup upload parser", () => {
  it("parses current-state KPI CSV rows into tenant metric observations", () => {
    const csv = [
      "metric_id,current_value,unit,as_of,source_detail,owner_role,direction,confidence,program_id,notes",
      "PAT-MET-003,61,%,2026-04-30,Apex forecast extract,SVP Supply Chain,higher_is_better,0.84,apex-customer-inventory-ai-modernization,Forecast baseline",
      "PAT-MET-045,,hours,2026-04-30,Missing signal freshness extract,SVP Supply Chain,lower_is_better,0.3,apex-customer-inventory-ai-modernization,Need upload",
    ].join("\n");

    const parsed = parseTenantMetricCsv(csv, "apex-retail-group");

    expect(parsed.tenantKey).toBe("apex-retail");
    expect(parsed.accepted).toHaveLength(1);
    expect(parsed.rejected).toHaveLength(1);
    expect(parsed.accepted[0]).toMatchObject({
      metricId: "PAT-MET-003",
      metricName: "Forecast accuracy at SKU-week",
      source: "setup_upload",
      currentValue: 61,
      confidence: 0.84,
    });
    expect(parsed.rejected[0].reason).toBe(
      "measured rows require current_value",
    );
  });

  it("accepts explicit measurement-gap rows without current values", () => {
    const csv = [
      "metric_id,current_value,unit,as_of,source_detail,owner_role,measurement_status,direction,confidence",
      "PAT-MET-274,,%,2026-04-30,No clinical AI inventory,CMIO,measurement_gap,higher_is_better,25",
    ].join("\n");

    const parsed = parseTenantMetricCsv(csv, "meridian");

    expect(parsed.accepted).toHaveLength(1);
    expect(parsed.accepted[0]).toMatchObject({
      tenantKey: "meridian-health",
      metricId: "PAT-MET-274",
      measurementStatus: "measurement_gap",
      confidence: 0.25,
    });
  });

  it("rejects unknown metric ids while keeping valid rows", () => {
    const csv = [
      "metric_id,current_value,unit,as_of,source_detail,owner_role",
      "PAT-MET-403,92,%,2026-04-30,Fraud ops,Chief Risk Officer",
      "PAT-MET-999,1,%,2026-04-30,Bad row,Owner",
    ].join("\n");

    const parsed = parseTenantMetricCsv(csv, "firstcapital");

    expect(parsed.accepted.map((row) => row.metricId)).toEqual(["PAT-MET-403"]);
    expect(parsed.rejected).toHaveLength(1);
    expect(parsed.rejected[0].reason).toBe("Unknown metric_id PAT-MET-999");
  });

  it("identifies Setup datasets that should use KPI ingestion", () => {
    expect(
      looksLikeTenantMetricUpload(
        "current-state-kpis.csv",
        "Reference metrics",
      ),
    ).toBe(true);
    expect(
      looksLikeTenantMetricUpload("architecture-notes.pdf", "Workshop notes"),
    ).toBe(false);
  });
});
