import { DefaultAzureCredential } from "@azure/identity";
import { BlobServiceClient } from "@azure/storage-blob";

const CONTEXT_DROPS_CONTAINER = "context-drops";

function metadataValue(value: unknown): string {
  return String(value ?? "")
    .replace(/[^a-zA-Z0-9 _.-]/g, "_")
    .slice(0, 256);
}

function safePathPart(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 128) || "context"
  );
}

function serviceClient(): BlobServiceClient | null {
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING?.trim();
  if (connectionString) {
    return BlobServiceClient.fromConnectionString(connectionString);
  }

  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME?.trim();
  if (!accountName) return null;
  return new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    new DefaultAzureCredential(),
  );
}

export async function stageFileToBlob(input: {
  tenantKey: string;
  dimensionFamily: string;
  fileName: string;
  fileBytes: Buffer;
  mimeType: string;
  recordCount?: number;
}): Promise<{
  blobUrl: string | null;
  blobContainer: string | null;
  blobObjectKey: string | null;
  staged: boolean;
}> {
  const client = serviceClient();
  const blobObjectKey = [
    safePathPart(input.tenantKey),
    safePathPart(input.dimensionFamily),
    safePathPart(input.fileName),
  ].join("/");

  if (!client) {
    return {
      blobUrl: null,
      blobContainer: null,
      blobObjectKey,
      staged: false,
    };
  }

  const container = client.getContainerClient(CONTEXT_DROPS_CONTAINER);
  await container.createIfNotExists();
  const blob = container.getBlockBlobClient(blobObjectKey);
  await blob.uploadData(input.fileBytes, {
    blobHTTPHeaders: { blobContentType: input.mimeType },
    metadata: {
      tenant_key: metadataValue(input.tenantKey),
      dimension_family: metadataValue(input.dimensionFamily),
      loaded_at: new Date().toISOString(),
      record_count: metadataValue(input.recordCount ?? 0),
    },
  });

  return {
    blobUrl: blob.url,
    blobContainer: CONTEXT_DROPS_CONTAINER,
    blobObjectKey,
    staged: true,
  };
}
