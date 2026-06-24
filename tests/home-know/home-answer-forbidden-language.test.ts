import {
  homeAnswerQualityViolations,
  repairHomeAnswerQuality,
} from "@/lib/home/know/home-answer-quality-gate";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";

function responseWithProse(prose: string): HomeKnowResponse {
  return {
    mode: "KNOW",
    tenantKey: "skyharbor-air",
    question:
      "how is our IT and business organized today? who are our technology leaders under our CIO?",
    intent: "lookup",
    answerStatus: "partial",
    prose,
    dimensionsUsed: ["business_org_functions", "it_org_ownership"],
    facts: [],
    tables: [
      {
        id: "home-business-functions",
        title: "Business Functions and Operating Model",
        dimensionId: "business_org_functions",
        columns: [{ key: "name", label: "Name" }],
        rows: [{ name: "Airport Operations" }],
        citationIds: ["c1"],
      },
      {
        id: "home-it-org",
        title: "IT Organization",
        dimensionId: "it_org_ownership",
        columns: [{ key: "team_name", label: "Team" }],
        rows: [{ team_name: "Operations Technology" }],
        citationIds: ["c2"],
      },
    ],
    charts: [],
    graphs: [],
    gaps: [
      {
        id: "gap-1",
        dimensionId: "it_org_ownership",
        objectType: "technology_portfolio",
        expectedField: "executive_owner_person_name",
        displayLabel: "Named technology leader",
        message: "Named individual leader is not loaded.",
        severity: "medium",
        citationIds: ["c2"],
      },
    ],
    conflicts: [],
    citations: [],
    handoff: null,
    safety: {
      serverValidated: true,
      blockedExperts: true,
      blockedDecisionFrames: true,
      blockedInternalCodes: true,
      unsupportedClaimsRemoved: 0,
      frontendTripwireShouldFire: false,
    },
  };
}

describe("Home answer forbidden-language gate", () => {
  it.each([
    [
      "false_absence",
      "The organizational structure of IT and business functions cannot be characterized from the available information.",
    ],
    [
      "false_absence",
      "Technology leaders reporting to the CIO cannot be identified from the loaded data.",
    ],
    ["row_count_lead", "I found 38 IT org rows and 500 application rows."],
    ["missing_support_lead", "Missing source support includes named leaders."],
    [
      "irrelevant_contract_owner",
      "The named contract owner is not loaded for this org question.",
    ],
    ["debug_language", "Read: Current-state read uses Evidence points."],
  ])("detects %s", (expected, prose) => {
    expect(homeAnswerQualityViolations(responseWithProse(prose))).toContain(
      expected,
    );
  });

  it("repairs the exact org false-refusal into role/domain synthesis", () => {
    const repaired = repairHomeAnswerQuality(
      responseWithProse(
        "The organizational structure of IT and business functions cannot be characterized from the available information.",
      ),
    );

    expect(repaired.prose).toMatch(/portfolio-led view/i);
    expect(repaired.prose).toMatch(/role, domain, and portfolio/i);
    expect(repaired.prose).toMatch(/named individual leaders under the CIO/i);
    expect(repaired.prose).not.toMatch(
      /cannot be characterized|cannot be identified|I found|rows|missing source support|named contract owner|Read:|Evidence:/i,
    );
    expect(repaired.safety.unsupportedClaimsRemoved).toBeGreaterThan(0);
  });
});
