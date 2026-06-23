import {
  buildHomeKnowResponseFromPacket,
  classifyHomeKnowIntent,
  validateHomeKnowResponse,
  type HomeKnowPacket,
} from "../home-know-engine";
import type { HomeKnowResponse } from "../home-know-contract";

const apexPacket: HomeKnowPacket = {
  coverage: [
    {
      tenant_key: "apex-retail",
      dimension_id: "it_org_ownership",
      dimension_label: "IT org ownership",
      record_count: 5,
      fact_count: 30,
      relationship_count: 3,
      source_count: 1,
      gap_count: 5,
      conflict_count: 0,
      last_loaded_at: "2026-06-23T00:00:00Z",
      trust_score: 95,
    },
    {
      tenant_key: "apex-retail",
      dimension_id: "applications_core_systems",
      dimension_label: "Applications and core systems",
      record_count: 170,
      fact_count: 1190,
      relationship_count: 400,
      source_count: 1,
      gap_count: 170,
      conflict_count: 0,
      last_loaded_at: "2026-06-23T00:00:00Z",
      trust_score: 50,
    },
  ],
  org: [
    {
      tenant_key: "apex-retail",
      team_id: "APX-IT-001",
      team_name: "Store Systems and POS",
      executive_owner_role: "VP Store Technology",
      domain: "store_systems",
      executive_owner_person_name: null,
      head_count_fte: 740,
      annual_budget_usd: 210000000,
      source_file: "family-1-enterprise-operating-model/F03_it-org-ownership.csv",
      source_row_number: 2,
      confidence: 0.91,
    },
  ],
  applications: [
    {
      tenant_key: "apex-retail",
      application_name: "Oracle Retail Merchandising",
      domain: "merchandising",
      primary_business_owner: "COO",
      technical_owner_team: "Store Systems and POS",
      technical_owner_role: "VP Store Technology",
      criticality: "critical",
      annual_run_cost_usd: 18200000,
      source_file: "family-2-technology-estate/F05_applications-systems.csv",
      source_row_number: 2,
      confidence: 0.9,
    },
  ],
  vendors: [
    {
      tenant_key: "apex-retail",
      vendor_name: "Salesforce",
      category: "commerce",
      annual_spend_usd: 1200000,
      renewal_risk: "high",
      business_owner: "COO",
      technology_owner: "Store Systems and POS",
      source_file: "family-4-financial-commercial/F11_vendors-contracts-licenses.csv",
      source_row_number: 2,
      confidence: 0.9,
    },
  ],
  budgets: [
    {
      tenant_key: "apex-retail",
      function_or_platform: "Store Systems and POS",
      run_budget_usd: 130200000,
      change_budget_usd: 71400000,
      ai_budget_usd: 650000,
      owner_role: "VP Store Technology",
      source_file: "family-4-financial-commercial/F12_it-budget-financials.csv",
      source_row_number: 2,
      confidence: 0.9,
    },
  ],
  gaps: [
    {
      tenant_key: "apex-retail",
      dimension_id: "it_org_ownership",
      object_type: "portfolio",
      expected_field: "executive_owner_person_name",
      display_label: "Named portfolio lead",
      severity: "medium",
      missing_count: 1,
      source_file: "family-1-enterprise-operating-model/F03_it-org-ownership.csv",
    },
  ],
  conflicts: [],
};

describe("Home KNOW contract engine", () => {
  it("keeps server intent authoritative", () => {
    expect(
      classifyHomeKnowIntent("How is our IT team organized? Who leads the portfolios?"),
    ).toBe("lookup");
    expect(classifyHomeKnowIntent("Where should we invest $30M?")).toBe(
      "decision_handoff",
    );
    expect(classifyHomeKnowIntent("Show this visually as a chart")).toBe("chart");
  });

  it("answers IT org lookup from deterministic view rows with gaps and citations", () => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "apex-retail",
      question: "How is our IT team organized? Who leads the portfolios?",
      packet: apexPacket,
    });

    expect(response.mode).toBe("KNOW");
    expect(response.intent).toBe("lookup");
    expect(response.answerStatus).toBe("partial");
    expect(response.tables[0]).toMatchObject({
      id: "home-it-org",
      dimensionId: "it_org_ownership",
    });
    expect(response.tables[0]?.rows[0]).toMatchObject({
      team_name: "Store Systems and POS",
      executive_owner_role: "VP Store Technology",
      annual_budget_usd: 210000000,
    });
    expect(response.citations[0]?.label).toContain("F03_it-org-ownership.csv row 2");
    expect(response.gaps[0]).toMatchObject({
      expectedField: "executive_owner_person_name",
      displayLabel: "Named portfolio lead",
    });
    expect(response.safety).toMatchObject({
      serverValidated: true,
      blockedExperts: true,
      blockedDecisionFrames: true,
      blockedInternalCodes: true,
      frontendTripwireShouldFire: false,
    });
    assertNoForbiddenHomeText(response);
  });

  it("hands decision questions off without generating a Home strategy memo", () => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "apex-retail",
      question: "Where should we invest $30M?",
      packet: apexPacket,
    });

    expect(response.intent).toBe("decision_handoff");
    expect(response.answerStatus).toBe("handoff");
    expect(response.handoff?.target).toBe("intelligence");
    expect(response.prose).toContain("this question asks for a decision");
    expect(response.charts).toEqual([]);
    expect(response.safety.frontendTripwireShouldFire).toBe(false);
  });

  it("returns no_data instead of bluffing when a subject is absent", () => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "apex-retail",
      question: "Which vendors support data platforms?",
      packet: { ...apexPacket, vendors: [], gaps: [] },
    });

    expect(response.intent).toBe("table");
    expect(response.answerStatus).toBe("no_data");
    expect(response.prose).toBe("I do not see that in the loaded data.");
    expect(response.tables[0]?.id).toBe("home-vendor-landscape");
    expect(response.tables[0]?.rows).toEqual([]);
  });

  it("emits deterministic chart data from the packet, not prose", () => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "apex-retail",
      question: "Show budget visually as a chart",
      packet: apexPacket,
    });

    expect(response.intent).toBe("chart");
    expect(response.charts[0]).toMatchObject({
      id: "home-budget-mix-chart",
      kind: "cost-stack",
      dimensionId: "it_budget_financials",
    });
    expect(response.charts[0]?.data).toEqual([
      { label: "Run", value: 130200000, color: expect.any(String) },
      { label: "Change", value: 71400000, color: expect.any(String) },
      { label: "AI", value: 650000, color: expect.any(String) },
    ]);
  });

  it("sets the backend tripwire if unsafe text survives validation", () => {
    const response = validateHomeKnowResponse({
      mode: "KNOW",
      tenantKey: "apex-retail",
      question: "What do we know?",
      intent: "lookup",
      answerStatus: "answered",
      prose: "DORA Wave-0 local env APX-APP-001",
      dimensionsUsed: [],
      facts: [],
      tables: [],
      charts: [],
      gaps: [],
      conflicts: [],
      citations: [],
      handoff: null,
      safety: {
        serverValidated: false,
        blockedExperts: false,
        blockedDecisionFrames: false,
        blockedInternalCodes: false,
        unsupportedClaimsRemoved: 0,
        frontendTripwireShouldFire: false,
      },
    });

    expect(response.safety.serverValidated).toBe(true);
    expect(response.safety.unsupportedClaimsRemoved).toBeGreaterThan(0);
    expect(response.safety.frontendTripwireShouldFire).toBe(false);
    expect(response.prose).not.toMatch(/DORA|Wave-0|local env|APX-APP/i);
  });
});

function assertNoForbiddenHomeText(response: HomeKnowResponse) {
  const publicText = JSON.stringify(response);
  expect(publicText).not.toMatch(
    /experts?_consulted|DORA|Wave-0|kill criteria|90-day pilot|local env|org_topology unavailable|clinical process/i,
  );
}
