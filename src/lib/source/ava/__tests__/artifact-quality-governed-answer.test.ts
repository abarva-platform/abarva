import { buildValidatedAgentContextBundle } from "@/lib/governance/agent-context-bundle";
import {
  acceptedArtifactVersionsFor,
  buildArtifactQualityGovernedAnswer,
  eventContextCandidatesForArtifactQuality,
  governedCandidateFromSourceArtifact,
  looksLikeArtifactQualityQuestion,
  sourceDataClassificationToClassification,
} from "@/lib/source/ava/artifact-quality-governed-answer";
import { buildGovernedEventContextBundle } from "@/lib/source/ava/event-context-bundle";
import { getLatestArtifactAcceptancesByArtifactIds } from "@/lib/source/artifact-acceptances";
import type { ArtifactAcceptanceRecord } from "@/lib/source/artifact-acceptances";
import { listSourceArtifactsForSourceEventIdWithContent } from "@/lib/source/artifact-registry";
import type { SourceArtifactRegistryRecordWithContent } from "@/lib/source/artifact-registry";

jest.mock("@/lib/source/artifact-registry", () => ({
  listSourceArtifactsForSourceEventIdWithContent: jest.fn(),
}));

jest.mock("@/lib/source/artifact-acceptances", () => ({
  getLatestArtifactAcceptancesByArtifactIds: jest.fn(),
}));

const mockListSourceArtifacts = jest.mocked(
  listSourceArtifactsForSourceEventIdWithContent,
);

const mockGetLatestAcceptances = jest.mocked(
  getLatestArtifactAcceptancesByArtifactIds,
);

/**
 * A real acceptance row shape: `authoritative_version_id` is a column of its
 * own, so a fixture that defaulted it to the artifact id would hide exactly
 * the superseded-version case this fence exists for.
 */
function acceptance(
  overrides: Partial<ArtifactAcceptanceRecord> = {},
): ArtifactAcceptanceRecord {
  return {
    id: "acceptance-1",
    artifactId: "artifact-1",
    eventId: "event-1",
    stageKey: "scope",
    artifactState: "client_final",
    authoritativeVersionId: "artifact-1",
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
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    sizeBytes: 1200,
    sha256: "sha",
    parseStatus: "parsed",
    embeddingStatus: "pending",
    graphStatus: "pending",
    classificationStatus: "classified",
    dataClassification: "Confidential",
    evidenceState: "cited",
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

describe("looksLikeArtifactQualityQuestion", () => {
  it("matches artifact quality and lifecycle questions", () => {
    expect(looksLikeArtifactQualityQuestion("How is artifact quality?")).toBe(
      true,
    );
    expect(
      looksLikeArtifactQualityQuestion(
        "Which files are missing or blocked for Gate B?",
      ),
    ).toBe(true);
    expect(
      looksLikeArtifactQualityQuestion("Are the client final documents ready?"),
    ).toBe(true);
    expect(
      looksLikeArtifactQualityQuestion(
        "Assess artifact lifecycle posture, client-final readiness, consulting quality, and required deliverable standards.",
      ),
    ).toBe(true);
  });

  it("does not capture unrelated Source chat turns", () => {
    expect(looksLikeArtifactQualityQuestion(undefined)).toBe(false);
    expect(looksLikeArtifactQualityQuestion("")).toBe(false);
    expect(
      looksLikeArtifactQualityQuestion(
        "How are vendors doing on response coverage?",
      ),
    ).toBe(false);
    expect(looksLikeArtifactQualityQuestion("What is the value at stake?")).toBe(
      false,
    );
  });
});

describe("sourceDataClassificationToClassification", () => {
  it("maps registry classifications to the canonical governance enum explicitly", () => {
    expect(sourceDataClassificationToClassification("Public")).toBe("public");
    expect(sourceDataClassificationToClassification("Internal")).toBe(
      "internal",
    );
    expect(sourceDataClassificationToClassification("Confidential")).toBe(
      "confidential",
    );
    expect(sourceDataClassificationToClassification("Restricted")).toBe(
      "restricted",
    );
  });
});

describe("governedCandidateFromSourceArtifact", () => {
  it("maps a registry row to an honest governed artifact candidate", () => {
    const candidate = governedCandidateFromSourceArtifact(artifact(), {
      clientKey: "meridian-health",
      tenantId: "tenant-1",
    });

    expect(candidate.source_layer).toBe("artifact");
    expect(candidate.source_basis).toBe("Client Final Scope Memo.docx");
    expect(candidate.classification).toBe("confidential");
    expect(candidate.retrievability).toBe("committed_not_indexed");
    expect(candidate.agent_readiness_status).toBe("not_reviewed");
    expect(candidate.confidence_level).toBe("high");
    expect(candidate.cited_render_verified_at).toBeNull();
    expect(candidate.citations?.[0]).toContain(
      "Client Final Scope Memo.docx",
    );
  });

  it("blocks restricted artifact rows by default through the real governance gate", () => {
    const candidate = governedCandidateFromSourceArtifact(
      artifact({ dataClassification: "Restricted" }),
      {
        clientKey: "meridian-health",
        tenantId: "tenant-1",
      },
    );

    const bundle = buildValidatedAgentContextBundle([candidate], {
      requireAgentReady: false,
    });

    expect(bundle.decision).toBe("block");
    expect(bundle.usable).toHaveLength(0);
    expect(bundle.blocked[0]?.errors[0]).toContain(
      'sensitive classification "restricted"',
    );
  });
});

describe("buildArtifactQualityGovernedAnswer", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  // C-506: this case now supplies the acceptance it always implied. The mode
  // cites accepted, current versions only, so an artifact with no acceptance
  // record no longer produces a citation — the fixture states the acceptance
  // rather than the assertion being relaxed.
  it("emits a governed chart + table from the same lifecycle matrix as Files", async () => {
    mockListSourceArtifacts.mockResolvedValue([
      artifact(),
      artifact({
        id: "artifact-other-tenant",
        tenantKey: "other",
        originalName: "Other Tenant Scope Memo.docx",
      }),
    ]);
    mockGetLatestAcceptances.mockResolvedValue(
      new Map([["artifact-1", acceptance()]]),
    );

    const answer = await buildArtifactQualityGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "How is artifact quality?",
    });

    expect(listSourceArtifactsForSourceEventIdWithContent).toHaveBeenCalledWith(
      "event-1",
    );
    // Every registered file reaches the evidence path, including one this
    // tenant does not own: the fence decides isolation, not a filter above it.
    expect(mockGetLatestAcceptances).toHaveBeenCalledWith([
      "artifact-1",
      "artifact-other-tenant",
    ]);
    expect(answer).not.toBeNull();
    expect(answer!.tenantKey).toBe("meridian-health");
    expect(answer!.intent).toBe("artifact_quality_lifecycle");
    expect(answer!.status).toBe("answered");
    expect(answer!.artifacts.map((item) => item.artifact)).toEqual([
      "chart",
      "table",
    ]);
    expect(answer!.citations).toHaveLength(1);
    expect(answer!.citations[0]?.recordId).toBe("artifact-1");
    expect(answer!.directAnswer).toContain("1 artifacts are registered");
    expect(answer!.safety.forbiddenLanguagePassed).toBe(true);
    expect(answer!.artifacts[1]).toMatchObject({
      artifact: "table",
      title: "Artifact quality and lifecycle",
    });
  });

  it("answers honestly from canonical standards when no registry rows exist", async () => {
    mockListSourceArtifacts.mockResolvedValue([]);
    mockGetLatestAcceptances.mockResolvedValue(new Map());

    const answer = await buildArtifactQualityGovernedAnswer({
      eventId: "event-empty",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "Which artifacts are missing?",
    });

    expect(answer).not.toBeNull();
    expect(answer!.status).toBe("no_data");
    expect(answer!.citations).toHaveLength(0);
    expect(answer!.gaps).toEqual([
      expect.objectContaining({
        id: "artifact-quality-required-files-missing",
        severity: "high",
      }),
    ]);
    expect(answer!.directAnswer).toContain("No Source artifacts are registered");
    expect(answer!.caveats[0]?.detail).toContain(
      "Missing artifacts come from Source's artifact standards",
    );
    expect(
      answer!.caveats
        .map((caveat) => `${caveat.label} ${caveat.detail}`)
        .join(" "),
    ).not.toMatch(/source_artifacts|\brows?\b/i);
    expect(answer!.safety.forbiddenLanguagePassed).toBe(true);
  });
});

// ── C-506 · the acceptance-bound event-context fence, wired to ONE mode ───────
//
// Before this wiring the mode built its citations from the corpus policy seam
// alone. That seam takes no requesting identity and has no view of accepted
// versions, so a file with no acceptance at all — and a superseded version of
// an accepted one — were both cited as evidence, under a caveat that says
// citations attach only to accepted records. These cases are the difference.

describe("buildArtifactQualityGovernedAnswer · acceptance-bound evidence", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("does not cite a file that has no acceptance for this event", async () => {
    mockListSourceArtifacts.mockResolvedValue([artifact()]);
    mockGetLatestAcceptances.mockResolvedValue(new Map());

    const answer = await buildArtifactQualityGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "How is artifact quality?",
    });

    expect(answer).not.toBeNull();
    expect(mockGetLatestAcceptances).toHaveBeenCalledWith(["artifact-1"]);
    expect(answer!.citations).toHaveLength(0);
    expect(answer!.gaps.map((gap) => gap.id)).toContain(
      "artifact-quality-evidence-not-acceptance-bound",
    );
    expect(answer!.safety.forbiddenLanguagePassed).toBe(true);
  });

  it("cites a file whose accepted version is the current one", async () => {
    mockListSourceArtifacts.mockResolvedValue([artifact()]);
    mockGetLatestAcceptances.mockResolvedValue(
      new Map([["artifact-1", acceptance()]]),
    );

    const answer = await buildArtifactQualityGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "How is artifact quality?",
    });

    expect(answer!.citations).toHaveLength(1);
    expect(answer!.citations[0]?.recordId).toBe("artifact-1");
    expect(answer!.gaps.map((gap) => gap.id)).not.toContain(
      "artifact-quality-evidence-not-acceptance-bound",
    );
  });

  it("does not cite a superseded version of an accepted file", async () => {
    mockListSourceArtifacts.mockResolvedValue([artifact()]);
    mockGetLatestAcceptances.mockResolvedValue(
      new Map([
        [
          "artifact-1",
          acceptance({ authoritativeVersionId: "artifact-1-v3" }),
        ],
      ]),
    );

    const answer = await buildArtifactQualityGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "How is artifact quality?",
    });

    expect(answer!.citations).toHaveLength(0);
    expect(answer!.gaps.map((gap) => gap.id)).toContain(
      "artifact-quality-evidence-not-acceptance-bound",
    );
  });

  it("does not cite a file whose measured content has drifted from the accepted version", async () => {
    mockListSourceArtifacts.mockResolvedValue([artifact()]);
    mockGetLatestAcceptances.mockResolvedValue(
      new Map([["artifact-1", acceptance({ contentDriftStatus: "stale" })]]),
    );

    const answer = await buildArtifactQualityGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "How is artifact quality?",
    });

    expect(answer!.citations).toHaveLength(0);
  });

  it("keeps the deterministic lifecycle view over this tenant's files while the evidence path is fenced", async () => {
    mockListSourceArtifacts.mockResolvedValue([artifact()]);
    mockGetLatestAcceptances.mockResolvedValue(new Map());

    const answer = await buildArtifactQualityGovernedAnswer({
      eventId: "event-1",
      clientKey: "meridian",
      tenantId: "tenant-1",
      question: "How is artifact quality?",
    });

    expect(answer!.status).toBe("answered");
    expect(answer!.directAnswer).toContain("1 artifacts are registered");
    expect(answer!.artifacts.map((item) => item.artifact)).toEqual([
      "chart",
      "table",
    ]);
  });
});

// The fence itself decides tenancy and event binding, over candidates the mode
// hands it unfiltered. Asserting the refusal CODES here rather than in the
// answer keeps mechanical vocabulary off the client surface while still
// proving which rule fired.
describe("eventContextCandidatesForArtifactQuality", () => {
  it("binds a candidate to the acceptance and refuses an opposite-tenant or cross-event file by the fence, not by a pre-filter", () => {
    const rows = [
      artifact(),
      artifact({
        id: "artifact-other-tenant",
        tenantKey: "other",
        originalName: "Other Tenant Scope Memo.docx",
      }),
      artifact({
        id: "artifact-other-event",
        sourceEventId: "event-2",
        originalName: "Other Event Scope Memo.docx",
      }),
    ];
    const acceptances = new Map([
      ["artifact-1", acceptance()],
      ["artifact-other-tenant", acceptance({ artifactId: "artifact-other-tenant", authoritativeVersionId: "artifact-other-tenant" })],
      ["artifact-other-event", acceptance({ artifactId: "artifact-other-event", authoritativeVersionId: "artifact-other-event" })],
    ]);

    const candidates = eventContextCandidatesForArtifactQuality(rows, acceptances, {
      tenantId: "tenant-1",
    });
    const fenced = buildGovernedEventContextBundle(candidates, {
      tenantId: "tenant-1",
      clientKey: "meridian-health",
      eventId: "event-1",
      contractId: null,
      currentStageKey: "scope",
      acceptedArtifactVersions: acceptedArtifactVersionsFor(acceptances),
    }, { requireAgentReady: false });

    expect(fenced.admitted.map((candidate) => candidate.id)).toEqual([
      "artifact-1",
    ]);
    expect(
      Object.fromEntries(
        fenced.refused.map((refusal) => [refusal.candidate.id, refusal.code]),
      ),
    ).toEqual({
      "artifact-other-tenant": "opposite_tenant",
      "artifact-other-event": "cross_event",
    });
    expect(fenced.tenantFencePassed).toBe(true);
  });

  it("reads the accepted version from the acceptance record, not from the file it is about", () => {
    const acceptances = new Map([
      ["artifact-1", acceptance({ authoritativeVersionId: "artifact-1-v9" })],
    ]);
    expect(acceptedArtifactVersionsFor(acceptances)).toEqual({
      "artifact-1": "artifact-1-v9",
    });
  });
});
