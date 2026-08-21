import "server-only";

import { createHash } from "node:crypto";

import {
  saveMoveArtifact,
  type SaveMoveArtifactInput,
} from "@/lib/programs/deliverables/move-artifacts";
import type { ProgramCore, TenancyCtx } from "@/lib/programs/types.db";
import type {
  StageReadinessWorkbookParseResult,
  StageReadinessWorkbookParsedResponse,
} from "./parser";

export const STAGE_READINESS_WORKBOOK_PARSER_VERSION =
  "stage-readiness-workbook-parser-v1";
export const STAGE_READINESS_PROPOSAL_SET_ARTIFACT_TYPE =
  "stage_readiness_workbook_proposal_set";

export type StageReadinessProposalDisposition =
  | "pending"
  | "accepted"
  | "rejected"
  | "needs_validation";

export type StageReadinessProposalAnswerState =
  | "answered"
  | "unknown"
  | "insufficient_evidence"
  | "blank";

export interface StageReadinessWorkbookProposal {
  proposalId: string;
  questionId: string;
  dimensionId: string;
  requirement: "required" | "recommended";
  sourceClass: string;
  question: string;
  response: string;
  context: string;
  evidenceOrSource: string;
  owner: string;
  workbookLocation: {
    sheetName: string;
    rowNumber: number;
  };
  answerState: StageReadinessProposalAnswerState;
  disposition: StageReadinessProposalDisposition;
}

export interface StageReadinessWorkbookProposalSet {
  proposalSetId: string;
  moveId: string;
  transition: {
    fromPhase: number;
    toPhase: number;
    stage: string;
  };
  workbook: {
    workbookId: string | null;
    workbookVersion: string | null;
    uploadedWorkbookSha256: string;
    sourceWorkbookContentHash: string | null;
  };
  baseMoveRevision: string | null;
  parserVersion: string;
  contractVersions: {
    workbookContractVersion: string | null;
    dimensionPlanVersion: string | null;
    questionContractVersion: string | null;
  };
  uploader: {
    userId: string | null;
    email: string | null;
  };
  uploadedAt: string;
  summary: StageReadinessWorkbookParseResult["summary"] & {
    proposalCount: number;
    pendingCount: number;
    acceptedCount: number;
    rejectedCount: number;
    needsValidationCount: number;
    answerStates: Record<StageReadinessProposalAnswerState, number>;
  };
  proposals: StageReadinessWorkbookProposal[];
}

export interface PersistStageReadinessProposalSetInput {
  ctx: TenancyCtx;
  program: ProgramCore;
  parsed: StageReadinessWorkbookParseResult;
  uploadedWorkbookSha256: string;
  uploadedAt?: string;
  saveArtifact?: typeof saveMoveArtifact;
}

export interface PersistStageReadinessProposalSetResult {
  artifactId: string;
  artifactVersion: number;
  proposalSet: StageReadinessWorkbookProposalSet;
  blobStored: boolean;
}

export async function persistStageReadinessProposalSet(
  input: PersistStageReadinessProposalSetInput,
): Promise<PersistStageReadinessProposalSetResult> {
  if (!input.parsed.ok) {
    throw new Error("Cannot persist a proposal set from an invalid workbook.");
  }
  const proposalSet = buildStageReadinessProposalSet(input);
  const saveArtifact = input.saveArtifact ?? saveMoveArtifact;
  const saved = await saveArtifact(input.ctx, artifactInput(proposalSet));
  return {
    artifactId: saved.artifactId,
    artifactVersion: saved.version,
    blobStored: saved.blobStored,
    proposalSet,
  };
}

export function buildStageReadinessProposalSet(
  input: Omit<PersistStageReadinessProposalSetInput, "saveArtifact">,
): StageReadinessWorkbookProposalSet {
  const metadata = input.parsed.metadata;
  const uploadedAt = input.uploadedAt ?? new Date().toISOString();
  const fromPhase = metadata?.phase ?? input.program.currentPhase ?? 0;
  const toPhase = metadata?.nextPhase ?? fromPhase + 1;
  const proposals = input.parsed.responses.map((response) =>
    buildProposal(input.program.id, input.uploadedWorkbookSha256, response),
  );
  const answerStates = countAnswerStates(proposals);
  const proposalSetId = stableId({
    moveId: input.program.id,
    fromPhase,
    toPhase,
    uploadedWorkbookSha256: input.uploadedWorkbookSha256,
    workbookId: metadata?.workbookId ?? null,
    proposalIds: proposals.map((proposal) => proposal.proposalId),
  });

  return {
    proposalSetId,
    moveId: input.program.id,
    transition: {
      fromPhase,
      toPhase,
      stage: `P${fromPhase} to P${toPhase}`,
    },
    workbook: {
      workbookId: metadata?.workbookId ?? null,
      workbookVersion: metadata?.workbookVersion ?? null,
      uploadedWorkbookSha256: input.uploadedWorkbookSha256,
      sourceWorkbookContentHash: metadata?.workbookContentHash ?? null,
    },
    baseMoveRevision:
      input.program.updatedAt ?? input.program.createdAt ?? null,
    parserVersion: STAGE_READINESS_WORKBOOK_PARSER_VERSION,
    contractVersions: {
      workbookContractVersion: metadata?.contractVersion ?? null,
      dimensionPlanVersion: metadata?.dimensionPlanVersion ?? null,
      questionContractVersion: metadata?.contractVersion ?? null,
    },
    uploader: {
      userId: input.ctx.userId ?? null,
      email: input.ctx.email ?? null,
    },
    uploadedAt,
    summary: {
      ...input.parsed.summary,
      proposalCount: proposals.length,
      pendingCount: proposals.length,
      acceptedCount: 0,
      rejectedCount: 0,
      needsValidationCount: 0,
      answerStates,
    },
    proposals,
  };
}

function artifactInput(
  proposalSet: StageReadinessWorkbookProposalSet,
): SaveMoveArtifactInput {
  return {
    moveId: proposalSet.moveId,
    phase: proposalSet.transition.fromPhase,
    artifactType: STAGE_READINESS_PROPOSAL_SET_ARTIFACT_TYPE,
    artifactFamily: "approval_artifact",
    title: `Stage readiness proposal set P${proposalSet.transition.fromPhase} to P${proposalSet.transition.toPhase}`,
    description:
      "Parsed workbook responses awaiting human accept/reject review. Uploading is not acceptance.",
    fileName: `${proposalSet.proposalSetId}.json`,
    fileFormat: "json",
    body: JSON.stringify(proposalSet, null, 2),
    status: "review_required",
    generatedBy: "stage_readiness_workbook_upload",
    sourceBasis: "parsed_workbook_pending_human_review",
    confidence: "pending_review",
    citationReady: false,
    metadata: {
      proposalSetId: proposalSet.proposalSetId,
      transition: proposalSet.transition,
      workbook: proposalSet.workbook,
      baseMoveRevision: proposalSet.baseMoveRevision,
      parserVersion: proposalSet.parserVersion,
      contractVersions: proposalSet.contractVersions,
      proposalCount: proposalSet.summary.proposalCount,
      pendingCount: proposalSet.summary.pendingCount,
      answerStates: proposalSet.summary.answerStates,
      governance:
        "Parsed workbook upload only. Pending proposals do not feed P2 until accepted.",
    },
  };
}

function buildProposal(
  moveId: string,
  uploadedWorkbookSha256: string,
  response: StageReadinessWorkbookParsedResponse,
): StageReadinessWorkbookProposal {
  const answerState = classifyAnswerState(response);
  return {
    proposalId: stableId({
      moveId,
      uploadedWorkbookSha256,
      questionId: response.questionId,
      sheetName: response.sheetName,
      rowNumber: response.rowNumber,
      response: response.response,
      context: response.context,
      evidenceOrSource: response.evidenceOrSource,
    }),
    questionId: response.questionId,
    dimensionId: response.dimensionId,
    requirement: response.requirement,
    sourceClass: response.sourceClass,
    question: response.question,
    response: response.response,
    context: response.context,
    evidenceOrSource: response.evidenceOrSource,
    owner: response.owner,
    workbookLocation: {
      sheetName: response.sheetName,
      rowNumber: response.rowNumber,
    },
    answerState,
    disposition: "pending",
  };
}

function classifyAnswerState(
  response: StageReadinessWorkbookParsedResponse,
): StageReadinessProposalAnswerState {
  const combined = [
    response.response,
    response.context,
    response.evidenceOrSource,
    response.status,
  ]
    .join(" ")
    .toLowerCase();
  if (!response.hasUserInput) return "blank";
  if (
    String(response.response)
      .trim()
      .toLowerCase()
      .match(/^unknown\b/)
  ) {
    return "unknown";
  }
  if (
    combined.match(
      /\binsufficient evidence\b|\bnot measured\b|\bnot available\b/,
    )
  ) {
    return "insufficient_evidence";
  }
  if (combined.match(/\bunknown\b|\btbd\b|\bto be confirmed\b/)) {
    return "unknown";
  }
  return "answered";
}

function countAnswerStates(
  proposals: StageReadinessWorkbookProposal[],
): Record<StageReadinessProposalAnswerState, number> {
  return proposals.reduce(
    (acc, proposal) => {
      acc[proposal.answerState] += 1;
      return acc;
    },
    { answered: 0, unknown: 0, insufficient_evidence: 0, blank: 0 },
  );
}

function stableId(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 32);
}
