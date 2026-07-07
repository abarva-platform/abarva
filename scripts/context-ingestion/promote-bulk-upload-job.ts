import "server-only";

import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { promoteAdminStructuredRowsToEnterpriseContext } from "@/lib/context-ingestion/admin-structured-context-promotion";
import {
  parseStructuredUpload,
  prepareCsvUploadForTenantContext,
} from "@/lib/context-ingestion/csv-upload-connector";
import { readBulkContextUploadJobStatus } from "@/lib/context-ingestion/bulk-context-upload-status";

const CONTEXT_UPLOADS_BUCKET = "context-uploads";

function receiptPath(tenantKey: string, jobId: string): string {
  return `${tenantKey}/_jobs/${jobId}-structured-promotion.json`;
}

function requiredArg(name: string): string {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  if (!value?.trim()) throw new Error(`Missing required argument ${flag}`);
  return value.trim();
}

async function main() {
  const clientId = requiredArg("client-id");
  const tenantKey = requiredArg("tenant-key");
  const jobId = requiredArg("job-id");
  const uploadedBy = process.argv.includes("--uploaded-by")
    ? requiredArg("uploaded-by")
    : "admin-bulk-upload-backfill";
  const uploadedAt = new Date().toISOString();

  const status = await readBulkContextUploadJobStatus({
    clientId,
    tenantKey,
    jobId,
  });
  if (status.status !== "committed") {
    throw new Error(`bulk_upload_job_not_committed:${status.status}`);
  }

  const adapter = getObjectStorageAdapter();
  const results = [];
  for (const file of status.files) {
    const bytes = await adapter.download("context-uploads", file.blobPath);
    const text = bytes.toString("utf8");
    const prepared = prepareCsvUploadForTenantContext({
      clientId,
      tenantKey,
      uploadedBy,
      uploadedAt,
      fileName: file.fileName,
      csvText: text,
      mapping: {
        templateId: file.templateId,
      },
    });
    const parsed = parseStructuredUpload(text, file.fileName);
    const promotion = await promoteAdminStructuredRowsToEnterpriseContext({
      clientId,
      tenantKey,
      fileName: file.fileName,
      sourceFileHash: file.sha256,
      uploadedBy,
      uploadedAt,
      uploadId: prepared.uploadId,
      template: prepared.template,
      mapping: prepared.mapping,
      rows: parsed.rows,
    });
    results.push({
      fileName: file.fileName,
      templateId: file.templateId,
      rowsParsed: parsed.rows.length,
      recordsPromoted: promotion.recordsPromoted,
      factsPromoted: promotion.factsPromoted,
      sourceFileId: promotion.sourceFileId,
    });
  }

  const totals = results.reduce(
    (sum, item) => ({
      rowsParsed: sum.rowsParsed + item.rowsParsed,
      recordsPromoted: sum.recordsPromoted + item.recordsPromoted,
      factsPromoted: sum.factsPromoted + item.factsPromoted,
    }),
    { rowsParsed: 0, recordsPromoted: 0, factsPromoted: 0 },
  );

  const receipt = {
    ok: true,
    schema: "abarva.context-bulk-upload.structured-promotion.v1",
    clientId,
    tenantKey,
    jobId,
    loadName: status.loadName,
    promotedAt: uploadedAt,
    promotedBy: uploadedBy,
    sourceJobStatusPath: `${tenantKey}/_jobs/${jobId}.json`,
    totals,
    results,
  };
  const path = receiptPath(tenantKey, jobId);
  await adapter.upload(
    CONTEXT_UPLOADS_BUCKET,
    path,
    JSON.stringify(receipt, null, 2),
    {
      contentType: "application/json",
      upsert: true,
      metadata: {
        tenantKey,
        clientId,
        jobId,
        sourceSystem: "admin_structured_context_promotion",
      },
    },
  );

  console.log(
    JSON.stringify(
      {
        ...receipt,
        receipt: {
          bucket: CONTEXT_UPLOADS_BUCKET,
          path,
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
