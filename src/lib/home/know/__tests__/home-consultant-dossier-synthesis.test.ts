import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";
import type { UniversalDimensionDossier } from "@/lib/semantic-dossiers";

import {
  type HomeConsultantDossierSynthesisOutput,
  buildHomeConsultantDossierPromptPacket,
  isHomeConsultantSynthesisResult,
  synthesizeHomeConsultantDossier,
  validateHomeConsultantSynthesis,
} from "../home-consultant-dossier-synthesis";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const mockGetAuditedAnthropicClient =
  getAuditedAnthropicClient as jest.MockedFunction<
    typeof getAuditedAnthropicClient
  >;

const dossier = {
  tenantKey: "skyharbor",
  route: {
    question: "Which systems and applications are loaded?",
    requestedSurface: "home",
    targetSurface: "home",
    intent: "know",
    primaryDimension: "application_systems",
    relatedDimensions: ["vendor_contracts", "organization_leadership"],
    requiredSources: [],
    artifactPlan: ["prose", "table", "chart", "graph"],
  },
  sourceCoverage: [
    {
      sourceKey: "F05_applications_systems",
      loaded: true,
      count: 2,
      purpose: "applications",
      required: true,
      dimensionFamily: "application_systems",
    },
  ],
  dimensionSummary: "Application estate with ownership and domain coverage.",
  sections: [
    {
      sectionKey: "apps",
      title: "Applications",
      dimensionFamily: "application_systems",
      sourceKeys: ["F05_applications_systems"],
      summary: "Applications by domain and ownership.",
      recordCount: 2,
      sample: [{ application_name: "Flight Ops", domain: "Operations" }],
    },
  ],
  facts: [],
  rollups: { applicationCount: 2 },
  relationshipPaths: [
    {
      pathKey: "apps-to-teams",
      label: "Applications connect to owner teams",
      from: "application",
      relationship: "owned by",
      to: "team",
      sourceKeys: ["F19_team_application_ownership"],
      confidence: "high",
    },
  ],
  metrics: [{ metricKey: "apps", label: "Applications", value: 2, sourceKeys: ["F05_applications_systems"] }],
  gaps: [
    {
      gapKey: "cmdb",
      label: "CMDB/service-map coverage is incomplete.",
      impact: "Limits operational dependency precision.",
      neededEvidence: ["CMDB service map"],
    },
  ],
  citations: [{ label: "Applications", sourceKey: "F05_applications_systems", count: 2 }],
  artifactPlan: ["prose", "table", "chart", "graph"],
  answerBoundary: { canAnswer: ["application estate"], cannotAnswer: ["future investment"], handoffTarget: null },
  composerPacket: {
    question: "Which systems and applications are loaded?",
    tenantKey: "skyharbor",
    primaryDimension: "application_systems",
    relatedDimensions: ["vendor_contracts", "organization_leadership"],
    dimensionSummary: "Application estate with ownership and domain coverage.",
    sections: [],
    rollups: { applicationCount: 2 },
    relationshipPaths: [],
    metrics: [],
    gaps: [],
    citations: [{ label: "Applications", sourceKey: "F05_applications_systems", count: 2 }],
    artifactPlan: ["prose", "table", "chart", "graph"],
    answerBoundary: { canAnswer: ["application estate"], cannotAnswer: ["future investment"], handoffTarget: null },
  },
  qualityFlags: [],
} satisfies UniversalDimensionDossier;

const response: HomeKnowResponse = {
  mode: "KNOW",
  tenantKey: "skyharbor",
  question: "Which systems and applications are loaded?",
  intent: "lookup",
  answerStatus: "partial",
  prose: "SkyHarbor's application context is strong enough to answer.",
  dimensionsUsed: ["application_systems"],
  facts: [],
  tables: [
    {
      id: "apps",
      title: "Applications",
      dimensionId: "application_systems",
      columns: [{ key: "name", label: "Name" }],
      rows: [{ name: "Flight Ops" }],
      citationIds: ["c1"],
    },
  ],
  charts: [],
  graphs: [],
  gaps: [],
  conflicts: [],
  citations: [{ id: "c1", label: "Applications", sourceClass: "tenant-source-file" }],
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

function mockClaudeJson(value: unknown) {
  mockGetAuditedAnthropicClient.mockResolvedValue({
    auditId: "audit-1",
    dataClass: "confidential",
    client: {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: "text", text: JSON.stringify(value) }],
        }),
      },
    },
  } as never);
}

describe("home consultant dossier synthesis", () => {
  const oldEnv = process.env.HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED;

  beforeEach(() => {
    mockGetAuditedAnthropicClient.mockReset();
    process.env.HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED = "true";
  });

  afterEach(() => {
    if (oldEnv === undefined) {
      delete process.env.HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED;
    } else {
      process.env.HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED = oldEnv;
    }
  });

  it("builds a bounded prompt packet with evidence channels and dimension style", () => {
    const packet = buildHomeConsultantDossierPromptPacket({ dossier, response });

    expect(packet.mode).toBe("home_know");
    expect(packet.primaryDimension).toBe("application_systems");
    expect(packet.dimensionStyle).toEqual(expect.arrayContaining(["lead with application estate shape"]));
    expect(packet.evidenceChannels).toMatchObject({
      facts: 0,
      tables: 1,
      citations: 1,
      sourceCoverage: 1,
      sections: 1,
    });
  });

  it("returns consultant synthesis when Claude stays inside the dossier contract", async () => {
    mockClaudeJson({
      directAnswer: "SkyHarbor's loaded application estate supports a domain-led view of systems and ownership.",
      currentStateSynthesis: "The context connects applications to domains and owner teams, so Home can explain the estate shape without inventing missing CMDB detail.",
      businessImplication: "The practical implication is that application rationalization can start from domain and ownership views while service-map precision is completed.",
      specificGaps: [
        {
          gap: "CMDB/service-map coverage is incomplete",
          whyItMatters: "It limits operational dependency precision.",
          sourceEvidence: "F05_applications_systems",
        },
      ],
      safeAnswerBoundary: {
        canSay: ["application estate shape"],
        cannotSay: ["future investment priority"],
        handoffTarget: null,
      },
      artifactNarrative: {
        tableIntro: "Use the table for app/domain coverage.",
        chartIntro: "Use the chart for estate distribution.",
        graphIntro: "Use the graph for ownership paths.",
      },
      citationRefsUsed: ["F05_applications_systems"],
      confidence: { level: "medium", reason: "Application evidence is present; CMDB detail is partial." },
    });

    const result = await synthesizeHomeConsultantDossier({
      dossier,
      deterministicResponse: response,
    });

    expect(isHomeConsultantSynthesisResult(result)).toBe(true);
    expect(result && "output" in result ? result.output.directAnswer : "").toMatch(
      /domain-led view/i,
    );
  });

  it("falls back when Claude returns forbidden false-absence language", async () => {
    const output: HomeConsultantDossierSynthesisOutput = {
      directAnswer: "The application estate cannot be characterized from the available data.",
      currentStateSynthesis: "No synthesis.",
      businessImplication: "No implication.",
      specificGaps: [],
      safeAnswerBoundary: { canSay: [], cannotSay: [], handoffTarget: null },
      artifactNarrative: { tableIntro: "", chartIntro: "", graphIntro: "" },
      citationRefsUsed: ["F05_applications_systems"],
      confidence: { level: "low", reason: "bad" },
    };

    expect(
      validateHomeConsultantSynthesis({ output, dossier, response }),
    ).toContain("forbidden_language");
  });

  it("does not call Claude when the env gate is disabled", async () => {
    process.env.HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED = "false";

    await expect(
      synthesizeHomeConsultantDossier({ dossier, deterministicResponse: response }),
    ).resolves.toMatchObject({
      attempted: true,
      used: false,
      reason: "env_disabled",
    });
    expect(mockGetAuditedAnthropicClient).not.toHaveBeenCalled();
  });
});
