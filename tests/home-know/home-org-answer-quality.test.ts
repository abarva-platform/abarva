import {
  buildHomeKnowResponseFromPacket,
  type HomeKnowPacket,
} from "@/lib/home/know/home-know-engine";

const SCREENSHOT_QUESTION =
  "how is our IT and business organized today? who are our technology leaders under our CIO?";

const skyharborOrgPacket: HomeKnowPacket = {
  coverage: [
    {
      tenant_key: "skyharbor-air",
      dimension_id: "business_org_functions",
      dimension_label: "Business & Operating Model",
      record_count: 6,
      fact_count: 30,
      relationship_count: 4,
      source_count: 1,
      gap_count: 1,
      conflict_count: 0,
      last_loaded_at: "2026-06-23T00:00:00Z",
      trust_score: 91,
    },
    {
      tenant_key: "skyharbor-air",
      dimension_id: "it_org_ownership",
      dimension_label: "IT org ownership",
      record_count: 6,
      fact_count: 42,
      relationship_count: 6,
      source_count: 1,
      gap_count: 1,
      conflict_count: 0,
      last_loaded_at: "2026-06-23T00:00:00Z",
      trust_score: 92,
    },
  ],
  org: [
    {
      tenant_key: "skyharbor-air",
      team_id: "sha-team-ops-tech",
      team_name: "Operations Technology",
      executive_owner_role: "VP Operations Technology",
      executive_owner_person_name: null,
      domain: "operations technology",
      head_count_fte: 92,
      annual_budget_usd: 31000000,
      source_file: "F03_it-org-ownership.csv",
      source_row_number: 2,
      confidence: 0.91,
    },
    {
      tenant_key: "skyharbor-air",
      team_id: "sha-team-data",
      team_name: "Data and Analytics",
      executive_owner_role: "VP Data and Analytics",
      executive_owner_person_name: null,
      domain: "data and analytics",
      head_count_fte: 74,
      annual_budget_usd: 28000000,
      source_file: "F03_it-org-ownership.csv",
      source_row_number: 3,
      confidence: 0.9,
    },
  ],
  applications: [],
  vendors: [],
  budgets: [],
  relationships: [],
  records: [
    {
      tenant_key: "skyharbor-air",
      canonical_record_id: "rec-business-airport-ops",
      source_record_id: "business-airport-ops",
      record_type: "business_function",
      dimension: "business_org_functions",
      payload: {
        function_name: "Airport Operations",
        business_domain: "operations",
        owner: "COO",
      },
    },
    {
      tenant_key: "skyharbor-air",
      canonical_record_id: "rec-business-customer",
      source_record_id: "business-customer",
      record_type: "business_function",
      dimension: "business_org_functions",
      payload: {
        function_name: "Customer Experience",
        business_domain: "commercial",
        owner: "Chief Commercial Officer",
      },
    },
  ],
  gaps: [
    {
      tenant_key: "skyharbor-air",
      dimension_id: "it_org_ownership",
      object_type: "technology_portfolio",
      expected_field: "executive_owner_person_name",
      display_label: "Named technology leader",
      severity: "medium",
      missing_count: 2,
      source_file: "F03_it-org-ownership.csv",
    },
  ],
  conflicts: [],
};

describe("Home org answer quality", () => {
  it("answers the screenshot question with synthesis first and the people gap second", () => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "skyharbor-air",
      question: SCREENSHOT_QUESTION,
      packet: skyharborOrgPacket,
    });

    expect(response.mode).toBe("KNOW");
    expect(response.intent).toBe("lookup");
    expect(response.answerStatus).toBe("partial");
    expect(response.dimensionsUsed).toEqual(
      expect.arrayContaining(["business_org_functions", "it_org_ownership"]),
    );
    expect(response.tables.map((table) => table.id)).toEqual(
      expect.arrayContaining(["home-business-functions", "home-it-org"]),
    );
    expect(response.prose).toMatch(/business/i);
    expect(response.prose).toMatch(/technology/i);
    expect(response.prose).toMatch(/portfolio|role|domain/i);
    expect(response.prose).toMatch(/named .*leader|named individuals/i);
    expect(response.gaps[0]).toMatchObject({
      expectedField: "executive_owner_person_name",
      displayLabel: "Named technology leader",
    });
    expect(response.prose).not.toMatch(
      /cannot be characterized|cannot be identified|I found|missing source support|named contract owner/i,
    );
    expect(response.prose).not.toMatch(/^\s*\d[\d,]*\s+rows/i);
    expect(response.prose).not.toMatch(/\b(Read|Evidence):/i);
    expect(response.prose).not.toMatch(
      /\b[A-Z]{2,16}-[A-Z0-9]{2,24}-\d{2,8}\b/i,
    );
  });
});
