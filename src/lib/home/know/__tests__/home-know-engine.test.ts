import {
  buildHomeKnowResponseFromPacket,
  classifyHomeKnowIntent,
  validateHomeKnowResponse,
  type HomeKnowPacket,
} from "../home-know-engine";
import { buildHomeKnowResponseFromDossier } from "../compose-dossier-answer";
import { shouldUseHomeKnowAgentAnswer } from "../home-know-agent-answer";
import type { HomeKnowResponse } from "../home-know-contract";
import type { UniversalDimensionDossier } from "@/lib/semantic-dossiers";

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
      source_file:
        "family-1-enterprise-operating-model/F03_it-org-ownership.csv",
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
      source_file:
        "family-4-financial-commercial/F11_vendors-contracts-licenses.csv",
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
  relationships: [
    {
      tenant_key: "apex-retail",
      relationship_key: "rel-1",
      relationship_type: "supports",
      from_external_id: "APP-ORACLE-RETAIL",
      to_external_id: "TEAM-STORE-SYSTEMS",
      source_file: "family-2-technology-estate/F08_integrations-interfaces.csv",
      source_row_number: 4,
      properties: {},
    },
  ],
  records: [
    {
      tenant_key: "apex-retail",
      canonical_record_id: "rec-app-oracle-retail",
      source_record_id: "APP-ORACLE-RETAIL",
      record_type: "application",
      dimension: "applications_core_systems",
      payload: {
        app_id: "APP-ORACLE-RETAIL",
        application_name: "Oracle Retail Merchandising",
      },
    },
    {
      tenant_key: "apex-retail",
      canonical_record_id: "rec-team-store-systems",
      source_record_id: "TEAM-STORE-SYSTEMS",
      record_type: "team",
      dimension: "it_org_ownership",
      payload: {
        team_id: "TEAM-STORE-SYSTEMS",
        team_name: "Store Systems and POS",
      },
    },
    {
      tenant_key: "apex-retail",
      canonical_record_id: "rec-business-store-ops",
      source_record_id: "BU-STORE-OPS",
      record_type: "business_function",
      dimension: "business_org_functions",
      payload: {
        function_name: "Store Operations",
        business_domain: "retail operations",
        owner: "COO",
        status: "active",
      },
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
      source_file:
        "family-1-enterprise-operating-model/F03_it-org-ownership.csv",
    },
  ],
  conflicts: [],
};

const skyharborPacket: HomeKnowPacket = {
  ...apexPacket,
  coverage: [
    ...apexPacket.coverage.map((row) => ({
      ...row,
      tenant_key: "skyharbor-air",
    })),
    {
      tenant_key: "skyharbor-air",
      dimension_id: "data_analytics_estate",
      dimension_label: "Data & Analytics Estate",
      record_count: 8,
      fact_count: 48,
      relationship_count: 12,
      source_count: 1,
      gap_count: 1,
      conflict_count: 0,
      last_loaded_at: "2026-06-23T00:00:00Z",
      trust_score: 88,
    },
    {
      tenant_key: "skyharbor-air",
      dimension_id: "infrastructure_cloud",
      dimension_label: "Infrastructure & Cloud",
      record_count: 6,
      fact_count: 36,
      relationship_count: 4,
      source_count: 1,
      gap_count: 1,
      conflict_count: 0,
      last_loaded_at: "2026-06-23T00:00:00Z",
      trust_score: 84,
    },
    {
      tenant_key: "skyharbor-air",
      dimension_id: "security_compliance",
      dimension_label: "Security & Compliance",
      record_count: 5,
      fact_count: 30,
      relationship_count: 2,
      source_count: 1,
      gap_count: 2,
      conflict_count: 0,
      last_loaded_at: "2026-06-23T00:00:00Z",
      trust_score: 82,
    },
    {
      tenant_key: "skyharbor-air",
      dimension_id: "initiatives_roadmap",
      dimension_label: "Initiatives & Roadmap",
      record_count: 12,
      fact_count: 72,
      relationship_count: 8,
      source_count: 1,
      gap_count: 2,
      conflict_count: 0,
      last_loaded_at: "2026-06-23T00:00:00Z",
      trust_score: 86,
    },
  ],
  org: apexPacket.org.map((row) => ({ ...row, tenant_key: "skyharbor-air" })),
  applications: [
    {
      tenant_key: "skyharbor-air",
      application_name: "Flight Operations Control",
      domain: "operations",
      primary_business_owner: "COO",
      technical_owner_team: "Operations Technology",
      technical_owner_role: "VP Operations Technology",
      criticality: "critical",
      annual_run_cost_usd: 8400000,
      source_file: "family-2-technology-estate/F05_applications-systems.csv",
      source_row_number: 5,
      confidence: 0.91,
    },
  ],
  vendors: [
    {
      tenant_key: "skyharbor-air",
      vendor_name: "Sabre",
      category: "airline operations",
      annual_spend_usd: 18000000,
      renewal_risk: "medium",
      business_owner: "COO",
      technology_owner: "Operations Technology",
      source_file:
        "family-4-financial-commercial/F11_vendors-contracts-licenses.csv",
      source_row_number: 4,
      confidence: 0.9,
    },
  ],
  budgets: [
    {
      tenant_key: "skyharbor-air",
      function_or_platform: "Operations Technology",
      run_budget_usd: 62000000,
      change_budget_usd: 28000000,
      ai_budget_usd: 3000000,
      owner_role: "VP Operations Technology",
      source_file: "family-4-financial-commercial/F12_it-budget-financials.csv",
      source_row_number: 3,
      confidence: 0.9,
    },
  ],
  relationships: [
    {
      tenant_key: "skyharbor-air",
      relationship_key: "sky-rel-1",
      relationship_type: "feeds",
      from_external_id: "SYS-FLIGHT-OPS",
      to_external_id: "DP-OPS-360",
      source_file: "family-3-data-connectivity/F10_integrations-interfaces.csv",
      source_row_number: 9,
      properties: { domain: "operations" },
    },
    {
      tenant_key: "skyharbor-air",
      relationship_key: "sky-rel-2",
      relationship_type: "supports",
      from_external_id: "VENDOR-SABRE",
      to_external_id: "SYS-FLIGHT-OPS",
      source_file:
        "family-4-financial-commercial/F11_vendors-contracts-licenses.csv",
      source_row_number: 4,
      properties: { domain: "operations" },
    },
  ],
  records: [
    {
      tenant_key: "skyharbor-air",
      canonical_record_id: "rec-sky-data-product",
      source_record_id: "DP-OPS-360",
      record_type: "data_product",
      dimension: "data_analytics_estate",
      payload: {
        data_product_name: "Operations 360 Data Product",
        domain: "operations",
        owning_team: "Operations Analytics",
        maturity: "silver",
      },
    },
    {
      tenant_key: "skyharbor-air",
      canonical_record_id: "rec-sky-system",
      source_record_id: "SYS-FLIGHT-OPS",
      record_type: "system_of_record",
      dimension: "applications_core_systems",
      payload: {
        system_name: "Flight Operations Control",
        business_capability: "irregular operations management",
        owner_team: "Operations Technology",
        lifecycle_status: "run",
      },
    },
    {
      tenant_key: "skyharbor-air",
      canonical_record_id: "rec-sky-initiative",
      source_record_id: "INIT-CONTACT-CENTER-AI",
      record_type: "initiative",
      dimension: "initiatives_roadmap",
      payload: {
        initiative_name: "Contact Center AI",
        business_impact: "front-office service productivity",
        risk_level: "medium",
        owning_team: "Customer Operations",
        status: "mobilize",
      },
    },
    {
      tenant_key: "skyharbor-air",
      canonical_record_id: "rec-sky-vendor",
      source_record_id: "VENDOR-SABRE",
      record_type: "vendor",
      dimension: "vendors_contracts",
      payload: {
        vendor_name: "Sabre",
        category: "airline operations",
      },
    },
  ],
  gaps: [
    {
      tenant_key: "skyharbor-air",
      dimension_id: "security_compliance",
      object_type: "control",
      expected_field: "severity",
      display_label: "Security gap severity",
      severity: "medium",
      missing_count: 1,
      source_file:
        "family-6-governance-ai-evidence/F16_security-risk-compliance.csv",
    },
  ],
  conflicts: [],
};

const loadedContextOverviewDossier = {
  tenantKey: "skyharbor-air",
  route: {
    question: "What context is loaded for this tenant?",
    requestedSurface: "home",
    targetSurface: "home",
    intent: "know",
    primaryDimension: "organization_leadership",
    relatedDimensions: [
      "application_systems",
      "vendor_contracts",
      "operations_process",
    ],
    requiredSources: [],
    artifactPlan: ["prose", "table", "chart", "graph"],
  },
  branchOptions: [
    {
      id: "org",
      label: "Leadership and org structure",
      dimensionKey: "organization_leadership",
      summary:
        "named executives, business functions, IT teams, budgets, and headcount",
      coverageScore: 0.92,
      confidence: 0.9,
      entityCount: 98,
      factCount: 640,
      relationshipCount: 140,
      citationCount: 8,
    },
    {
      id: "apps",
      label: "Application and systems estate",
      dimensionKey: "application_systems",
      summary:
        "applications, ownership joins, integrations, lifecycle, and criticality",
      coverageScore: 0.88,
      confidence: 0.86,
      entityCount: 900,
      factCount: 5400,
      relationshipCount: 1800,
      citationCount: 6,
    },
  ],
  sourceCoverage: [
    {
      sourceKey: "F03_it_org_ownership",
      loaded: true,
      count: 18,
      purpose: "IT organization and role accountability",
      required: true,
      dimensionFamily: "organization_leadership",
      binderRole: "primary",
    },
  ],
  dimensionSummary:
    "Leadership, organization, systems, vendors, operations, risk, and AI context are loaded.",
  sections: [
    {
      sectionKey: "it-org",
      title: "IT organization and role accountability",
      dimensionFamily: "organization_leadership",
      sourceKeys: ["F03_it_org_ownership"],
      summary: "Role-level leadership, teams, budget, and headcount.",
      recordCount: 18,
      sample: [],
    },
  ],
  facts: [],
  rollups: { namedExecutives: 12, itTeams: 18, applications: 900 },
  relationshipPaths: [
    {
      pathKey: "team-app",
      label: "Teams own applications",
      from: "org_team",
      relationship: "owns",
      to: "application",
      sourceKeys: ["context_relationships"],
      confidence: "high",
    },
  ],
  metrics: [
    {
      metricKey: "applications",
      label: "Applications",
      value: 900,
      sourceKeys: ["F05_applications_systems"],
    },
  ],
  gaps: [
    {
      gapKey: "role-person",
      label:
        "Some role-level technology accountabilities do not have named people attached.",
      impact: "Keeps Home from asserting a final HR reporting tree.",
      neededEvidence: ["Client-approved role-to-person mapping"],
    },
  ],
  citations: [
    {
      label: "IT organization and role accountability",
      sourceKey: "F03_it_org_ownership",
      count: 18,
    },
  ],
  artifactPlan: ["prose", "table", "chart", "graph"],
  answerBoundary: {
    canAnswer: ["what context is loaded", "role-level accountabilities"],
    cannotAnswer: ["final HR reporting hierarchy"],
    handoffTarget: null,
  },
  composerPacket: {
    question: "What context is loaded for this tenant?",
    tenantKey: "skyharbor-air",
    primaryDimension: "organization_leadership",
    relatedDimensions: [
      "application_systems",
      "vendor_contracts",
      "operations_process",
    ],
    dimensionSummary:
      "Leadership, organization, systems, vendors, operations, risk, and AI context are loaded.",
    sections: [],
    rollups: { namedExecutives: 12, itTeams: 18, applications: 900 },
    relationshipPaths: [],
    metrics: [],
    gaps: [],
    citations: [
      {
        label: "IT organization and role accountability",
        sourceKey: "F03_it_org_ownership",
        count: 18,
      },
    ],
    artifactPlan: ["prose", "table", "chart", "graph"],
    answerBoundary: {
      canAnswer: ["what context is loaded", "role-level accountabilities"],
      cannotAnswer: ["final HR reporting hierarchy"],
      handoffTarget: null,
    },
  },
  qualityFlags: [],
} satisfies UniversalDimensionDossier;

describe("Home KNOW contract engine", () => {
  it("keeps server intent authoritative", () => {
    expect(
      classifyHomeKnowIntent(
        "How is our IT team organized? Who leads the portfolios?",
      ),
    ).toBe("lookup");
    expect(classifyHomeKnowIntent("Where should we invest $30M?")).toBe(
      "decision_handoff",
    );
    expect(classifyHomeKnowIntent("Show this visually as a chart")).toBe(
      "chart",
    );
    expect(classifyHomeKnowIntent("Show the integration topology")).toBe(
      "chart",
    );
    expect(
      classifyHomeKnowIntent(
        "What will our exact cloud bill be in 2027, to the dollar?",
      ),
    ).toBe("gap");
  });

  it("routes every Home ask through Home KNOW so experts cannot leak", () => {
    expect(
      shouldUseHomeKnowAgentAnswer({
        query:
          "What would you tell our CIO is the riskiest assumption in the current plan?",
        surfaceContext: { activeTab: "home", clientKey: "apex-retail" },
      }),
    ).toBe(true);
    expect(
      shouldUseHomeKnowAgentAnswer({
        query:
          "What would you tell our CIO is the riskiest assumption in the current plan?",
        surfaceContext: { activeTab: "intelligence", clientKey: "apex-retail" },
      }),
    ).toBe(false);
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
      dimensionId: "IT Organization & Ownership",
    });
    expect(response.tables[0]?.rows[0]).toMatchObject({
      team_name: "Store Systems and POS",
      executive_owner_role: "VP Store Technology",
      annual_budget_usd: 210000000,
    });
    expect(response.citations[0]?.label).toContain(
      "F03_it-org-ownership.csv line 2",
    );
    expect(response.gaps[0]).toMatchObject({
      expectedField: "Executive Owner Person Name",
      displayLabel: "Named portfolio lead",
    });
    expect(response.safety).toMatchObject({
      serverValidated: true,
      blockedExperts: true,
      blockedDecisionFrames: true,
      blockedInternalCodes: true,
      frontendTripwireShouldFire: false,
    });
    expect(response.prose).not.toMatch(
      /\b(Read|Evidence|Implication|Next move):/,
    );
    expect(response.prose).not.toMatch(/^Home can show/i);
    assertNoForbiddenHomeText(response);
  });

  it("binds business functions and IT ownership for cross-dimension org questions", () => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "apex-retail",
      question:
        "How is our IT and business organized today, and who are the technology leaders under our CIO?",
      packet: apexPacket,
    });

    expect(response.dimensionsUsed).toEqual(
      expect.arrayContaining([
        "Business Functions",
        "IT Organization & Ownership",
      ]),
    );
    expect(response.tables.map((table) => table.id)).toEqual(
      expect.arrayContaining(["home-business-functions", "home-it-org"]),
    );
    expect(response.tables[0]?.rows[0]).toMatchObject({
      name: "Store Operations",
      owner: "COO",
    });
    expect(response.prose).toMatch(/business/i);
    expect(response.prose).not.toMatch(/cannot be characterized/i);
    expect(response.prose).not.toMatch(/cannot be identified/i);
    expect(response.prose).not.toMatch(/^I found/i);
    expect(response.prose).not.toMatch(/^.*rows/i);
    expect(response.prose).not.toMatch(/^missing source support/i);
    expect(response.prose).not.toMatch(
      /\b(Read|Evidence|Implication|Next move):/,
    );
    expect(response.prose).not.toMatch(/\b[A-Z]{2,}-[A-Z0-9-]+-\d+\b/);
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
    expect(response.prose).toContain("accountable recommendation");
    expect(response.charts).toEqual([]);
    expect(response.safety.frontendTripwireShouldFire).toBe(false);
    expect(response.prose).not.toMatch(
      /\b(Read|Evidence|Implication|Next move):/,
    );
  });

  it("returns no_data instead of bluffing when a subject is absent", () => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "apex-retail",
      question: "Which vendors support data platforms?",
      packet: { ...apexPacket, vendors: [], gaps: [] },
    });

    expect(response.intent).toBe("table");
    expect(response.answerStatus).toBe("no_data");
    expect(response.prose).toMatch(/specific source fields/i);
    expect(response.prose.length).toBeGreaterThan(120);
    expect(response.tables[0]?.id).toBe("home-vendor-landscape");
    expect(response.tables[0]?.rows).toEqual([]);
  });

  it("refuses exact unknowable questions with a specific gap instead of generic coverage", () => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "apex-retail",
      question: "What will our exact cloud bill be in 2027, to the dollar?",
      packet: apexPacket,
    });

    expect(response.intent).toBe("gap");
    expect(response.answerStatus).toBe("partial");
    expect(response.prose).toMatch(/can't give that exact value/i);
    expect(response.prose).toMatch(/2027 cloud-cost forecast/i);
    expect(response.prose).not.toMatch(
      /\b(Read|Evidence|Implication|Next move):/,
    );
    expect(response.prose).not.toMatch(/Home context for .* includes .* row/i);
    expect(response.tables).toEqual([]);
    expect(response.gaps[0]).toMatchObject({
      expectedField: "Forecast Cloud Bill 2027 Usd",
      displayLabel: "2027 cloud bill by account/provider",
    });
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
      type: "cost_stack",
      dimensionId: "IT Budget & Financials",
    });
    expect(response.charts[0]?.data).toEqual([
      { label: "Run", value: 130200000, color: expect.any(String) },
      { label: "Change", value: 71400000, color: expect.any(String) },
      { label: "AI", value: 650000, color: expect.any(String) },
    ]);
  });

  it("emits deterministic graph data from relationship rows", () => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "apex-retail",
      question: "Show the integration topology between our systems.",
      packet: apexPacket,
    });

    expect(response.intent).toBe("chart");
    expect(response.graphs[0]).toMatchObject({
      id: "home-relationship-graph",
      confidence: "high",
      inferredEdges: false,
    });
    expect(response.graphs[0]?.nodes.map((node) => node.label)).toEqual(
      expect.arrayContaining([
        "Oracle Retail Merchandising",
        "Store Systems and POS",
      ]),
    );
    expect(response.graphs[0]?.edges[0]).toMatchObject({
      from: "node-1",
      to: "node-2",
      type: "Supports",
    });
  });

  it("returns a graph artifact with a specific gap instead of a blank graph answer", () => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "apex-retail",
      question:
        "Show the relationship graph between vendors and the systems they support.",
      packet: {
        ...apexPacket,
        relationships: [],
      },
    });

    expect(response.intent).toBe("chart");
    expect(response.graphs).toHaveLength(1);
    expect(response.graphs[0]).toMatchObject({
      id: "home-relationship-graph",
      confidence: "low",
      inferredEdges: false,
    });
    expect(response.graphs[0]?.gaps[0]).toMatch(
      /source-to-target integration edges missing/i,
    );
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
      graphs: [],
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
    expect(response.prose).not.toMatch(
      /DORA|Wave-0|local env|APX-APP|the cited record/i,
    );
    expect(response.prose).not.toMatch(
      /\b(Read|Evidence|Implication|Next move):/,
    );
  });

  it("does not replace grounded Home prose just because it mentions operating decisions", () => {
    const response = validateHomeKnowResponse({
      mode: "KNOW",
      tenantKey: "lakeshore",
      question:
        "What do we know about Lakeshore's IT and business organization today?",
      intent: "lookup",
      answerStatus: "partial",
      prose:
        "Lakeshore Holdings' available material supports a portfolio-led view of IT and business organization. Technology accountability is visible across business functions, IT domains, application ownership, and executive role-level leadership. The available sources do not show a specific gap for this question, though final operating decisions still need client validation.",
      dimensionsUsed: ["organization_leadership"],
      facts: [],
      tables: [
        {
          id: "question-source-coverage",
          title: "Source coverage for this question",
          dimensionId: "organization_leadership",
          columns: [{ key: "section", label: "Section" }],
          rows: [{ section: "IT organization and role accountability" }],
          citationIds: ["c1"],
        },
      ],
      charts: [],
      graphs: [],
      gaps: [],
      conflicts: [],
      citations: [
        {
          id: "c1",
          label: "IT organization and role accountability",
          sourceClass: "tenant-source-file",
        },
      ],
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

    expect(response.prose).toMatch(/portfolio-led view/i);
    expect(response.prose).not.toMatch(
      /Here is what is loaded|I do not see that in the loaded data|dossier|binder|no blocking gap/i,
    );
    expect(response.safety.frontendTripwireShouldFire).toBe(false);
  });

  it("does not rewrite valid source-context prose when factsBound is zero but other evidence channels are populated", () => {
    const response = validateHomeKnowResponse({
      mode: "KNOW",
      tenantKey: "lakeshore",
      question: "Which systems and applications are loaded for Lakeshore?",
      intent: "lookup",
      answerStatus: "answered",
      prose:
        "Lakeshore Holdings' application systems material is strong enough to answer from source support. The application table, domain chart, relationship graph, and source records show how applications connect to business domains.",
      dimensionsUsed: ["application_systems"],
      facts: [],
      tables: [
        {
          id: "question-source-coverage",
          title: "Source coverage for this question",
          dimensionId: "application_systems",
          columns: [{ key: "section", label: "Section" }],
          rows: [{ section: "Applications and systems" }],
          citationIds: ["c1"],
        },
      ],
      charts: [
        {
          id: "apps-by-domain",
          title: "Apps by domain",
          kind: "bar",
          type: "bar",
          dimensionId: "application_systems",
          data: [{ label: "Finance", value: 12 }],
          sourceIds: ["F05"],
          citationIds: ["c1"],
          caveats: [],
          status: "tenant-fact",
        },
      ],
      graphs: [
        {
          id: "app-ownership",
          title: "App ownership",
          nodes: [
            { id: "app", label: "ERP", type: "application" },
            { id: "team", label: "Finance IT", type: "team" },
          ],
          edges: [{ from: "app", to: "team", label: "owned by", type: "owns" }],
          nodeTypes: ["application", "team"],
          edgeTypes: ["owns"],
          sourceIds: ["F19"],
          citationIds: ["c1"],
          confidence: "high",
          gaps: [],
          inferredEdges: false,
        },
      ],
      gaps: [],
      conflicts: [],
      citations: [
        {
          id: "c1",
          label: "Applications and systems",
          sourceClass: "tenant-source-file",
        },
      ],
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

    expect(response.prose).toMatch(/application systems material/i);
    expect(response.prose).not.toMatch(
      /Here is what is loaded|I do not see that in the loaded data/i,
    );
    expect(response.safety.usableEvidence).toBe(true);
    expect(response.safety.evidenceChannels).toMatchObject({
      facts: 0,
      tables: 1,
      charts: 1,
      graphs: 1,
      citations: 1,
    });
    expect(response.safety.frontendTripwireShouldFire).toBe(false);
  });

  it("renders loaded-context overview as branch-first navigation instead of an artifact dump", () => {
    const response = buildHomeKnowResponseFromDossier({
      tenantKey: "skyharbor-air",
      question: "What context is loaded for this tenant?",
      dossier: loadedContextOverviewDossier,
    });

    expect(response.intent).toBe("browse");
    expect(response.prose).toMatch(/Where do you want to go deeper/i);
    expect(response.prose).toMatch(/Leadership and org structure/i);
    expect(response.prose).toMatch(/Application and systems estate/i);
    expect(response.prose).toMatch(/Airline Demo|Skyharbor Air|SkyHarbor Air/i);
    expect(response.tables).toEqual([]);
    expect(response.charts).toEqual([]);
    expect(response.graphs).toEqual([]);
    expect(response.prose).not.toMatch(
      /Here is what is loaded|records can characterize|tenant-chunk|source rows|no blocking gap/i,
    );
  });

  it("hands recommendation questions to Intelligence rather than erasing the grounded Home answer path", () => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "skyharbor-air",
      question: "Where should SkyHarbor invest next in AI?",
      packet: skyharborPacket,
    });

    expect(response.intent).toBe("decision_handoff");
    expect(response.answerStatus).toBe("handoff");
    expect(response.handoff?.target).toBe("intelligence");
    expect(response.prose).toMatch(/supporting facts|decision work/i);
  });

  it.each([
    "Show our data products in a table with domain and owning team.",
    "Give me a table comparing our top three initiatives on impact, risk, and owner.",
    "List our systems of record in a table with the business capability each supports.",
    "Table our IT budget by category with run vs change split.",
  ])("keeps SkyHarbor table artifact prompts nonblank: %s", (question) => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "skyharbor-air",
      question,
      packet: skyharborPacket,
    });

    expect(response.prose.trim().length).toBeGreaterThan(0);
    expect(response.tables.length).toBeGreaterThan(0);
    expect(response.citations.length).toBeGreaterThan(0);
    assertNoForbiddenHomeText(response);
  });

  it.each([
    "Visualize how the next $30M would be allocated across the top bets.",
    "Visualize vendor spend concentration across our top contracts.",
    "Chart the adoption curve we should expect for the contact-center / front-office AI bet.",
  ])("keeps SkyHarbor chart artifact prompts nonblank: %s", (question) => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "skyharbor-air",
      question,
      packet: skyharborPacket,
    });

    expect(response.prose.trim().length).toBeGreaterThan(0);
    expect(response.charts.length).toBeGreaterThan(0);
    expect(response.citations.length).toBeGreaterThan(0);
    assertNoForbiddenHomeText(response);
  });

  it.each([
    "Show me the dependency graph of our core systems.",
    "Map the relationships between our data products and the systems that feed them.",
    "Show the relationship graph between vendors and the systems they support.",
  ])("keeps SkyHarbor graph artifact prompts nonblank: %s", (question) => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "skyharbor-air",
      question,
      packet: skyharborPacket,
    });

    expect(response.prose.trim().length).toBeGreaterThan(0);
    expect(response.graphs.length).toBeGreaterThan(0);
    expect(response.citations.length).toBeGreaterThan(0);
    assertNoForbiddenHomeText(response);
  });

  it.each([
    "What will our exact cloud bill be in 2027, to the dollar?",
    "Tell me the exact date our lakehouse migration completes.",
    "Give me the precise headcount of our data engineering team next quarter.",
  ])("keeps SkyHarbor exact questions honest and nonblank: %s", (question) => {
    const response = buildHomeKnowResponseFromPacket({
      tenantKey: "skyharbor-air",
      question,
      packet: skyharborPacket,
    });

    expect(response.prose.trim().length).toBeGreaterThan(0);
    expect(response.answerStatus).not.toBe("answered");
    expect(response.gaps.length).toBeGreaterThan(0);
    expect(response.prose).toMatch(/can't give that exact value/i);
    assertNoForbiddenHomeText(response);
  });
});

function assertNoForbiddenHomeText(response: HomeKnowResponse) {
  const publicText = JSON.stringify(response);
  expect(publicText).not.toMatch(
    /experts?_consulted|DORA|Wave-0|kill criteria|90-day pilot|local env|org_topology unavailable|clinical process/i,
  );
}
