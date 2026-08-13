import {
  buildSourceAnswerEngine,
  detectSourceAnswerMode,
  type SourceAnswerMode,
} from "../source-answer-engine";
import { buildSourceArtifactStandardsContext } from "../artifact-lifecycle-matrix";
import { SOURCE_GOLDEN_EVENT_IDS } from "../constants";
import type {
  SourceAgentContextBundle,
  SourceLiveTenantContextSnapshot,
} from "../agent-context";

const liveTenantContext: SourceLiveTenantContextSnapshot = {
  clientKey: "apexretail",
  brokerTenantKey: "apex-retail",
  inventoryRecordCount: 883,
  contextChunkCount: 935,
  embeddedContextChunkCount: 935,
  sourceEventFound: true,
  segments: [
    {
      segmentId: "it_landscape",
      inventoryRecords: 96,
      contextChunks: 96,
      embeddedChunks: 96,
    },
    {
      segmentId: "evidence_ledger",
      inventoryRecords: 20,
      contextChunks: 20,
      embeddedChunks: 20,
    },
    {
      segmentId: "vendor_contracts",
      inventoryRecords: 38,
      contextChunks: 38,
      embeddedChunks: 38,
    },
    {
      segmentId: "financial_model",
      inventoryRecords: 63,
      contextChunks: 63,
      embeddedChunks: 63,
    },
  ],
  currentStateAreas: [
    "IT Landscape",
    "Evidence Ledger",
    "Vendor Contracts",
    "Financial Model",
  ],
  evidenceBasis: [
    "IT Landscape: 96 records, 96 chunks, 96 embedded",
    "Evidence Ledger: 20 records, 20 chunks, 20 embedded",
  ],
  retrievedEvidence: [
    {
      id: "chunk:evidence_ledger:identity",
      segmentId: "evidence_ledger",
      recordId: "evidence_ledger:ev:apex:001",
      title: "Identity match baseline",
      sourceType: "contextChunk",
      sourceDoc: "data-quality-baseline-2026-q1.xlsx",
      excerpt:
        "claim: Identity match rate across customer source systems is currently 71%.",
      confidence: "high",
      score: 14,
    },
    {
      id: "chunk:evidence_ledger:cdp",
      segmentId: "evidence_ledger",
      recordId: "evidence_ledger:ev:apex:009",
      title: "CDP selection memo",
      sourceType: "contextChunk",
      sourceDoc: "CDP-Round-1-Selection-Memo-2026-04-15.pdf",
      excerpt:
        "claim: Deloitte Digital was selected as CDP implementation partner; Treasure Data and Segment advanced to BAFO.",
      confidence: "high",
      score: 13,
    },
    {
      id: "chunk:it_landscape:martech",
      segmentId: "it_landscape",
      recordId: "it_landscape:martech",
      title: "Martech integration landscape",
      sourceType: "contextChunk",
      sourceDoc: "martech-architecture-inventory.csv",
      excerpt:
        "Current martech estate includes loyalty, email, web analytics, customer service, and data lake integrations.",
      confidence: "high",
      score: 12,
    },
    {
      id: "chunk:vendor_contracts:cdp",
      segmentId: "vendor_contracts",
      recordId: "vendor_contracts:cdp",
      title: "CDP contract baseline",
      sourceType: "contextChunk",
      sourceDoc: "vendor-contract-register.csv",
      excerpt:
        "Current customer data vendors include renewal and data-processing constraints that affect CDP implementation scope.",
      confidence: "high",
      score: 11,
    },
    {
      id: "chunk:financial_model:cdp",
      segmentId: "financial_model",
      recordId: "financial_model:cdp",
      title: "CDP value case",
      sourceType: "contextChunk",
      sourceDoc: "cdp-value-model.xlsx",
      excerpt:
        "CDP value model separates platform subscription, implementation, data engineering, and run support.",
      confidence: "high",
      score: 10,
    },
    {
      id: "chunk:org_structure:cdo",
      segmentId: "org_structure",
      recordId: "org_structure:cdo",
      title: "CDO ownership",
      sourceType: "contextChunk",
      sourceDoc: "org-structure.csv",
      excerpt:
        "Customer data activation decision rights sit with the CDO and CIO governance forum.",
      confidence: "high",
      score: 9,
    },
  ],
  warnings: [],
};

const contextBundle: SourceAgentContextBundle = {
  tenant: {
    tenantId: "apex-retail",
    tenantKey: "apexretail",
    tenantName: "Apex Retail Group",
  },
  user: { id: "user-source-answer" },
  userRole: "cio",
  persona: "cio",
  route: "/api/v1/source/APX-SRC-CDP-2026/nexus/ask",
  surface: "nexusPanel",
  contextScope: "event",
  sourcingEvent: {
    id: "apx-src-cdp-2026",
    code: "APX-SRC-CDP-2026",
    name: "CDP Vendor Selection",
    accountName: "Apex Retail Group",
    archetype: "platform_selection",
    rigor: "strategic",
    lifecycleStatus: "active",
    owner: "Chief Digital Officer",
    currentStageKey: "evaluation",
    valueAtStakeUsd: 2_400_000,
  },
  sourcingArchetype: "platform_selection",
  liveTenantContext,
  blockers: [],
  requiredInputs: [],
  missingInputs: [],
  stageGates: [],
  artifacts: [],
  projectedValueLedger: [],
  uploadedFiles: [],
  selectedAttachmentIds: [],
  allowedActions: [],
  sourceOfTruthTimestamps: [],
  risks: [],
  decisions: [],
  parsedFileSummaries: [],
  evidenceCitations: [],
  relevantPatternSections: [],
  priorConversationTurns: [],
  userPrompt: "How should the CIO shape the CDP sourcing event?",
  normalizedIntent: "unknown",
  systemProposedActions: [],
  contextQuality: {
    contextCompleteness: 5,
    patternGrounding: 4,
    evidenceCoverage: 5,
    eventStateGrounding: 5,
    missingInputAwareness: 5,
    actionability: 5,
    vanillaResponseRisk: 1,
    overallConfidence: "high",
    missingContextReasons: [],
  },
};

describe("Source answer engine", () => {
  it.each([
    [
      "What is Apex current state of affairs for the CDP event?",
      "current_state",
    ],
    [
      "Summarize org structure and tech landscape for this sourcing event.",
      "current_state",
    ],
    ["What should the CIO recommend before BAFO?", "cxo_guidance"],
    ["What traps should we watch in CDP sourcing?", "risk_traps"],
    ["What data is missing before we proceed?", "missing_data"],
    ["How smart is Sentinel Source about IT outsourcing?", "expert_sourcing"],
    ["What is the current financial baseline?", "current_state"],
    ["How should the CFO shape value and pricing?", "cxo_guidance"],
    ["Which vendor risk should we avoid?", "risk_traps"],
    ["What gaps block a decision-grade recommendation?", "missing_data"],
    ["How do we scope the RFP?", "event_shaping"],
    [
      "What does the market and corpus say about CDP sourcing?",
      "expert_sourcing",
    ],
    ["What is the current tech landscape?", "current_state"],
    ["How should this event be scored?", "event_shaping"],
    ["Give CXO guidance for the selection decision.", "cxo_guidance"],
    ["What commercial gotchas should we avoid?", "risk_traps"],
    ["What baseline do we need?", "missing_data"],
    ["Explain expert sourcing posture for AMS.", "expert_sourcing"],
    ["What is the org structure implication?", "current_state"],
    ["How should vendors be evaluated?", "event_shaping"],
    ["What should the CDO steer?", "cxo_guidance"],
    ["What red flags are in vendor demos?", "risk_traps"],
    ["What required evidence is not ready?", "missing_data"],
    ["What is the sourcing expertise lens?", "expert_sourcing"],
    ["What is our financial and technology current state?", "current_state"],
    ["How should the event shape the scorecard?", "event_shaping"],
    ["What decision should the CFO make?", "cxo_guidance"],
    ["What failure modes should Sentinel flag?", "risk_traps"],
    ["What cannot proceed without more data?", "missing_data"],
    ["What outsourcing knowledge should Source apply?", "expert_sourcing"],
  ] satisfies Array<[string, SourceAnswerMode]>)(
    "classifies %s",
    (prompt, mode) => {
      expect(detectSourceAnswerMode(prompt)).toBe(mode);
    },
  );

  it("builds a cited CXO answer with current-state facts and CDP sourcing guidance", () => {
    const answer = buildSourceAnswerEngine({
      prompt: "How should the CIO shape the CDP sourcing event?",
      contextBundle,
      userRole: "cio",
    });

    expect(answer).toMatchObject({
      engineVersion: "source-answer-engine/v1",
      mode: "cxo_guidance",
      confidence: "high",
      recommendedNextAction:
        "Lock CDP scoring around identity, activation, integration ownership, governance, and full TCO before BAFO.",
    });
    expect(answer?.answerText).not.toContain("Current state:");
    expect(answer?.answerText).toContain("What it means for sourcing");
    expect(answer?.answerText).toContain("CXO guidance");
    expect(answer?.expertLens[0]).toContain("enterprise data operating model");
    expect(answer?.evidenceCitations.length).toBeGreaterThanOrEqual(5);
    expect(
      answer?.evidenceCitations.map((citation) => citation.sourceDoc),
    ).toEqual(
      expect.arrayContaining([
        "data-quality-baseline-2026-q1.xlsx",
        "CDP-Round-1-Selection-Memo-2026-04-15.pdf",
      ]),
    );
    expect(answer?.responseParts.some((part) => part.type === "table")).toBe(
      true,
    );
    expect(answer?.responseParts.some((part) => part.type === "barChart")).toBe(
      true,
    );
    expect(
      answer?.responseParts.some((part) => part.type === "citations"),
    ).toBe(true);
  });

  it("answers artifact standard questions from the canonical artifact profile context", () => {
    const standards = buildSourceArtifactStandardsContext({
      artifacts: [
        {
          artifactKind: "d09_rfp_pack",
          artifactGroup: "generated",
          sourceOrigin: "generated",
          status: "approved",
        },
      ],
      prompt:
        "What should the RFP pack look like, how many pages, and what token budget applies?",
      stageKey: "rfp",
      limit: 2,
    });
    const contextWithArtifactStandards: SourceAgentContextBundle = {
      ...contextBundle,
      sourcingEvent: {
        ...contextBundle.sourcingEvent!,
        currentStageKey: "rfp",
      },
      liveTenantContext: {
        ...liveTenantContext,
        segments: [
          ...liveTenantContext.segments,
          {
            segmentId: "artifact_standards",
            inventoryRecords: 0,
            contextChunks: standards.length,
            embeddedChunks: 0,
          },
        ],
        currentStateAreas: [
          ...liveTenantContext.currentStateAreas,
          "Artifact Standards",
        ],
        retrievedEvidence: [
          ...standards.map((item) => ({
            id: `source-artifact-standard:${item.code}`,
            segmentId: "artifact_standards",
            recordId: item.code,
            title: item.title,
            sourceType: "contextChunk" as const,
            sourceDoc: "Source artifact standards registry",
            excerpt: item.excerpt,
            confidence: "high" as const,
            score: item.score,
          })),
          ...liveTenantContext.retrievedEvidence,
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt:
        "What should the RFP pack look like, how many pages, and what token budget applies?",
      contextBundle: contextWithArtifactStandards,
      userRole: "cio",
    });

    expect(answer?.title).toBe("Artifact standards answer");
    expect(answer?.answerText).toContain("not a fixed page count");
    expect(answer?.answerText).toContain("Required exhibits: 11");
    expect(answer?.answerText).toContain("No fixed page cap");
    expect(answer?.answerText).toContain("128k max");
    expect(answer?.answerText).toContain("Human review is required");
    expect(answer?.answerText).toContain("accepted back as the final record");
    expect(
      answer?.evidenceCitations.some(
        (citation) =>
          citation.sourceDoc === "Source artifact standards registry",
      ),
    ).toBe(true);
  });

  it("renders Source answer branding as Ava even when retrieved evidence still says Sentinel", () => {
    const contextWithLegacyBranding: SourceAgentContextBundle = {
      ...contextBundle,
      liveTenantContext: {
        ...liveTenantContext,
        retrievedEvidence: [
          {
            ...liveTenantContext.retrievedEvidence[0],
            excerpt:
              "claim: Sentinel has guided the event through scope, strategy, RFP, vendor responses, and evaluation.",
          },
          ...liveTenantContext.retrievedEvidence.slice(1),
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt: "Compare BAFO deltas across rounds",
      contextBundle: contextWithLegacyBranding,
      userRole: "cio",
    });

    const visiblePayload = JSON.stringify({
      answerText: answer?.answerText,
      currentStateFindings: answer?.currentStateFindings,
      sourcingImplications: answer?.sourcingImplications,
      cxoGuidance: answer?.cxoGuidance,
      riskTraps: answer?.riskTraps,
      missingData: answer?.missingData,
      recommendedNextAction: answer?.recommendedNextAction,
      evidenceCitations: answer?.evidenceCitations,
      responseParts: answer?.responseParts,
    });
    expect(visiblePayload).toContain("aVa has guided");
    expect(visiblePayload).not.toContain("Sentinel has guided");
    expect(answer?.responseParts[0]).toMatchObject({
      type: "metricStrip",
      title: "aVa sourcing read",
    });
  });

  it("summarizes structured CSV evidence in the visible current-state lead instead of pasting raw rows", () => {
    const contextWithStructuredRows: SourceAgentContextBundle = {
      ...contextBundle,
      liveTenantContext: {
        ...liveTenantContext,
        retrievedEvidence: [
          {
            id: "source-artifact-chunk:rfp-risk",
            segmentId: "compliance",
            recordId: "rfp-risk",
            title: "17_RFP_Risk_Register_APPROVED.csv excerpt",
            sourceType: "contextChunk",
            sourceDoc: "source_artifact_chunks",
            excerpt:
              'risk_id,risk_category,failure_mode,likelihood,impact,mitigation,owner,blocking_gate,evidence_basis RFP-R1,Transition,"Incumbent knowledge transfer is incomplete or delayed",Medium,High,"Require KT plan, runbook escrow, named SMEs, and exit criteria before transition wave approval",AMS Transition Lead,Transition readiness gate,"Agreement baseline; transition dependency register; blackout calendar"',
            confidence: "high",
            score: 40,
          },
          ...liveTenantContext.retrievedEvidence,
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt: "What is still blocking the AMS RFP release?",
      contextBundle: contextWithStructuredRows,
      userRole: "cio",
    });

    expect(answer?.answerText).toContain(
      "Supporting detail: 17 RFP Risk Register APPROVED.csv",
    );
    expect(answer?.answerText).not.toContain("is cited evidence");
    expect(answer?.answerText).not.toContain("risk_id,risk_category");
    expect(answer?.answerText).not.toContain("RFP-R1,Transition");
    const visiblePayload = JSON.stringify({
      answerText: answer?.answerText,
      currentStateFindings: answer?.currentStateFindings,
      evidenceCitations: answer?.evidenceCitations,
      responseParts: answer?.responseParts,
    });
    expect(visiblePayload).toContain(
      "Supporting detail: 17 RFP Risk Register APPROVED.csv",
    );
    expect(visiblePayload).not.toContain("is cited evidence");
    expect(visiblePayload).not.toContain("risk_id,risk_category");
    expect(visiblePayload).not.toContain("blocking_gate,evidence_basis");
    expect(visiblePayload).not.toContain("RFP-R1,Transition");
  });

  it("opens a tenant sourcing event overview without supplier-finalist placeholders", () => {
    const lakeshoreContext: SourceAgentContextBundle = {
      ...contextBundle,
      tenant: {
        tenantId: "lakeshore",
        tenantKey: "lakeshore",
        tenantName: "Lakeshore Holdings",
      },
      sourcingEvent: {
        ...contextBundle.sourcingEvent!,
        id: "18439aee-9889-4e97-a444-4d9e43a85bd5",
        code: "LAKE-SHARED-SERVICES-AMS-2026",
        name: "Lakeshore Shared Services AMS Sourcing Event",
        accountName: "Lakeshore Holdings",
        archetype: "managed_service",
        currentStageKey: "strategy",
        valueAtStakeUsd: 18_000_000,
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt: "What is this Lakeshore sourcing event about?",
      contextBundle: lakeshoreContext,
      userRole: "cio",
    });

    expect(answer?.answerText.split("\n")[0]).toBe(
      "Lakeshore Shared Services AMS Sourcing Event is Lakeshore Holdings's governed Source event that should be interpreted through its loaded evidence, stage gates, and artifacts.",
    );
    expect(answer?.answerText).toContain("client-final RFP");
    expect(answer?.answerText).not.toContain("Vendor A/B/C");
    expect(answer?.answerText).toContain("proposal evidence is loaded");
  });

  it("answers BAFO questions from vendor-specific instructions instead of generic current-state prose", () => {
    const contextWithBafoInstructions: SourceAgentContextBundle = {
      ...contextBundle,
      liveTenantContext: {
        ...liveTenantContext,
        embeddedContextChunkCount: 0,
        retrievedEvidence: [
          {
            id: "source-event:sky:bafo-a-01",
            segmentId: "sourcing_artifacts",
            recordId: "BAFO-A-01",
            title: "Vendor A BAFO instruction",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "productivity gap: Please provide a year-by-year productivity credit schedule, including baseline volumes, automation use cases, measurement method, and financial credit if committed productivity is not achieved. Required response: Baseline volume + committed % by year + price-down or gainshare schedule + remedy. Scoring holdback: Do not give full automation/productivity scoring credit until the economics are contractually committed.",
            confidence: "high",
            score: 26,
          },
          {
            id: "source-event:sky:bafo-b-01",
            segmentId: "sourcing_artifacts",
            recordId: "BAFO-B-01",
            title: "Vendor B BAFO instruction",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "staffing coverage gap: Please reconcile the proposed coverage model to a staffing table by role, shift, location, and critical application tier. Required response: Role/FTE/shift/location table + named critical-app coverage + exception list. Scoring holdback: Treat coverage as conditional until staffing, location, and shift evidence reconcile to the support model.",
            confidence: "high",
            score: 25,
          },
          {
            id: "source-event:sky:bafo-c-01",
            segmentId: "sourcing_artifacts",
            recordId: "BAFO-C-01",
            title: "Vendor C BAFO instruction",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "scope exception: Please include the optional tower in normalized TCO or exclude it from all vendors. Required response: Exception disposition table with redline, pricing impact, and executive decision flag. Scoring holdback: Evaluate only after the exception is accepted, priced, or removed.",
            confidence: "high",
            score: 24,
          },
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt: "What should go into BAFO?",
      contextBundle: contextWithBafoInstructions,
      userRole: "cio",
    });

    expect(answer?.title).toBe("BAFO instruction answer");
    expect(answer?.answerText).toContain(
      "BAFO should focus on 3 unresolved commercial commitments",
    );
    expect(answer?.answerText).toContain("Vendor A");
    expect(answer?.answerText).toContain("Vendor B");
    expect(answer?.answerText).toContain("Vendor C");
    expect(answer?.answerText).toContain("structured exhibits");
    expect(answer?.answerText).toContain("Do not award full scoring credit");
    expect(answer?.recommendedNextAction).toContain(
      "Issue the vendor-specific BAFO questions",
    );
    expect(answer?.answerText).not.toContain("Mode:");
    expect(answer?.answerText).not.toContain("Current state:");
    expect(answer?.answerText).not.toContain("source_events");
    expect(answer?.answerText).not.toContain("Sourcing Artifacts");
  });

  it("keeps every BAFO vendor in the answer even when public citations are bounded", () => {
    const highRankedChallengeEvidence = Array.from(
      { length: 8 },
      (_, index) => ({
        id: `source-event:sky:challenge-${index + 1}`,
        segmentId: "sourcing_artifacts",
        recordId: `CHALLENGE-${index + 1}`,
        title: `Vendor challenge ${index + 1}`,
        sourceType: "contextChunk" as const,
        sourceDoc: "source_events",
        excerpt:
          "challenge: Require the vendor to reconcile narrative claims to structured pricing, SLA, staffing, transition, and assumptions exhibits.",
        confidence: "high" as const,
        score: 40 - index,
      }),
    );
    const contextWithManyBafoInstructions: SourceAgentContextBundle = {
      ...contextBundle,
      liveTenantContext: {
        ...liveTenantContext,
        embeddedContextChunkCount: 0,
        retrievedEvidence: [
          ...highRankedChallengeEvidence,
          {
            id: "source-event:sky:bafo-a-01",
            segmentId: "sourcing_artifacts",
            recordId: "BAFO-A-01",
            title: "Vendor A BAFO instruction",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "productivity gap: Please provide a year-by-year productivity credit schedule. Required response: Baseline volume + committed % by year + price-down or gainshare schedule + remedy. Scoring holdback: Hold automation scoring until economics are contractually committed.",
            confidence: "high",
            score: 12,
          },
          {
            id: "source-event:sky:bafo-b-01",
            segmentId: "sourcing_artifacts",
            recordId: "BAFO-B-01",
            title: "Vendor B BAFO instruction",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "staffing coverage gap: Please reconcile the proposed coverage model to a staffing table by role, shift, location, and critical application tier. Required response: Role/FTE/shift/location table + critical-app coverage + exception list. Scoring holdback: Hold coverage scoring until staffing evidence reconciles to the support model.",
            confidence: "high",
            score: 11,
          },
          {
            id: "source-event:sky:bafo-c-01",
            segmentId: "sourcing_artifacts",
            recordId: "BAFO-C-01",
            title: "Vendor C BAFO instruction",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "scope exception: Please include the optional tower in normalized TCO or exclude it from all vendors. Required response: Exception disposition table with redline, pricing impact, and executive decision flag. Scoring holdback: Evaluate only after the exception is accepted, priced, or removed.",
            confidence: "high",
            score: 1,
          },
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt: "What should go into BAFO?",
      contextBundle: contextWithManyBafoInstructions,
      userRole: "cio",
    });

    expect(answer?.answerText).toContain(
      "3 unresolved commercial commitments across 3 vendor profiles",
    );
    expect(answer?.answerText).toContain("Vendor A");
    expect(answer?.answerText).toContain("Vendor B");
    expect(answer?.answerText).toContain("Vendor C");
    expect(answer?.evidenceCitations).toHaveLength(8);
    expect(answer?.answerText).not.toContain("source_events");
    expect(answer?.answerText).not.toContain("Sourcing Artifacts");
  });

  it.each([
    // Answers name a vendor only from the parsed summary rows, so the
    // assertions pin the derived shape rather than the old fixed narrative.
    ["Which vendor is leading?", "Vendor A leads the evaluation at 7.4/10"],
    ["Which vendor is cheapest on normalized TCO?", "Vendor B is cheapest"],
    [
      "Which vendor has the highest transition risk?",
      "Vendor B carries the highest transition risk",
    ],
    [
      "Which vendor is riskiest?",
      "Vendor B carries the highest transition risk",
    ],
    ["Why is Vendor B conditional?", "Vendor B is conditional because"],
    [
      "Why should Vendor C remain in the process?",
      "Vendor C is ranked 2 at 7.2/10 on evidenced criteria",
    ],
    [
      "Which vendor should advance to BAFO?",
      "Advance Vendor A as the risk-adjusted lead and Vendor C",
    ],
    [
      "Show the evaluation scorecard summary.",
      "The evaluation scorecard ranks Vendor A 7.4/10",
    ],
    [
      "What is the final recommendation for the sourcing team?",
      "Vendor A leads the evaluation at 7.4/10",
    ],
    [
      "What are the executive tradeoffs?",
      "price and evidence do not necessarily point at the same vendor",
    ],
  ])("answers evaluation scorecard question: %s", (prompt, expectedLead) => {
    const contextWithEvaluationScorecard: SourceAgentContextBundle = {
      ...contextBundle,
      sourcingEvent: {
        ...contextBundle.sourcingEvent,
        id: "skyh-test-event",
        code: "SKYH-SKYHARBOR-AMS-OUTSOURCING-2026",
        name: "SkyHarbor AMS Outsourcing RFP",
        accountName: "SkyHarbor Air",
        archetype: "managed_services",
        rigor: "strategic",
        lifecycleStatus: "active",
        owner: "CIO Office",
        valueAtStakeUsd: 96_400_000,
        currentStageKey: "evaluation",
      },
      liveTenantContext: {
        ...liveTenantContext,
        embeddedContextChunkCount: 0,
        retrievedEvidence: [
          {
            id: "source-event:sky:eval-a",
            segmentId: "sourcing_artifacts",
            recordId: "vendor-a-evaluation-summary",
            title: "Vendor A evaluation summary",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "Rank 1; weighted score 7.4/10; recommendation advance to bafo. Risk-adjusted leader at 7.4/10 because continuity, scope coverage, and transition confidence outweigh its weaker commercial remedies. Finalist posture: Preferred BAFO lead: advance, but require sharper commercial remedies before award. Tradeoffs: Best continuity and transition risk posture. Needs stronger productivity price-down, SLA credit economics, and transition fee holdbacks. Conditions: improve productivity credits and transition fee holdbacks.",
            confidence: "high",
            score: 30,
          },
          {
            id: "source-event:sky:eval-b",
            segmentId: "sourcing_artifacts",
            recordId: "vendor-b-evaluation-summary",
            title: "Vendor B evaluation summary",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "Rank 3; weighted score 6.6/10; recommendation hold until clarified. Lowest-cost price benchmark at 6.6/10, but coverage staffing, retained effort, pass-through exposure, and productivity economics must close before it can be treated as a preferred finalist. Finalist posture: Price benchmark only: hold from preferred-finalist status unless BAFO cures the named staffing, retained-effort, pass-through, and productivity gaps. Tradeoffs: Best apparent normalized TCO. Highest execution risk because productivity, staffing coverage, and retained-client effort remain conditional. Conditions: reconcile proposed coverage model to staffing table; include retained effort in normalized TCO.",
            confidence: "high",
            score: 29,
          },
          {
            id: "source-event:sky:eval-c",
            segmentId: "sourcing_artifacts",
            recordId: "vendor-c-evaluation-summary",
            title: "Vendor C evaluation summary",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "Rank 2; weighted score 7.2/10; recommendation advance with conditions. Service-quality specialist at 7.2/10 with strong SLA economics, but scope and transition caveats must be normalized before it can lead. Finalist posture: Conditional finalist: advance if corporate shared-services scope and transition timing are normalized. Tradeoffs: Best SLA remedy posture and clean evidence discipline. Narrower base scope and slower transition make the headline price less directly comparable. Conditions: normalize optional corporate tower and accelerated transition option.",
            confidence: "high",
            score: 28,
          },
          {
            id: "source-event:sky:comparison-tco",
            segmentId: "sourcing_artifacts",
            recordId: "evaluation-comparison-normalized-tco",
            title: "Normalized vendor comparison - Normalized 5-year TCO",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "Normalized 5-year TCO: Shows cost position after transition, optional, and one-time lines are visible. Vendor A: $96.4M; posture watch; Higher TCO reflects continuity. Vendor B: $91.8M; posture strength; Lowest TCO with retained-effort caveats. Vendor C: $94.3M; posture watch; Optional corporate support must be normalized.",
            confidence: "high",
            score: 27,
          },
          {
            id: "source-event:sky:comparison-transition",
            segmentId: "sourcing_artifacts",
            recordId: "evaluation-comparison-transition-risk",
            title: "Normalized vendor comparison - Transition risk",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "Transition risk: Highlights transition commitments. Vendor A: lower operational risk. Vendor B: Highest risk because client SME dependency and coverage proof remain open. Vendor C: schedule risk remains because stabilization extends beyond buyer target.",
            confidence: "high",
            score: 26,
          },
          {
            id: "source-event:sky:impact-b",
            segmentId: "sourcing_artifacts",
            recordId: "vendor-b-score-impact",
            title: "Vendor B score impact scenario",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "Score movement: 6.6 to 7.3 if cured; delta +0.7. BAFO cure: Reconcile 24x7 staffing to role/location tables, cap tooling pass-throughs, cost retained-client effort, and commit productivity price-downs. Required evidence: Shift/FTE/location table, retained-effort RACI with cost model, capped pass-through schedule, and year-by-year productivity credit. Decision impact: Vendor B can move from price benchmark to viable finalist, but not to risk-adjusted lead unless execution proof is contractual.",
            confidence: "high",
            score: 25,
          },
          {
            id: "source-event:sky:finalist",
            segmentId: "sourcing_artifacts",
            recordId: "evaluation-finalist-recommendation",
            title: "Finalist recommendation",
            sourceType: "contextChunk",
            sourceDoc: "source_events",
            excerpt:
              "Advance Vendor A as the risk-adjusted lead and Vendor C as a conditional service-accountability finalist. Keep Vendor B as the price benchmark only; it should not become a preferred finalist unless BAFO cures staffing coverage, retained-effort, pass-through, and productivity-credit gaps.",
            confidence: "high",
            score: 24,
          },
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt,
      contextBundle: contextWithEvaluationScorecard,
      userRole: "cio",
    });

    expect(answer?.title).toBe("Evaluation scorecard answer");
    expect(answer?.answerText).toContain(expectedLead);
    expect(answer?.answerText).toContain("Vendor A");
    expect(answer?.answerText).toContain("Vendor B");
    expect(answer?.answerText).toContain("Vendor C");
    expect(answer?.answerText).toContain("What can change the score");
    expect(answer?.answerText).not.toContain("Mode:");
    expect(answer?.answerText).not.toContain("Current state:");
    expect(answer?.answerText).not.toContain("source_events");
    expect(answer?.answerText).not.toContain("Sourcing Artifacts");
    const renderedPartText = JSON.stringify(answer?.responseParts ?? []);
    expect(renderedPartText).not.toMatch(
      /Mode:|Current state:|source_events|Sourcing Artifacts|Source Artifacts/i,
    );
    expect(renderedPartText).toContain(
      "Decision signals and sourcing implications",
    );
  });

  it("does not let client-final RFP authority hijack vendor advancement questions", () => {
    const sharedEvidence = [
      {
        id: "source-artifact:scope-client-final",
        segmentId: "sourcing_artifacts",
        recordId: "scope-client-final",
        title: "Scope Memo - Client Final",
        sourceType: "contextChunk" as const,
        sourceDoc: "source_artifacts",
        excerpt:
          'Artifact authority record: "Lakeshore Client Final Scope Memo.docx" is a client-final upload. Artifact type: d05_scope_memo; stage: scope; status: client_final; lifecycle: current; version: 2. Authority: clientFinal=true; currentAuthoritative=true; blobBacked=true. Lineage: links to the prior generated draft; supersedes a prior artifact version. Client-final note: Scope memo accepted after client review.',
        confidence: "high" as const,
        score: 95,
      },
      {
        id: "source-artifact:client-final",
        segmentId: "sourcing_artifacts",
        recordId: "client-final",
        title: "RFP Package - Client Final",
        sourceType: "contextChunk" as const,
        sourceDoc: "source_artifacts",
        excerpt:
          'Artifact authority record: "Client Final - Lakeshore Shared Services AMS RFP Pack.docx" is a client-final upload. Artifact type: d09_rfp_pack; stage: rfp; status: client_final; lifecycle: current; version: 4. Authority: clientFinal=true; currentAuthoritative=true; blobBacked=true. Lineage: links to the prior generated draft; supersedes a prior artifact version. Client-final note: Client legal/procurement edits accepted after review; this version is final for vendor issuance. Client-final stakeholder group: Sourcing steering committee.',
        confidence: "high" as const,
        score: 90,
      },
      {
        id: "source-artifact:generated-draft",
        segmentId: "sourcing_artifacts",
        recordId: "generated-draft",
        title: "RFP Package",
        sourceType: "contextChunk" as const,
        sourceDoc: "source_artifacts",
        excerpt:
          'Artifact authority record: "RFP_Package-lakeshore.docx" is an AbarVa-generated draft. Artifact type: d09_rfp_pack; stage: rfp; status: superseded; lifecycle: superseded; version: 1. Authority: clientFinal=false; currentAuthoritative=false; blobBacked=true. Lineage: has been superseded by a later artifact version.',
        confidence: "high" as const,
        score: 70,
      },
      {
        id: "source-event:lake:eval-a",
        segmentId: "sourcing_artifacts",
        recordId: "vendor-a-evaluation-summary",
        title: "Vendor A evaluation summary",
        sourceType: "contextChunk" as const,
        sourceDoc: "source_events",
        excerpt:
          "Rank 1; weighted score 7.4/10; recommendation advance to bafo. Risk-adjusted leader at 7.4/10 because continuity, scope coverage, and transition confidence outweigh its weaker commercial remedies. Finalist posture: Preferred BAFO lead: advance, but require sharper commercial remedies before award. Tradeoffs: Best continuity and transition risk posture. Needs stronger productivity price-down, SLA credit economics, and transition fee holdbacks. Conditions: improve productivity credits and transition fee holdbacks.",
        confidence: "high" as const,
        score: 30,
      },
      {
        id: "source-event:lake:eval-b",
        segmentId: "sourcing_artifacts",
        recordId: "vendor-b-evaluation-summary",
        title: "Vendor B evaluation summary",
        sourceType: "contextChunk" as const,
        sourceDoc: "source_events",
        excerpt:
          "Rank 3; weighted score 6.6/10; recommendation hold until clarified. Lowest-cost price benchmark at 6.6/10, but coverage staffing, retained effort, pass-through exposure, and productivity economics must close before it can be treated as a preferred finalist. Finalist posture: Price benchmark only: hold from preferred-finalist status unless BAFO cures the named staffing, retained-effort, pass-through, and productivity gaps. Tradeoffs: Best apparent normalized TCO. Highest execution risk because productivity, staffing coverage, and retained-client effort remain conditional. Conditions: reconcile proposed coverage model to staffing table; include retained effort in normalized TCO.",
        confidence: "high" as const,
        score: 29,
      },
      {
        id: "source-event:lake:eval-c",
        segmentId: "sourcing_artifacts",
        recordId: "vendor-c-evaluation-summary",
        title: "Vendor C evaluation summary",
        sourceType: "contextChunk" as const,
        sourceDoc: "source_events",
        excerpt:
          "Rank 2; weighted score 7.2/10; recommendation advance with conditions. Service-quality specialist at 7.2/10 with strong SLA economics, but scope and transition caveats must be normalized before it can lead. Finalist posture: Conditional finalist: advance if corporate shared-services scope and transition timing are normalized. Tradeoffs: Best SLA remedy posture and clean evidence discipline. Narrower base scope and slower transition make the headline price less directly comparable. Conditions: normalize optional corporate tower and accelerated transition option.",
        confidence: "high" as const,
        score: 28,
      },
      {
        id: "source-event:lake:finalist",
        segmentId: "sourcing_artifacts",
        recordId: "evaluation-finalist-recommendation",
        title: "Finalist recommendation",
        sourceType: "contextChunk" as const,
        sourceDoc: "source_events",
        excerpt:
          "Advance Vendor A as the risk-adjusted lead and Vendor C as a conditional service-accountability finalist. Keep Vendor B as the price benchmark only; it should not become a preferred finalist unless BAFO cures staffing coverage, retained-effort, pass-through, and productivity-credit gaps.",
        confidence: "high" as const,
        score: 24,
      },
    ];
    const contextWithClientFinalAndEvaluation: SourceAgentContextBundle = {
      ...contextBundle,
      liveTenantContext: {
        ...liveTenantContext,
        embeddedContextChunkCount: 0,
        retrievedEvidence: sharedEvidence,
      },
    };

    const vendorAnswer = buildSourceAnswerEngine({
      prompt: "Which vendor should advance and why?",
      contextBundle: contextWithClientFinalAndEvaluation,
      userRole: "cio",
    });

    expect(vendorAnswer?.title).toBe("Evaluation scorecard answer");
    expect(vendorAnswer?.answerText).toContain(
      "Advance Vendor A as the risk-adjusted lead and Vendor C",
    );
    expect(vendorAnswer?.answerText).toContain("Vendor B");
    expect(vendorAnswer?.answerText).not.toContain("final RFP version");
    expect(vendorAnswer?.answerText).not.toContain("client-final artifact");

    const rfpFinalityAnswer = buildSourceAnswerEngine({
      prompt: "Which RFP version is final?",
      contextBundle: contextWithClientFinalAndEvaluation,
      userRole: "cio",
    });

    expect(rfpFinalityAnswer?.title).toBe("Artifact authority answer");
    expect(rfpFinalityAnswer?.answerText).toContain(
      "Client Final - Lakeshore Shared Services AMS RFP Pack.docx is the final RFP version of record",
    );
    expect(rfpFinalityAnswer?.answerText).toContain("AbarVa-generated");
    expect(rfpFinalityAnswer?.answerText).toContain("File Cabinet");
    expect(rfpFinalityAnswer?.answerText).not.toContain(
      "Advance Vendor A as the risk-adjusted lead",
    );
    expect(rfpFinalityAnswer?.answerText).not.toContain(
      "Lakeshore Client Final Scope Memo.docx is the final RFP",
    );

    const scopeFinalityAnswer = buildSourceAnswerEngine({
      prompt: "Which scope memo version is final?",
      contextBundle: contextWithClientFinalAndEvaluation,
      userRole: "cio",
    });

    expect(scopeFinalityAnswer?.title).toBe("Artifact authority answer");
    expect(scopeFinalityAnswer?.answerText).toContain(
      "Lakeshore Client Final Scope Memo.docx is the final Scope Memo version of record",
    );
    expect(scopeFinalityAnswer?.answerText).not.toContain(
      "Client Final - Lakeshore Shared Services AMS RFP Pack.docx is the final Scope Memo",
    );
  });

  it("uses the shared artifact-authority resolver for artifact governance answers", () => {
    const contextWithAcceptedArtifact: SourceAgentContextBundle = {
      ...contextBundle,
      liveTenantContext: {
        ...liveTenantContext,
        embeddedContextChunkCount: 0,
        retrievedEvidence: [
          {
            id: "source-artifact:current-authoritative",
            segmentId: "sourcing_artifacts",
            recordId: "current-authoritative",
            title: "RFP Package - Current Authoritative",
            sourceType: "contextChunk" as const,
            sourceDoc: "source_artifacts",
            excerpt:
              'Artifact authority record: "Generated Current RFP.docx" is an AbarVa-generated draft. Artifact type: d09_rfp_pack; stage: rfp; status: draft; lifecycle: current; version: 8. Authority: clientFinal=false; currentAuthoritative=true; activeAcceptance=false; blobBacked=true.',
            confidence: "high" as const,
            score: 92,
          },
          {
            id: "source-artifact:accepted-working-final",
            segmentId: "sourcing_artifacts",
            recordId: "accepted-working-final",
            title: "RFP Package - Accepted",
            sourceType: "contextChunk" as const,
            sourceDoc: "source_artifacts",
            excerpt:
              'Artifact authority record: "Accepted Working RFP.docx" is a Source artifact. Artifact type: d09_rfp_pack; stage: rfp; status: draft; lifecycle: current; version: 5. Authority: clientFinal=false; currentAuthoritative=false; activeAcceptance=true; blobBacked=true. Lineage: supersedes a prior artifact version.',
            confidence: "high" as const,
            score: 90,
          },
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt: "Which RFP version is final?",
      contextBundle: contextWithAcceptedArtifact,
      userRole: "cio",
    });

    expect(answer?.title).toBe("Artifact authority answer");
    expect(answer?.answerText).toContain("Accepted Working RFP.docx");
    expect(answer?.answerText).toContain(
      "selected by the shared artifact-authority resolver",
    );
    expect(answer?.answerText).toContain(
      "client-final authoritative rfp is not confirmed",
    );
    expect(answer?.answerText).not.toContain(
      "Generated Current RFP.docx is the strongest available RFP",
    );
  });

  it("answers event-overview questions before artifact-authority governance", () => {
    const contextWithLakeshoreEvent: SourceAgentContextBundle = {
      ...contextBundle,
      tenant: {
        tenantId: "lakeshore",
        tenantKey: "lakeshore",
        tenantName: "Lakeshore Holdings",
      },
      sourcingEvent: {
        ...contextBundle.sourcingEvent,
        id: "lake-shared-services-ams-2026",
        code: "LAKE-SHARED-SERVICES-AMS-2026",
        name: "Lakeshore Shared Services AMS Sourcing Event",
        accountName: "Lakeshore Holdings",
        archetype: "managed_services",
        rigor: "strategic",
        lifecycleStatus: "active",
        owner: "CIO Office",
        currentStageKey: "responses",
        valueAtStakeUsd: 18_000_000,
      },
      liveTenantContext: {
        ...liveTenantContext,
        retrievedEvidence: [
          {
            id: "source-artifact:client-final",
            segmentId: "sourcing_artifacts",
            recordId: "client-final",
            title: "RFP Package - Client Final",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              'Artifact authority record: "Client Final - Lakeshore Shared Services AMS RFP Pack.docx" is a client-final upload and current authoritative RFP.',
            confidence: "high",
            score: 80,
          },
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt: "What is this Lakeshore sourcing event about?",
      contextBundle: contextWithLakeshoreEvent,
      userRole: "cio",
    });

    expect(answer?.title).toBe("Source event overview answer");
    expect(answer?.answerText.split("\n")[0]).toBe(
      "Lakeshore Shared Services AMS Sourcing Event is Lakeshore Holdings's governed Source event that should be interpreted through its loaded evidence, stage gates, and artifacts.",
    );
    expect(answer?.answerText).not.toContain("Vendor A/B/C");
    expect(answer?.answerText).not.toContain("final RFP version of record");
  });

  it("does not unlock vendor-finalist fallback from standards-only context", () => {
    const contextWithStandardsOnly: SourceAgentContextBundle = {
      ...contextBundle,
      liveTenantContext: {
        ...liveTenantContext,
        retrievedEvidence: [
          {
            id: "source-artifact-standard:d24_decision_brief",
            segmentId: "artifact_standards",
            recordId: "d24_decision_brief",
            title: "D24 Decision Brief standard",
            sourceType: "contextChunk",
            sourceDoc: "Source artifact standards registry",
            excerpt:
              "Evaluation scorecard, decision brief, normalized vendor comparison, finalist recommendation, Vendor A, Vendor B, and Vendor C are standard sections when real supplier evidence exists.",
            confidence: "high",
            score: 100,
          },
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt: "Which vendor should advance to BAFO?",
      contextBundle: contextWithStandardsOnly,
      userRole: "cio",
    });

    expect(answer?.title).not.toBe("Evaluation scorecard answer");
    expect(answer?.answerText).not.toContain("Advance Vendor A");
    expect(answer?.answerText).not.toContain("Vendor C as a conditional");
    expect(answer?.answerText).not.toContain("Vendor B as a price benchmark");
  });

  it("falls back to vendor advisory when Lakeshore evaluation artifacts are present but summary row titles are not", () => {
    const contextWithLakeshoreEvaluationArtifacts: SourceAgentContextBundle = {
      ...contextBundle,
      liveTenantContext: {
        ...liveTenantContext,
        embeddedContextChunkCount: 0,
        retrievedEvidence: [
          {
            id: "source-artifact:lake-d24",
            segmentId: "sourcing_artifacts",
            recordId: "D24_Decision_Brief",
            title: "D24 Decision Brief",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              "Lakeshore D24 decision brief references Vendor A, Vendor B, Vendor C, a weighted scorecard, normalized vendor comparison, BAFO conditions, and finalist recommendation.",
            confidence: "high",
            score: 40,
          },
          {
            id: "source-artifact:lake-mve",
            segmentId: "sourcing_artifacts",
            recordId: "Vendor_Response_MVE_Profiles",
            title: "Vendor Response MVE Profiles",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              "Vendor A continuity option; Vendor B price challenger with staffing and productivity gaps; Vendor C service-accountability option with SLA economics and scope caveats.",
            confidence: "high",
            score: 39,
          },
          {
            id: "source-artifact:client-final",
            segmentId: "sourcing_artifacts",
            recordId: "client-final",
            title: "RFP Package - Client Final",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              'Artifact authority record: "Client Final - Lakeshore Shared Services AMS RFP Pack.docx" is a client-final upload and current authoritative RFP.',
            confidence: "high",
            score: 90,
          },
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt: "Which vendor should advance and why?",
      contextBundle: contextWithLakeshoreEvaluationArtifacts,
      userRole: "cio",
    });

    expect(answer?.title).toBe("Evaluation scorecard answer");
    // This fallback runs when structured vendor scores cannot be read, so it
    // must not name a leading, cheapest, or riskiest vendor.
    expect(answer?.answerText).toContain(
      "structured vendor scores could not be read",
    );
    expect(answer?.answerText).not.toMatch(/Vendor [ABC] (is|leads|carries)/);
    expect(answer?.answerText).toContain("targeted BAFO");
    expect(answer?.answerText).not.toContain("final RFP version");
    expect(answer?.answerText).not.toContain("client-final artifact");
  });

  it("falls back to BAFO advisory when Lakeshore challenge and leverage artifacts are present but instruction row titles are not", () => {
    const contextWithLakeshoreBafoArtifacts: SourceAgentContextBundle = {
      ...contextBundle,
      liveTenantContext: {
        ...liveTenantContext,
        embeddedContextChunkCount: 0,
        retrievedEvidence: [
          {
            id: "source-artifact:lake-bafo",
            segmentId: "sourcing_artifacts",
            recordId: "BAFO_Instruction_Pack",
            title: "BAFO Pack",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              "BAFO pack covers Vendor A, Vendor B, and Vendor C with pricing workbook, staffing model, SLA commitment, transition plan, productivity commitment, assumptions, and exclusions.",
            confidence: "high",
            score: 40,
          },
          {
            id: "source-artifact:lake-challenge",
            segmentId: "sourcing_artifacts",
            recordId: "Challenge_Log_and_Commercial_Leverage",
            title: "Challenge Log and Commercial Leverage Seeds",
            sourceType: "contextChunk",
            sourceDoc: "source_artifacts",
            excerpt:
              "Vendor A needs productivity credit and transition fee holdback. Vendor B needs staffing coverage, retained-client effort, tooling pass-through, and productivity credit evidence. Vendor C needs scope, SLA economics, and transition normalization.",
            confidence: "high",
            score: 39,
          },
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt: "What should we ask Vendor B before scoring?",
      contextBundle: contextWithLakeshoreBafoArtifacts,
      userRole: "cio",
    });

    expect(answer?.title).toBe("BAFO instruction answer");
    expect(answer?.answerText).toContain("Before scoring Vendor B");
    expect(answer?.answerText).toContain("staffing coverage");
    expect(answer?.answerText).toContain("retained-client effort");
    expect(answer?.answerText).toContain("revised pricing workbook");
    expect(answer?.answerText).not.toContain("source_artifacts");
    expect(answer?.answerText).not.toContain("Sourcing Artifacts");
  });

  it("attaches a Slice 1.1 category strategy classification (CDP -> data/AI platform)", () => {
    const answer = buildSourceAnswerEngine({
      prompt: "How should the CIO shape the CDP sourcing event?",
      contextBundle,
      userRole: "cio",
    });

    const strategy = answer?.categoryStrategy;
    expect(strategy).not.toBeNull();
    expect(strategy?.categoryId).toBe("data_ai_platform");
    expect(strategy?.buyingMotion).toBe("competitive_rfp");
    // it_financials is a required input for data/AI platform and the fixture
    // live context does not load it — so it must surface as an evidence gap.
    expect(strategy?.evidenceGaps.map((gap) => gap.segment)).toContain(
      "it_financials",
    );
    expect(strategy?.classifierVersion).toBe("source-category-classifier/v1");
  });

  it("attaches a Slice 1.3 should-cost estimate modelling the full TCO iceberg", () => {
    const answer = buildSourceAnswerEngine({
      prompt: "How should the CIO shape the CDP sourcing event?",
      contextBundle,
      userRole: "cio",
    });

    const estimate = answer?.shouldCostEstimate;
    expect(estimate).not.toBeNull();
    expect(estimate?.modelVersion).toBe("1.0");
    expect(estimate?.estimateLabel).toBe("CDP Vendor Selection");
    // The visible quoted layer is anchored to the event value-at-stake.
    expect(estimate?.vendorQuotedCost).toBe(2_400_000);
    // The iceberg surfaces the visible layer plus seven hidden layers.
    expect(estimate?.icebergLayers.length).toBe(8);
    // Should-cost must exceed the quote once the hidden layers are modelled.
    expect(estimate?.totalHigh ?? 0).toBeGreaterThan(2_400_000);
    expect(estimate?.headline).toContain("should-cost");
    expect(answer?.responseParts.some((part) => part.type === "barChart")).toBe(
      true,
    );
  });

  it("attaches a Slice 1.4 proposal-normalization matrix scoped to the event", () => {
    const answer = buildSourceAnswerEngine({
      prompt: "How should the CIO shape the CDP sourcing event?",
      contextBundle,
      userRole: "cio",
    });

    const matrix = answer?.proposalNormalization;
    expect(matrix).not.toBeNull();
    expect(matrix?.eventId).toBe("apx-src-cdp-2026");
    expect(matrix?.eventName).toBe("CDP Vendor Selection");
    // The matrix covers all eight proposal dimensions.
    expect(matrix?.summary.totalDimensions).toBe(8);
    expect(matrix?.rows.length).toBe(8);
    // No structured vendor proposals on the bundle yet — the normalizer must
    // return the conservative "collect responses first" posture.
    expect(matrix?.summary.totalVendors).toBe(0);
    expect(matrix?.recommendedNextAction).toContain("Collect responses");
  });

  it("grounds Apex AMS BAFO savings questions in the expanded Source corpus doctrine", () => {
    const apexAmsBundle: SourceAgentContextBundle = {
      ...contextBundle,
      route: "/api/v1/source/apex-retail-ams-outsourcing-2026/nexus/ask",
      sourcingArchetype: "managed_services",
      sourcingEvent: {
        ...contextBundle.sourcingEvent,
        id: SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026,
        code: "SRC-004",
        name: "Apex Retail AMS Outsourcing 2026",
        accountName: "Apex Retail Group",
        archetype: "managed_services",
        rigor: "strategic",
        lifecycleStatus: "active",
        owner: "CIO Office",
        currentStageKey: "bafo",
        valueAtStakeUsd: 35_000_000,
      },
      userPrompt:
        "How do we prove BAFO pricing savings to the CFO without overstating the number?",
    };

    const answer = buildSourceAnswerEngine({
      prompt:
        "How do we prove BAFO pricing savings to the CFO without overstating the number?",
      contextBundle: apexAmsBundle,
      userRole: "cio",
    });

    const answerText = [
      ...(answer?.expertLens ?? []),
      ...(answer?.riskTraps ?? []),
      ...(answer?.missingData ?? []),
      ...(answer?.limits ?? []),
    ].join("\n");

    expect(answerText).toContain("PAT-SRC-VPF-NO-EVIDENCE-NO-NUMBER");
    expect(answerText).toMatch(/savings|evidence/i);
    expect(answerText).toContain("global doctrine");
    expect(answer?.limits).toContain(
      "Corpus guidance is global doctrine; tenant, vendor, benchmark, and savings claims still require cited evidence.",
    );
  });

  it("answers contract optimization questions with question-specific sourcing guidance", () => {
    const contractEvidence: SourceLiveTenantContextSnapshot["retrievedEvidence"] =
      [
        {
          id: "source-event:skyh:contract-optimization-recommended-path",
          segmentId: "sourcing_artifacts",
          recordId: "contract-optimization-recommended-path",
          title: "Existing contract optimization recommended path",
          sourceType: "contextChunk",
          sourceDoc: "Source intake record",
          excerpt:
            "Immediate action: Issue a reservation-of-rights and cure notice covering invoice variance, SLA economics, staffing reconciliation, and change-order normalization before the renewal notice window closes. Primary path: Renegotiate the incumbent agreement with cure conditions, normalized run-rate baseline, stronger SLA credits, staffing true-up, and cataloged change-order controls. Fallback path: Prepare a competitive RFP if cure items remain unresolved or the incumbent cannot convert the evidence-backed levers into commercial commitments. Do not do: Do not renew as-is or treat the current run-rate as clean until leakage, staffing, SLA, and recurring change-order issues are resolved.",
          confidence: "high",
          score: 36,
        },
        {
          id: "source-event:skyh:contract-optimization-finding-price",
          segmentId: "sourcing_artifacts",
          recordId: "contract-optimization-finding-price",
          title:
            "Contract optimization finding - Invoices are running above contracted baseline",
          sourceType: "contextChunk",
          sourceDoc: "Source intake record",
          excerpt:
            "price leakage: $791,000 of above-baseline invoice variance appears in the sampled months; annualized exposure is about $1,582,000. Implication: The incumbent commercial baseline cannot be treated as clean until pass-throughs, demand changes, and out-of-catalog charges are reconciled. Recommended action: Create a recovery and normalization schedule before renewal pricing.",
          confidence: "high",
          score: 34,
        },
        {
          id: "source-event:skyh:contract-optimization-finding-sla",
          segmentId: "sourcing_artifacts",
          recordId: "contract-optimization-finding-sla",
          title:
            "Contract optimization finding - Service credits do not match operational criticality",
          sourceType: "contextChunk",
          sourceDoc: "Source intake record",
          excerpt:
            "sla credit leakage: 3 SLA commitment(s) show missed/weak performance economics or insufficient chronic-miss language. Implication: The buyer has operational risk without proportionate contractual remedy.",
          confidence: "high",
          score: 33,
        },
        {
          id: "source-event:skyh:contract-optimization-finding-staffing",
          segmentId: "sourcing_artifacts",
          recordId: "contract-optimization-finding-staffing",
          title:
            "Contract optimization finding - Committed staffing and observed coverage do not fully reconcile",
          sourceType: "contextChunk",
          sourceDoc: "Source intake record",
          excerpt:
            "staffing variance: 12.0 of 114.0 committed FTE equivalent(s) are not visible in observed staffing or shift coverage. Estimated staffing value exposure is $2,220,000 annually.",
          confidence: "high",
          score: 32,
        },
        {
          id: "source-event:skyh:contract-optimization-finding-change-order",
          segmentId: "sourcing_artifacts",
          recordId: "contract-optimization-finding-change-order",
          title:
            "Contract optimization finding - Change-order spend is not cleanly cataloged into the run baseline",
          sourceType: "contextChunk",
          sourceDoc: "Source intake record",
          excerpt:
            "change-order exposure: $1,152,000 of sampled exposure lacks clean catalog mapping, complete approval evidence, or one-time/recurring separation; $1,008,000 appears recurring.",
          confidence: "high",
          score: 31,
        },
      ];
    const skyharborContractBundle: SourceAgentContextBundle = {
      ...contextBundle,
      tenant: {
        tenantId: "skyharbor",
        tenantKey: "skyharbor",
        tenantName: "SkyHarbor Air",
      },
      route: "/api/v1/source/SKYH-AMS-CONTRACT-OPT-2026/nexus/ask",
      sourcingArchetype: "managed_services",
      sourcingEvent: {
        ...contextBundle.sourcingEvent,
        id: "skyh-ams-contract-opt-2026",
        code: "SKYH-AMS-CONTRACT-OPT-2026",
        name: "SkyHarbor Air AMS Contract Optimization",
        accountName: "SkyHarbor Air",
        archetype: "managed_services",
        rigor: "strategic",
        lifecycleStatus: "active",
        owner: "VP IT Operations / Procurement commercial lead",
        valueAtStakeUsd: 38_400_000,
        currentStageKey: "responses",
      },
      liveTenantContext: {
        ...liveTenantContext,
        clientKey: "skyharbor",
        brokerTenantKey: "skyharbor",
        retrievedEvidence: contractEvidence,
      },
    };

    const renewAnswer = buildSourceAnswerEngine({
      prompt: "Should we renew, renegotiate, or rebid?",
      contextBundle: skyharborContractBundle,
      userRole: "cio",
    });
    const cureAnswer = buildSourceAnswerEngine({
      prompt: "What should the cure notice say?",
      contextBundle: skyharborContractBundle,
      userRole: "cio",
    });
    const missingAnswer = buildSourceAnswerEngine({
      prompt: "What evidence is missing?",
      contextBundle: skyharborContractBundle,
      userRole: "cio",
    });
    const exposureAnswer = buildSourceAnswerEngine({
      prompt: "Where are we leaking money?",
      contextBundle: skyharborContractBundle,
      userRole: "cio",
    });
    const businessImpactAnswer = buildSourceAnswerEngine({
      prompt:
        "Where is value leaking, what is the business impact, and what should we do now?",
      contextBundle: skyharborContractBundle,
      userRole: "cio",
    });

    expect(renewAnswer?.answerText).toContain("Do not renew as-is");
    expect(renewAnswer?.answerText).toContain("RFP fallback");
    expect(renewAnswer?.answerText).toContain("Decision posture:");
    expect(renewAnswer?.answerText).toContain(
      "Financial exposure: approximately $3.6M-$4.8M annualized, subject to vendor cure review.",
    );
    expect(renewAnswer?.answerText).toContain("Action required:");
    expect(
      renewAnswer?.responseParts.some(
        (part) =>
          part.type === "barChart" && part.title === "Exposure by driver",
      ),
    ).toBe(true);
    expect(
      renewAnswer?.responseParts.some(
        (part) =>
          part.type === "table" && part.title === "Business impact lens",
      ),
    ).toBe(true);
    expect(
      renewAnswer?.responseParts.some(
        (part) =>
          part.type === "table" &&
          part.title === "Contract optimization decision signals",
      ),
    ).toBe(true);
    expect(renewAnswer?.answerText).not.toContain(
      "Contract optimization finding",
    );
    expect(cureAnswer?.answerText).toContain(
      "The cure notice should preserve rights",
    );
    expect(cureAnswer?.answerText).toContain("Cure posture:");
    expect(cureAnswer?.answerText).toContain("Invoice cure");
    expect(cureAnswer?.answerText).toContain("Change-order cure");
    expect(
      cureAnswer?.responseParts.some(
        (part) => part.type === "table" && part.title === "Cure notice agenda",
      ),
    ).toBe(true);
    expect(cureAnswer?.answerText).not.toContain("\nAction:");
    expect(exposureAnswer?.answerText).not.toContain(
      "Operational pressure: - ",
    );
    expect(exposureAnswer?.answerText).toContain("Top exposure drivers:");
    expect(exposureAnswer?.answerText).toContain(
      "Financial exposure: approximately $3.6M-$4.8M annualized, subject to vendor cure review.",
    );
    expect(
      exposureAnswer?.responseParts.some(
        (part) =>
          part.type === "barChart" && part.title === "Exposure by driver",
      ),
    ).toBe(true);
    expect(businessImpactAnswer?.title).toBe("Contract optimization answer");
    expect(businessImpactAnswer?.answerText).toContain(
      "The money leakage is concentrated in invoice variance",
    );
    expect(businessImpactAnswer?.answerText).toContain("Immediate action:");
    expect(businessImpactAnswer?.answerText).not.toMatch(
      /^Existing contract optimization recommended path is cited evidence/i,
    );
    expect(
      businessImpactAnswer?.responseParts.some(
        (part) =>
          part.type === "table" && part.title === "Business impact lens",
      ),
    ).toBe(true);
    expect(missingAnswer?.answerText).toContain(
      "not enough to approve a final commercial reset",
    );
    expect(missingAnswer?.answerText).toContain("Top 3 gaps:");
    expect(renewAnswer?.answerText.length).toBeLessThan(2200);
    expect(cureAnswer?.answerText.length).toBeLessThan(2600);
    expect(exposureAnswer?.answerText.length).toBeLessThan(1800);
    expect(renewAnswer?.answerText).not.toEqual(cureAnswer?.answerText);
    expect(cureAnswer?.answerText).not.toEqual(missingAnswer?.answerText);
  });

  it("answers persisted contract evidence questions from structured Source evidence", () => {
    const contextWithContractEvidence: SourceAgentContextBundle = {
      ...contextBundle,
      liveTenantContext: {
        ...liveTenantContext,
        retrievedEvidence: [
          {
            id: "source-event:lakeshore:structured-evidence-family-invoice",
            segmentId: "it_financials",
            recordId: "structured-evidence-family-invoice_exception",
            title: "Structured evidence - Invoice exceptions",
            sourceType: "contextChunk",
            sourceDoc: "Source structured evidence",
            excerpt:
              "Invoice exceptions: 14 accepted evidence record(s) out of 14; status loaded.",
            confidence: "high",
            score: 39,
          },
          {
            id: "source-event:lakeshore:structured-evidence-family-staffing",
            segmentId: "operating_telemetry",
            recordId: "structured-evidence-family-staffing_model",
            title: "Structured evidence - Staffing model",
            sourceType: "contextChunk",
            sourceDoc: "Source structured evidence",
            excerpt:
              "Staffing model: 6 accepted evidence record(s) out of 6; status loaded.",
            confidence: "high",
            score: 38,
          },
          {
            id: "source-event:lakeshore:structured-evidence-metric-invoice",
            segmentId: "it_financials",
            recordId:
              "structured-evidence-metric-invoice_exception_exposure_usd",
            title: "Calculated metric - Invoice exception exposure",
            sourceType: "contextChunk",
            sourceDoc: "Source structured evidence",
            excerpt:
              "Invoice exception exposure: $540,000, calculated from Invoice exceptions.",
            confidence: "high",
            score: 37,
          },
          {
            id: "source-event:lakeshore:structured-evidence-finding-invoice",
            segmentId: "it_financials",
            recordId: "structured-evidence-finding-invoice_leakage",
            title: "Supported finding - Invoice leakage",
            sourceType: "contextChunk",
            sourceDoc: "Source structured evidence",
            excerpt:
              "Invoice exception exposure: $540,000. This supports a recovery or cure discussion before renewal or renegotiation.",
            confidence: "high",
            score: 36,
          },
          ...liveTenantContext.retrievedEvidence,
        ],
      },
    };

    const answer = buildSourceAnswerEngine({
      prompt:
        "What evidence is loaded and what calculated findings can we use?",
      contextBundle: contextWithContractEvidence,
      userRole: "cio",
    });

    expect(answer?.title).toBe("Structured Source evidence answer");
    expect(answer?.answerText).toContain(
      "sourcing-critical evidence loaded for Invoice exceptions and Staffing model",
    );
    expect(answer?.answerText).toContain(
      "Invoice exception exposure: $540,000",
    );
    expect(answer?.answerText).toContain("Invoice leakage");
    expect(answer?.answerText).not.toContain("source_contract");
    expect(answer?.answerText).not.toContain("raw document browsing");
    expect(
      answer?.responseParts.some(
        (part) =>
          part.type === "barChart" &&
          part.title === "Calculated sourcing metrics",
      ),
    ).toBe(true);
    expect(
      answer?.responseParts.some(
        (part) => part.type === "table" && part.title === "Evidence coverage",
      ),
    ).toBe(true);
    expect(
      answer?.responseParts.some(
        (part) => part.type === "table" && part.title === "Supported findings",
      ),
    ).toBe(true);
  });
});
