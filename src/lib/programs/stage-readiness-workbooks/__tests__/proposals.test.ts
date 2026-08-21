import type { TenancyCtx, ProgramCore } from "@/lib/programs/types.db";
import {
  buildStageReadinessProposalSet,
  persistStageReadinessProposalSet,
} from "../proposals";
import type { StageReadinessWorkbookParseResult } from "../parser";

const ctx = {
  clientId: "tenant-1",
  clientKey: "tenant-key",
  userId: "user-1",
  email: "reviewer@example.com",
} as TenancyCtx;

const program = {
  id: "37ee2d85-5dc0-4d1f-862e-ab8eff60fdd4",
  clientId: "tenant-1",
  name: "Move",
  currentPhase: 1,
  createdAt: "2026-08-20T00:00:00.000Z",
  updatedAt: "2026-08-20T12:00:00.000Z",
} as ProgramCore;

const parsed: StageReadinessWorkbookParseResult = {
  ok: true,
  metadata: {
    workbookId: "move:p1-p2:stage-readiness",
    workbookVersion: "v1",
    contractVersion: "stage-readiness-workbook-v1",
    moveId: program.id,
    phase: 1,
    nextPhase: 2,
    archetype: "Regulated Agent Assist",
    generatedAt: "2026-08-20T00:00:00.000Z",
    workbookContentHash: "source-content-hash",
    dimensionPlanVersion: "stage-readiness-dimension-plan-v1",
  },
  responses: [
    {
      questionId: "q_baseline",
      dimensionId: "baseline_metrics",
      requirement: "required",
      sourceClass: "client_metric",
      sheetName: "Performance & Value",
      rowNumber: 2,
      question: "Provide baseline metrics.",
      response: "Unknown",
      context: "Current latency has not been measured.",
      evidenceOrSource: "",
      owner: "Operations owner",
      status: "needs_answer",
      hasUserInput: true,
    },
    {
      questionId: "q_volume",
      dimensionId: "delay_volume",
      requirement: "required",
      sourceClass: "evidence_gap",
      sheetName: "Performance & Value",
      rowNumber: 3,
      question: "Provide addressable delay volume.",
      response: "Insufficient evidence",
      context: "No client source establishes annual volume.",
      evidenceOrSource: "",
      owner: "Finance owner",
      status: "insufficient_evidence",
      hasUserInput: true,
    },
  ],
  issues: [],
  summary: {
    totalQuestions: 2,
    answeredQuestions: 2,
    requiredAnswered: 2,
    requiredTotal: 2,
    warningCount: 0,
    errorCount: 0,
  },
};

describe("stage readiness workbook proposals", () => {
  it("builds pending proposals without treating unknown or insufficient evidence as readiness", () => {
    const proposalSet = buildStageReadinessProposalSet({
      ctx,
      program,
      parsed,
      uploadedWorkbookSha256: "a".repeat(64),
      uploadedAt: "2026-08-20T13:00:00.000Z",
    });

    expect(proposalSet.summary).toMatchObject({
      answeredQuestions: 2,
      requiredAnswered: 2,
      proposalCount: 2,
      pendingCount: 2,
      acceptedCount: 0,
      answerStates: {
        answered: 0,
        unknown: 1,
        insufficient_evidence: 1,
        blank: 0,
      },
    });
    expect(proposalSet.proposals).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          questionId: "q_baseline",
          answerState: "unknown",
          disposition: "pending",
        }),
        expect.objectContaining({
          questionId: "q_volume",
          answerState: "insufficient_evidence",
          disposition: "pending",
        }),
      ]),
    );
    expect(proposalSet.workbook).toMatchObject({
      workbookId: "move:p1-p2:stage-readiness",
      uploadedWorkbookSha256: "a".repeat(64),
      sourceWorkbookContentHash: "source-content-hash",
    });
  });

  it("persists proposal sets as review-required approval artifacts", async () => {
    const saveArtifact = jest.fn().mockResolvedValue({
      artifactId: "artifact-1",
      version: 7,
      blobStored: true,
      blobPath: "moves/tenant/move/approvals/p1/v7/proposal.json",
    });

    const result = await persistStageReadinessProposalSet({
      ctx,
      program,
      parsed,
      uploadedWorkbookSha256: "b".repeat(64),
      saveArtifact,
    });

    expect(result.artifactId).toBe("artifact-1");
    expect(saveArtifact).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        artifactType: "stage_readiness_workbook_proposal_set",
        artifactFamily: "approval_artifact",
        fileFormat: "json",
        status: "review_required",
        sourceBasis: "parsed_workbook_pending_human_review",
        metadata: expect.objectContaining({
          pendingCount: 2,
          governance:
            "Parsed workbook upload only. Pending proposals do not feed P2 until accepted.",
        }),
      }),
    );
  });

  it("refuses to persist invalid parses", async () => {
    await expect(
      persistStageReadinessProposalSet({
        ctx,
        program,
        parsed: { ...parsed, ok: false },
        uploadedWorkbookSha256: "c".repeat(64),
        saveArtifact: jest.fn(),
      }),
    ).rejects.toThrow(/invalid workbook/i);
  });
});
