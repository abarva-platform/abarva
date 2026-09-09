import {
  formatStructuredApplicationInventory,
  formatStructuredEvidenceOverview,
  formatStructuredOperationalEvidence,
} from "../structured-evidence";
import type { SourceGenerationContext } from "../types";

function context(): SourceGenerationContext {
  return {
    tenantKey: "sample-tenant",
    tenantName: "Sample Tenant",
    event: {
      id: "11111111-1111-4111-8111-111111111111",
      code: "SRC-001",
      name: "Managed services event",
      archetype: "Managed Services",
      rigor: "enhanced",
      currentStageKey: "scope",
      statusLabel: "Active",
      owner: "IT sourcing",
      triggerDescription: "Renewal",
      scopeDescription: "Analytics applications",
      estimatedValueUsd: 2_000_000,
    },
    artifactStates: [],
    gateCriteria: [],
    evidence: [],
    structuredContractEvidence: {
      summary: {
        eventId: "11111111-1111-4111-8111-111111111111",
        tenantKey: "sample-tenant",
        manifests: [
          {
            id: "manifest-1",
            evidencePackName: "AMS evidence",
            sourceType: "synthetic_demo",
            validationStatus: "accepted",
            rowCount: 3,
            requiredFamilyCount: 2,
            coveredRequiredFamilyCount: 2,
            missingFamilies: [],
            warnings: ["Synthetic demo evidence; do not treat as client-approved truth."],
            sourceArtifactId: null,
            createdAt: "2026-09-08T00:00:00.000Z",
          },
        ],
        families: [
          {
            family: "application_inventory",
            label: "Application inventory",
            rowCount: 1,
            acceptedRows: 1,
            status: "loaded",
          },
        ],
        metrics: [],
        findings: [],
        missingFamilies: [],
        warnings: ["Synthetic demo evidence; do not treat as client-approved truth."],
        userFacingSummary: "1 structured evidence pack loaded with 3 evidence records and 0 calculated metrics.",
      },
      records: [
        {
          family: "application_inventory",
          sourceSheet: "CMDB",
          sourceRowNumber: 2,
          periodStart: null,
          amountUsd: null,
          confidence: 0.7,
          payload: {
            application_ref: "APP-001",
            application_name: "Claims Analytics Mart",
            business_function: "Claims Operations",
            criticality: "Tier 1",
            hosting_model: "AWS",
            scope_role: "primary",
            source_file_id: "DOC-SOW",
          },
        },
        {
          family: "ticket_volume",
          sourceSheet: "ITSM",
          sourceRowNumber: 2,
          periodStart: "2026-07-01",
          amountUsd: null,
          confidence: 0.7,
          payload: {
            month: "2026-07",
            severity: "P2",
            ticket_count: 8,
            avg_resolution_hours: 28.8,
          },
        },
        {
          family: "sla_performance",
          sourceSheet: "SLA",
          sourceRowNumber: 2,
          periodStart: "2026-09-01",
          amountUsd: null,
          confidence: 0.7,
          payload: {
            period_start: "2026-09-01",
            metric_name: "critical_incident_response_minutes",
            committed_threshold_pct: 30,
            actual_result_pct: 35,
            threshold_direction: "maximum",
            breach_state: "missed",
            credit_owed_usd: 8177.08,
            credit_claimed: false,
          },
        },
      ],
    },
  };
}

describe("structured contract evidence prompt formatting", () => {
  it("renders exact event-scoped application rows", () => {
    const result = formatStructuredApplicationInventory(context());
    expect(result).toContain("1 applications");
    expect(result).toContain("APP-001");
    expect(result).toContain("Claims Analytics Mart");
    expect(result).toContain("do not invent");
  });

  it("renders ticket and SLA rows without merging their measures", () => {
    const result = formatStructuredOperationalEvidence(context());
    expect(result).toContain("Ticket-volume rows: 1");
    expect(result).toContain("28.8");
    expect(result).toContain("SLA-performance rows: 1");
    expect(result).toContain("8177.08");
    expect(result).toContain("do not combine their resolution hours into one MTTR");
  });

  it("retains the synthetic-evidence warning", () => {
    expect(formatStructuredEvidenceOverview(context())).toContain(
      "Synthetic demo evidence; do not treat as client-approved truth.",
    );
  });
});
