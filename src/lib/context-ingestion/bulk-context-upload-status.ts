import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import type {
  BulkContextUploadFileResult,
  BulkContextUploadInput,
  BulkContextUploadResult,
} from "@/lib/context-ingestion/bulk-context-upload";

export interface BulkContextUploadJobStatus {
  schema: "abarva.context-bulk-upload.job-status.v1";
  jobId: string;
  clientId: string;
  tenantKey: string;
  loadName: string;
  mode: BulkContextUploadInput["mode"];
  status:
    | "validated_only"
    | "staged_and_enqueued"
    | "staged_and_processed"
    | "waiting_for_private_worker"
    | "needs_operator_review"
    | "committed"
    | "blocked";
  summary: string;
  updatedAt: string;
  workflow: BulkContextUploadResult["workflow"];
  files: Array<{
    fileName: string;
    templateId: string;
    sha256: string;
    blobPath: string;
    queueMessageId: string | null;
    processingStatus: BulkContextUploadFileResult["processing"]["status"];
    nextAction: string;
  }>;
  reviewArtifacts?: Array<{
    fileName: string;
    templateId: string;
    bucket: string;
    path: string;
    candidateCount: number;
    status: "needs_operator_review" | "committed";
  }>;
  counts: {
    filesProcessed: number;
    rowsParsed: number;
    chunksQueued: number;
    recordsPromoted: number;
    factsPromoted: number;
  };
}

const BULK_CONTEXT_BUCKET = "context-uploads";

function statusPath(tenantKey: string, jobId: string): string {
  if (!/^bulk-[a-f0-9]{16}$/.test(jobId)) {
    throw new Error(`bulk_upload_status_invalid_job_id:${jobId}`);
  }
  const safeTenant = tenantKey
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!safeTenant) throw new Error("bulk_upload_status_invalid_tenant");
  return `${safeTenant}/_jobs/${jobId}.json`;
}

export function bulkContextUploadJobStatusLocation(args: {
  tenantKey: string;
  jobId: string;
}): { bucket: string; path: string } {
  return {
    bucket: BULK_CONTEXT_BUCKET,
    path: statusPath(args.tenantKey, args.jobId),
  };
}

function statusForResult(
  result: BulkContextUploadResult,
): BulkContextUploadJobStatus["status"] {
  if (result.mode === "validate_only") return "validated_only";
  if (result.mode === "stage_and_process") return "committed";
  if (result.mode === "stage_and_enqueue") return "waiting_for_private_worker";
  return "blocked";
}

export function buildBulkContextUploadJobStatus(args: {
  clientId: string;
  tenantKey: string;
  result: BulkContextUploadResult;
  updatedAt: string;
}): BulkContextUploadJobStatus {
  return {
    schema: "abarva.context-bulk-upload.job-status.v1",
    jobId: args.result.workflow.jobId,
    clientId: args.clientId,
    tenantKey: args.tenantKey,
    loadName: args.result.loadName,
    mode: args.result.mode,
    status: statusForResult(args.result),
    summary: args.result.workflow.summary,
    updatedAt: args.updatedAt,
    workflow: args.result.workflow,
    files: args.result.results.map((file) => ({
      fileName: file.fileName,
      templateId: file.templateId,
      sha256: file.blob.sha256,
      blobPath: file.blob.path,
      queueMessageId: file.queue?.messageId ?? null,
      processingStatus: file.processing.status,
      nextAction: file.processing.nextAction,
    })),
    counts: {
      filesProcessed: args.result.filesProcessed,
      rowsParsed: args.result.rowsParsed,
      chunksQueued: args.result.chunksQueued,
      recordsPromoted: args.result.recordsPromoted,
      factsPromoted: args.result.factsPromoted,
    },
  };
}

export async function persistBulkContextUploadJobStatus(args: {
  clientId: string;
  tenantKey: string;
  result: BulkContextUploadResult;
  updatedAt: string;
}): Promise<{ bucket: string; path: string }> {
  const location = bulkContextUploadJobStatusLocation({
    tenantKey: args.tenantKey,
    jobId: args.result.workflow.jobId,
  });
  const status = buildBulkContextUploadJobStatus(args);
  await getObjectStorageAdapter().upload(
    location.bucket,
    location.path,
    JSON.stringify(status, null, 2),
    {
      contentType: "application/json",
      upsert: true,
      metadata: {
        tenantKey: args.tenantKey,
        clientId: args.clientId,
        jobId: args.result.workflow.jobId,
        sourceSystem: "admin_bulk_context_upload_status",
      },
    },
  );
  return location;
}

export async function persistBulkContextUploadJobStatusSnapshot(
  status: BulkContextUploadJobStatus,
): Promise<{ bucket: string; path: string }> {
  const location = bulkContextUploadJobStatusLocation({
    tenantKey: status.tenantKey,
    jobId: status.jobId,
  });
  await getObjectStorageAdapter().upload(
    location.bucket,
    location.path,
    JSON.stringify(status, null, 2),
    {
      contentType: "application/json",
      upsert: true,
      metadata: {
        tenantKey: status.tenantKey,
        clientId: status.clientId,
        jobId: status.jobId,
        sourceSystem: "admin_bulk_context_upload_status",
      },
    },
  );
  return location;
}

export async function readBulkContextUploadJobStatus(args: {
  clientId: string;
  tenantKey: string;
  jobId: string;
}): Promise<BulkContextUploadJobStatus> {
  const { bucket, path } = bulkContextUploadJobStatusLocation({
    tenantKey: args.tenantKey,
    jobId: args.jobId,
  });
  const bytes = await getObjectStorageAdapter().download(bucket, path);
  const parsed = JSON.parse(
    bytes.toString("utf8"),
  ) as BulkContextUploadJobStatus;
  if (
    parsed.schema !== "abarva.context-bulk-upload.job-status.v1" ||
    parsed.clientId !== args.clientId ||
    parsed.tenantKey !== args.tenantKey ||
    parsed.jobId !== args.jobId
  ) {
    throw new Error("bulk_upload_status_tenant_mismatch");
  }
  return parsed;
}

function updateWorkflowStep(
  workflow: BulkContextUploadResult["workflow"],
  stepId: BulkContextUploadResult["workflow"]["steps"][number]["id"],
  status: BulkContextUploadResult["workflow"]["steps"][number]["status"],
  detail: string,
): BulkContextUploadResult["workflow"] {
  return {
    ...workflow,
    steps: workflow.steps.map((step) =>
      step.id === stepId ? { ...step, status, detail } : step,
    ),
  };
}

export async function markBulkContextUploadJobNeedsOperatorReview(args: {
  clientId: string;
  tenantKey: string;
  jobId: string;
  fileName: string;
  templateId: string;
  reviewArtifact: {
    bucket: string;
    path: string;
    candidateCount: number;
  };
  updatedAt?: string;
}): Promise<BulkContextUploadJobStatus> {
  const current = await readBulkContextUploadJobStatus({
    clientId: args.clientId,
    tenantKey: args.tenantKey,
    jobId: args.jobId,
  });
  const updatedAt = args.updatedAt ?? new Date().toISOString();
  let workflow = {
    ...current.workflow,
    summary:
      "Document extraction completed. Operator review is required before tenant-context commit.",
  };
  workflow = updateWorkflowStep(
    workflow,
    "private_worker",
    "complete",
    "The Azure worker parsed the document and wrote a review-required extraction artifact.",
  );
  workflow = updateWorkflowStep(
    workflow,
    "operator_review",
    "active",
    `${args.reviewArtifact.candidateCount} extracted candidate chunks require operator approval.`,
  );
  workflow = updateWorkflowStep(
    workflow,
    "tenant_context_commit",
    "pending",
    "No document-derived facts are committed until review approval is recorded.",
  );

  const reviewArtifacts = [
    ...(current.reviewArtifacts ?? []).filter(
      (artifact) => artifact.path !== args.reviewArtifact.path,
    ),
    {
      fileName: args.fileName,
      templateId: args.templateId,
      bucket: args.reviewArtifact.bucket,
      path: args.reviewArtifact.path,
      candidateCount: args.reviewArtifact.candidateCount,
      status: "needs_operator_review" as const,
    },
  ];
  const next: BulkContextUploadJobStatus = {
    ...current,
    status: "needs_operator_review",
    summary: workflow.summary,
    updatedAt,
    workflow,
    files: current.files.map((file) =>
      file.fileName === args.fileName
        ? {
            ...file,
            nextAction:
              "Review extracted document chunks before tenant-context commit.",
          }
        : file,
    ),
    reviewArtifacts,
  };
  await persistBulkContextUploadJobStatusSnapshot(next);
  return next;
}

export async function markBulkContextUploadJobCommittedAfterReview(args: {
  clientId: string;
  tenantKey: string;
  jobId: string;
  committedArtifactPaths: string[];
  chunksQueued: number;
  updatedAt?: string;
}): Promise<BulkContextUploadJobStatus> {
  const current = await readBulkContextUploadJobStatus({
    clientId: args.clientId,
    tenantKey: args.tenantKey,
    jobId: args.jobId,
  });
  const updatedAt = args.updatedAt ?? new Date().toISOString();
  let workflow = {
    ...current.workflow,
    summary:
      "Operator-approved document chunks were committed and are waiting for embedding refresh.",
  };
  workflow = updateWorkflowStep(
    workflow,
    "operator_review",
    "complete",
    "Operator approval was recorded for the selected document chunks.",
  );
  workflow = updateWorkflowStep(
    workflow,
    "tenant_context_commit",
    "complete",
    "Approved document chunks were written with embedding_status=pending.",
  );
  const committedPaths = new Set(args.committedArtifactPaths);
  const next: BulkContextUploadJobStatus = {
    ...current,
    status: "committed",
    summary: workflow.summary,
    updatedAt,
    workflow,
    reviewArtifacts: (current.reviewArtifacts ?? []).map((artifact) =>
      committedPaths.has(artifact.path)
        ? { ...artifact, status: "committed" as const }
        : artifact,
    ),
    counts: {
      ...current.counts,
      chunksQueued: current.counts.chunksQueued + args.chunksQueued,
    },
  };
  await persistBulkContextUploadJobStatusSnapshot(next);
  return next;
}
