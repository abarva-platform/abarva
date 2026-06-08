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
