import {
  buildEvidenceReadinessGovernedAnswer,
  eventContextCandidatesForEvidenceReadiness,
  looksLikeEvidenceReadinessQuestion,
  looksLikeSourceStageCompletionQuestion,
} from "@/lib/source/ava/evidence-readiness-governed-answer";
import { acceptedArtifactVersionsFor } from "@/lib/source/ava/artifact-quality-governed-answer";
import { buildGovernedEventContextBundle } from "@/lib/source/ava/event-context-bundle";
import { getLatestArtifactAcceptancesByArtifactIds } from "@/lib/source/artifact-acceptances";
import type { ArtifactAcceptanceRecord } from "@/lib/source/artifact-acceptances";
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

jest.mock("@/lib/source/artifact-acceptances", () => ({
  getLatestArtifactAcceptancesByArtifactIds: jest.fn(),
}));

const mockListSourceArtifacts = jest.mocked(
  listSourceArtifactsForSourceEventIdWithContent,
);
const mockListArtifactStates = jest.mocked(listArtifactStatesForEventStage);
const mockGetLatestAcceptances = jest.mocked(
  getLatestArtifactAcceptancesByArtifactIds,
);

/**
 * A real acceptance row shape: `authoritative_version_id` is its own column,
 * so a fixture that defaulted it to the artifact id would hide the
 * superseded-version case the fence exists for.
 */
function acceptance(
  overrides: Partial<ArtifactAcceptanceRecord> = {},
): ArtifactAcceptanceRecord {
  const artifactId = overrides.artifactId ?? "artifact-1";
  return {
    id: `acceptance-${artifactId}`,
    artifactId,
    eventId: "event-1",
    stageKey: "scope",
    artifactState: "client_final",
    authoritativeVersionId: artifactId,
    artifactRole: "authoritative",
    contentDriftStatus: "current",
    gatePreconditionStatus: "ready",
    downstreamContextPolicy: "include",
    diffSummary: null,
    approvalRationale: "Accepted after client review.",
    acceptedBy: "user-2",
    acceptedAt: "2026-07-23T01:00:00.000Z",
    createdAt: "2026-07-23T01:00:00.000Z",
    ...overrides,
  };
}

function acceptedAll(...artifactIds: string[]) {
  return new Map(
    artifactIds.map((artifactId) => [artifactId, acceptance({ artifactId })]),
  );
}

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
    // Fail-closed default: no file is accepted unless a test says so.
    mockGetLatestAcceptances.mockResolvedValue(new Map());
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
    // C-506: a file is cited only when its current version is accepted. All
    // three of this event's files are, so all three are still cited; the
    // opposite-tenant row is accepted too and must still not be.
    mockGetLatestAcceptances.mockResolvedValue(
      acceptedAll("artifact-1", "artifact-2", "artifact-3", "other-tenant"),
    );

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
    // C-506: every row is accepted, so the two exclusions below are decided by
    // the event fence's tenant and event rules rather than by the absence of
    // an acceptance — without this, both assertions would pass vacuously.
    mockGetLatestAcceptances.mockResolvedValue(
      acceptedAll(
        "app-inventory-draft",
        "scope-memo-draft",
        "exclusion-log-evidence",
        "ticket-history-draft",
        "foreign-tenant-same-event",
        "same-tenant-opposite-event",
      ),
    );

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
    // The four files on this tenant's aliases are accepted and current, so
    // canonicalising the alias keys must admit them, not refuse them as
    // another tenant's.
    expect(
      answer!.citations.map((citation) => citation.recordId).sort(),
    ).toEqual([
      "app-inventory-draft",
      "exclusion-log-evidence",
      "scope-memo-draft",
      "ticket-history-draft",
    ]);
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

// C-506 · mode 2 of 10. The evidence-readiness answer used to cite every file
// registered to the event for this tenant. It now cites only files whose
// current version is accepted, read from the acceptance record's own
// `authoritative_version_id`. The readiness report, chart and table still
// count every stored file: they quote nothing.
describe("evidence-readiness citations are acceptance-bound (C-506)", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockListArtifactStates.mockResolvedValue([]);
    mockGetLatestAcceptances.mockResolvedValue(new Map());
  });

  const ask = (overrides: { eventAliases?: string[] } = {}) =>
    buildEvidenceReadinessGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "Which uploaded evidence is parsed and search-ready?",
      ...overrides,
    });

  it("does not cite a stored file that has no acceptance, and says so as a gap", async () => {
    mockListSourceArtifacts.mockResolvedValue([
      artifact(),
      artifact({ id: "artifact-2", originalName: "Unaccepted notes.txt" }),
    ]);
    mockGetLatestAcceptances.mockResolvedValue(acceptedAll("artifact-1"));

    const answer = await ask();

    expect(answer!.citations.map((citation) => citation.recordId)).toEqual([
      "artifact-1",
    ]);
    expect(answer!.directAnswer).toContain("2 Source files are stored");
    const gap = answer!.gaps.find(
      (item) => item.id === "evidence-readiness-evidence-not-acceptance-bound",
    );
    expect(gap?.detail).toContain("1 of this event's files");
    expect(answer!.safety.forbiddenLanguagePassed).toBe(true);
  });

  it("does not cite a file whose accepted version has been superseded", async () => {
    mockListSourceArtifacts.mockResolvedValue([artifact()]);
    mockGetLatestAcceptances.mockResolvedValue(
      new Map([
        ["artifact-1", acceptance({ authoritativeVersionId: "artifact-1-v3" })],
      ]),
    );

    const answer = await ask();

    expect(answer!.citations).toHaveLength(0);
    expect(answer!.gaps.map((gap) => gap.id)).toContain(
      "evidence-readiness-evidence-not-acceptance-bound",
    );
  });

  it("does not cite a file whose content has drifted from the accepted version", async () => {
    mockListSourceArtifacts.mockResolvedValue([artifact()]);
    mockGetLatestAcceptances.mockResolvedValue(
      new Map([["artifact-1", acceptance({ contentDriftStatus: "stale" })]]),
    );

    const answer = await ask();

    expect(answer!.citations).toHaveLength(0);
  });

  it("cites an accepted file listed under the event code alias, and raises no gap", async () => {
    mockListSourceArtifacts.mockImplementation(async (eventId) =>
      eventId === "SRC-001" ? [artifact({ sourceEventId: "SRC-001" })] : [],
    );
    mockGetLatestAcceptances.mockResolvedValue(acceptedAll("artifact-1"));

    const answer = await ask({ eventAliases: ["SRC-001"] });

    expect(answer!.citations.map((citation) => citation.recordId)).toEqual([
      "artifact-1",
    ]);
    expect(answer!.gaps.map((gap) => gap.id)).not.toContain(
      "evidence-readiness-evidence-not-acceptance-bound",
    );
  });

  it("looks up acceptances for every listed file and never counts another tenant's or event's file as this event's gap", async () => {
    mockListSourceArtifacts.mockResolvedValue([
      artifact(),
      artifact({ id: "foreign", tenantKey: "other" }),
      artifact({ id: "elsewhere", sourceEventId: "event-2" }),
    ]);
    mockGetLatestAcceptances.mockResolvedValue(acceptedAll("artifact-1"));

    const answer = await ask();

    expect(mockGetLatestAcceptances).toHaveBeenCalledWith([
      "artifact-1",
      "foreign",
      "elsewhere",
    ]);
    expect(answer!.citations.map((citation) => citation.recordId)).toEqual([
      "artifact-1",
    ]);
    expect(answer!.gaps.map((gap) => gap.id)).not.toContain(
      "evidence-readiness-evidence-not-acceptance-bound",
    );
  });
});

// The fence decides tenancy and event binding over candidates handed to it
// unfiltered. Refusal codes are asserted here, off the client surface.
describe("eventContextCandidatesForEvidenceReadiness", () => {
  it("canonicalises this event's aliases, admits this tenant's alias keys, and leaves the fence to refuse the rest by rule", () => {
    const rows = [
      artifact({ id: "alias-event", sourceEventId: "SRC-001" }),
      artifact({ id: "row-id-event", sourceEventId: null as unknown as string, sourceEventRowId: "event-1" }),
      artifact({ id: "alias-tenant", tenantKey: "meridian_health_global" }),
      artifact({ id: "foreign", tenantKey: "other" }),
      artifact({ id: "elsewhere", sourceEventId: "event-2" }),
      artifact({ id: "unaccepted" }),
    ];
    const acceptances = acceptedAll(
      "alias-event",
      "row-id-event",
      "alias-tenant",
      "foreign",
      "elsewhere",
    );

    const candidates = eventContextCandidatesForEvidenceReadiness(
      rows,
      acceptances,
      {
        tenantId: "tenant-1",
        eventId: "event-1",
        eventAliases: ["event-1", "SRC-001"],
      },
    );
    const fenced = buildGovernedEventContextBundle(
      candidates,
      {
        tenantId: "tenant-1",
        clientKey: "meridian-health",
        eventId: "event-1",
        contractId: null,
        currentStageKey: "",
        acceptedArtifactVersions: acceptedArtifactVersionsFor(acceptances),
      },
      { requireAgentReady: false },
    );

    expect(fenced.admitted.map((candidate) => candidate.id)).toEqual([
      "alias-event",
      "row-id-event",
      "alias-tenant",
    ]);
    expect(
      Object.fromEntries(
        fenced.refused.map((refusal) => [refusal.candidate.id, refusal.code]),
      ),
    ).toEqual({
      foreign: "opposite_tenant",
      elsewhere: "cross_event",
      unaccepted: "unreviewed_evidence",
    });
    expect(fenced.tenantFencePassed).toBe(true);
  });
});
