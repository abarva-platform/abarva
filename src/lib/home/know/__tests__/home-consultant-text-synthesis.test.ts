import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { HomeKnowResponse } from "@/lib/home/know/home-know-contract";
import type { UniversalDimensionDossier } from "@/lib/semantic-dossiers";

import {
  applyHomeConsultantTextSynthesis,
  applyHomeConsultantTextSynthesisFailureTrace,
  buildHomeConsultantTextPromptPacket,
  isHomeConsultantTextSynthesisResult,
  normalizeHomeConsultantUserFacingText,
  renderHomeConsultantTextUserPrompt,
  synthesizeHomeConsultantText,
  validateHomeConsultantText,
} from "../home-consultant-text-synthesis";

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
  branchOptions: [
    {
      id: "applications",
      label: "Application and systems estate",
      dimensionKey: "application_systems",
      summary: "applications, ownership, and domain coverage",
      coverageScore: 0.91,
      confidence: 0.9,
      entityCount: 2,
      factCount: 12,
      relationshipCount: 1,
      citationCount: 1,
    },
  ],
  sourceCoverage: [
    {
      sourceKey: "F05_applications_systems",
      loaded: true,
      count: 2,
      purpose: "applications",
      required: true,
      dimensionFamily: "application_systems",
      binderRole: "primary",
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
  metrics: [
    {
      metricKey: "apps",
      label: "Applications",
      value: 2,
      sourceKeys: ["F05_applications_systems"],
    },
  ],
  gaps: [
    {
      gapKey: "cmdb",
      label: "CMDB/service-map coverage is incomplete.",
      impact: "Limits operational dependency precision.",
      neededEvidence: ["CMDB service map"],
    },
  ],
  citations: [
    { label: "Applications", sourceKey: "F05_applications_systems", count: 2 },
  ],
  artifactPlan: ["prose", "table", "chart", "graph"],
  answerBoundary: {
    canAnswer: ["application estate"],
    cannotAnswer: ["future investment"],
    handoffTarget: null,
  },
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
    citations: [
      {
        label: "Applications",
        sourceKey: "F05_applications_systems",
        count: 2,
      },
    ],
    artifactPlan: ["prose", "table", "chart", "graph"],
    answerBoundary: {
      canAnswer: ["application estate"],
      cannotAnswer: ["future investment"],
      handoffTarget: null,
    },
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
  charts: [
    {
      id: "chart",
      title: "Applications by domain",
      kind: "bar",
      type: "bar",
      dimensionId: "application_systems",
      data: [{ label: "Operations", value: 2 }],
      sourceIds: ["F05_applications_systems"],
      citationIds: ["c1"],
      caveats: [],
      status: "tenant-fact",
    },
  ],
  graphs: [],
  gaps: [],
  conflicts: [],
  citations: [
    { id: "c1", label: "Applications", sourceClass: "tenant-source-file" },
  ],
  handoff: null,
  safety: {
    serverValidated: true,
    blockedExperts: true,
    blockedDecisionFrames: true,
    blockedInternalCodes: true,
    unsupportedClaimsRemoved: 0,
    frontendTripwireShouldFire: false,
    composerTrace: {
      route: "/api/home/know/ask",
      composer: "golden_home_know_semantic_synthesis",
      goldenComposerAttempted: true,
      goldenComposerUsed: true,
      fallbackUsed: false,
      dimensionsUsed: ["application_systems"],
      factsBound: 0,
      tablesBound: 1,
      chartsBound: 1,
      graphsBound: 0,
      citationsBound: 1,
      gapsBound: 0,
      answerStatus: "partial",
    },
  },
};

function mockClaudeText(text: string, delayMs = 0) {
  const finalMessage = jest.fn(async () => {
    if (delayMs > 0)
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    return {
      content: [{ type: "text", text }],
    };
  });
  mockGetAuditedAnthropicClient.mockResolvedValue({
    auditId: "audit-1",
    dataClass: "confidential",
    client: {
      messages: {
        stream: jest.fn(() => ({ finalMessage })),
      },
    },
  } as never);
}

describe("home consultant text synthesis", () => {
  const oldEnv = {
    enabled: process.env.HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED,
    timeout: process.env.HOME_KNOW_CLAUDE_TIMEOUT_MS,
    maxTokens: process.env.HOME_KNOW_CLAUDE_MAX_TOKENS,
  };

  beforeEach(() => {
    mockGetAuditedAnthropicClient.mockReset();
    process.env.HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED = "true";
    delete process.env.HOME_KNOW_CLAUDE_TIMEOUT_MS;
    delete process.env.HOME_KNOW_CLAUDE_MAX_TOKENS;
  });

  afterEach(() => {
    restoreEnv("HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED", oldEnv.enabled);
    restoreEnv("HOME_KNOW_CLAUDE_TIMEOUT_MS", oldEnv.timeout);
    restoreEnv("HOME_KNOW_CLAUDE_MAX_TOKENS", oldEnv.maxTokens);
  });

  it("builds a text prompt with all dossier evidence channels", () => {
    const packet = buildHomeConsultantTextPromptPacket({ dossier, response });
    const prompt = renderHomeConsultantTextUserPrompt(packet);

    expect(packet.outputMode).toBe("text");
    expect(prompt).toContain("Relevant sections:");
    expect(prompt).toContain("Computed rollups:");
    expect(prompt).toContain("Relevant tables:");
    expect(prompt).toContain("Relevant charts:");
    expect(prompt).toContain("Relevant graphs / operating connections:");
    expect(prompt).toContain("Branch options for overview questions:");
    expect(prompt).toContain("Application and systems estate");
    expect(prompt).toContain("Citation labels available:");
    expect(prompt).toContain("Source confidence:");
    expect(prompt).toContain("Safe answer scope:");
    expect(prompt).toContain("Return plain text only.");
    expect(prompt).not.toContain("Evidence strength:");
    expect(prompt).not.toContain("Answer boundary:");
    expect(prompt).not.toContain(" rows;");
    expect(prompt).not.toContain("needed evidence:");
  });

  it("accepts Claude prose output", async () => {
    mockClaudeText(
      "SkyHarbor's loaded application estate supports a domain-led view of systems and ownership.\n\nHome can explain the current estate shape from application, domain, ownership, and citation evidence while noting that CMDB/service-map coverage remains incomplete.",
    );

    const result = await synthesizeHomeConsultantText({
      dossier,
      deterministicResponse: response,
    });

    expect(isHomeConsultantTextSynthesisResult(result)).toBe(true);
    expect(result && "text" in result ? result.text : "").toMatch(
      /domain-led view/i,
    );
    expect(result && "text" in result ? result.text : "").not.toMatch(
      /\bevidence\b/i,
    );
  });

  it("captures the verbatim Anthropic boundary when operator trace is enabled", async () => {
    mockClaudeText(
      "SkyHarbor's application estate supports a domain-led view of systems and ownership.\n\nHome can explain the current estate shape from application, domain, ownership, and source support while noting that service-map coverage remains incomplete.",
    );

    const result = await synthesizeHomeConsultantText({
      dossier,
      deterministicResponse: response,
      operatorTrace: true,
    });

    expect(isHomeConsultantTextSynthesisResult(result)).toBe(true);
    if (!isHomeConsultantTextSynthesisResult(result))
      throw new Error("expected synthesis");
    expect(result.trace.anthropicTrace).toMatchObject({
      model: expect.any(String),
      params: {
        max_tokens: 25_000,
        timeoutMs: expect.any(Number),
      },
      finalPrompt: {
        requestJson: expect.any(String),
        promptByteLength: expect.any(Number),
        promptSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      },
      claudeRaw: {
        text: expect.stringContaining("domain-led view"),
      },
    });
    expect(result.trace.anthropicTrace?.finalPrompt.messages).toEqual([
      expect.objectContaining({ role: "user", content: expect.any(String) }),
    ]);
    expect(result.trace.anthropicTrace?.finalPrompt.requestJson).toContain(
      '"messages"',
    );
  });

  it("selects Claude prose over deterministic fallback when valid", async () => {
    mockClaudeText(
      "SkyHarbor's loaded application evidence supports a domain-led view of the technology estate.\n\nThe practical implication is that Home can describe current application ownership and domain structure while keeping future investment decisions in Intelligence.",
    );

    const result = await synthesizeHomeConsultantText({
      dossier,
      deterministicResponse: response,
    });

    expect(isHomeConsultantTextSynthesisResult(result)).toBe(true);
    if (!isHomeConsultantTextSynthesisResult(result))
      throw new Error("expected synthesis");
    const selected = applyHomeConsultantTextSynthesis(response, result);
    expect(selected.prose).toContain("domain-led view");
    expect(selected.prose).toContain("source support gives");
    expect(selected.prose).not.toMatch(/\bevidence\b/i);
    expect(selected.prose).not.toMatch(/semantic|loaded context|source context|rows/i);
    expect(selected.safety.composerTrace?.composer).toBe(
      "claude_text_synthesis",
    );
    expect(selected.tables).toHaveLength(1);
    expect(selected.charts).toHaveLength(1);
    expect(selected.citations).toHaveLength(1);
  });

  it("does not reject Claude output because it is not JSON", async () => {
    mockClaudeText(
      "SkyHarbor's loaded application context can be described from its domain, ownership, and source coverage evidence. This is plain prose, not JSON, and should still be selected.",
    );

    const result = await synthesizeHomeConsultantText({
      dossier,
      deterministicResponse: response,
    });

    expect(isHomeConsultantTextSynthesisResult(result)).toBe(true);
  });

  it("normalizes user-facing source language before validation and selection", () => {
    const text = normalizeHomeConsultantUserFacingText(
      "Read: The loaded evidence supports a strong current-state read across 42 rows, but needed evidence is missing for one leader.",
    );

    expect(text).toBe(
      "The loaded source support gives a strong current picture across 42 records, but needed source support is missing for one leader.",
    );
    expect(text).not.toMatch(/\bread\b|\bevidence\b|\brows\b|source context|current-state context/i);
  });

  it("normalizes consultant preamble, markdown, and answer-boundary wording before validation", () => {
    const text = normalizeHomeConsultantUserFacingText(
      "## SkyHarbor lifecycle view\nHere is what the loaded context can tell you about lifecycle posture: **Lifecycle posture** depends on `lifecycle_stage`; SAP maps to APP-00044; the safe answer boundary is role-level.",
    );

    expect(text).toBe(
      "For lifecycle posture: Lifecycle posture depends on lifecycle_stage; SAP maps to source reference; the safe answer scope is role-level.",
    );
    expect(
      validateHomeConsultantText({ text, dossier, response }),
    ).not.toContain("forbidden_language");
  });

  it("normalizes deterministic fallback prose when Claude synthesis is not selected", () => {
    const selected = applyHomeConsultantTextSynthesisFailureTrace(
      {
        ...response,
        prose:
          "The loaded evidence supports this view across 42 rows, but named leaders are loaded only where the evidence provides them.",
      },
      {
        attempted: true,
        used: false,
        outputMode: "text",
        promptVersion: "home_consultant_text_synthesis_v1",
        reason: "validation_failed",
        validationIssues: ["forbidden_language"],
      },
    );

    expect(selected.prose).toContain("loaded source support gives");
    expect(selected.prose).toContain("42 records");
    expect(selected.prose).not.toMatch(/\bevidence\b|\brows\b|source context/i);
    expect(selected.safety.composerTrace?.fallbackUsed).toBe(true);
  });

  it("preserves branch list line breaks while normalizing fallback prose", () => {
    const text = normalizeHomeConsultantUserFacingText(
      "SkyHarbor Air has enough current-state context.\n\nWhere do you want to go deeper?\n- budget financials: 160 rows\n- vendor contracts: 160 rows",
    );

    expect(text).toContain("\n- budget financials: 160 records");
    expect(text).toContain("\n- vendor contracts: 160 records");
    expect(text).not.toContain("? - budget");
  });

  it("fails Claude output with forbidden false-absence language", () => {
    expect(
      validateHomeConsultantText({
        text: "The application estate cannot be characterized from the available data.",
        dossier,
        response,
      }),
    ).toEqual(expect.arrayContaining(["forbidden_language"]));
  });

  it("fails standalone read language before it reaches the Home API", () => {
    expect(
      validateHomeConsultantText({
        text: "This current-state read explains the loaded organization.",
        dossier,
        response,
      }),
    ).toEqual(expect.arrayContaining(["forbidden_language"]));
  });

  it("fails unsupported Home recommendations", () => {
    expect(
      validateHomeConsultantText({
        text: "SkyHarbor should prioritize the next $30M in this domain.",
        dossier,
        response,
      }),
    ).toEqual(expect.arrayContaining(["home_recommendation_without_handoff"]));
  });

  it("fails raw IDs", () => {
    expect(
      validateHomeConsultantText({
        text: "SkyHarbor's estate includes SKYHARBOR-APP-0001 as the anchor.",
        dossier,
        response,
      }),
    ).toEqual(expect.arrayContaining(["raw_id"]));
  });

  it("fails cross-tenant content", () => {
    expect(
      validateHomeConsultantText({
        text: "Lakeshore's application estate is relevant here.",
        dossier,
        response,
      }),
    ).toEqual(expect.arrayContaining(["cross_tenant_content:Lakeshore"]));
  });

  it("fails full cross-tenant names but not ordinary apex wording", () => {
    expect(
      validateHomeConsultantText({
        text: "SkyHarbor has apex-level operational complexity across the airline estate.",
        dossier,
        response,
      }),
    ).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^cross_tenant_content:/)]),
    );

    expect(
      validateHomeConsultantText({
        text: "Apex Retail's application estate is relevant here.",
        dossier,
        response,
      }),
    ).toEqual(expect.arrayContaining(["cross_tenant_content:Apex Retail"]));
  });

  it("rejects browse overview output when Claude collapses branch options into a wall", () => {
    const browseResponse: HomeKnowResponse = {
      ...response,
      intent: "browse",
      tables: [],
      charts: [],
      graphs: [],
    };

    expect(
      validateHomeConsultantText({
        text: "For SkyHarbor Air, the available material is strongest around organization leadership. Adjacent areas also carry available records and can be characterized at the enterprise level. Where do you want to go deeper? - Budget and financials - Vendor contracts - Enterprise profile - Organization leadership One caveat: source-supported connections are not yet established.",
        dossier,
        response: browseResponse,
      }),
    ).toEqual(expect.arrayContaining(["browse_branch_layout_missing"]));
  });

  it("rejects and normalizes internal semantic wording from Claude", () => {
    const raw =
      "For SkyHarbor Air, the loaded context is backed by a curated semantic evidence source with typed facts and resolved relationship paths.";

    expect(normalizeHomeConsultantUserFacingText(raw)).toBe(
      "For SkyHarbor Air, the available business material is backed by an available business material with source support and resolved source-supported connections.",
    );

    expect(
      validateHomeConsultantText({
        text: raw,
        dossier,
        response,
      }),
    ).toEqual(expect.arrayContaining(["forbidden_language"]));
  });

  it("rejects internal numeric entity/fact/citation inventory language", () => {
    expect(
      validateHomeConsultantText({
        text: "Where do you want to go deeper?\n- budget financials: 160 entities, 160 facts, 0 relationships, 160 citations",
        dossier,
        response: { ...response, intent: "browse" },
      }),
    ).toEqual(expect.arrayContaining(["internal_count_language"]));
  });

  it("falls back cleanly on timeout", async () => {
    process.env.HOME_KNOW_CLAUDE_TIMEOUT_MS = "1";
    mockClaudeText(
      "SkyHarbor's loaded application context supports a domain-led view.",
      10,
    );

    await expect(
      synthesizeHomeConsultantText({
        dossier,
        deterministicResponse: response,
      }),
    ).resolves.toMatchObject({
      attempted: true,
      used: false,
      reason: "timeout",
    });
  });

  it("falls back cleanly on empty Claude response", async () => {
    mockClaudeText("");

    await expect(
      synthesizeHomeConsultantText({
        dossier,
        deterministicResponse: response,
      }),
    ).resolves.toMatchObject({
      attempted: true,
      used: false,
      reason: "validation_failed",
      validationIssues: expect.arrayContaining(["empty_text"]),
    });
  });

  it("uses the 25K default output budget", async () => {
    mockClaudeText(
      "SkyHarbor's loaded application context supports a domain-led view.",
    );

    const result = await synthesizeHomeConsultantText({
      dossier,
      deterministicResponse: response,
    });

    expect(isHomeConsultantTextSynthesisResult(result)).toBe(true);
    const call = mockGetAuditedAnthropicClient.mock.results[0];
    expect(call).toBeDefined();
    const client = await call.value;
    expect(client.client.messages.stream).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 25_000 }),
    );
  });

  it("does not call Claude when the env gate is disabled", async () => {
    process.env.HOME_KNOW_CLAUDE_SYNTHESIS_ENABLED = "false";

    await expect(
      synthesizeHomeConsultantText({
        dossier,
        deterministicResponse: response,
      }),
    ).resolves.toMatchObject({
      attempted: true,
      used: false,
      reason: "env_disabled",
    });
    expect(mockGetAuditedAnthropicClient).not.toHaveBeenCalled();
  });
});

function restoreEnv(key: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
  } else {
    process.env[key] = value;
  }
}
