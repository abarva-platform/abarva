import {
  buildEvidenceReadinessGovernedAnswer,
  looksLikeEvidenceReadinessQuestion,
  looksLikeSourceStageCompletionQuestion,
} from "@/lib/source/ava/evidence-readiness-governed-answer";
import { listSourceArtifactsForSourceEventIdWithContent } from "@/lib/source/artifact-registry";
import type { SourceArtifactRegistryRecordWithContent } from "@/lib/source/artifact-registry";
import {
  listArtifactStatesForEventStage,
  type SourceEventArtifactState,
} from "@/lib/source/canvas-substrate";

jest.mock("@/lib/source/artifact-registry", () => ({
  listSourceArtifactsForSourceEventIdWithContent: jest.fn(),
}));

jest.mock("@/lib/source/canvas-substrate", () => ({
  listArtifactStatesForEventStage: jest.fn(),
}));

const mockListSourceArtifacts = jest.mocked(
  listSourceArtifactsForSourceEventIdWithContent,
);
const mockListArtifactStates = jest.mocked(listArtifactStatesForEventStage);

function artifact(
  overrides: Partial<SourceArtifactRegistryRecordWithContent> = {},
): SourceArtifactRegistryRecordWithContent {
  return {
    id: "artifact-1",
    tenantKey: "meridian",
    sourceEventId: "event-1",
    sourceEventRowId: null,
    stageKey: "scope",
    artifactFamily: "scope_document",
    artifactKind: "d05_scope_memo",
    sourceOrigin: "uploaded",
    sourceFormat: "docx",
    originalName: "Client Final Scope Memo.docx",
    blobUri: "inline://source-event-artifact-state/artifact-1",
    uploaderUserId: "user-1",
    mimeType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sizeBytes: 1200,
    sha256: "sha",
    parseStatus: "pending",
    embeddingStatus: "pending",
    graphStatus: "pending",
    classificationStatus: "classified",
    dataClassification: "Confidential",
    evidenceState: "unparsed",
    approvalState: "approved",
    description: null,
    isClientFinal: true,
    isCurrentAuthoritative: true,
    sourceGeneratedArtifactId: null,
    clientFinalUploadedBy: "user-1",
    clientFinalUploadedAt: "2026-07-23T00:00:00.000Z",
    clientFinalAcceptedBy: "user-2",
    clientFinalAcceptedAt: "2026-07-23T01:00:00.000Z",
    clientFinalNote: "Accepted after client review.",
    clientFinalReviewMeetingDate: null,
    clientFinalStakeholderGroup: "Steering committee",
    clientFinalChangeSummary: {},
    citedSourceArtifactIds: [],
    version: 2,
    supersedesArtifactVersionId: null,
    createdBy: "user-1",
    validatedBy: null,
    createdAt: "2026-07-23T00:00:00.000Z",
    updatedAt: "2026-07-23T01:00:00.000Z",
    deletedAt: null,
    bodyMarkdown:
      "# Scope Memo\n\n## Executive Summary\n\nThis memo names scope, baselines, responsibilities, assumptions, and approval.",
    ...overrides,
  };
}

function artifactState(
  overrides: Partial<SourceEventArtifactState>,
): SourceEventArtifactState {
  return {
    id: "state-1",
    sourceEventId: "event-1",
    tenantKey: "meridian",
    artifactCode: "d04_app_inv",
    stage: "scope",
    family: "scope_document",
    tier: "rich",
    status: "drafting",
    requirementLevel: "required",
    gateDefining: true,
    linkedArtifactId: null,
    notes: null,
    body: null,
    bodyFormat: "markdown",
    bodyAuthoredBy: null,
    bodyUpdatedAt: null,
    bodyGenerationMetadata: null,
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
    ...overrides,
  };
}

describe("looksLikeEvidenceReadinessQuestion", () => {
  it("matches parse, indexing, and evidence-readiness questions", () => {
    expect(
      looksLikeEvidenceReadinessQuestion(
        "Which uploaded evidence is parsed and search-ready?",
      ),
    ).toBe(true);
    expect(
      looksLikeEvidenceReadinessQuestion(
        "Show files needing parser backfill or indexing as a chart",
      ),
    ).toBe(true);
    expect(
      looksLikeEvidenceReadinessQuestion(
        "Have the workshop notes been promoted to enterprise context?",
      ),
    ).toBe(true);
  });

  it("does not swallow neighboring structured-answer intents", () => {
    expect(looksLikeEvidenceReadinessQuestion(undefined)).toBe(false);
    expect(looksLikeEvidenceReadinessQuestion("")).toBe(false);
    expect(looksLikeEvidenceReadinessQuestion("How is artifact quality?")).toBe(
      false,
    );
    expect(
      looksLikeEvidenceReadinessQuestion(
        "Assess artifact lifecycle posture, client-final readiness, consulting quality, and required deliverable standards.",
      ),
    ).toBe(false);
    expect(
      looksLikeEvidenceReadinessQuestion(
        "How are vendors doing on response coverage?",
      ),
    ).toBe(false);
    expect(looksLikeEvidenceReadinessQuestion("Show the value waterfall")).toBe(
      false,
    );
  });
});

describe("looksLikeSourceStageCompletionQuestion", () => {
  it("recognizes the signed-in Source New completion-and-evidence question", () => {
    expect(
      looksLikeSourceStageCompletionQuestion(
        "What do I need to complete Define, and which evidence is still missing?",
      ),
    ).toBe(true);
    expect(
      looksLikeSourceStageCompletionQuestion(
        "What is blocking this event from advancing from Define, and what exact action should the sourcing lead take next? Do not estimate savings or recommend a supplier.",
      ),
    ).toBe(true);
  });

  it("does not steal a pure evidence-processing question", () => {
    expect(
      looksLikeSourceStageCompletionQuestion(
        "Which uploaded evidence is parsed and search-ready?",
      ),
    ).toBe(false);
  });
});

describe("buildEvidenceReadinessGovernedAnswer", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockListArtifactStates.mockResolvedValue([]);
  });

  it("emits a governed chart + table from existing registry parse/search states", async () => {
    const parserReady = artifact();
    const parsedSearchReady = artifact({
      id: "artifact-2",
      originalName: "Parsed Pricing Workbook.xlsx",
      artifactFamily: "pricing_workbook",
      artifactKind: "d19_pricing_workbook",
      sourceFormat: "xlsx",
      parseStatus: "parsed",
      embeddingStatus: "embedded",
      graphStatus: "projected",
      evidenceState: "cited",
    });
    const failed = artifact({
      id: "artifact-3",
      originalName: "Failed Workshop Notes.txt",
      artifactFamily: "meeting_notes",
      artifactKind: "workshop_notes",
      sourceFormat: "txt",
      parseStatus: "failed",
      approvalState: "not_required",
      isClientFinal: false,
      isCurrentAuthoritative: false,
    });

    mockListSourceArtifacts.mockImplementation(async (eventId) => {
      if (eventId === "event-1") {
        return [
          parserReady,
          parsedSearchReady,
          artifact({ id: "other-tenant", tenantKey: "other" }),
        ];
      }
      if (eventId === "SRC-001") return [parserReady, failed];
      return [];
    });

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-1",
      eventAliases: ["SRC-001"],
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "Which uploaded evidence is parsed and search-ready?",
    });

    expect(listSourceArtifactsForSourceEventIdWithContent).toHaveBeenCalledWith(
      "event-1",
    );
    expect(listSourceArtifactsForSourceEventIdWithContent).toHaveBeenCalledWith(
      "SRC-001",
    );
    expect(answer).not.toBeNull();
    expect(answer!.tenantKey).toBe("meridian-health");
    expect(answer!.intent).toBe("evidence_processing_readiness");
    expect(answer!.status).toBe("answered");
    expect(answer!.artifacts.map((item) => item.artifact)).toEqual([
      "chart",
      "table",
    ]);
    expect(answer!.citations).toHaveLength(3);
    expect(answer!.directAnswer).toContain("3 Source files are stored");
    expect(answer!.directAnswer).toContain("1 is parsed");
    expect(answer!.directAnswer).toContain("1 is search-ready");
    expect(answer!.directAnswer).toContain("1 is parser-ready");
    expect(answer!.directAnswer).toContain("1 has parser or review exceptions");
    expect(answer!.artifacts[0]).toMatchObject({
      artifact: "chart",
      title: "Evidence processing readiness",
    });
    expect(answer!.artifacts[1]).toMatchObject({
      artifact: "table",
      title: "Evidence items needing attention",
    });
    expect(answer!.caveats.map((caveat) => caveat.id)).toContain(
      "evidence-readiness-read-only",
    );
    expect(answer!.safety.tenantFencePassed).toBe(true);
    expect(answer!.safety.forbiddenLanguagePassed).toBe(true);
  });

  it("answers phase completion and evidence readiness together from recorded context", async () => {
    mockListSourceArtifacts.mockResolvedValue([
      artifact(),
      artifact({
        id: "artifact-2",
        originalName: "Parsed Scope Workbook.xlsx",
        parseStatus: "parsed",
        embeddingStatus: "pending",
      }),
    ]);

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question:
        "What do I need to complete Define, and which evidence is still missing?",
      stageContext: {
        stageLabel: "Define",
        nextAction: "Open scope and strategy",
        blocker: "Scope owner approval is not recorded",
        missingInputs: ["Approved scope", "Decision owner"],
      },
    });

    expect(answer).not.toBeNull();
    expect(answer!.directAnswer).toContain("Define is not complete");
    expect(answer!.directAnswer).toContain("Open scope and strategy");
    expect(answer!.directAnswer).toContain(
      "Scope owner approval is not recorded",
    );
    expect(answer!.directAnswer).toContain("Approved scope");
    expect(answer!.directAnswer).toContain("Decision owner");
    expect(answer!.directAnswer).toContain("2 Source files are stored");
    expect(answer!.directAnswer).toContain("0 are search-ready");
    expect(answer!.directAnswer).toContain("1 still requires parsing");
    expect(answer!.nextSteps[0]?.label).toContain("Open scope and strategy");
  });

  it("does not call a registered AI draft missing when recorded missing-input text still says no artifact is registered", async () => {
    mockListSourceArtifacts.mockResolvedValue([
      artifact({
        id: "scope-draft",
        tenantKey: "corpus_global",
        artifactKind: "d05_scope_memo",
        originalName: "Example Client Scope Memo with Boundaries.md",
        sourceOrigin: "generated",
        sourceFormat: "markdown",
        approvalState: "draft",
        isClientFinal: false,
        isCurrentAuthoritative: true,
      }),
    ]);

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-1",
      clientKey: "corpus_global",
      tenantId: null,
      question:
        "What do I need to complete Define, and which evidence is still missing?",
      stageContext: {
        stageLabel: "Define",
        nextAction: "Review generated scope artifacts",
        missingInputs: [
          "Scope Memo with Boundaries has no registered artifact yet",
          "Exclusion Log has no registered artifact yet",
        ],
      },
    });

    expect(answer).not.toBeNull();
    expect(answer!.directAnswer).toContain(
      "Scope Memo with Boundaries is registered as AI draft awaiting review",
    );
    expect(answer!.directAnswer).toContain(
      "Exclusion Log has no registered artifact yet",
    );
    expect(answer!.directAnswer).not.toContain(
      "Scope Memo with Boundaries has no registered artifact yet",
    );
  });

  it("states when the governed event records no blocker or missing phase inputs", async () => {
    mockListSourceArtifacts.mockResolvedValue([artifact()]);

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question:
        "What do I need to complete Define, and which evidence is still missing?",
      stageContext: {
        stageLabel: "Define",
        nextAction: "Open scope and strategy",
        missingInputs: [],
      },
    });

    expect(answer).not.toBeNull();
    expect(answer!.directAnswer).toContain("Define completion is not proven");
    expect(answer!.directAnswer).toContain("No recorded phase blocker");
    expect(answer!.directAnswer).toContain(
      "No required phase inputs are recorded as missing",
    );
  });

  it("uses the mounted artifact gate to answer the signed-in Define completion question", async () => {
    mockListSourceArtifacts.mockResolvedValue([
      artifact({
        id: "app-inventory-draft",
        tenantKey: "corpus_global",
        artifactKind: "d04_app_inv",
        originalName: "Application Inventory draft.xlsx",
        sourceOrigin: "generated",
        approvalState: "draft",
        isClientFinal: false,
      }),
      artifact({
        id: "scope-memo-draft",
        tenantKey: "corpus_global",
        artifactKind: "d05_scope_memo",
        originalName: "Scope Memo draft.docx",
        sourceOrigin: "generated",
        approvalState: "draft",
        isClientFinal: false,
      }),
      artifact({
        id: "exclusion-log-evidence",
        tenantKey: "corpus_global",
        artifactKind: "d06_excl_log",
        originalName: "Exclusion Log evidence.xlsx",
        sourceOrigin: "uploaded",
        approvalState: "not_required",
        isClientFinal: false,
      }),
      artifact({
        id: "ticket-history-draft",
        tenantKey: "corpus_global",
        artifactKind: "d07_ticket_synth",
        originalName: "Ticket History draft.xlsx",
        sourceOrigin: "generated",
        approvalState: "draft",
        isClientFinal: false,
      }),
    ]);

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-1",
      clientKey: "corpus_global",
      tenantId: null,
      question:
        "What is blocking this event from advancing from Define, and what exact action should the sourcing lead take next? Do not estimate savings or recommend a supplier.",
      stageContext: {
        stageKey: "scope",
        stageLabel: "Define",
        nextAction: "Open scope and strategy",
        missingInputs: [],
      },
    });

    expect(answer).not.toBeNull();
    expect(answer!.directAnswer).toContain("Define is not complete");
    expect(answer!.directAnswer).toContain(
      "Next action: Review and accept the blocked artifacts in Files",
    );
    expect(answer!.directAnswer).toContain("4 required/gate artifacts");
    expect(answer!.directAnswer).toContain(
      "Application Inventory & Tiering: AI draft not accepted as client final",
    );
    expect(answer!.directAnswer).toContain(
      "Scope Memo with Boundaries: AI draft not accepted as client final",
    );
    expect(answer!.directAnswer).toContain(
      "Exclusion Log: evidence is present, but no governed deliverable is accepted",
    );
    expect(answer!.directAnswer).toContain(
      "Ticket History Synthesis: AI draft not accepted as client final",
    );
    expect(answer!.directAnswer).not.toContain("No recorded phase blocker");
  });

  it("reconciles accepted tenant aliases without admitting another event or tenant", async () => {
    mockListSourceArtifacts.mockResolvedValue([
      artifact({
        id: "app-inventory-draft",
        tenantKey: "meridian",
        sourceEventId: "event-1",
        artifactKind: "d04_app_inv",
        originalName: "Application Inventory draft.xlsx",
        sourceOrigin: "generated",
        approvalState: "draft",
        isClientFinal: false,
      }),
      artifact({
        id: "scope-memo-draft",
        tenantKey: "meridian-health",
        sourceEventId: "event-1",
        artifactKind: "d05_scope_memo",
        originalName: "Scope Memo draft.docx",
        sourceOrigin: "generated",
        approvalState: "draft",
        isClientFinal: false,
      }),
      artifact({
        id: "exclusion-log-evidence",
        tenantKey: "meridian_health_global",
        sourceEventId: "event-1",
        artifactKind: "d06_excl_log",
        originalName: "Exclusion Log evidence.xlsx",
        sourceOrigin: "uploaded",
        approvalState: "not_required",
        isClientFinal: false,
      }),
      artifact({
        id: "ticket-history-draft",
        tenantKey: "meridian",
        sourceEventId: "event-1",
        artifactKind: "d07_ticket_synth",
        originalName: "Ticket History draft.xlsx",
        sourceOrigin: "generated",
        approvalState: "draft",
        isClientFinal: false,
      }),
      artifact({
        id: "foreign-tenant-same-event",
        tenantKey: "other",
        sourceEventId: "event-1",
      }),
      artifact({
        id: "same-tenant-opposite-event",
        tenantKey: "meridian",
        sourceEventId: "event-2",
      }),
    ]);

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-1",
      eventAliases: ["SRC-001"],
      clientKey: "meridian_health_global",
      tenantId: "tenant-1",
      question:
        "What is blocking this event from advancing from Define, and what exact action should the sourcing lead take next? Do not estimate savings or recommend a supplier.",
      stageContext: {
        stageKey: "scope",
        stageLabel: "Define",
        nextAction: "Open scope and strategy",
        missingInputs: [],
      },
    });

    expect(answer).not.toBeNull();
    expect(answer!.directAnswer).toContain("4 Source files are stored");
    expect(answer!.directAnswer).toContain(
      "Application Inventory & Tiering: AI draft not accepted as client final",
    );
    expect(answer!.directAnswer).toContain(
      "Scope Memo with Boundaries: AI draft not accepted as client final",
    );
    expect(answer!.directAnswer).toContain(
      "Exclusion Log: evidence is present, but no governed deliverable is accepted",
    );
    expect(answer!.directAnswer).toContain(
      "Ticket History Synthesis: AI draft not accepted as client final",
    );
    expect(
      answer!.citations.map((citation) => citation.recordId),
    ).not.toContain("foreign-tenant-same-event");
    expect(
      answer!.citations.map((citation) => citation.recordId),
    ).not.toContain("same-tenant-opposite-event");
  });

  it("uses the mounted Files projection of registry files plus current-stage artifact states", async () => {
    mockListSourceArtifacts.mockResolvedValue(
      Array.from({ length: 17 }, (_, index) =>
        artifact({
          id: `registry-${index + 1}`,
          sourceEventId: "event-1",
          artifactKind:
            index === 0
              ? "d04_app_inv"
              : index === 1
                ? "d05_scope_memo"
                : index === 2
                  ? "d07_ticket_synth"
                  : `supporting-${index + 1}`,
          sourceOrigin: index < 3 ? "generated" : "uploaded",
          approvalState: index < 3 ? "draft" : "not_required",
          isClientFinal: false,
          isCurrentAuthoritative: false,
          parseStatus: index < 6 ? "parsed" : "pending",
        }),
      ),
    );
    mockListArtifactStates.mockResolvedValue([
      artifactState({
        id: "state-app-inventory",
        linkedArtifactId: "registry-1",
      }),
      artifactState({
        id: "state-scope-memo",
        artifactCode: "d05_scope_memo",
        linkedArtifactId: "registry-2",
      }),
      artifactState({
        id: "state-exclusion-log",
        artifactCode: "d06_excl_log",
        notes: "Supporting evidence is registered.",
      }),
      artifactState({
        id: "state-ticket-history",
        artifactCode: "d07_ticket_synth",
        linkedArtifactId: "registry-3",
      }),
      artifactState({
        id: "state-premortem",
        artifactCode: "d08_premortem",
        family: "workshop_output",
        tier: "outline",
        requirementLevel: "optional",
        gateDefining: false,
      }),
      artifactState({
        id: "foreign-event-state",
        sourceEventId: "event-2",
        artifactCode: "d06_excl_log",
        status: "approved",
      }),
    ]);

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question:
        "What is blocking this event from advancing from Define, and what exact action should the sourcing lead take next? Do not estimate savings or recommend a supplier.",
      stageContext: {
        stageKey: "scope",
        stageLabel: "Define",
        nextAction: "Open scope and strategy",
        missingInputs: [],
      },
    });

    expect(mockListArtifactStates).toHaveBeenCalledWith("event-1", "scope");
    expect(answer).not.toBeNull();
    expect(answer!.directAnswer).toContain(
      "22 Source artifact records are stored",
    );
    expect(answer!.directAnswer).toContain("6 are parsed");
    expect(answer!.directAnswer).toContain("16 still require parsing");
    expect(answer!.directAnswer).toContain(
      "Exclusion Log: evidence is present, but no governed deliverable is accepted",
    );
    expect(answer!.directAnswer).not.toContain("Exclusion Log: not registered");
    expect(answer!.directAnswer).not.toMatch(/\bsavings?\b/i);
    expect(answer!.directAnswer).not.toMatch(
      /recommend(?:ed|ation)? a supplier/i,
    );
    expect(answer!.artifacts[0]).toMatchObject({
      artifact: "chart",
      data: {
        data: expect.arrayContaining([
          { metric: "Stored", count: 22 },
          { metric: "Needs parser", count: 16 },
          { metric: "Parsed", count: 6 },
        ]),
      },
    });
  });

  it("answers honestly when no registry rows exist", async () => {
    mockListSourceArtifacts.mockResolvedValue([]);

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-empty",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "Show evidence readiness status",
    });

    expect(answer).not.toBeNull();
    expect(answer!.status).toBe("no_data");
    expect(answer!.citations).toHaveLength(0);
    expect(answer!.directAnswer).toContain(
      "No Source evidence files are registered",
    );
    expect(answer!.gaps).toEqual([
      expect.objectContaining({
        id: "evidence-readiness-files-missing",
        severity: "high",
      }),
    ]);
    expect(answer!.caveats[0]?.detail).toContain("parsed no bytes");
  });

  it("blocks instead of rendering restricted evidence rows", async () => {
    mockListSourceArtifacts.mockResolvedValue([
      artifact({
        sourceEventId: "event-restricted",
        dataClassification: "Restricted",
      }),
    ]);

    const answer = await buildEvidenceReadinessGovernedAnswer({
      eventId: "event-restricted",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "Which files are parsed?",
    });

    expect(answer).not.toBeNull();
    expect(answer!.status).toBe("blocked");
    expect(answer!.safety.tenantFencePassed).toBe(false);
    expect(answer!.artifacts).toHaveLength(0);
    expect(answer!.gaps[0]?.detail).toContain(
      'sensitive classification "restricted"',
    );
  });
});
