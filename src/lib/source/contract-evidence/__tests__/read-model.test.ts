import {
  buildContractEvidenceRuntimeSummary,
  formatMetricValue,
} from "../read-model";

describe("Source contract evidence runtime summary", () => {
  it("projects persisted evidence into coverage, metrics, and supported findings", () => {
    const summary = buildContractEvidenceRuntimeSummary({
      sourceEventId: "LAKE-AMS-CONTRACT-OPT-2026",
      tenantKey: "lakeshore",
      manifests: [
        {
          id: "manifest-1",
          evidencePackName: "Lakeshore AMS evidence pack",
          sourceType: "client_uploaded",
          validationStatus: "accepted",
          rowCount: 4,
          requiredFamilyCount: 4,
          coveredRequiredFamilyCount: 4,
          missingFamilies: [],
          warnings: [],
          sourceArtifactId: "artifact-1",
          createdAt: "2026-07-04T20:00:00.000Z",
        },
      ],
      rows: [
        { evidence_family: "contract_baseline", validation_status: "accepted" },
        { evidence_family: "invoice_exception", validation_status: "accepted" },
        { evidence_family: "invoice_exception", validation_status: "accepted" },
        { evidence_family: "staffing_model", validation_status: "accepted" },
      ],
      metrics: [
        {
          key: "invoice_exception_exposure_usd",
          label: "Invoice exception exposure",
          value: 540000,
          unit: "USD",
          family: "invoice_exception",
          confidence: 0.85,
        },
        {
          key: "staffing_gap_fte",
          label: "Staffing gap",
          value: 4,
          unit: "FTE",
          family: "staffing_model",
          confidence: 0.85,
        },
      ],
    });

    expect(summary.userFacingSummary).toBe(
      "1 structured evidence pack loaded with 4 evidence records and 2 calculated metrics.",
    );
    expect(summary.families).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Contract baseline",
          rowCount: 1,
          status: "loaded",
        }),
        expect.objectContaining({
          label: "Invoice exceptions",
          rowCount: 2,
          status: "loaded",
        }),
      ]),
    );
    expect(summary.findings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "invoice_leakage",
          label: "Invoice leakage",
          implication:
            "This supports a recovery or cure discussion before renewal or renegotiation.",
        }),
        expect.objectContaining({
          key: "staffing_variance",
          label: "Staffing variance",
        }),
      ]),
    );
    expect(formatMetricValue(summary.metrics[0]!)).toBe("$540,000");
    expect(formatMetricValue(summary.metrics[1]!)).toBe("4 FTE");
  });
});
