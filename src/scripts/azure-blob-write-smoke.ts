#!/usr/bin/env -S npx tsx
// Azure Blob write-only smoke.
//
// This intentionally proves only the permission Meridian/PHS needs for Admin
// context reload staging: create/upload one tiny object through the same
// object-storage adapter used by the bulk loader. It does not read, list, or
// delete blobs, so it works with least-privilege writer credentials.

import {
  describeObjectStorageLocation,
  getObjectStorageAdapter,
} from "@/lib/data-plane/objectStorage";

type SmokeReport = {
  event: "azure_blob_write_smoke";
  status: "pass" | "fail";
  runId: string;
  bucket: string;
  tenantKey: string;
  objectPath: string;
  resolvedLocation?: {
    accountName: string;
    containerName: string;
    blobPath: string;
  };
  producedAt: string;
  detail: string;
};

function env(name: string, fallback?: string): string {
  const value = process.env[name]?.trim();
  if (value) return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required env var: ${name}`);
}

function runId(): string {
  return (
    process.env.AZURE_BLOB_WRITE_SMOKE_RUN_ID?.trim() ||
    `blobwrite-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}`
  );
}

function redact(value: string): string {
  return value
    .replace(/(AccountKey=)[^;&\s]+/gi, "$1<redacted>")
    .replace(/(sig=)[^&\s]+/gi, "$1<redacted>")
    .replace(/(password=)[^;&\s]+/gi, "$1<redacted>");
}

async function main() {
  const id = runId();
  const bucket = env("AZURE_BLOB_WRITE_SMOKE_BUCKET", "context-uploads");
  const tenantKey = env("AZURE_BLOB_WRITE_SMOKE_TENANT_KEY", "meridian-health");
  const objectPath =
    process.env.AZURE_BLOB_WRITE_SMOKE_PATH?.trim() ||
    `${tenantKey}/connectivity-smoke/${id}.txt`;
  const body = [
    "AbarVa Azure Blob write smoke.",
    "Purpose: prove Admin context upload staging can write to Blob.",
    `runId=${id}`,
    `tenantKey=${tenantKey}`,
  ].join("\n");

  let resolvedLocation: SmokeReport["resolvedLocation"];
  try {
    resolvedLocation = describeObjectStorageLocation(bucket, objectPath);
    await getObjectStorageAdapter().upload(bucket, objectPath, body, {
      contentType: "text/plain",
      metadata: {
        smokeRunId: id,
        tenantKey,
        purpose: "admin-context-upload-write-proof",
      },
    });

    const report: SmokeReport = {
      event: "azure_blob_write_smoke",
      status: "pass",
      runId: id,
      bucket,
      tenantKey,
      objectPath,
      resolvedLocation,
      producedAt: new Date().toISOString(),
      detail: "Blob upload succeeded through the app object-storage adapter.",
    };
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    const report: SmokeReport = {
      event: "azure_blob_write_smoke",
      status: "fail",
      runId: id,
      bucket,
      tenantKey,
      objectPath,
      resolvedLocation,
      producedAt: new Date().toISOString(),
      detail: redact(error instanceof Error ? error.message : String(error)),
    };
    console.error(JSON.stringify(report, null, 2));
    process.exitCode = 1;
  }
}

void main();
