// The caller end of `stampApprovedEvidenceLineage`.
//
// The stamp's own suite proves the recorded lineage can be checked for currency.
// This one proves the GENERATION write actually records it: a hand-rebuilt call
// sequence would test the stamp again and never the caller, so this drives
// `persistMoveGeneratedArtifact` with its two persistence deps mocked and reads
// the structured data it hands to `draftModuleDeliverable`.
//
// The two `signOffDeliverable` lineage writers (the deliverable sign-off route and
// the artifact client-approval route) are pinned by the type instead: that option
// is `{...} & ApprovedEvidenceLineageStamp`, so a lineage recorded without the
// moment does not compile.

const mockDraftModuleDeliverable = jest.fn();
const mockSaveMoveArtifact = jest.fn();

jest.mock("@/lib/programs/nexus", () => ({
  draftModuleDeliverable: (...args: unknown[]) =>
    mockDraftModuleDeliverable(...args),
}));

jest.mock("@/lib/programs/deliverables/move-artifacts", () => ({
  saveMoveArtifact: (...args: unknown[]) => mockSaveMoveArtifact(...args),
}));

jest.mock("@/lib/deliverables/phase-word-equivalent", () => ({
  buildPhaseWordEquivalentDocx: jest.fn(async () =>
    Buffer.from("PK editable-docx"),
  ),
  phaseWordEquivalentFileName: jest.fn(() => "editable-phase-deliverable.docx"),
}));

import { persistMoveGeneratedArtifact } from "@/lib/deliverables/persist-move-generated-artifact";
import { isApprovedMoveEvidenceBasisCurrent } from "@/lib/programs/approved-move-evidence-snapshot";
import { CANONICAL_TENANT_KEYS } from "@/lib/tenant/aliases";

const TENANT_KEY = CANONICAL_TENANT_KEYS[0]!;
const WHOLE_MOVE_HASH = "whole-move-revision-1";
const PHASE_HASH = "phase-2-revision-1";

function generateResult() {
  return {
    status: "generated" as const,
    html: "<html><body><svg></svg><table></table><p>Diagnostic.</p></body></html>",
    context: {
      moveId: "move-1",
      tenantKey: TENANT_KEY,
      useCase: "Governed data foundation",
      kpis: [{ name: "Cycle time", domain: "operational" }],
      currentState: "Manual exception handling.",
      gaps: [],
      decisions: [],
      humanApprovalNotes: [],
      evidencePackets: [],
    },
    goldenBar: {
      pass: true,
      hasDataGap: false,
      svgCount: 1,
      proseOnly: false,
      missingVisuals: [],
      missingTables: [],
      wordCount: 1200,
      forbiddenLanguageHits: [],
      missingExactEvidenceTerms: [],
      missingTaxonomyTerms: [],
      rawClientFacingIdHits: [],
      reasons: [],
      overMaximumWordCount: false,
      unsupportedClaimSignals: [],
      duplicateSectionHeadings: [],
      forbiddenContentHits: [],
      titleReadsAsGenericLabel: false,
      qualityScore: 89,
    },
    generationMode: "draft" as const,
    draftOnly: true,
    draftCaveats: [],
    contextCaveats: [],
  };
}

async function persistOnce() {
  await persistMoveGeneratedArtifact({
    ctx: {
      clientId: "client-1",
      clientKey: TENANT_KEY,
      userId: "user-1",
      email: "cio@example.com",
    },
    program: { id: "move-1", name: "Governed Data Foundation" },
    phase: 2,
    artifact: "discovery_report",
    title: "Current Work Diagnostic",
    evidenceSnapshotHash: WHOLE_MOVE_HASH,
    phaseEvidenceSnapshotHash: PHASE_HASH,
    result: generateResult(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);
  const call = mockDraftModuleDeliverable.mock.calls[0];
  expect(call).toBeDefined();
  return (call![1] as { structuredData: Record<string, unknown> })
    .structuredData;
}

describe("persistMoveGeneratedArtifact records a checkable evidence lineage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDraftModuleDeliverable.mockResolvedValue({
      deliverableId: "deliverable-1",
      versionId: "version-1",
    });
    mockSaveMoveArtifact.mockResolvedValue({
      artifactId: "artifact-1",
      version: 1,
      blobStored: true,
    });
  });

  it("carries both revisions, the phase scope, AND the moment they were read", async () => {
    const structured = await persistOnce();
    expect(structured.evidenceSnapshotHash).toBe(WHOLE_MOVE_HASH);
    expect(structured.phaseEvidenceSnapshotHash).toBe(PHASE_HASH);
    expect(structured.evidenceSnapshotScope).toBe("phase");
    expect(typeof structured.generatedAt).toBe("string");
    expect(
      Number.isFinite(Date.parse(structured.generatedAt as string)),
    ).toBe(true);
  });

  it("records a moment the currency check can actually parse", async () => {
    // The reader's first act is `Date.parse(generatedAt)`; a value it cannot
    // parse is indistinguishable from recording nothing at all.
    const structured = await persistOnce();
    const current = isApprovedMoveEvidenceBasisCurrent({
      snapshot: {
        tenantKey: TENANT_KEY,
        moveId: "move-1",
        revision: WHOLE_MOVE_HASH,
        approvedEvidenceCount: 1,
        rows: [],
        latestEvidenceActivityAt: "2026-09-01T00:00:00.000Z",
        revisionByPhase: { 1: "x", 2: PHASE_HASH, 3: "y", 4: "z", 5: "w" },
        latestEvidenceActivityAtByPhase: {
          1: null,
          2: "2026-09-01T00:00:00.000Z",
          3: null,
          4: null,
          5: null,
        },
      },
      phase: 2,
      recordedRevision: structured.phaseEvidenceSnapshotHash as string,
      scope: structured.evidenceSnapshotScope as string,
      generatedAt: structured.generatedAt as string,
    });
    expect(current).toBe(true);
  });

  it("still records the generation source the gate keys generation on", async () => {
    const structured = await persistOnce();
    expect(structured.source).toBe("moves_program_generate");
  });
});
