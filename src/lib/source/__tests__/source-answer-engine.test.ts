import {
  buildSourceAnswerEngine,
  detectSourceAnswerMode,
  type SourceAnswerMode,
} from "../source-answer-engine";
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
    expect(answer?.answerText).toContain("Current state");
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
    expect(answer?.responseParts.some((part) => part.type === 'table')).toBe(true);
    expect(answer?.responseParts.some((part) => part.type === 'barChart')).toBe(true);
    expect(answer?.responseParts.some((part) => part.type === 'citations')).toBe(true);
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
    expect(visiblePayload).toContain("Ava has guided");
    expect(visiblePayload).not.toContain("Sentinel has guided");
    expect(answer?.responseParts[0]).toMatchObject({
      type: "metricStrip",
      title: "Ava sourcing read",
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
      "17 RFP Risk Register APPROVED.csv is loaded as cited sourcing evidence",
    );
    expect(answer?.answerText).not.toContain("risk_id,risk_category");
    expect(answer?.answerText).not.toContain("RFP-R1,Transition");
    const visiblePayload = JSON.stringify({
      answerText: answer?.answerText,
      currentStateFindings: answer?.currentStateFindings,
      evidenceCitations: answer?.evidenceCitations,
      responseParts: answer?.responseParts,
    });
    expect(visiblePayload).toContain(
      "17 RFP Risk Register APPROVED.csv is structured Source evidence",
    );
    expect(visiblePayload).not.toContain("risk_id,risk_category");
    expect(visiblePayload).not.toContain("blocking_gate,evidence_basis");
    expect(visiblePayload).not.toContain("RFP-R1,Transition");
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
    expect(answer?.answerText).toContain("BAFO should focus on 3 unresolved commercial commitments");
    expect(answer?.answerText).toContain("Vendor A");
    expect(answer?.answerText).toContain("Vendor B");
    expect(answer?.answerText).toContain("Vendor C");
    expect(answer?.answerText).toContain("structured exhibits");
    expect(answer?.answerText).toContain("Do not award full scoring credit");
    expect(answer?.recommendedNextAction).toContain("Issue the vendor-specific BAFO questions");
    expect(answer?.answerText).not.toContain("Mode:");
    expect(answer?.answerText).not.toContain("Current state:");
    expect(answer?.answerText).not.toContain("source_events");
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
});
