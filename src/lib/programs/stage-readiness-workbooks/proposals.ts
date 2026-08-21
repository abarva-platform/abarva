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
export const STAGE_READINESS_PROPOSAL_REVIEW_ARTIFACT_TYPE =
  "stage_readiness_workbook_proposal_review";

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

export interface StageReadinessProposalDecision {
  proposalId: string;
  disposition: Exclude<StageReadinessProposalDisposition, "pending">;
  note?: string;
}

export interface StageReadinessAcceptedWorkbookResponse {
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
  workbookLocation: StageReadinessWorkbookProposal["workbookLocation"];
  answerState: StageReadinessProposalAnswerState;
  acceptedAt: string;
  acceptedBy: string | null;
}

export interface StageReadinessProposalReview {
  reviewId: string;
  proposalSetId: string;
  moveId: string;
  transition: StageReadinessWorkbookProposalSet["transition"];
  sourceProposalSetArtifact: {
    artifactId: string;
    artifactVersion: number | null;
  };
  reviewer: {
    userId: string | null;
    email: string | null;
  };
  reviewedAt: string;
  summary: {
    proposalCount: number;
    pendingCount: number;
    acceptedCount: number;
    rejectedCount: number;
    needsValidationCount: number;
    acceptedAnswerStates: Record<StageReadinessProposalAnswerState, number>;
    readiness: {
      ready: number;
      partial: number;
      insufficientEvidence: number;
      unknown: number;
    };
  };
  decisions: StageReadinessProposalDecision[];
  acceptedResponses: StageReadinessAcceptedWorkbookResponse[];
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

export interface PersistStageReadinessProposalReviewInput {
  ctx: TenancyCtx;
  program: ProgramCore;
  proposalSet: StageReadinessWorkbookProposalSet;
  sourceProposalSetArtifactId: string;
  sourceProposalSetArtifactVersion: number | null;
  decisions: StageReadinessProposalDecision[];
  reviewedAt?: string;
  saveArtifact?: typeof saveMoveArtifact;
}

export interface PersistStageReadinessProposalReviewResult {
  artifactId: string;
  artifactVersion: number;
  proposalReview: StageReadinessProposalReview;
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

export async function persistStageReadinessProposalReview(
  input: PersistStageReadinessProposalReviewInput,
): Promise<PersistStageReadinessProposalReviewResult> {
  const proposalReview = buildStageReadinessProposalReview(input);
  const saveArtifact = input.saveArtifact ?? saveMoveArtifact;
  const saved = await saveArtifact(
    input.ctx,
    reviewArtifactInput(proposalReview),
  );
  return {
    artifactId: saved.artifactId,
    artifactVersion: saved.version,
    blobStored: saved.blobStored,
    proposalReview,
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

export function buildStageReadinessProposalReview(
  input: Omit<PersistStageReadinessProposalReviewInput, "saveArtifact">,
): StageReadinessProposalReview {
  const reviewedAt = input.reviewedAt ?? new Date().toISOString();
  const decisionByProposalId = new Map(
    input.decisions.map((decision) => [decision.proposalId, decision]),
  );
  const unknownProposalIds = input.decisions
    .map((decision) => decision.proposalId)
    .filter(
      (proposalId) =>
        !input.proposalSet.proposals.some(
          (proposal) => proposal.proposalId === proposalId,
        ),
    );
  if (unknownProposalIds.length > 0) {
    throw new Error(
      `Unknown stage readiness proposal id(s): ${unknownProposalIds.join(", ")}`,
    );
  }

  const proposals = input.proposalSet.proposals.map((proposal) => {
    const decision = decisionByProposalId.get(proposal.proposalId);
    return decision
      ? { ...proposal, disposition: decision.disposition }
      : proposal;
  });
  const acceptedResponses: StageReadinessAcceptedWorkbookResponse[] = proposals
    .filter((proposal) => proposal.disposition === "accepted")
    .map((proposal) => ({
      proposalId: proposal.proposalId,
      questionId: proposal.questionId,
      dimensionId: proposal.dimensionId,
      requirement: proposal.requirement,
      sourceClass: proposal.sourceClass,
      question: proposal.question,
      response: proposal.response,
      context: proposal.context,
      evidenceOrSource: proposal.evidenceOrSource,
      owner: proposal.owner,
      workbookLocation: proposal.workbookLocation,
      answerState: proposal.answerState,
      acceptedAt: reviewedAt,
      acceptedBy: input.ctx.userId ?? null,
    }));
  const summary = countProposalDispositions(proposals);
  const acceptedAnswerStates = countAnswerStates(acceptedResponses);

  return {
    reviewId: stableId({
      proposalSetId: input.proposalSet.proposalSetId,
      sourceProposalSetArtifactId: input.sourceProposalSetArtifactId,
      sourceProposalSetArtifactVersion: input.sourceProposalSetArtifactVersion,
      decisions: input.decisions,
      reviewedAt,
    }),
    proposalSetId: input.proposalSet.proposalSetId,
    moveId: input.proposalSet.moveId,
    transition: input.proposalSet.transition,
    sourceProposalSetArtifact: {
      artifactId: input.sourceProposalSetArtifactId,
      artifactVersion: input.sourceProposalSetArtifactVersion,
    },
    reviewer: {
      userId: input.ctx.userId ?? null,
      email: input.ctx.email ?? null,
    },
    reviewedAt,
    summary: {
      ...summary,
      acceptedAnswerStates,
      readiness: {
        ready: acceptedAnswerStates.answered,
        partial: 0,
        insufficientEvidence: acceptedAnswerStates.insufficient_evidence,
        unknown: acceptedAnswerStates.unknown,
      },
    },
    decisions: input.decisions,
    acceptedResponses,
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

function reviewArtifactInput(
  proposalReview: StageReadinessProposalReview,
): SaveMoveArtifactInput {
  const terminalReview =
    proposalReview.summary.pendingCount === 0 &&
    proposalReview.summary.needsValidationCount === 0;
  return {
    moveId: proposalReview.moveId,
    phase: proposalReview.transition.fromPhase,
    artifactType: STAGE_READINESS_PROPOSAL_REVIEW_ARTIFACT_TYPE,
    artifactFamily: "approval_artifact",
    title: `Stage readiness proposal review P${proposalReview.transition.fromPhase} to P${proposalReview.transition.toPhase}`,
    description:
      "Human review of parsed workbook proposals. Only accepted responses can feed the next phase context.",
    fileName: `${proposalReview.reviewId}.json`,
    fileFormat: "json",
    body: JSON.stringify(proposalReview, null, 2),
    status: terminalReview ? "accepted" : "review_required",
    generatedBy: "stage_readiness_workbook_review",
    sourceBasis: "human_reviewed_stage_readiness_workbook_proposals",
    confidence: "human_reviewed",
    citationReady: false,
    metadata: {
      reviewId: proposalReview.reviewId,
      proposalSetId: proposalReview.proposalSetId,
      transition: proposalReview.transition,
      sourceProposalSetArtifact: proposalReview.sourceProposalSetArtifact,
      proposalCount: proposalReview.summary.proposalCount,
      acceptedCount: proposalReview.summary.acceptedCount,
      rejectedCount: proposalReview.summary.rejectedCount,
      needsValidationCount: proposalReview.summary.needsValidationCount,
      pendingCount: proposalReview.summary.pendingCount,
      acceptedAnswerStates: proposalReview.summary.acceptedAnswerStates,
      readiness: proposalReview.summary.readiness,
      governance:
        "Accepted workbook responses may feed P2 context. Pending, rejected, and needs-validation proposals must not feed P2.",
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
  proposals: Array<{
    answerState: StageReadinessProposalAnswerState;
  }>,
): Record<StageReadinessProposalAnswerState, number> {
  return proposals.reduce(
    (acc, proposal) => {
      acc[proposal.answerState] += 1;
      return acc;
    },
    { answered: 0, unknown: 0, insufficient_evidence: 0, blank: 0 },
  );
}

function countProposalDispositions(
  proposals: StageReadinessWorkbookProposal[],
): Pick<
  StageReadinessProposalReview["summary"],
  | "proposalCount"
  | "pendingCount"
  | "acceptedCount"
  | "rejectedCount"
  | "needsValidationCount"
> {
  return proposals.reduce(
    (acc, proposal) => {
      acc.proposalCount += 1;
      if (proposal.disposition === "pending") acc.pendingCount += 1;
      if (proposal.disposition === "accepted") acc.acceptedCount += 1;
      if (proposal.disposition === "rejected") acc.rejectedCount += 1;
      if (proposal.disposition === "needs_validation") {
        acc.needsValidationCount += 1;
      }
      return acc;
    },
    {
      proposalCount: 0,
      pendingCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      needsValidationCount: 0,
    },
  );
}

function stableId(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 32);
}
