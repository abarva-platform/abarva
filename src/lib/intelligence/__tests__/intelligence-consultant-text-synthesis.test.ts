jest.mock("server-only", () => ({}));

import { getAuditedAnthropicClient } from "@/lib/agent/stream";
import type { IntelligenceDossier } from "@/lib/intelligence/dossiers";
import {
  buildIntelligenceConsultantPromptPacket,
  buildIntelligenceConsultantUserPrompt,
  synthesizeIntelligenceConsultantText,
  validateIntelligenceConsultantText,
} from "../intelligence-consultant-text-synthesis";
import { findRawModelInputLeaks } from "../model-input-cleaner";
import { parseIntelligenceTabbedResponse } from "../tabbed-response";

jest.mock("@/lib/agent/stream", () => ({
  getAuditedAnthropicClient: jest.fn(),
}));

const mockGetAuditedAnthropicClient =
  getAuditedAnthropicClient as jest.MockedFunction<
    typeof getAuditedAnthropicClient
  >;

const dossier = {
  tenantKey: "skyharbor-air",
  tenantName: "SkyHarbor Air",
  question: "Where should SkyHarbor place the next $30M in AI?",
  intelligenceIntent: "investment_prioritization",
  primaryDimension: "ai_value_governance",
  relatedDimensions: ["operations_process", "data_analytics"],
  tenantEvidenceDossier: {
    sourceFamiliesIncluded: ["TENANT", "SURFACE"],
    sections: [
      {
        id: "tenant-section-1",
        label: "Loaded initiative evidence",
        sourceType: "TENANT",
        summary:
          "MRO predictive maintenance has a bounded operational loop; IROPS recovery is gated by mainframe API exposure and customer identity readiness.",
        factCount: 3,
        citationIds: ["tenant-1"],
      },
    ],
    rollups: { tenantSourceCount: 2 },
    metrics: [
      {
        id: "metric-1",
        label: "Visible AI investment pool",
        value: "$30M",
        basis: "user scenario, not loaded budget approval",
        citationIds: ["tenant-1"],
      },
    ],
    relationshipPaths: [
      {
        id: "relationship-1",
        label: "IROPS depends on write-back readiness",
        from: "IROPS recovery automation",
        relationship: "depends_on",
        to: "mainframe API exposure",
        citationIds: ["tenant-1"],
        confidence: "medium",
      },
    ],
    gaps: [
      {
        id: "gap-1",
        label: "Realized value baseline is missing.",
        detail: "The packet does not include measured realized value for the candidate AI investments.",
        severity: "medium",
      },
    ],
    citations: [
      {
        id: "tenant-1",
        label: "SkyHarbor initiative evidence",
        sourceClass: "tenant-fact",
        confidence: "high",
      },
    ],
    confidence: "partial",
  },
  corpusPatternDossier: {
    patternFamilies: ["airline operations AI sequencing"],
    patternsIncluded: [
      {
        patternFamilyId: "airline-ops",
        patternFamilyName: "Airline operations AI sequencing",
        relevanceReason: "The question asks how to allocate AI capital in airline operations.",
        industryFit: "airline",
        functionFit: "operations",
        valueLever: "disruption recovery and bounded operational loops",
        patterns: [
          {
            patternId: "pattern-1",
            title: "Scale bounded loops before write-back-heavy recovery orchestration",
            summary:
              "Airline AI programs scale faster where the operational loop is bounded and data freshness is already governed.",
            applicability: "High for MRO and turn management; lower for IROPS until integration gates clear.",
            prerequisites: ["governed operational data", "human escalation"],
            risks: ["false confidence at disruption volume"],
            evidenceStrength: "moderate",
            citationIds: ["corpus-1"],
          },
        ],
      },
    ],
    patternsExcluded: [],
    applicabilitySummary: "Pattern support favors sequencing, not a single unconstrained AI spend.",
    citations: [
      {
        id: "corpus-1",
        label: "Airline AI sequencing pattern",
        sourceClass: "corpus-pattern",
        confidence: "medium",
      },
    ],
  },
  expertCouncilDossier: {
    selectedExperts: [
      {
        expertId: "xp.airline.operations-revenue-management",
        nameOrRole: "Airline Operations & Revenue Management Expert",
        lens: "airline operations",
        whySelected: "The question is about AI investment sequencing for airline operations.",
        expectedContribution: "Pressure-test scale readiness and operational failure modes.",
        questionsThisExpertShouldPressureTest: [
          "Which operational loops can scale without mainframe write-back?",
        ],
        citationIds: ["expert-1"],
      },
      {
        expertId: "xp.x.value-office-ai-enablement",
        nameOrRole: "Value Office AI Enablement Expert",
        lens: "value realization",
        whySelected: "The question asks where to place investment.",
        expectedContribution: "Separate directional value from measured value.",
        questionsThisExpertShouldPressureTest: [
          "What baseline proves value before release of the next tranche?",
        ],
        citationIds: ["expert-2"],
      },
    ],
    excludedExperts: [],
    expertLensSummary: "Operations and value lenses are enough for this first answer.",
    citations: [],
  },
  benchmarkDossier: {
    benchmarkSources: [],
    peerExamples: [],
    roiRanges: [],
    implementationCaveats: [
      "No exact ROI benchmark is in the packet; answer with directional confidence.",
    ],
    freshness: "none retrieved",
    confidence: "directional",
  },
  decisionOptionsDossier: {
    options: [
      {
        optionId: "scale-mro",
        title: "Scale MRO predictive maintenance",
        description: "Bounded operational loop with fewer write-back dependencies.",
        tenantEvidenceSupport: ["MRO loop is bounded"],
        corpusSupport: ["Scale bounded loops first"],
        expertSupport: ["Airline operations lens"],
        expectedValue: "Operational reliability and avoidable maintenance disruption",
        executionComplexity: "medium",
        riskLevel: "low",
        prerequisites: ["validate realized value baseline"],
        missingEvidence: ["measured realized value"],
        recommendedUse: "scale",
      },
      {
        optionId: "hold-irops",
        title: "Hold IROPS recovery orchestration",
        description: "Do not scale until write-back and identity gates clear.",
        tenantEvidenceSupport: ["mainframe API exposure remains a dependency"],
        corpusSupport: ["write-back-heavy recovery automation fails without governed data"],
        expertSupport: ["operations risk lens"],
        expectedValue: "High upside after readiness gates",
        executionComplexity: "high",
        riskLevel: "high",
        prerequisites: ["mainframe API exposure", "identity readiness"],
        missingEvidence: ["readiness dates"],
        recommendedUse: "hold",
      },
    ],
    tradeoffs: [
      "MRO has lower dependency risk; IROPS has higher strategic value but higher execution risk.",
    ],
    recommendedDecisionFrame:
      "Sequence bounded operational loops first; fund IROPS only after integration gates clear.",
    confidence: "moderate",
  },
  riskCaveatDossier: {
    tenantEvidenceGaps: ["Realized value baseline is missing."],
    dataReadinessGaps: ["mainframe API write-back readiness remains a gate"],
    operatingModelRisks: ["owner accountability must be validated"],
    governanceRisks: ["human escalation controls must be explicit"],
    executionRisks: ["IROPS automation can fail at disruption volume"],
    measurementRisks: ["ROI must stay directional without measured baselines"],
  },
  evidenceBoundary: {
    tenantFacts: [
      "MRO predictive maintenance has a bounded operational loop; IROPS recovery is gated by mainframe API exposure and customer identity readiness.",
    ],
    corpusPatterns: [
      "Scale bounded loops before write-back-heavy recovery orchestration: airline AI programs scale faster where the operational loop is bounded.",
    ],
    expertInterpretations: [
      "Airline Operations & Revenue Management Expert: pressure-test scale readiness.",
      "Value Office AI Enablement Expert: separate directional value from measured value.",
    ],
    benchmarkClaims: [],
    missingTenantEvidence: ["Realized value baseline is missing."],
    cannotConclude: ["Exact ROI without cited tenant baselines."],
  },
  artifactPlan: ["executive_answer", "option_matrix"],
  citations: [],
  qualityFlags: [],
} satisfies IntelligenceDossier;

function mockClaudeText(text: string) {
  mockGetAuditedAnthropicClient.mockResolvedValue({
    auditId: "audit-1",
    dataClass: "confidential",
    client: {
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ type: "text", text }],
        }),
      },
    },
  } as never);
}

function mockClaudeTexts(texts: string[]) {
  const create = jest.fn();
  for (const text of texts) {
    create.mockResolvedValueOnce({
      content: [{ type: "text", text }],
    });
  }
  mockGetAuditedAnthropicClient.mockResolvedValue({
    auditId: "audit-1",
    dataClass: "confidential",
    client: {
      messages: {
        create,
      },
    },
  } as never);
  return create;
}

describe("Intelligence consultant text synthesis", () => {
  const oldEnabled = process.env.INTELLIGENCE_CLAUDE_SYNTHESIS_ENABLED;
  const oldKey = process.env.ANTHROPIC_API_KEY;

  beforeEach(() => {
    mockGetAuditedAnthropicClient.mockReset();
    process.env.INTELLIGENCE_CLAUDE_SYNTHESIS_ENABLED = "true";
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  afterEach(() => {
    if (oldEnabled === undefined) {
      delete process.env.INTELLIGENCE_CLAUDE_SYNTHESIS_ENABLED;
    } else {
      process.env.INTELLIGENCE_CLAUDE_SYNTHESIS_ENABLED = oldEnabled;
    }
    if (oldKey === undefined) {
      delete process.env.ANTHROPIC_API_KEY;
    } else {
      process.env.ANTHROPIC_API_KEY = oldKey;
    }
  });

  it("builds a bounded advisory packet with tenant, corpus, advisory lens, option, and gap sections", () => {
    const packet = buildIntelligenceConsultantPromptPacket(dossier);

    expect(packet.tenantBrief.tenantName).toBe("SkyHarbor Air");
    expect(packet.tenantEvidenceBrief.factsThatMatter).toHaveLength(1);
    expect(packet.corpusPatternBrief.patternSummaries.join(" ")).toContain(
      "bounded loops",
    );
    expect(packet.advisoryLensBrief.lenses.length).toBeGreaterThan(0);
    expect(packet.optionsBrief.options.join(" ")).toContain("Scale MRO");
    expect(packet.riskCaveatBrief.tenantEvidenceGaps).toContain(
      "Realized value baseline is missing.",
    );
  });

  it("asks Claude for plain text synthesis rather than JSON output", () => {
    const packet = buildIntelligenceConsultantPromptPacket(dossier);
    const prompt = buildIntelligenceConsultantUserPrompt(packet);

    expect(prompt).toContain("Return final user-facing text only.");
    expect(prompt).toContain("Use the decision-canvas tab markers");
    expect(prompt).toContain("Tenant evidence:");
    expect(prompt).toContain("Corpus patterns:");
    expect(prompt).toContain("Advisory lenses:");
    expect(prompt).not.toContain("Expert council:");
    expect(prompt).not.toContain("Return structured JSON");
  });

  it("cleans raw substrate fields before building Claude model input", () => {
    const packet = buildIntelligenceConsultantPromptPacket({
      ...dossier,
      tenantEvidenceDossier: {
        ...dossier.tenantEvidenceDossier,
        metrics: [
          {
            id: "SHA-CAP-001",
            label: "IROPS agentic recovery",
            value: "$270M ai_maturity: 1",
            basis: "skyharbor_ai_portfolio.csv Row: 7 APP-00002",
            citationIds: ["SHA-BF-001"],
          },
        ],
        citations: [
          {
            id: "SHA-BF-001",
            label: "skyharbor_ai_portfolio.csv Row: 7 ai_maturity: 1",
            sourceClass: "tenant-fact",
            confidence: "high",
          },
        ],
      },
      evidenceBoundary: {
        ...dossier.evidenceBoundary,
        tenantFacts: [
          "SHA-CAP-001 IROPS recovery has ai_maturity: 1 in skyharbor_ai_portfolio.csv Row: 7.",
        ],
      },
    });
    const prompt = buildIntelligenceConsultantUserPrompt(packet);

    expect(prompt).toContain("IROPS recovery");
    expect(prompt).toContain("AI maturity is early-stage");
    expect(prompt).not.toContain("SHA-CAP");
    expect(prompt).not.toContain("SHA-BF");
    expect(prompt).not.toContain("APP-");
    expect(prompt).not.toContain(".csv");
    expect(prompt).not.toContain("Row:");
    expect(prompt).not.toContain("ai_maturity:");
    expect(findRawModelInputLeaks(prompt)).toEqual([]);
  });

  it("returns Claude text when it stays inside the consultant contract", async () => {
    mockClaudeText(
      [
        "SkyHarbor should sequence the next AI tranche toward bounded operational loops first, with MRO predictive maintenance as the scale candidate and IROPS recovery held behind integration gates.",
        "",
        "The tenant evidence supports that split: MRO has a bounded loop, while IROPS depends on mainframe API exposure and customer identity readiness. The airline operations pattern reinforces the same sequence, because write-back-heavy recovery automation fails when freshness and escalation controls are weak.",
        "",
        "The tradeoff is upside versus execution risk. IROPS may become the larger prize, but the missing realized-value baseline and readiness dates mean it should not receive scale funding yet.",
      ].join("\n"),
    );

    const result = await synthesizeIntelligenceConsultantText({
      dossier,
      tenantId: "tenant-skyharbor",
    });

    expect(result).toMatchObject({
      trace: { used: true, model: expect.any(String) },
    });
    expect(result && "text" in result ? result.text : "").toContain(
      "MRO predictive maintenance",
    );
  });

  it("preserves SkyHarbor IROPS tabbed Claude output without prose or table rewrites", async () => {
    const claudeOutput = [
      "SkyHarbor should make IROPS recovery decisioning the next AI investment, but only through a governed readiness gate. It is the largest operational value pool in the packet, and the decision is not to buy autonomy; it is to fund decision support where certified operating data, crew legality, and passenger reaccommodation controls are already clear.",
      "",
      "<<<TAB: Decision | grounding: tenant-evidence>>>",
      "Approve a gated IROPS decisioning tranche. The executive choice is to fund recovery option ranking and human dispatch support before autonomous write-back.",
      "",
      "<<<TAB: Industry Insights | grounding: industry-context>>>",
      "Industry context: airlines that improve disruption recovery usually start with decision support around crew, aircraft, and passenger recovery. This is not tenant proof; it is context for why the SkyHarbor operating problem is worth prioritizing.",
      "",
      "<<<TAB: Chart | grounding: tenant-evidence>>>",
      "| Value pool | Annual value | Readiness score |",
      "|---|---:|---:|",
      "| IROPS recovery decisioning | $270M | 2 |",
      "| Customer AI concierge | $180M | 2 |",
      "| Data estate rationalization | $122M | 3 |",
      "",
      "<<<TAB: Table | grounding: tenant-evidence>>>",
      "| Option | Value | Readiness | Risk | Decision |",
      "|---|---:|---|---|---|",
      "| IROPS recovery decisioning | $270M | Gate required | Operational data freshness | Fund gated tranche |",
      "| Customer AI concierge | $180M | Identity dependency | Consent fragmentation | Hold scale |",
      "| Data estate rationalization | $122M | Foundation work | Benefit timing | Start as enabler |",
      "",
      "<<<TAB: Evidence | grounding: mixed>>>",
      "- Tenant facts: IROPS recovery, customer AI, and data rationalization are named value pools in the packet.",
      "- Industry context: disruption recovery decisioning is a known airline AI pattern, but not tenant proof.",
      "- Missing evidence: signed data freshness SLA, crew legality owner, and recovery write-back control.",
    ].join("\n");
    mockClaudeText(claudeOutput);

    const result = await synthesizeIntelligenceConsultantText({
      dossier: {
        ...dossier,
        question:
          "What is the single best AI investment SkyHarbor should make next, and why?",
        tenantEvidenceDossier: {
          ...dossier.tenantEvidenceDossier,
          metrics: [
            {
              id: "value-pool-irops",
              label: "IROPS recovery decisioning",
              value: "$270M",
              basis: "business-named value pool",
              citationIds: ["tenant-1"],
            },
            {
              id: "value-pool-customer-ai",
              label: "Customer AI concierge",
              value: "$180M",
              basis: "business-named value pool",
              citationIds: ["tenant-1"],
            },
          ],
        },
      },
      tenantId: "tenant-skyharbor",
    });

    const text = result && "text" in result ? result.text : "";
    expect(text).toBe(claudeOutput);
    expect(text).not.toContain("the referenced evidence");
    expect(text).not.toContain("ai_maturity: 1");

    const parsed = parseIntelligenceTabbedResponse(text);
    expect(parsed.mainAnswer).toBe(
      "SkyHarbor should make IROPS recovery decisioning the next AI investment, but only through a governed readiness gate. It is the largest operational value pool in the packet, and the decision is not to buy autonomy; it is to fund decision support where certified operating data, crew legality, and passenger reaccommodation controls are already clear.",
    );
    expect(parsed.tabs.map((tab) => tab.label)).toEqual([
      "Decision",
      "Industry Insights",
      "Chart",
      "Table",
      "Evidence",
    ]);
    expect(parsed.tabs.find((tab) => tab.id === "table")?.content).toBe(
      [
        "| Option | Value | Readiness | Risk | Decision |",
        "|---|---:|---|---|---|",
        "| IROPS recovery decisioning | $270M | Gate required | Operational data freshness | Fund gated tranche |",
        "| Customer AI concierge | $180M | Identity dependency | Consent fragmentation | Hold scale |",
        "| Data estate rationalization | $122M | Foundation work | Benefit timing | Start as enabler |",
      ].join("\n"),
    );
    expect(parsed.tabs.find((tab) => tab.id === "industry_insights")).toMatchObject({
      grounding: "industry-context",
    });
  });

  it("rejects prose-only explicit visual answers instead of building API fallback tables", async () => {
    const create = mockClaudeTexts([
      [
        "SkyHarbor should sequence the next AI tranche toward bounded operational loops first, with MRO predictive maintenance as the scale candidate and IROPS recovery held behind integration gates.",
        "",
        "The tenant evidence supports that split: MRO has a bounded loop, while IROPS depends on mainframe API exposure and customer identity readiness.",
        "",
        "The missing evidence is the realized-value baseline and readiness dates, so hold scale funding until those are confirmed.",
      ].join("\n"),
      [
        "SkyHarbor should sequence the next AI tranche toward bounded operational loops first, with MRO predictive maintenance as the scale candidate and IROPS recovery held behind integration gates.",
        "",
        "The tenant evidence supports that split: MRO has a bounded loop, while IROPS depends on mainframe API exposure and customer identity readiness.",
        "",
        "The missing evidence is the realized-value baseline and readiness dates, so hold scale funding until those are confirmed.",
      ].join("\n"),
    ]);

    const result = await synthesizeIntelligenceConsultantText({
      dossier: {
        ...dossier,
        question:
          "Compare MRO and IROPS in a table with value, readiness, risk, and next action.",
      },
      tenantId: "tenant-skyharbor",
    });

    expect(create).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      attempted: true,
      used: false,
      reason: "validation_failed",
      validationIssues: expect.arrayContaining([
        "missing_model_generated_visual_tab:table",
      ]),
    });
  });

  it("rejects explicit visual answers with no model-generated option rows", async () => {
    const create = mockClaudeTexts([
      [
        "The finance AI portfolio has value, but scale should wait for evidence on measurement and controls.",
        "",
        "The missing evidence is the realized-value baseline and readiness dates, so hold scale funding until those are confirmed.",
      ].join("\n"),
      [
        "The finance AI portfolio has value, but scale should wait for evidence on measurement and controls.",
        "",
        "The missing evidence is the realized-value baseline and readiness dates, so hold scale funding until those are confirmed.",
      ].join("\n"),
    ]);

    const result = await synthesizeIntelligenceConsultantText({
      dossier: {
        ...dossier,
        question:
          "Compare the top finance and treasury AI initiatives in a table with value, readiness, risk, and next action.",
        tenantEvidenceDossier: {
          ...dossier.tenantEvidenceDossier,
          metrics: [
            {
              id: "metric-1",
              label: "Kyriba global cash and payments rollout",
              value: "$86M promised benefit",
              basis: "loaded initiative evidence",
              citationIds: ["tenant-1"],
            },
            {
              id: "metric-2",
              label: "M365 Copilot finance automation",
              value: "$83M committed-versus-realized gap",
              basis: "loaded initiative evidence",
              citationIds: ["tenant-1"],
            },
            {
              id: "metric-3",
              label: "Finance semantic layer",
              value: "$28M reporting control value",
              basis: "loaded initiative evidence",
              citationIds: ["tenant-1"],
            },
          ],
        },
        decisionOptionsDossier: {
          ...dossier.decisionOptionsDossier,
          options: [],
          recommendedDecisionFrame:
            "Close bank-connectivity and measurement evidence before scale.",
        },
      },
      tenantId: "tenant-skyharbor",
    });

    expect(create).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      attempted: true,
      used: false,
      reason: "validation_failed",
      validationIssues: expect.arrayContaining([
        "missing_model_generated_visual_tab:table",
      ]),
    });
  });

  it("uses a Chart tab marker for explicit trend or benchmark chart fallbacks", async () => {
    const advisoryAnswer =
      "Use the industry trend as context, not tenant proof: sequence bounded operational AI options first, then hold broader recovery automation until the missing readiness evidence is closed. The tradeoff is speed versus control, so the chart should guide where to investigate, not approve scale funding by itself.";
    const create = mockClaudeTexts([
      advisoryAnswer,
      [
        advisoryAnswer,
        "",
        "<<<TAB: Chart | grounding: industry-context>>>",
        "Industry context, not tenant proof: directional opportunity map for airline AI investment sequencing.",
        "",
        "| Opportunity | Value score | Readiness score |",
        "|---|---:|---:|",
        "| IROPS recovery | 9 | 6 |",
        "| Predictive maintenance | 7 | 7 |",
        "| Customer concierge | 6 | 5 |",
      ].join("\n"),
    ]);

    const result = await synthesizeIntelligenceConsultantText({
      dossier: {
        ...dossier,
        question:
          "Show me an industry trend chart for AI opportunities in this function.",
      },
      tenantId: "tenant-skyharbor",
    });

    expect(create).toHaveBeenCalledTimes(2);
    const text = result && "text" in result ? result.text : "";
    const parsed = parseIntelligenceTabbedResponse(text);
    expect(parsed.mainAnswer).toBe(advisoryAnswer);
    expect(parsed.tabs.find((tab) => tab.id === "chart")).toMatchObject({
      grounding: "industry-context",
      content: expect.stringContaining("| Opportunity | Value score | Readiness score |"),
    });
  });

  it("rejects undersized repaired tables instead of replacing them outside Claude", async () => {
    const create = mockClaudeTexts([
      "The finance AI portfolio has value, but the control gates need to close before scale.",
      [
        "The finance AI portfolio has value, but the control gates need to close before scale.",
        "",
        "| Initiative | Budget | Promised benefit | Readiness | Risk | Next action |",
        "|---|---:|---:|---|---|---|",
        "| Kyriba global cash and payments rollout | $42M | $86M | Build | Critical | Hold broad rollout. |",
      ].join("\n"),
    ]);

    const result = await synthesizeIntelligenceConsultantText({
      dossier: {
        ...dossier,
        question:
          "Compare the top finance and treasury AI initiatives in a table with value, readiness, risk, and next action.",
        tenantEvidenceDossier: {
          ...dossier.tenantEvidenceDossier,
          metrics: [
            {
              id: "metric-1",
              label: "Kyriba global cash and payments rollout",
              value: "$86M promised benefit",
              basis: "loaded initiative evidence",
              citationIds: ["tenant-1"],
            },
            {
              id: "metric-2",
              label: "M365 Copilot finance automation",
              value: "$83M committed-versus-realized gap",
              basis: "loaded initiative evidence",
              citationIds: ["tenant-1"],
            },
            {
              id: "metric-3",
              label: "Finance semantic layer",
              value: "$28M reporting control value",
              basis: "loaded initiative evidence",
              citationIds: ["tenant-1"],
            },
          ],
        },
        decisionOptionsDossier: {
          ...dossier.decisionOptionsDossier,
          options: [],
          recommendedDecisionFrame:
            "Close bank-connectivity and measurement evidence before scale.",
        },
      },
      tenantId: "tenant-skyharbor",
    });

    expect(create).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      attempted: true,
      used: false,
      reason: "validation_failed",
      validationIssues: expect.arrayContaining([
        "missing_model_generated_visual_tab:table",
      ]),
    });
  });

  it("rejects sparse grounded narratives when Claude does not generate the visual tab", async () => {
    const narrative = [
      "The portfolio carries $292M in promised benefit against $132M in combined budget across six initiatives, but readiness is uneven.",
      "",
      "The decisive sequencing call: bank connectivity ($12M, October 2026) is the gate for the entire stack. Kyriba's $86M promise, the business layer's $46M promise, and the variance explainer's $17M all run downstream of clean bank feeds and certified SAP mapping.",
      "",
      "The single number demanding CFO attention: $83M gap between committed and realized value on M365 Copilot finance alone, with no certified measurement framework in place.",
    ].join("\n");
    const create = mockClaudeTexts([narrative, narrative]);

    const result = await synthesizeIntelligenceConsultantText({
      dossier: {
        ...dossier,
        question:
          "Compare the top finance and treasury AI initiatives in a table with value, readiness, risk, and next action.",
        tenantEvidenceDossier: {
          ...dossier.tenantEvidenceDossier,
          metrics: [],
        },
        decisionOptionsDossier: {
          ...dossier.decisionOptionsDossier,
          options: [],
          recommendedDecisionFrame:
            "Close bank-connectivity and measurement evidence before scale.",
        },
      },
      tenantId: "tenant-lakeshore",
    });

    expect(create).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      attempted: true,
      used: false,
      reason: "validation_failed",
      validationIssues: expect.arrayContaining([
        "missing_model_generated_visual_tab:table",
      ]),
    });
  });

  it("rejects old transcript labels and raw ids", () => {
    expect(
      validateIntelligenceConsultantText({
        text: "Read: APX-INIT-001 should scale. Evidence: Trust me.",
        dossier,
      }),
    ).toEqual(expect.arrayContaining(["old_template_labels", "raw_id_leak"]));
  });

  it("rejects session-dependent answer language", () => {
    expect(
      validateIntelligenceConsultantText({
        text: "As discussed earlier in this session, the answer has not changed: SkyHarbor should hold IROPS scale until the evidence gaps are closed.",
        dossier,
      }),
    ).toEqual(expect.arrayContaining(["session_context_language"]));
  });
});
