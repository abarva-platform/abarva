import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { loadSourceV4WorkspaceSnapshot } from "@/lib/source/data-model/source-v4-workspace-snapshot";
import { isCuratedDossierNonFallbackError, loadCuratedSemanticDossier } from "@/lib/semantic-dossiers";

import { buildHomeKnowResponse } from "../home-know-engine";

jest.mock("@/lib/semantic-dossiers", () => ({
  isCuratedDossierNonFallbackError: jest.fn(),
  loadCuratedSemanticDossier: jest.fn(),
}));

jest.mock("@/lib/features/is-feature-enabled", () => ({
  isFeatureEnabled: jest.fn(),
}));

jest.mock("@/lib/source/data-model/source-v4-workspace-snapshot", () => ({
  loadSourceV4WorkspaceSnapshot: jest.fn(),
}));

jest.mock("@/lib/data-plane/postgresCompat", () => ({
  getAzureReadFluentClient: jest.fn(),
}));

const tableData: Record<string, unknown[]> = {
  mv_home_dimension_coverage_view: [
    {
      tenant_key: "meridian-health",
      dimension_id: "it_budget_financials",
      dimension_label: "IT budget and financials",
      record_count: 1,
      fact_count: 4,
      relationship_count: 0,
      source_count: 1,
      gap_count: 0,
      conflict_count: 0,
      last_loaded_at: "2026-09-02T00:00:00Z",
      trust_score: 92,
    },
  ],
  mv_home_it_org_view: [],
  mv_home_application_ownership_view: [
    {
      tenant_key: "meridian-health",
      application_name: "Epic Hyperspace Production",
      domain: "Clinical operations",
      primary_business_owner: "Clinical Operations",
      technical_owner_team: "Clinical Systems",
      technical_owner_role: "VP Clinical Systems",
      criticality: "critical",
      annual_run_cost_usd: 43000000,
      source_file: "04_applications_systems.csv",
      source_row_number: 2,
      confidence: 0.9,
    },
  ],
  mv_home_vendor_landscape_view: [],
  mv_home_budget_by_portfolio_view: [
    {
      tenant_key: "meridian-health",
      function_or_platform: "Clinical Systems",
      run_budget_usd: 43000000,
      change_budget_usd: 12000000,
      ai_budget_usd: 2500000,
      owner_role: "VP Clinical Systems",
      source_file: "08_spend_value.csv",
      source_row_number: 3,
      confidence: 0.9,
    },
  ],
  enterprise_context_relationships: [],
  enterprise_context_records: [],
  mv_home_gap_register_view: [],
  mv_home_conflict_register_view: [],
};

function mockReadClient() {
  return {
    from(table: string) {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async limit() {
          return { data: tableData[table] ?? [], error: null };
        },
      };
    },
  };
}

describe("buildHomeKnowResponse current packet fallback", () => {
  beforeEach(() => {
    jest.mocked(loadCuratedSemanticDossier).mockRejectedValue(new Error("No active curated dossier found."));
    jest.mocked(isCuratedDossierNonFallbackError).mockReturnValue(true);
    jest.mocked(isFeatureEnabled).mockReturnValue(false);
    jest.mocked(loadSourceV4WorkspaceSnapshot).mockResolvedValue(null as never);
    jest.mocked(getAzureReadFluentClient).mockReturnValue(mockReadClient() as never);
  });

  it("uses the current Home read model when the curated advisor dossier is unavailable", async () => {
    const response = await buildHomeKnowResponse({
      tenantKey: "meridian-health",
      client: "meridian",
      question:
        "I'm on Technology & Data, but tell me what the CFO should care about.",
    });

    expect(response.answerStatus).not.toBe("blocked");
    expect(response.prose).not.toContain("needs to be refreshed");
    expect(response.tables.length).toBeGreaterThan(0);
    expect(response.citations.length).toBeGreaterThan(0);
    expect(
      response.citations.some(
        (citation) => citation.sourceFile === "08_spend_value.csv",
      ),
    ).toBe(true);
    expect(response.gaps.some((gap) => gap.message.includes("curated advisor context file"))).toBe(true);
    expect(response.safety.composerTrace?.fallbackUsed).toBe(true);
  });

  it("binds executive smoke questions to current read-model dimensions", async () => {
    const questions = [
      "I'm on Technology & Data, but tell me what the CFO should care about.",
      "Where are we commercially exposed, and what evidence supports that?",
      "What should leadership address first before a Friday CXO walkthrough?",
      "What could mislead a board reader on this page?",
      "What do we know about the business, not just the technology?",
    ];

    for (const question of questions) {
      const response = await buildHomeKnowResponse({
        tenantKey: "meridian-health",
        client: "meridian",
        question,
      });

      expect(response.answerStatus).not.toBe("blocked");
      expect(response.answerStatus).not.toBe("no_data");
      expect(response.dimensionsUsed.length).toBeGreaterThan(0);
      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.prose).not.toMatch(/adjacent to the question|try rephrasing/i);
    }
  });
});
