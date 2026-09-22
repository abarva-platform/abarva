import {
  adaptServiceNowSourcingRequest,
  adaptServiceNowSourcingRequestExtract,
  type ServiceNowSourcingRequestRow,
} from "../servicenow-sourcing-request-adapter";

const completeRow: ServiceNowSourcingRequestRow = {
  sys_id: "snreq000000000000000000000001",
  number: "REQ0010001",
  opened_at: "2026-09-02T14:00:00Z",
  updated_at: "2026-09-10T16:30:00Z",
  state: "open",
  requested_by_user_id: "USR-SYN-IT-001",
  requested_by_display_name: "IT Service Portfolio Lead",
  requested_for_org: "Technology Services",
  business_domain: "it",
  business_function: "application_operations",
  cost_center: "CC-SYN-4100",
  assignment_group: "Strategic Sourcing Intake",
  short_description: "Application managed services sourcing for enterprise applications",
  description:
    "Source L2 and L3 application managed services for ERP, integration, analytics, and customer applications with transition, run, maintain, and minor enhancement scope.",
  business_justification:
    "The current agreement expires in 2027 and service performance varies by tower. The requester wants a competitive outcome-based sourcing event.",
  sourcing_trigger: "Contract renewal and service-level improvement",
  requested_outcome:
    "Competitive RFP with transparent unit economics, service levels, transition accountability, and retained-organization clarity.",
  needed_by: "2027-01-15",
  target_decision_date: "2026-11-20",
  contract_end_date: "2027-03-31",
  estimated_annual_value: "12800000",
  currency: "USD",
  value_confidence: "requester_stated_unvalidated",
  incumbent_supplier_name: "Synthetic Operations Partner",
  existing_contract_reference: "CTR-SYN-AMS-001",
  scope_in:
    "L2/L3 support; incident, problem, change, release support; minor enhancements; 74 applications across ERP, integration, analytics, and customer platforms",
  scope_out: "Cyber operations; end-user computing; major transformation programs",
  geography: "United States; India delivery centers",
  service_criticality: "high",
  regulated_data_flags: "pii|operationally_sensitive",
  data_system_owner: "Director, IT Service Management",
  budget_status: "planning_range_confirmed",
  decision_owner: "VP, Technology Operations",
  baseline_owner: "IT Finance and ServiceNow Platform Owner",
  security_review_needed: "true",
  legal_review_needed: "true",
  attachment_references: "ATT-SYN-AMS-001|ATT-SYN-AMS-002",
  source_table: "sc_req_item",
  extract_timestamp: "2026-09-15T12:00:00Z",
  extract_version: "2026-09-15T120000Z",
};

describe("ServiceNow sourcing-request adapter", () => {
  it("preserves upstream lineage and keeps the request pre-event", () => {
    const request = adaptServiceNowSourcingRequest({
      tenantKey: "internal-golden",
      sourceRow: 2,
      row: completeRow,
      loadedSegments: [
        "vendor_contracts",
        "it_landscape",
        "it_financials",
        "operating_telemetry",
      ],
    });

    expect(request.requestId).toBe(
      "servicenow:sc_req_item:snreq000000000000000000000001",
    );
    expect(request.source).toEqual({
      system: "servicenow",
      table: "sc_req_item",
      recordId: "snreq000000000000000000000001",
      requestNumber: "REQ0010001",
      row: 2,
      extractedAt: "2026-09-15T12:00:00.000Z",
      version: "2026-09-15T120000Z",
    });
    expect(request.eventLink).toBeNull();
    expect(request.lifecycle).toBe("imported_request");
    expect(request.mappingDecision).toBeNull();
    expect(request.value).toEqual({
      amount: 12_800_000,
      currency: "USD",
      basis: "requester_stated_unvalidated",
      validated: false,
    });
    expect(request.attachments).toEqual([
      "ATT-SYN-AMS-001",
      "ATT-SYN-AMS-002",
    ]);
    expect(request.rawSource.short_description).toBe(
      completeRow.short_description,
    );
  });

  it("proposes AMS with auditable reasons without accepting the mapping", () => {
    const request = adaptServiceNowSourcingRequest({
      tenantKey: "internal-golden",
      sourceRow: 2,
      row: completeRow,
      loadedSegments: [],
    });

    expect(request.mappingProposal.categoryId).toBe("ams");
    expect(request.mappingProposal.archetypeId).toBe("AMS_MANAGED_SERVICES");
    expect(request.mappingProposal.reasons.join(" ")).toMatch(
      /application managed service/i,
    );
    expect(request.mappingProposal.evidenceGaps.length).toBeGreaterThan(0);
    expect(request.mappingDecision).toBeNull();
  });

  it("fails closed on tenant or source identity gaps", () => {
    expect(() =>
      adaptServiceNowSourcingRequest({
        tenantKey: "",
        sourceRow: 2,
        row: completeRow,
        loadedSegments: [],
      }),
    ).toThrow(/tenant/i);

    expect(() =>
      adaptServiceNowSourcingRequest({
        tenantKey: "internal-golden",
        sourceRow: 2,
        row: { ...completeRow, sys_id: "" },
        loadedSegments: [],
      }),
    ).toThrow(/sys_id/i);
  });

  it("records missing intake facts instead of inventing values", () => {
    const request = adaptServiceNowSourcingRequest({
      tenantKey: "internal-golden",
      sourceRow: 2,
      row: {
        ...completeRow,
        decision_owner: "",
        baseline_owner: "",
        estimated_annual_value: "",
      },
      loadedSegments: [],
    });

    expect(request.requiredFactGaps).toEqual([
      "decision_owner",
      "baseline_owner",
    ]);
    expect(request.value).toBeNull();
  });

  it("is idempotent for the same request version and preserves later versions", () => {
    const requests = adaptServiceNowSourcingRequestExtract({
      tenantKey: "internal-golden",
      loadedSegments: [],
      rows: [
        { sourceRow: 2, row: completeRow },
        { sourceRow: 2, row: completeRow },
        {
          sourceRow: 3,
          row: {
            ...completeRow,
            updated_at: "2026-09-16T10:00:00Z",
            extract_timestamp: "2026-09-16T12:00:00Z",
            extract_version: "2026-09-16T120000Z",
            scope_in: `${completeRow.scope_in}; after-hours release support`,
          },
        },
      ],
    });

    expect(requests).toHaveLength(2);
    expect(new Set(requests.map((request) => request.requestId)).size).toBe(1);
    expect(requests.map((request) => request.source.version)).toEqual([
      "2026-09-15T120000Z",
      "2026-09-16T120000Z",
    ]);
    expect(requests.every((request) => request.mappingDecision === null)).toBe(
      true,
    );
  });

  it("rejects conflicting rows with the same source version identity", () => {
    expect(() =>
      adaptServiceNowSourcingRequestExtract({
        tenantKey: "internal-golden",
        loadedSegments: [],
        rows: [
          { sourceRow: 2, row: completeRow },
          {
            sourceRow: 2,
            row: { ...completeRow, scope_in: "Conflicting replacement scope" },
          },
        ],
      }),
    ).toThrow(/conflicting servicenow rows/i);
  });
});
