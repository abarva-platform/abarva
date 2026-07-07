#!/usr/bin/env -S npx tsx
// Azure context ingestion worker · A2b deployable wrapper
//
// Pulls messages from Service Bus queue `q-context-ingestion-events`,
// downloads the referenced blob with managed identity, runs the
// sensitive-upload guard through `consumeOneMessage`, writes an
// append-only audit row to Postgres when DATABASE_URL is present, and
// settles the queue message according to the consumer outcome.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";
import {
  ServiceBusClient,
  type ServiceBusReceivedMessage,
} from "@azure/service-bus";
import { Pool } from "pg";
import {
  consumeOneMessage,
  type AuditWriter,
  type BlobDownloader,
  type IngestionPipeline,
} from "@/lib/ingestion/azure-landing-zone-consumer";
import { normalizeEventGridBlobCreated } from "@/lib/ingestion/event-grid-normalizer";
import { createDurablePilotLedgerWriter } from "@/lib/ingestion/pilot-ledger-writer";
import {
  buildBulkDocumentReviewArtifact,
  persistBulkDocumentReviewArtifact,
} from "@/lib/context-ingestion/bulk-document-review";
import { markBulkContextUploadJobNeedsOperatorReview } from "@/lib/context-ingestion/bulk-context-upload-status";

const execFileAsync = promisify(execFile);

function readEnv(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

function readIntEnv(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Invalid integer env var ${name}: ${raw}`);
  }
  return parsed;
}

function readBooleanEnv(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}

function serviceBusNamespace(): string {
  const explicit = process.env.SERVICE_BUS_FULLY_QUALIFIED_NAMESPACE?.trim();
  if (explicit) return explicit;
  const namespaceName = readEnv("SERVICE_BUS_NAMESPACE");
  return namespaceName.includes(".")
    ? namespaceName
    : `${namespaceName}.servicebus.windows.net`;
}

let pool: Pool | null | undefined;

function getPool(): Pool | null {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) return null;
  if (pool === undefined) {
    pool = new Pool({
      connectionString,
      max: 2,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
  }
  return pool;
}

function parseBody(message: ServiceBusReceivedMessage): unknown {
  const body = message.body;
  if (typeof body === "string") {
    return JSON.parse(body);
  }
  if (Buffer.isBuffer(body)) {
    return JSON.parse(body.toString("utf-8"));
  }
  return body;
}

async function normalizeBody(
  message: ServiceBusReceivedMessage,
  credential: DefaultAzureCredential,
): Promise<unknown> {
  const body = parseBody(message);
  const normalized = await normalizeEventGridBlobCreated(
    body,
    async ({ accountName, containerName, blobPath }) => {
      const service = new BlobServiceClient(
        `https://${accountName}.blob.core.windows.net`,
        credential,
      );
      const blob = service
        .getContainerClient(containerName)
        .getBlobClient(blobPath);
      const properties = await blob.getProperties();
      return {
        metadata: properties.metadata ?? {},
        contentType: properties.contentType,
        contentLength: properties.contentLength,
      };
    },
  );
  return normalized ?? body;
}

function createDownloader(credential: DefaultAzureCredential): BlobDownloader {
  return async (msg) => {
    const service = new BlobServiceClient(
      `https://${msg.storage.accountName}.blob.core.windows.net`,
      credential,
    );
    const blob = service
      .getContainerClient(msg.storage.containerName)
      .getBlobClient(msg.storage.blobPath);
    const bytes = await blob.downloadToBuffer();
    return {
      bytes,
      filename: msg.storage.blobPath.split("/").pop() || "context-upload",
    };
  };
}

function createAuditWriter(): AuditWriter {
  return async ({ message, outcome, protectionResult }) => {
    const idHint = `a2b-${message.tenantClientKey}-${Date.now()}`;
    const db = getPool();
    if (!db) {
      console.log(
        JSON.stringify({
          event: "ingestion_audit_console_only",
          id: idHint,
          tenantClientKey: message.tenantClientKey,
          segmentKey: message.segmentKey,
          outcome,
        }),
      );
      return idHint;
    }

    const patternDecision =
      protectionResult?.decision ??
      (outcome.status === "quarantined" ? "quarantine" : "allow");
    const finalDecision =
      outcome.status === "quarantined" ? "quarantine" : "allow";
    const reasonCodes =
      protectionResult?.matchedRules.map((r) => r.ruleId) ??
      ("reasonCodes" in outcome
        ? [...outcome.reasonCodes]
        : "reason" in outcome
          ? [outcome.reason]
          : [outcome.status]);

    const inserted = await db.query<{ id: string }>(
      `
        insert into sensitive_upload_audit (
          tenant_client_key,
          ingestion_tier,
          uploader_user_id,
          filename,
          mime_type,
          size_bytes,
          sha256,
          pattern_decision,
          purview_reached,
          purview_labels,
          final_decision,
          reason_codes,
          storage_path,
          metadata
        )
        values ($1, 'tier2_blob', null, $2, $3, $4, $5, $6, false, '[]'::jsonb, $7, $8, $9, $10::jsonb)
        returning id
      `,
      [
        message.tenantClientKey,
        message.storage.blobPath.split("/").pop() || "context-upload",
        message.storage.contentType,
        message.storage.sizeBytes,
        message.storage.sha256,
        patternDecision,
        finalDecision,
        reasonCodes,
        `${message.storage.containerName}/${message.storage.blobPath}`,
        JSON.stringify({
          schema: message.schema,
          segmentKey: message.segmentKey,
          outcomeStatus: outcome.status,
          durationMs: outcome.durationMs,
          metadata: message.metadata ?? {},
        }),
      ],
    );
    return inserted.rows[0]?.id ?? idHint;
  };
}

function metadataString(
  metadata: Record<string, string | number | boolean> | undefined,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function shouldCreateDocumentReview(args: {
  filename: string;
  contentType: string;
  metadata: Record<string, string | number | boolean> | undefined;
}): boolean {
  if (metadataString(args.metadata, "source") !== "admin_bulk_context_upload") {
    return false;
  }
  const lowerName = args.filename.toLowerCase();
  const lowerType = args.contentType.toLowerCase();
  return (
    lowerName.endsWith(".pdf") ||
    lowerName.endsWith(".docx") ||
    lowerName.endsWith(".pptx") ||
    lowerName.endsWith(".xlsx") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".markdown") ||
    lowerType === "application/pdf" ||
    lowerType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    lowerType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    lowerType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    lowerType === "text/markdown"
  );
}

function createPipeline(): IngestionPipeline {
  return async ({ message, bytes, filename, document }) => {
    const mode = process.env.INGESTION_PIPELINE_MODE?.trim() || "audit_only";
    if (
      document &&
      shouldCreateDocumentReview({
        filename,
        contentType: message.storage.contentType,
        metadata: message.metadata,
      })
    ) {
      const bulkJobId = metadataString(message.metadata, "bulkJobId");
      const clientId = metadataString(message.metadata, "clientId");
      const templateId = metadataString(message.metadata, "templateId");
      if (!bulkJobId || !clientId || !templateId) {
        throw new Error("bulk_document_review_missing_metadata");
      }
      const artifact = buildBulkDocumentReviewArtifact({
        jobId: bulkJobId,
        clientId,
        tenantKey: message.tenantClientKey,
        fileName:
          metadataString(message.metadata, "originalFileName") ?? filename,
        templateId,
        segmentKey: message.segmentKey,
        sha256: message.storage.sha256,
        blobPath: message.storage.blobPath,
        dataClassification:
          message.declaredClassification ?? "confidential_business",
        document,
      });
      const location = await persistBulkDocumentReviewArtifact(artifact);
      await markBulkContextUploadJobNeedsOperatorReview({
        clientId,
        tenantKey: message.tenantClientKey,
        jobId: bulkJobId,
        fileName: artifact.fileName,
        templateId,
        reviewArtifact: {
          bucket: location.bucket,
          path: location.path,
          candidateCount: artifact.candidates.length,
        },
      });
      console.log(
        JSON.stringify({
          event: "bulk_document_review_artifact_created",
          tenantClientKey: message.tenantClientKey,
          jobId: bulkJobId,
          fileName: artifact.fileName,
          reviewPath: location.path,
          candidateCount: artifact.candidates.length,
          parseMethod: document.parseMethod,
        }),
      );
      return { chunksWritten: 0 };
    }

    if (mode === "broker_command") {
      const command = readEnv("INGESTION_BROKER_REBUILD_COMMAND");
      const [bin, ...args] = command.split(" ").filter(Boolean);
      if (!bin) throw new Error("broker_command_empty");
      await execFileAsync(bin, args, {
        env: {
          ...process.env,
          INGESTION_TENANT_CLIENT_KEY: message.tenantClientKey,
          INGESTION_SEGMENT_KEY: message.segmentKey,
        },
        timeout: readIntEnv("INGESTION_BROKER_REBUILD_TIMEOUT_MS", 300_000),
      });
      return { chunksWritten: 0 };
    }

    // Lab default: prove Service Bus -> Blob -> guard -> parse -> audit without
    // pretending the broker/indexer has been rebuilt. Document payloads
    // estimate chunks from extracted text; tabular/binary fallback uses bytes.
    if (document) {
      console.log(
        JSON.stringify({
          event: "ingestion_document_parsed",
          tenantClientKey: message.tenantClientKey,
          segmentKey: message.segmentKey,
          parseMethod: document.parseMethod,
          textChars: document.text.length,
          warnings: document.warnings,
          metadata: document.metadata,
        }),
      );
      return {
        chunksWritten: Math.max(1, Math.ceil(document.text.length / 800)),
      };
    }
    return { chunksWritten: Math.max(1, Math.ceil(bytes.byteLength / 800)) };
  };
}

async function processMessage(
  receiver: ReturnType<ServiceBusClient["createReceiver"]>,
  rawMessage: ServiceBusReceivedMessage,
  ctx: Parameters<typeof consumeOneMessage>[1],
  credential: DefaultAzureCredential,
): Promise<void> {
  let body: unknown;
  try {
    body = await normalizeBody(rawMessage, credential);
  } catch (err) {
    await receiver.deadLetterMessage(rawMessage, {
      deadLetterReason: "ingestion_message_normalization_failed",
      deadLetterErrorDescription:
        err instanceof Error
          ? err.message
          : "ingestion_message_normalization_failed",
    });
    return;
  }

  const outcome = await consumeOneMessage(body, ctx);
  if (outcome.status === "accepted" || outcome.status === "quarantined") {
    await receiver.completeMessage(rawMessage);
  } else if (outcome.status === "rejected") {
    await receiver.deadLetterMessage(rawMessage, {
      deadLetterReason: outcome.reason,
      deadLetterErrorDescription: outcome.reason,
    });
  } else {
    await receiver.abandonMessage(rawMessage);
  }

  console.log(
    JSON.stringify({
      event: "ingestion_message_processed",
      messageId: rawMessage.messageId,
      status: outcome.status,
      auditRowId: outcome.auditRowId,
      durationMs: outcome.durationMs,
    }),
  );
}

async function main(): Promise<void> {
  const managedIdentityClientId = process.env.AZURE_CLIENT_ID?.trim();
  const credential = new DefaultAzureCredential(
    managedIdentityClientId ? { managedIdentityClientId } : undefined,
  );
  const client = new ServiceBusClient(serviceBusNamespace(), credential);
  const queueName = readEnv(
    "SERVICE_BUS_QUEUE_NAME",
    "q-context-ingestion-events",
  );
  const receiver = client.createReceiver(queueName);
  const maxMessages = readIntEnv("INGESTION_WORKER_MAX_MESSAGES", 10);
  const maxWaitTimeInMs = readIntEnv("INGESTION_WORKER_MAX_WAIT_MS", 5_000);

  const ctx = {
    download: createDownloader(credential),
    writeAudit: createAuditWriter(),
    runPipeline: createPipeline(),
    ...(readBooleanEnv("INGESTION_PILOT_LEDGER_ENABLED")
      ? { writePilotLedger: createDurablePilotLedgerWriter() }
      : {}),
  };

  try {
    const messages = await receiver.receiveMessages(maxMessages, {
      maxWaitTimeInMs,
    });
    if (messages.length === 0) {
      console.log(
        JSON.stringify({ event: "ingestion_worker_idle", queueName }),
      );
      return;
    }
    for (const message of messages) {
      await processMessage(receiver, message, ctx, credential);
    }
  } finally {
    await receiver.close();
    await client.close();
    await pool?.end();
  }
}

main().catch((err) => {
  console.error(
    JSON.stringify({
      event: "ingestion_worker_failed",
      error: err instanceof Error ? err.message : String(err),
    }),
  );
  process.exit(1);
});
